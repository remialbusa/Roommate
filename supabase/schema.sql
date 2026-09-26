-- Roomie online schema (Supabase / Postgres). Run this once in the
-- Supabase Dashboard → SQL Editor. It creates tables, Row Level
-- Security policies, and enables realtime on every table.
--
-- Auth note: in Authentication → Sign In / Sign Ups, turn OFF
-- "Confirm email" so sign-up returns a session immediately.

-- ---------- Tables ----------

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  bg text not null default '#8A7F6B'
);

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  currency text not null default 'USD',
  log_reminders boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  category text not null default 'Utilities',
  amount numeric not null,
  due text not null default 'This month',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists bill_splits (
  bill_id uuid not null references bills (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  paid boolean not null default false,
  primary key (bill_id, user_id)
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  amount numeric not null,
  direction text not null default 'owedToYou' check (direction in ('owedToYou', 'youOwe')),
  counterparty_id uuid references profiles (id) on delete set null,
  counterparty_name text not null default 'roommate',
  date text not null default 'Today',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans (id) on delete cascade,
  amount numeric not null,
  date text not null default 'Today',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  body text not null,
  author uuid references profiles (id) on delete set null,
  time text not null default 'Just now',
  color text not null default 'gold',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  day int not null check (day between 1 and 31),
  time text not null,
  color text not null default 'lime',
  created_at timestamptz not null default now()
);

create table if not exists event_attendees (
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (event_id, user_id)
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  day text not null default 'Today',
  time text not null,
  roommate uuid references profiles (id) on delete set null,
  category text not null,
  action text not null,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------

alter table profiles enable row level security;
alter table households enable row level security;
alter table memberships enable row level security;
alter table bills enable row level security;
alter table bill_splits enable row level security;
alter table loans enable row level security;
alter table repayments enable row level security;
alter table notes enable row level security;
alter table events enable row level security;
alter table event_attendees enable row level security;
alter table activity_log enable row level security;

-- Profiles: readable by any signed-in user (names only, no emails),
-- writable only by their owner.
create policy "profiles readable by signed-in users"
  on profiles for select to authenticated using (true);
create policy "profiles insert own"
  on profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own"
  on profiles for update to authenticated using (id = auth.uid());

-- Households: anyone signed in can read (needed to join by code)
-- and create; only admins can update.
create policy "households readable by signed-in users"
  on households for select to authenticated using (true);
create policy "households creatable by signed-in users"
  on households for insert to authenticated with check (true);
create policy "households updatable by admins"
  on households for update to authenticated using (
    exists (
      select 1 from memberships
      where memberships.household_id = households.id
        and memberships.user_id = auth.uid()
        and memberships.role = 'admin'
    )
  );

-- Memberships: readable by signed-in users; anyone can insert their
-- own row (joining); only admins can remove rows.
create policy "memberships readable by signed-in users"
  on memberships for select to authenticated using (true);
create policy "memberships joinable by self"
  on memberships for insert to authenticated with check (user_id = auth.uid());
create policy "memberships removable by admins"
  on memberships for delete to authenticated using (
    exists (
      select 1 from memberships m
      where m.household_id = memberships.household_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Household content: full access for members of that household.
-- (bill_splits / repayments / event_attendees reach their household
-- through their parent row.)

create policy "bills member access"
  on bills for all to authenticated using (
    exists (
      select 1 from memberships
      where memberships.household_id = bills.household_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from memberships
      where memberships.household_id = bills.household_id
        and memberships.user_id = auth.uid()
    )
  );

create policy "bill_splits member access"
  on bill_splits for all to authenticated using (
    exists (
      select 1 from bills
      join memberships on memberships.household_id = bills.household_id
      where bills.id = bill_splits.bill_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from bills
      join memberships on memberships.household_id = bills.household_id
      where bills.id = bill_splits.bill_id
        and memberships.user_id = auth.uid()
    )
  );

create policy "loans member access"
  on loans for all to authenticated using (
    exists (
      select 1 from memberships
      where memberships.household_id = loans.household_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from memberships
      where memberships.household_id = loans.household_id
        and memberships.user_id = auth.uid()
    )
  );

create policy "repayments member access"
  on repayments for all to authenticated using (
    exists (
      select 1 from loans
      join memberships on memberships.household_id = loans.household_id
      where loans.id = repayments.loan_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from loans
      join memberships on memberships.household_id = loans.household_id
      where loans.id = repayments.loan_id
        and memberships.user_id = auth.uid()
    )
  );

create policy "notes member access"
  on notes for all to authenticated using (
    exists (
      select 1 from memberships
      where memberships.household_id = notes.household_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from memberships
      where memberships.household_id = notes.household_id
        and memberships.user_id = auth.uid()
    )
  );

create policy "events member access"
  on events for all to authenticated using (
    exists (
      select 1 from memberships
      where memberships.household_id = events.household_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from memberships
      where memberships.household_id = events.household_id
        and memberships.user_id = auth.uid()
    )
  );

create policy "event_attendees member access"
  on event_attendees for all to authenticated using (
    exists (
      select 1 from events
      join memberships on memberships.household_id = events.household_id
      where events.id = event_attendees.event_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from events
      join memberships on memberships.household_id = events.household_id
      where events.id = event_attendees.event_id
        and memberships.user_id = auth.uid()
    )
  );

create policy "activity_log member access"
  on activity_log for all to authenticated using (
    exists (
      select 1 from memberships
      where memberships.household_id = activity_log.household_id
        and memberships.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from memberships
      where memberships.household_id = activity_log.household_id
        and memberships.user_id = auth.uid()
    )
  );

-- ---------- Realtime ----------

alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table households;
alter publication supabase_realtime add table memberships;
alter publication supabase_realtime add table bills;
alter publication supabase_realtime add table bill_splits;
alter publication supabase_realtime add table loans;
alter publication supabase_realtime add table repayments;
alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table event_attendees;
alter publication supabase_realtime add table activity_log;
