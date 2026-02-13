-- Optional: add maintenance fields to vehicles for oil-change and mileage-based predictions
alter table public.vehicles add column if not exists current_mileage integer;
alter table public.vehicles add column if not exists last_oil_change_mileage integer;
alter table public.vehicles add column if not exists last_oil_change_date date;
alter table public.vehicles add column if not exists oil_change_interval_miles integer default 5000;

comment on column public.vehicles.current_mileage is 'Current odometer reading for maintenance predictions';
comment on column public.vehicles.last_oil_change_mileage is 'Odometer at last oil change';
comment on column public.vehicles.oil_change_interval_miles is 'Miles between oil changes (e.g. 5000)';
