-- Roomie migration 003: real dates for loans and notes so the
-- calendar agenda can surface them alongside bills and events.
-- Run once in Supabase SQL Editor AFTER migration-002.

alter table loans add column if not exists loan_date date;
alter table notes add column if not exists note_date date;
