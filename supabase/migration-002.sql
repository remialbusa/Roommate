-- Roomie migration 002: bill dates + recurrence, loan confirmations,
-- receipt/photo attachments. Run once in Supabase SQL Editor AFTER
-- supabase/schema.sql.

-- Bill due dates + repeats.
alter table bills add column if not exists due_date date;
alter table bills add column if not exists recurrence text not null default 'None'
  check (recurrence in ('None', 'Weekly', 'Monthly'));

-- Loan lifecycle: new loans start Pending, counterparty confirms.
alter table loans add column if not exists status text not null default 'confirmed'
  check (status in ('pending', 'confirmed', 'declined'));

-- Attachments (receipts for bills/loans, photos for notes/events).
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  kind text not null check (kind in ('bill', 'loan', 'note', 'event')),
  owner_id text not null,
  path text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table attachments enable row level security;
create policy "attachments member access"
  on attachments for all to authenticated using (
    exists (
      select 1 from memberships
      where memberships.household_id = attachments.household_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from memberships
      where memberships.household_id = attachments.household_id
        and memberships.user_id = auth.uid()
    )
  );
alter publication supabase_realtime add table attachments;

-- Private storage bucket for receipt/photo files. Files live under
-- "<household_id>/..." so access follows household membership.
insert into storage.buckets (id, name, public)
  values ('receipts', 'receipts', false)
  on conflict (id) do nothing;

create policy "receipts readable by household members"
  on storage.objects for select to authenticated using (
    bucket_id = 'receipts' and exists (
      select 1 from memberships
      where memberships.user_id = auth.uid()
        and storage.objects.name like memberships.household_id::text || '/%'
    )
  );
create policy "receipts writable by household members"
  on storage.objects for insert to authenticated with check (
    bucket_id = 'receipts' and exists (
      select 1 from memberships
      where memberships.user_id = auth.uid()
        and storage.objects.name like memberships.household_id::text || '/%'
    )
  );
create policy "receipts deletable by household members"
  on storage.objects for delete to authenticated using (
    bucket_id = 'receipts' and exists (
      select 1 from memberships
      where memberships.user_id = auth.uid()
        and storage.objects.name like memberships.household_id::text || '/%'
    )
  );
