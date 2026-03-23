begin;

create or replace function public.generate_display_id()
returns text
language plpgsql
as $fn$
declare
  seq_val bigint;
  cipher_val bigint;
  year_str text;
  encoded text;
  key1 constant bigint := 47293;
  key2 constant bigint := 83461;
  rounds constant int := 3;
  max_half constant bigint := 65536;
  l bigint;
  r bigint;
  tmp bigint;
begin
  seq_val := nextval('member_display_id_seq');
  l := seq_val / max_half;
  r := seq_val % max_half;

  for i in 1..rounds loop
    tmp := r;
    r := l # ((r * key1 + key2 + i) % max_half);
    l := tmp;
  end loop;

  cipher_val := l * max_half + r;
  year_str := to_char(now(), 'YYYY');
  encoded := upper(lpad(to_hex(cipher_val), 8, '0'));

  return 'AMARI-' || year_str || '-' || encoded;
end;
$fn$;

commit;
