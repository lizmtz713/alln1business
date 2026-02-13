# Feature Changelog — Premium Household / Dashboard

Smart home-screen features: dashboard cards, push reminders, global search, quick-add FAB, and monthly spending chart.

---

## 1. Dashboard cards on home screen

**Location:** Home tab (`app/(tabs)/index.tsx`)

- **Upcoming bills (7 days)**  
  Card listing bills due in the next 7 days (pending only). Shows bill name, due date, and amount. Tap a row to open the bill detail. “Add a bill” / “View all bills” for empty or overflow.

- **Expiring documents (30 days)**  
  Card listing documents with `expiration_date` in the next 30 days. Shows name and expiration date. Tap to open document detail.

- **Recent activity**  
  Card with the 5 most recent transactions (any type). Shows vendor, category, and amount. Tap to open transaction detail. “Add expense” / “View all transactions” for empty or overflow.

Data comes from existing `useBills()`, `useDocuments()`, and `useTransactions()`; filtering is done in the component with `useMemo`.

---

## 2. Push notification scheduling (expo-notifications)

**New:** `src/services/notificationSchedule.ts`

- **Permissions**  
  `requestNotificationPermissions()` requests notification permission when needed.

- **Channels (Android)**  
  “Bill Reminders” and “Reminders” channels are created for bills and for compliance/reminder items.

- **Bill due reminders**  
  `scheduleBillDueNotification(bill, daysBefore)` schedules a local notification for 1 day before the due date (default). Used for pending bills only.

- **Appointment / task reminders**  
  `scheduleReminderNotification(item, daysBefore)` schedules a reminder for compliance items (or any item with `id`, `name`, `due_date`). Default 1 day before.

- **Sync**  
  `syncBillAndReminderNotifications(bills, reminders)`:
  - Requests permission, then cancels all previously scheduled notifications that have `content.data.type === 'bill'` or `'reminder'`.
  - Schedules notifications for:
    - Bills due within the next 14 days (1 day before due).
    - Reminders due within the next 14 days (1 day before due).

- **Integration**  
  On the home screen, a `useEffect` runs when `upcomingBills` and `complianceItems` are available and calls `syncBillAndReminderNotifications(billPayload, reminderPayload)` so reminders stay in sync when the user opens the app.

- **Handler**  
  `setNotificationHandler` is set so notifications show as banner, in list, with sound and badge when the app is in the foreground.

---

## 3. Search bar on home screen (global search)

**Location:** Home tab, below greeting

- **UI**  
  A search bar with placeholder “Search bills, contacts, documents…” and clear button. Results render inline below when the query length is ≥ 2.

- **Scope**  
  Search runs across:
  - **Bills** — by bill name, provider name, or linked vendor company name.
  - **Contacts** — customers (company name, contact name, email) and vendors (company name, contact name, email).
  - **Documents** — by name, description, or tags.

- **Hook**  
  `src/hooks/useGlobalSearch.ts` — `useGlobalSearch(query)`:
  - Uses `useQueries` to run four queries (bills, customers, vendors, documents) when `query.trim().length >= 2`.
  - Returns `{ bills, customers, vendors, documents, isLoading, isError }`.

- **Result list**  
  Each result row is tappable and navigates to the correct screen (bill detail, edit customer, edit vendor, document detail). Type label shown (Bill, Customer, Vendor, Document).

**Note:** There is no separate “vehicles” entity in the main app; search is limited to bills, contacts (customers + vendors), and documents.

---

## 4. Quick-add floating action button (FAB)

**Location:** Home tab, bottom-right (above tab bar)

- **Button**  
  Blue circular FAB with “+” icon. Tappable area and position (e.g. bottom: 100) chosen for thumb reach.

- **Modal**  
  Tapping the FAB opens a bottom-sheet style modal titled “Quick add” with a grid of actions:
  - Add Expense  
  - Add Income  
  - Scan Receipt  
  - Create Invoice  
  - Upload Statement  
  - Add Bill  
  - Add Customer  
  - Add Vendor  
  - Upload Document  

  Each option navigates to the corresponding modal/route and closes the sheet. Haptic feedback on tap.

- **Constants**  
  Options are defined in `QUICK_ADD_OPTIONS` (label, icon, route) and reused for the FAB modal and the existing quick-action grid so behavior stays consistent.

---

## 5. Bill total summary — monthly spending by category (bar chart)

**Location:** Home tab, section “Monthly spending by category”

- **Data**  
  Uses `useTransactions({ type: 'expense', dateRange: monthRange })` where `monthRange` is the first and last day of the current month. Expenses are grouped by `category`, and amounts are summed (absolute value).

- **Chart**  
  A simple horizontal bar chart:
  - Up to 8 categories, sorted by total descending.
  - Each row: category name (via `getCategoryName()`), a bar whose width is proportional to that category’s share of the max total, and the total amount in dollars.
  - Implemented with `View` and flex; no extra chart library.

- **Empty state**  
  If there are no expenses in the current month, a short message is shown (e.g. “No expenses this month yet.”).

---

## Files touched / added

| Path | Change |
|------|--------|
| `app/(tabs)/index.tsx` | Dashboard cards, search bar, search results, monthly chart, quick-add FAB and modal, notification sync effect, stats from real data |
| `src/hooks/useGlobalSearch.ts` | **New** — global search across bills, customers, vendors, documents |
| `src/services/notificationSchedule.ts` | **New** — permissions, channels, bill/reminder scheduling, sync, cancel helpers |
| `docs/FEATURE_CHANGELOG_HOUSEHOLD.md` | **New** — this changelog |

---

## Verification

- `npx tsc --noEmit` passes.

---

## Summary

| Feature | Description |
|--------|-------------|
| **Dashboard cards** | Upcoming bills (7d), expiring documents (30d), recent activity (5 items) on home |
| **Push notifications** | Local notifications for bill due dates and compliance/reminder due dates (1 day before); sync on home load |
| **Global search** | Search bar on home; results across bills, contacts (customers + vendors), documents |
| **Quick-add FAB** | FAB on home opens modal to add expense, income, receipt, invoice, statement, bill, customer, vendor, document |
| **Monthly spending chart** | Bar chart of current-month expenses by category on home |
