-- ============================================================
-- TIER CHANGE FUNCTION (admin only)
-- Handles: audit log, JWT refresh trigger, notification
-- ============================================================

CREATE OR REPLACE FUNCTION change_member_tier(
  p_member_id uuid,
  p_new_tier membership_tier,
  p_reason text,
  p_changed_by uuid DEFAULT auth.uid()
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_old_tier membership_tier;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_roles WHERE member_id = p_changed_by) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT tier INTO v_old_tier FROM members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;

  IF v_old_tier = p_new_tier THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already at this tier');
  END IF;

  UPDATE members SET tier = p_new_tier WHERE id = p_member_id;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('tier', p_new_tier::text)
  WHERE id = p_member_id;

  INSERT INTO tier_changes (member_id, old_tier, new_tier, changed_by, reason)
  VALUES (p_member_id, v_old_tier, p_new_tier, p_changed_by, p_reason);

  INSERT INTO notifications (member_id, type, title, body, data)
  VALUES (
    p_member_id, 'tier_change',
    'Your membership has been updated',
    'You are now an AMARI ' || initcap(p_new_tier::text) || ' member.',
    jsonb_build_object('old_tier', v_old_tier::text, 'new_tier', p_new_tier::text)
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_tier', v_old_tier::text,
    'new_tier', p_new_tier::text
  );
END;
$$;
