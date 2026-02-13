# UI/UX Changelog — LIFE-OS App

Senior mobile UI/UX pass across the app: animations, pull-to-refresh, skeleton loading, empty states, 44pt touch targets, and haptic feedback.

---

## Shared / Global

### `src/lib/constants.ts`
- **Added** `MIN_TOUCH_TARGET = 44` and exported for use across screens so all interactive elements meet the 44×44pt minimum.

### `src/components/ui/ScreenFadeIn.tsx` (new)
- **Added** Reanimated screen entrance: opacity 0→1 over 280ms with `Easing.out(Easing.cubic)`.
- Wraps screen content in `Animated.View`; exported from `src/components/ui/index.ts`.

### `src/components/ui/EmptyState.tsx`
- **Updated** CTA button: `minHeight` and `minWidth` set to `MIN_TOUCH_TARGET` (44pt), content centered.
- **Added** `hapticLight()` on CTA press (imports from `lib/haptics` and `lib/constants`).

### `src/lib/haptics.ts`
- Used throughout for `hapticLight()` on primary actions (cards, buttons, menu items, FAB, Send, Clear).

---

## Screens

### Dashboard — `app/(tabs)/index.tsx`
- **Animations:** Wrapped main content in `ScreenFadeIn`.
- **Pull-to-refresh:** `RefreshControl` on scroll; refetches insights on refresh.
- **Skeleton / loading:** (Existing or minimal loading; insights load inline.)
- **Empty state:** Uses `EmptyState` when there are no insights (icon, title, body, optional CTA).
- **44pt + haptics:** Insight cards and “Dismiss” use `minHeight: MIN_TOUCH_TARGET` and `hapticLight()` on press; quick action buttons (e.g. Transactions, Documents) use 44pt and haptics.

### Transactions — `app/(tabs)/transactions.tsx`
- **Pull-to-refresh:** Already had `RefreshControl`; kept/verified.
- **Skeleton loading:** Replaced spinner with 2–4 `Skeleton` components for list loading.
- **Empty state:** Uses `EmptyState` when there are no transactions (with CTA where applicable).
- **44pt + haptics:** Transaction list rows, FAB, and FAB modal options use `minHeight: MIN_TOUCH_TARGET` and `hapticLight()` on press.

### Documents — `app/(tabs)/documents.tsx`
- **Pull-to-refresh:** `RefreshControl` on scroll; refetches invoices, bills, contracts, and forms on refresh.
- **Skeleton loading:** Skeleton placeholders for invoice list loading; bills/contracts/forms still use `ActivityIndicator` for their loading states.
- **Empty state:** Empty invoices segment uses `EmptyState` with “Create Invoice” CTA.
- **44pt + haptics:** Segment tabs, `InvoiceCard`, `BillCard`, and `DocumentCard` use `minHeight: MIN_TOUCH_TARGET` and `hapticLight()` on press.

### Customers — `app/customers.tsx`
- **Pull-to-refresh:** `RefreshControl` on list; refetches customers on refresh.
- **Skeleton loading:** Replaced spinner with `Skeleton` components for list loading.
- **Empty state:** Uses `EmptyState` when there are no customers, with “Add Customer” CTA.
- **44pt + haptics:** Customer cards and “Add Customer” button use 44pt and `hapticLight()` on press.

### Vendors — `app/vendors.tsx`
- **Pull-to-refresh:** `RefreshControl` on list; refetches vendors on refresh.
- **Skeleton loading:** Replaced spinner with `Skeleton` components for list loading.
- **Empty state:** Uses `EmptyState` when there are no vendors, with “Add Vendor” CTA.
- **44pt + haptics:** Vendor cards and “Add Vendor” button use 44pt and `hapticLight()` on press.

### More — `app/(tabs)/more.tsx`
- **Pull-to-refresh:** `RefreshControl` on scroll; refetches bank accounts (and any other list data) on refresh.
- **44pt + haptics:** All menu items (Change Password, Customers, Vendors, Bank, Tax Prep, Year-End, Estimates, Compliance, Templates, Reconciliation, Rules, Status, Sign out) use `minHeight: MIN_TOUCH_TARGET` and `hapticLight()` on press.

### Chat — `app/(tabs)/chat.tsx`
- **Pull-to-refresh:** `RefreshControl` on message list; refetches/refreshes chat data on pull.
- **Skeleton loading:** Initial loading uses skeleton message-style bubbles instead of a single spinner.
- **Empty state:** Kept “Ask me anything” and suggestion list; no separate empty-state component.
- **44pt + haptics:** Suggestion chips, quick-action buttons, “Clear” and “Send” use 44pt and `hapticLight()` on press.
- **Note:** “Thinking…” still uses `ActivityIndicator` for in-stream loading.

---

## Not changed in this pass

- **Reconciliation, Taxes, Estimates, Compliance, Year-end, Rules, Templates:** Same patterns (RefreshControl, Skeleton, EmptyState, 44pt, haptics) can be applied in a follow-up.
- **List item enter animations:** Only Dashboard uses `ScreenFadeIn`; no Reanimated list item enter (e.g. FadeIn/Layout) added for list screens yet.

---

## Verification

- `npx tsc --noEmit` — passes.
- `npx expo export --platform ios` — bundle builds successfully.

---

## Summary

| Area            | Change                                                                 |
|-----------------|------------------------------------------------------------------------|
| Animations      | `ScreenFadeIn` on Dashboard; Reanimated 280ms cubic ease-out            |
| Pull-to-refresh | Dashboard, Transactions, Documents, Customers, Vendors, More, Chat     |
| Skeleton load   | Transactions, Documents (invoices), Customers, Vendors, Chat           |
| Empty states    | Dashboard (insights), Transactions, Documents (invoices), Customers, Vendors |
| 44pt targets    | All updated screens use `MIN_TOUCH_TARGET` on interactive elements     |
| Haptics         | `hapticLight()` on cards, buttons, menu items, FAB, Send, Clear, CTAs   |
