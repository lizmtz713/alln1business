# Phase 4G: Quarterly Estimates + Compliance — Verification Checklist

## Prerequisites
- [ ] Run `docs/supabase-quarterly-estimates-schema.sql` in Supabase SQL Editor
- [ ] Transactions exist for the selected year (or use empty state)

## Settings
- [ ] Set effective tax rate (default 25%), save
- [ ] Set optional state rate, save
- [ ] Toggle "Meals 50% deductible", save
- [ ] Toast shows "Settings saved"

## Generate Estimates
- [ ] Select year (current ± 1)
- [ ] Tap "Update Estimates" — creates/updates rows for Q1–Q4
- [ ] Toast shows "Estimates updated"
- [ ] Each quarter card shows: due date, profit, deductible, federal/state/total

## Mark Paid
- [ ] Tap "Mark Paid" on a quarter
- [ ] Modal opens with amount (default total), date, method, confirmation, notes
- [ ] Save — status badge changes to "Paid"
- [ ] Toast shows "Payment updated"
- [ ] Tap "Edit Payment" to update payment details

## Compliance Reminders
- [ ] Tap "Add as Compliance Reminders"
- [ ] Creates compliance_items for each quarter (category=tax, recurrence=yearly, reminder_days=7, source=system)
- [ ] Toast shows "Reminder added" (per item)
- [ ] Navigate to Compliance Calendar — items appear with "System" tag
- [ ] Tapping a tax estimate reminder deep-links to /estimates?year=YYYY&quarter=Q

## Dashboard Insight
- [ ] When within 14 days of a quarterly due date AND that quarter not paid:
  - [ ] Insight appears: "Quarterly tax estimate due soon"
  - [ ] CTA "View Estimates" routes to /estimates

## Navigation
- [ ] More → Reports → Quarterly Estimates
- [ ] More → Compliance Calendar
- [ ] /estimates?year=2025&quarter=2 — scrolls to/highlights Q2 card

## Offline
- [ ] When offline: Mark Paid disabled with toast "Connect to mark payments"
- [ ] Add Compliance Reminders disabled when offline
- [ ] View-only works with cached data

## No OpenAI
- [ ] All features work without EXPO_PUBLIC_OPENAI_API_KEY
