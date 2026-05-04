-- Allow the mobile admin panel to issue auditable membership invitation codes.

begin;

alter table public.invitation_codes
  drop constraint if exists invitation_codes_invite_source_check;

alter table public.invitation_codes
  add constraint invitation_codes_invite_source_check
  check (invite_source in ('bootstrap', 'monthly_member', 'admin'));

commit;
