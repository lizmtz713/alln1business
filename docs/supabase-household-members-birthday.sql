-- Optional: add birthday for household report ("Jake's birthday in 2 weeks!")
alter table public.household_members add column if not exists birthday date;

comment on column public.household_members.birthday is 'Date of birth for birthday reminders in household report';
