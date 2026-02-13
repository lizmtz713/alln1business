# Changelog: Household Features (Alln1Home)

This document lists all changes made to add household-specific features after removing business features.

---

## 1. New TypeScript types

| File | Description |
|------|-------------|
| `src/types/vehicles.ts` | `Vehicle`, `VehicleInsert`, `VehicleUpdate` — year, make, model, VIN, insurance_provider, insurance_expiry, registration_expiry, notes |
| `src/types/pets.ts` | `Pet`, `PetInsert`, `PetUpdate` — name, type, breed, vet_name, vet_phone, vaccination_dates, notes |
| `src/types/insurance.ts` | `InsurancePolicy`, `InsurancePolicyInsert`, `InsurancePolicyUpdate` — provider, policy_number, policy_type, premium_amount, premium_frequency, renewal_date, notes |
| `src/types/medical.ts` | `MedicalRecord`, `MedicalRecordInsert`, `MedicalRecordUpdate` — provider, record_date, record_type, notes, next_appointment |
| `src/types/homeServices.ts` | `HomeServiceContact`, `HomeServiceContactInsert`, `HomeServiceContactUpdate` — service_type, name, phone, email, notes, last_service_date |
| `src/types/appointments.ts` | `Appointment`, `AppointmentInsert`, `AppointmentUpdate` — title, appointment_date, appointment_time, location, notes, is_recurring, recurring_rule |

---

## 2. New Supabase migration SQL (docs/)

| File | Table | RLS |
|------|--------|-----|
| `docs/supabase-vehicles-schema.sql` | `vehicles` | user_id = auth.uid() |
| `docs/supabase-pets-schema.sql` | `pets` | user_id = auth.uid() |
| `docs/supabase-insurance-schema.sql` | `insurance_policies` | user_id = auth.uid() |
| `docs/supabase-medical-schema.sql` | `medical_records` | user_id = auth.uid() |
| `docs/supabase-home-services-schema.sql` | `home_service_contacts` | user_id = auth.uid() |
| `docs/supabase-appointments-schema.sql` | `appointments` | user_id = auth.uid() |

All tables include `user_id uuid references auth.users on delete cascade not null` and RLS policies for SELECT/INSERT/UPDATE/DELETE.

---

## 3. New CRUD hooks

| File | Exports |
|------|---------|
| `src/hooks/useVehicles.ts` | `useVehicles`, `useVehicle`, `useCreateVehicle`, `useUpdateVehicle`, `useDeleteVehicle` |
| `src/hooks/usePets.ts` | `usePets`, `usePet`, `useCreatePet`, `useUpdatePet`, `useDeletePet` |
| `src/hooks/useInsurance.ts` | `useInsurancePolicies`, `useInsurancePolicy`, `useCreateInsurancePolicy`, `useUpdateInsurancePolicy`, `useDeleteInsurancePolicy` |
| `src/hooks/useMedical.ts` | `useMedicalRecords`, `useMedicalRecord`, `useCreateMedicalRecord`, `useUpdateMedicalRecord`, `useDeleteMedicalRecord` |
| `src/hooks/useHomeServices.ts` | `useHomeServiceContacts`, `useHomeServiceContact`, `useCreateHomeServiceContact`, `useUpdateHomeServiceContact`, `useDeleteHomeServiceContact` |
| `src/hooks/useAppointments.ts` | `useAppointments`, `useAppointment`, `useCreateAppointment`, `useUpdateAppointment`, `useDeleteAppointment` |

---

## 4. New / updated screens

### List screens
- `app/vehicles.tsx` — list vehicles, link to detail and add modal
- `app/pets.tsx` — list pets
- `app/insurance.tsx` — list insurance policies
- `app/medical.tsx` — list medical records
- `app/home-services.tsx` — list home service contacts
- `app/appointments.tsx` — list appointments

### Detail screens
- `app/vehicle/[id].tsx` — vehicle detail, edit, delete
- `app/pet/[id].tsx` — pet detail
- `app/insurance-policy/[id].tsx` — insurance policy detail
- `app/medical/[id].tsx` — medical record detail (updated from pet template)
- `app/home-service/[id].tsx` — home service contact detail (updated from pet template)
- `app/appointment/[id].tsx` — appointment detail (updated from pet template)

