const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://127.0.0.1:19006';
const MAILPIT_URL = 'http://127.0.0.1:54324';
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const runStamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const outputDir = path.join(process.cwd(), '.live-checks', runStamp);
fs.mkdirSync(outputDir, { recursive: true });

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function waitForCondition(fn, { timeout = 60000, interval = 500, label = 'condition' } = {}) {
  const started = Date.now();
  let lastError = null;

  while (Date.now() - started < timeout) {
    try {
      const result = await fn();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error(`Timed out waiting for ${label}`);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`);
  }
  return response.json();
}

function extractRecipientAddresses(message) {
  const source = message.To || message.to || [];
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return entry.toLowerCase();
      if (typeof entry.Address === 'string') return entry.Address.toLowerCase();
      if (typeof entry.address === 'string') return entry.address.toLowerCase();
      return null;
    })
    .filter(Boolean);
}

function extractUrls(payload) {
  if (!payload || typeof payload !== 'string') {
    return [];
  }

  return payload.match(/https?:\/\/[^\s"'<>]+/g) || [];
}

function sanitizeUrl(url) {
  return url.replace(/&amp;/g, '&').replace(/[)>]+$/g, '');
}

async function waitForMagicLink(email, createdAfterMs) {
  const normalizedEmail = email.toLowerCase();

  return waitForCondition(
    async () => {
      const inbox = await fetchJson(`${MAILPIT_URL}/api/v1/messages`);
      const matches = (inbox.messages || [])
        .filter((message) => {
          const recipients = extractRecipientAddresses(message);
          const createdAt = new Date(
            message.Created || message.created || message.Date || message.date || 0,
          ).getTime();
          return recipients.includes(normalizedEmail) && createdAt >= createdAfterMs - 1000;
        })
        .sort((a, b) => {
          const aTime = new Date(a.Created || a.created || a.Date || a.date || 0).getTime();
          const bTime = new Date(b.Created || b.created || b.Date || b.date || 0).getTime();
          return bTime - aTime;
        });

      if (matches.length === 0) {
        return null;
      }

      const messageId = matches[0].ID || matches[0].id;
      if (!messageId) {
        return null;
      }

      const detail = await fetchJson(`${MAILPIT_URL}/api/v1/message/${messageId}`);
      const candidates = [
        ...(extractUrls(detail.Text || detail.text || '')),
        ...(extractUrls(detail.HTML || detail.html || '')),
        ...(extractUrls(JSON.stringify(detail))),
      ].map(sanitizeUrl);

      const magicLink =
        candidates.find(
          (url) =>
            url.includes('/auth/v1/verify') &&
            (url.includes('type=magiclink') || url.includes('type=email')) &&
            url.includes('redirect_to='),
        ) ||
        null;

      return magicLink;
    },
    { timeout: 90000, interval: 1500, label: `magic link for ${email}` },
  );
}

async function getMemberByEmail(email) {
  const { data, error } = await supabase
    .from('members')
    .select('id, email, full_name, tier, status, skills, interests, current_project, industry, city')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function waitForMemberByEmail(email) {
  return waitForCondition(() => getMemberByEmail(email), {
    timeout: 30000,
    interval: 500,
    label: `member row for ${email}`,
  });
}

async function updateMemberProfile(email, updates) {
  const { error } = await supabase.from('members').update(updates).eq('email', email);
  if (error) {
    throw error;
  }
}

async function waitForInviteByRecipient(email) {
  const normalizedEmail = email.toLowerCase();

  return waitForCondition(
    async () => {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('code, tier_grant, recipient_email, issued_at')
        .eq('recipient_email', normalizedEmail)
        .eq('invite_source', 'monthly_member')
        .order('issued_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    { timeout: 30000, interval: 500, label: `invite for ${email}` },
  );
}

async function getUnusedBootstrapCode({ tier, staffRole = null, codePrefix = null }) {
  let query = supabase
    .from('invitation_codes')
    .select('code')
    .eq('invite_source', 'bootstrap')
    .eq('tier_grant', tier)
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .order('code', { ascending: true })
    .limit(1);

  query =
    staffRole === null
      ? query.is('staff_role_grant', null)
      : query.eq('staff_role_grant', staffRole);

  if (codePrefix) {
    query = query.like('code', `${codePrefix}%`);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.code) {
    throw new Error(
      `No unused bootstrap code available for tier=${tier} staffRole=${staffRole ?? 'none'} prefix=${codePrefix ?? 'any'}`,
    );
  }

  return data.code;
}

async function getTileByDescription(description) {
  const { data, error } = await supabase
    .from('aligned_tiles')
    .select('id, description, moderation_status, visibility_tiers, contact_enabled, user_id, type')
    .eq('description', description)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function waitForTileByDescription(description) {
  return waitForCondition(
    () => getTileByDescription(description),
    { timeout: 30000, interval: 500, label: `aligned tile ${description}` },
  );
}

async function waitForText(page, text, timeout = 60000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

async function waitForAppReady(page) {
  await waitForCondition(
    async () => {
      const body = await page.textContent('body');
      return body && body.includes('Explore') && body.includes('Pulse') ? true : null;
    },
    { timeout: 90000, interval: 1000, label: 'app shell' },
  );
}

async function waitForPath(page, pathFragment, timeout = 20000) {
  await page.waitForFunction(
    (fragment) => window.location.pathname.includes(fragment),
    pathFragment,
    { timeout },
  );
}

async function revealLocator(page, locator, { timeout = 20000, label = 'locator', scrollDelta = 720 } = {}) {
  return waitForCondition(
    async () => {
      if ((await locator.count()) > 0) {
        const target = locator.first();
        if (await target.isVisible()) {
          await target.scrollIntoViewIfNeeded().catch(() => null);
          return target;
        }
      }

      await page.evaluate((delta) => {
        window.scrollBy(0, delta);

        for (const element of Array.from(document.querySelectorAll('*'))) {
          if (!(element instanceof HTMLElement)) continue;
          const style = window.getComputedStyle(element);
          const canScroll =
            element.scrollHeight > element.clientHeight &&
            (style.overflowY === 'auto' || style.overflowY === 'scroll');

          if (canScroll) {
            element.scrollBy(0, delta);
          }
        }
      }, scrollDelta);

      return null;
    },
    { timeout, interval: 400, label },
  );
}

function attachPageLogging(page, label, runtimeIssues) {
  page.on('console', (message) => {
    const type = message.type();
    const text = message.text();
    if (type === 'error' || type === 'warning') {
      runtimeIssues.push({ label, type, text });
      console.log(`[${label}] console ${type}: ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    runtimeIssues.push({ label, type: 'pageerror', text: error.message });
    console.log(`[${label}] pageerror: ${error.message}`);
  });
}

