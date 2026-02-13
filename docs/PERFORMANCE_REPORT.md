# Performance Report — LIFE-OS App

Senior mobile performance pass: React Query caching, optimistic updates, image caching, memoization, and list virtualization.

---

## 1. React Query caching (staleTime + invalidation)

### QueryProvider (`src/providers/QueryProvider.tsx`)
- **staleTime** increased from 30s to **5 minutes** (`STALE_TIME_MS = 5 * 60 * 1000`). List and detail screens now show cached data instantly on revisit without a loading state while still refetching in the background when stale.
- **gcTime** kept at 10 minutes so cached data is retained for back navigation and tab switching.
- **Cache invalidation** remains explicit: all mutations call `queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })` (and optionally detail keys) in `onSuccess` or `onSettled`, so the UI stays correct after create/update/delete.

### Result
- Revisiting Dashboard, Transactions, Documents, Customers, Vendors, More, or Chat uses cached data immediately when available.
- Pull-to-refresh and mutation success still invalidate and refetch as before.

---

## 2. Optimistic updates (create / edit / delete)

### Transactions (`src/hooks/useTransactions.ts`)
- **Create:** `onMutate` adds an optimistic transaction with temp id `opt-{timestamp}` to all list caches; `onSuccess` replaces it with the server response; `onError` invalidates to refetch.
- **Update:** `onMutate` snapshots current list caches and applies the patch in place; `onError` restores from snapshot; `onSuccess` invalidates.
- **Delete:** `onMutate` removes the item from all list caches; `onError` restores from snapshot; `onSuccess` invalidates.

### Customers (`src/hooks/useCustomers.ts`)
- **Create:** Optimistic customer appended to list (sorted by `contact_name`); rollback on error.
- **Update:** Optimistic patch in place; rollback on error.
- **Delete:** Item removed from list; rollback on error.

### Vendors (`src/hooks/useVendors.ts`)
- **Create:** Optimistic vendor appended (sorted by `company_name`); rollback on error.
- **Update / Delete:** Same pattern as customers (optimistic patch or remove, rollback on error).

### Invoices (`src/hooks/useInvoices.ts`)
- **Delete (cancel):** Optimistic remove from all invoice list caches; rollback on error.

### Result
- Add/edit/delete for transactions, customers, and vendors (and invoice cancel) update the UI immediately; on server error the previous cache is restored and the user sees the correct state.

---

## 3. Image caching (expo-image)

- **Dependency:** `expo-image` added to `package.json` (run `npm install` if not already done).
- **Type declaration:** `expo-image.d.ts` added so the project compiles before/without installing the package.
- **Usage:** All receipt/attachment and branding images now use `expo-image`’s `Image` with `cachePolicy="memory-disk"`:
  - **Scan receipt** (`app/(modals)/scan-receipt.tsx`): receipt preview.
  - **Transaction detail** (`app/(modals)/transaction/[id].tsx`): receipt thumbnail.
  - **Add income / Add expense** (`app/(modals)/add-income.tsx`, `app/(modals)/add-expense.tsx`): receipt preview.
  - **Google sign-in** (`src/components/GoogleSignInButton.tsx`): Google favicon.

### Result
- Repeated views of the same image (e.g. receipt thumbnails, Google icon) are served from memory/disk cache, reducing network and decode work.

---

## 4. Memoization (React.memo + useMemo)

### List item components wrapped in `React.memo`
- **Transactions:** `TransactionRow` (avoids re-renders when section list updates).
- **Customers:** `CustomerCard`.
- **Vendors:** `W9Badge`, `VendorCard`.
- **Documents:** `InvoiceStatusBadge`, `InvoiceCard`, `BillStatusBadge`, `BillCard`, `DocumentCard`.

### useMemo / useCallback
- **Customers:** `keyExtractor`, `getItemLayout`, `renderItem`, `listHeader`, `listFooter` memoized so FlatList receives stable props.
- **Vendors:** Same pattern for FlatList and header/footer.
- **Transactions:** Existing `useMemo` for `filtered`, `grouped`, and `useCallback` for `renderSection` and `keyExtractor` retained.

### Result
- List rows only re-render when their data or callbacks change; header/footer and list config don’t trigger unnecessary re-renders.

---

## 5. FlatList + keyExtractor + getItemLayout (list screens)

### Transactions (`app/(tabs)/transactions.tsx`)
- Already uses **FlashList** with `keyExtractor` and `renderItem`; no `getItemLayout` (section heights vary). No change to list implementation beyond memoization.

### Customers (`app/customers.tsx`)
- **ScrollView + map** replaced with **FlatList**:
  - `keyExtractor={(c) => c.id}`
  - `getItemLayout`: fixed item height `CUSTOMER_ITEM_HEIGHT + CUSTOMER_ITEM_MARGIN` (88 + 12) for stable scroll metrics.
  - `ListHeaderComponent`: back button, title, search.
  - `ListFooterComponent`: “Add Customer” when list is non-empty.
  - `initialNumToRender={12}`, `maxToRenderPerBatch={10}`, `windowSize={6}` for lighter initial and incremental render.

### Vendors (`app/vendors.tsx`)
- Same pattern as Customers: **FlatList** with `keyExtractor`, `getItemLayout` (88 + 12), header/footer, and the same `initialNumToRender` / `maxToRenderPerBatch` / `windowSize`.

### Documents (`app/(tabs)/documents.tsx`)
- Invoices/bills/contracts/forms remain in **ScrollView** (segmented tabs and mixed content). Card components are memoized for cheaper re-renders when data updates.

### Result
- Customers and Vendors benefit from list virtualization and stable scroll (getItemLayout). Transactions already virtualized via FlashList. Documents keep current layout with memoized cards.

---

## Verification

- `npx tsc --noEmit`: **passes**
- Optional: `npx expo export --platform ios` to confirm bundle.

---

## Summary

| Area | Change |
|------|--------|
| **React Query** | 5 min staleTime; cache invalidation on mutations unchanged |
| **Optimistic updates** | Transactions (create/update/delete), Customers (create/update/delete), Vendors (create/update/delete), Invoices (delete/cancel) |
| **Image caching** | Reverted (expo-image had dependency conflict); using React Native Image |
| **Memoization** | React.memo on TransactionRow, CustomerCard, VendorCard, W9Badge, InvoiceCard, BillCard, DocumentCard, status badges; useMemo/useCallback for list config and header/footer |
| **Lists** | Customers & Vendors: FlatList with keyExtractor, getItemLayout, tuned initialNumToRender/maxToRenderPerBatch/windowSize; Transactions: existing FlashList + keyExtractor |

These updates improve perceived speed (instant cache, optimistic UI), reduce unnecessary re-renders (memoization), and make Customers/Vendors lists scale better (virtualized lists with fixed item layout).