### Add modals
- `app/(modals)/add-vehicle.tsx`
- `app/(modals)/add-pet.tsx`
- `app/(modals)/add-insurance.tsx`
- `app/(modals)/add-medical.tsx` — medical fields (provider, record_date, record_type, notes, next_appointment)
- `app/(modals)/add-home-service.tsx` — service_type, name, phone, email, last_service_date, notes
- `app/(modals)/add-appointment.tsx` — title, date, time, location, notes, recurring

### Edit modals
- `app/(modals)/edit-vehicle/[id].tsx`
- `app/(modals)/edit-pet/[id].tsx`
- `app/(modals)/edit-insurance/[id].tsx`
- `app/(modals)/edit-medical/[id].tsx`
- `app/(modals)/edit-home-service/[id].tsx`
- `app/(modals)/edit-appointment/[id].tsx`

---

## 5. Layout and navigation

- **`app/(modals)/_layout.tsx`** — Registered Stack screens for all 12 new modals: add-vehicle, edit-vehicle/[id], add-pet, edit-pet/[id], add-insurance, edit-insurance/[id], add-medical, edit-medical/[id], add-home-service, edit-home-service/[id], add-appointment, edit-appointment/[id].
- **`app/(tabs)/more.tsx`** — New “Household” section with links: Vehicles, Pets, Insurance, Medical, Home Services, Appointments (above Account).

---

## 6. Home dashboard (`app/(tabs)/index.tsx`)

- **New data hooks:** `useAppointments`, `useVehicles`, `useInsurancePolicies`, `usePets`, `useHomeServiceContacts`.
- **New dashboard cards:**
  - **Upcoming appointments (14 days)** — next 5 appointments, link to add and list.
  - **Expiring insurance / registration (30 days)** — vehicles (registration_expiry, insurance_expiry) and insurance_policies (renewal_date), link to vehicle or insurance detail.
  - **Pet vaccination reminders** — pets with vaccination_dates set, link to pet detail and list.
  - **Home service due** — contacts with no last_service_date or last service &gt; 6 months ago, link to home-service detail and list.
- **Quick Stats / Quick Actions** — unchanged; first 6 quick-add options shown in grid.

---

## 7. Global search (`src/hooks/useGlobalSearch.ts`)

- **`GlobalSearchResult`** extended with: `vehicles`, `pets`, `insurancePolicies`, `medicalRecords`, `homeServiceContacts`, `appointments`.
- **New queries:** search over vehicles (make, model, vin, notes), pets (name, type, breed, vet_name, notes), insurance_policies (provider, policy_number, policy_type, notes), medical_records (provider, record_type, notes), home_service_contacts (name, service_type, notes), appointments (title, location, notes).
- **Dashboard search UI** — placeholder updated to “Search bills, documents, vehicles, pets…”; result list renders all new types with correct links (e.g. `/vehicle/:id`, `/pet/:id`, `/insurance-policy/:id`, `/medical/:id`, `/home-service/:id`, `/appointment/:id`).

---

## 8. Quick-add FAB (`app/(tabs)/index.tsx`)

- **`QUICK_ADD_OPTIONS`** extended with: Add Vehicle (car), Add Pet (paw), Add Insurance (shield-checkmark), Add Medical (medkit), Add Home Service (construct), Add Appointment (calendar).
- FAB modal shows all 11 options; Quick Actions grid still shows first 6.

---

## 9. Verification

- **`npx tsc --noEmit`** — passes with no errors.

---

## Summary

| Category | Count |
|----------|--------|
| New type files | 6 |
| New SQL schema files | 6 |
| New hook files | 6 |
| List screens | 6 (all present/updated) |
| Detail screens | 6 (4 updated from pet template) |
| Add modals | 6 |
| Edit modals | 6 |
| Dashboard cards (new) | 4 |
| Global search entity types | +6 (vehicles, pets, insurance, medical, home services, appointments) |
| Quick-add options (new) | 6 |

All new entities are scoped by `user_id` and protected by RLS. Routes follow: `/vehicles`, `/vehicle/[id]`, `/pets`, `/pet/[id]`, `/insurance`, `/insurance-policy/[id]`, `/medical`, `/medical/[id]`, `/home-services`, `/home-service/[id]`, `/appointments`, `/appointment/[id]`.