async function captureDialog(page, action) {
  const dialogPromise = page.waitForEvent('dialog', { timeout: 12000 }).catch(() => null);
  await action();
  const dialog = await dialogPromise;
  if (!dialog) {
    return null;
  }
  const message = dialog.message();
  await dialog.accept();
  return message;
}

async function screenshot(page, name) {
  const target = path.join(outputDir, name);
  await page.screenshot({ path: target, fullPage: true });
  return target;
}

async function clickAccessibleButton(page, name, options = {}) {
  const timeout = options.timeout ?? 20000;
  const candidateTimeout = Math.max(2500, Math.floor(timeout / 4));
  const locators = [];

  if (typeof name === 'string') {
    const escapedName = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    locators.push(page.getByRole('button', { name, exact: options.exact ?? true }).first());
    locators.push(page.locator(`[aria-label="${escapedName}"]`).first());
    locators.push(
      page.getByText(options.text ?? name, {
        exact: options.textExact ?? options.exact ?? true,
      }).first(),
    );
  } else {
    locators.push(page.getByRole('button', { name }).first());
    if (options.ariaPrefix) {
      const escapedPrefix = options.ariaPrefix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      locators.push(page.locator(`[aria-label^="${escapedPrefix}"]`).first());
    }
    if (options.text) {
      locators.push(page.getByText(options.text, { exact: options.textExact ?? true }).first());
    }
  }

  let locator = null;
  for (const candidate of locators) {
    try {
      await candidate.waitFor({ state: 'visible', timeout: candidateTimeout });
      locator = candidate;
      break;
    } catch {
      // Try the next selector shape.
    }
  }

  if (!locator) {
    throw new Error(`Unable to find clickable control for ${String(name)}`);
  }

  await waitForCondition(
    async () => ((await locator.isEnabled()) ? true : null),
    {
      timeout,
      interval: 250,
      label: `button ${String(name)}`,
    },
  );
  await locator.click({ force: options.force ?? false });
}

