alter table if exists public.guests
  add column if not exists seat_index integer;

alter table if exists public.guests
  drop constraint if exists guests_seat_index_non_negative;

alter table if exists public.guests
  add constraint guests_seat_index_non_negative
  check (seat_index is null or seat_index >= 0);

with ordered_guests as (
  select
    id,
    row_number() over (
      partition by table_id
      order by created_at, last_name, first_name, id
    ) - 1 as next_seat_index
  from public.guests
  where table_id is not null
    and seat_index is null
    and archived = false
)
update public.guests
set seat_index = ordered_guests.next_seat_index
from ordered_guests
where public.guests.id = ordered_guests.id;

create unique index if not exists guests_table_seat_unique_idx
  on public.guests (table_id, seat_index)
  where table_id is not null and seat_index is not null and archived = false;