async function registerUser(browser, runtimeIssues, details) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    permissions: [],
  });

  await context.addInitScript(() => {
    window.__openedUrls = [];
    const originalOpen = window.open;
    window.open = function patchedOpen(url, ...args) {
      window.__openedUrls.push(String(url));
      if (typeof originalOpen === 'function') {
        return originalOpen.call(window, url, ...args);
      }
      return null;
    };
  });

  const page = await context.newPage();
  attachPageLogging(page, details.label, runtimeIssues);

  await page.goto(`${BASE_URL}/invite`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('AMARI-XXXX-XXX').waitFor({ state: 'visible', timeout: 20000 });

  await page.locator('input').first().fill(details.code);
  await clickAccessibleButton(page, 'Validate invitation code');
  await waitForPath(page, '/register', 20000);
  await page.getByText('Join the Convergence', { exact: true }).waitFor({ state: 'visible', timeout: 20000 });

  await clickAccessibleButton(page, 'Sign up with email');
  await page.getByPlaceholder('Your full name').waitFor({ state: 'visible', timeout: 20000 });

  await page.getByPlaceholder('Your full name').fill(details.name);
  await page.getByPlaceholder('you@example.com').fill(details.email);
  await page.getByPlaceholder('Melbourne').fill(details.city);
  await page.getByPlaceholder('e.g. Technology, Finance').fill(details.industry);

  const sentAfter = Date.now();
  await clickAccessibleButton(page, 'Send magic link');
  await page.getByText('Check Your Email', { exact: false }).waitFor({ state: 'visible', timeout: 20000 });

  const magicLink = await waitForMagicLink(details.email, sentAfter);
  assert.ok(magicLink, `Expected a magic link for ${details.email}`);

  await page.goto(magicLink, { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);

  const member = await waitForMemberByEmail(details.email);
  assert.equal(member?.tier, details.expectedTier);

  return { context, page, member };
}

async function createMonthlyInvite(page, recipientName, recipientEmail, tier) {
  await waitForText(page, 'Member Invites');
  await page.getByPlaceholder('Recipient full name').fill(recipientName);
  await page.getByPlaceholder('name@example.com').fill(recipientEmail);
  await page.getByText(tier.toUpperCase(), { exact: true }).click();
  await captureDialog(page, async () => {
    await page.getByText('Create Invite', { exact: true }).click();
  });

  const invite = await waitForInviteByRecipient(recipientEmail);
  assert.equal(invite?.tier_grant, tier);
  return invite.code;
}

async function createAlignedTile(page, options) {
  await page.goto(`${BASE_URL}/aligned/create`, { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'New Tile');

  if (options.type === 'interest') {
    await page.getByText('Interest', { exact: true }).click();
  }

  const descriptionPlaceholder =
    options.type === 'interest'
      ? 'One sentence about what interests you...'
      : 'One sentence about your project...';
  await page.getByPlaceholder(descriptionPlaceholder).fill(options.description);

  for (const tag of options.tags) {
    await page.getByText(tag, { exact: true }).click();
  }

  for (const audience of options.visibility) {
    await page.getByText(audience, { exact: true }).click();
  }

  if (options.type === 'project') {
    const contactLabel = options.contactEnabled ? 'Yes, Allow Email' : 'Not Yet';
    await page.getByText(contactLabel, { exact: true }).click();
  }

  const dialogMessage = await captureDialog(page, async () => {
    await clickAccessibleButton(page, 'Create tile');
  });

  const tile = await waitForTileByDescription(options.description);
  assert.equal(tile?.type, options.type);
  if (dialogMessage) {
    assert.ok(dialogMessage.includes('Tile created'), 'Expected tile creation alert');
  }
  return tile;
}

async function reloadTo(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
}

async function run() {
  console.log(`Saving live verification output to ${outputDir}`);

  const runtimeIssues = [];
  const browser = await chromium.launch({ headless: true });
  const accounts = {};
  const findings = [];
  const suffix = runStamp.toLowerCase();

  try {
    const platinumBootstrapCode = await getUnusedBootstrapCode({
      tier: 'platinum',
      codePrefix: 'AMARI-PLAT-',
    });
    const adminBootstrapCode = await getUnusedBootstrapCode({
      tier: 'laureate',
      staffRole: 'admin',
      codePrefix: 'AMARI-ADMN-',
    });

    const platinum = await registerUser(browser, runtimeIssues, {
      label: 'platinum',
      code: platinumBootstrapCode,
      name: 'Platinum Tester',
      email: `platinum.${suffix}@example.com`,
      city: 'Footscray',
      industry: 'Government',
      expectedTier: 'platinum',
    });
    accounts.platinum = platinum;

    await waitForText(platinum.page, 'MONTHLY INVITES', 20000);
    await waitForText(platinum.page, 'Dear Platinum Tester', 20000);
    findings.push('Platinum monthly invite modal rendered with personalized copy.');
    await screenshot(platinum.page, '01-platinum-monthly-modal.png');

    await platinum.page.getByText('Send Invites', { exact: true }).click();
    const silverEmail = `silver.${suffix}@example.com`;
    const memberEmail = `member.${suffix}@example.com`;
    const silverCode = await createMonthlyInvite(
      platinum.page,
      'Silver Tester',
      silverEmail,
      'silver',
    );
    const memberCode = await createMonthlyInvite(
      platinum.page,
      'Member Tester',
      memberEmail,
      'member',
    );
    await waitForCondition(
      async () => {
        const body = await platinum.page.textContent('body');
        return body && body.includes('2 sent of 3') ? true : null;
      },
      { timeout: 15000, interval: 500, label: 'updated invite quota' },
    );
    findings.push('Platinum invite center created Silver and Member monthly invites and decremented the quota.');

    await updateMemberProfile(platinum.member.email, {
      skills: ['policy', 'government', 'leadership'],
      interests: ['community', 'mental health', 'transport'],
      current_project: 'Creative West community policy accelerator',
      industry: 'Government',
      city: 'Footscray',
    });

    await createAlignedTile(platinum.page, {
      type: 'project',
      description: 'Member-visible project for Black creators building a collaborative production studio.',
      tags: ['Culture', 'Design'],
      visibility: ['Member', 'Silver'],
      contactEnabled: true,
    });

    await createAlignedTile(platinum.page, {
      type: 'interest',
      description: 'Interest circle for theatre, performance, and story development across the diaspora.',
      tags: ['Culture', 'Design'],
      visibility: ['Member', 'Silver'],
    });
    findings.push('Platinum project and interest tiles were created through the UI.');

    const silver = await registerUser(browser, runtimeIssues, {
      label: 'silver',
      code: silverCode,
      name: 'Silver Tester',
      email: silverEmail,
      city: 'Melbourne',
      industry: 'Health',
      expectedTier: 'silver',
    });
    accounts.silver = silver;

    await reloadTo(silver.page, '/corridor');
    await waitForText(silver.page, 'The Corridor');
    await waitForText(silver.page, 'SILVER+ ACCESS');
    const silverOpportunityTitle = await revealLocator(
      silver.page,
      silver.page.getByText('Series A — Pan-African Logistics', { exact: true }),
      { timeout: 30000, label: 'Silver corridor opportunity title' },
    );
    await silverOpportunityTitle.waitFor({ state: 'visible', timeout: 5000 });
    const silverExpressButton = await revealLocator(
      silver.page,
      silver.page.locator('[aria-label^=\"Express interest in\"]'),
      { timeout: 30000, label: 'Silver corridor express-interest button' },
    );
    const silverButtonState = await silverExpressButton.evaluate((element) => ({
      disabled: 'disabled' in element ? element.disabled : null,
      ariaDisabled: element.getAttribute('aria-disabled'),
      ariaLabel: element.getAttribute('aria-label'),
      text: element.textContent,
      outerHTML: element.outerHTML,
    }));
    console.log('Silver corridor button state:', JSON.stringify(silverButtonState, null, 2));
    await screenshot(silver.page, '02-silver-corridor-before-interest.png');
    await silverExpressButton.click({ force: true });
    await waitForText(silver.page, 'Interest Expressed');
    await screenshot(silver.page, '03-silver-corridor.png');
    findings.push('Silver can view and act on legacy Laureate/Platinum corridor opportunities.');

    const silverPendingTile = await createAlignedTile(silver.page, {
      type: 'project',
      description: 'Silver-only healthcare collaboration board looking for advisors and operators.',
      tags: ['HealthTech', 'Operations'],
      visibility: ['Silver'],
      contactEnabled: true,
    });
    assert.equal(silverPendingTile.moderation_status, 'pending');
    findings.push('Silver project submissions enter the moderation queue instead of publishing immediately.');

    const member = await registerUser(browser, runtimeIssues, {
      label: 'member',
      code: memberCode,
      name: 'Member Tester',
      email: memberEmail,
      city: 'Melbourne',
      industry: 'Arts',
      expectedTier: 'member',
    });
    accounts.member = member;

    await updateMemberProfile(member.member.email, {
      skills: ['music', 'performance', 'directing'],
      interests: ['theatre', 'storytelling', 'culture'],
      current_project: 'Stage production network for Black creatives',
      industry: 'Arts',
      city: 'Melbourne',
    });

    await reloadTo(member.page, '/');
    await waitForText(member.page, 'Explore');
    await waitForText(member.page, "The Cast Behind MJ the Musical's Australian Tour");
    await screenshot(member.page, '03-member-home-recommendation.png');
    findings.push('Member home recommends the MJ story after profile signals were updated.');

    await reloadTo(member.page, '/corridor');
    await waitForText(member.page, 'The Corridor opens from Silver membership.');
    await waitForText(
      member.page,
      'This room is reserved for Silver, Platinum, and Laureate members.',
    );
    findings.push('Member is blocked from Corridor and sees the Silver membership gate screen.');

    await reloadTo(member.page, '/aligned');
    await waitForText(member.page, 'Aligned');
    await waitForText(member.page, 'Browse only on Member');
    findings.push('Member sees the browse-only Aligned publishing gate on the landing screen.');

    await reloadTo(member.page, '/aligned/projects');
    await waitForText(member.page, 'Projects');
    await waitForText(
      member.page,
      'Member-visible project for Black creators building a collaborative production studio.',
    );
    const projectTexts = await member.page.textContent('body');
    assert.ok(projectTexts.includes('Email'));
    assert.ok(!projectTexts.includes('Silver-only healthcare collaboration board'));
    await screenshot(member.page, '04-member-aligned-projects.png');
    findings.push('Member can open Aligned, sees the member-visible project tile, and does not see Silver-only pending content.');

    await clickAccessibleButton(member.page, 'Open your email app to contact this project owner');
    const openedUrls = await member.page.evaluate(() => window.__openedUrls || []);
    if (openedUrls.some((url) => String(url).startsWith('mailto:'))) {
      findings.push('Project contact opens the external mail app flow on web via mailto.');
    } else {
      findings.push('Project contact CTA is present in the UI; final mail-app handoff still requires device verification because React Native alerts are not exposed as browser dialogs in this web harness.');
    }

    await reloadTo(member.page, '/aligned/interests');
    await waitForText(member.page, 'Interests');
    await waitForText(
      member.page,
      'Interest circle for theatre, performance, and story development across the diaspora.',
    );
    const interestsTexts = await member.page.textContent('body');
    assert.ok(!interestsTexts.includes('Email'));
    findings.push('Interest tiles render without an email contact action.');

    await reloadTo(member.page, '/pulse');
    await waitForText(member.page, 'Editorial Archive');
    await waitForText(member.page, "The Cast Behind MJ the Musical's Australian Tour");
    await clickAccessibleButton(member.page, 'Filter by Business');
    const zivaiStoryCard = await revealLocator(
      member.page,
      member.page.getByRole('button', {
        name: /Zivai Matipano Named Among 101 Collins Street's Leading Ladies/i,
      }),
      { timeout: 60000, label: 'Zivai Pulse story card' },
    );
    await zivaiStoryCard.click({ force: true });
    await waitForPath(member.page, '/pulse/zivai-matipano-101-collins', 60000);
    await waitForText(member.page, 'Sources');
    await screenshot(member.page, '05-pulse-zivai-detail.png');
    findings.push('Pulse archive loads, category filters work, and the Zivai story renders cleanly without a provided photo.');

    const admin = await registerUser(browser, runtimeIssues, {
      label: 'admin',
      code: adminBootstrapCode,
      name: 'Admin Tester',
      email: `admin.${suffix}@example.com`,
      city: 'Melbourne',
      industry: 'Operations',
      expectedTier: 'laureate',
    });
    accounts.admin = admin;

    await waitForText(admin.page, 'MONTHLY INVITES', 20000);
    await waitForText(admin.page, 'Dear Admin Tester', 20000);
    await admin.page.getByText('Later', { exact: true }).click();
    findings.push('Laureate/admin monthly invite modal also renders with personalized copy.');

    await reloadTo(admin.page, '/admin/aligned');
    await waitForText(admin.page, 'Aligned Queue');
    await waitForText(admin.page, 'Silver-only healthcare collaboration board looking for advisors and operators.');
    await screenshot(admin.page, '06-admin-aligned-queue.png');
    await admin.page.getByText('Approve', { exact: true }).first().click();
    await waitForCondition(
      async () => {
        const tile = await getTileByDescription(
          'Silver-only healthcare collaboration board looking for advisors and operators.',
        );
        return tile.moderation_status === 'approved' ? tile : null;
      },
      { timeout: 30000, interval: 500, label: 'approved silver tile' },
    );
    findings.push('Admin can approve Silver Aligned submissions from the in-app queue.');

    await reloadTo(platinum.page, '/aligned/projects');
    await waitForText(platinum.page, 'Projects');
    await waitForText(
      platinum.page,
      'Silver-only healthcare collaboration board looking for advisors and operators.',
    );
    findings.push('Approved Silver content becomes visible to Platinum members in Aligned.');

    await reloadTo(platinum.page, '/');
    await waitForText(platinum.page, 'Explore');
    const platinumHome = await platinum.page.textContent('body');
    assert.ok(
      platinumHome.includes('Mohamed Semra Elected Mayor of Maribyrnong'),
      'Expected the policy/government recommendation on Platinum home',
    );
    await screenshot(platinum.page, '07-platinum-home-recommendation.png');
    findings.push('Platinum home recommends the Semra story after policy/government profile tuning.');

    const summary = {
      outputDir,
      findings,
      runtimeIssues,
      accounts: Object.fromEntries(
        Object.entries(accounts).map(([key, value]) => [
          key,
          {
            email: value.member.email,
            tier: value.member.tier,
            id: value.member.id,
          },
        ]),
      ),
    };

    const summaryPath = path.join(outputDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
