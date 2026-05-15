# 🔍 Analytics Debug Checklist

## Quick Test Guide

### 1. Console check (F12 - Console tab)
When you load the homepage:
- Do you see "[Analytics] Error tracking page view" messages?
- Do you see any other errors?

### 2. Network check (F12 - Network tab)
Filter by "analytics":
- Should see: POST `/api/analytics/track`
- Look at the request:
  - **Headers** tab: Should show `Content-Type: application/json`
  - **Payload** tab: Should show `{ eventType: "pageView", deviceId: "..." }`
  - **Response** tab: Should show `{ success: true }`

### 3. Firestore Console check
Go to: https://console.firebase.google.com → Firestore
- Navigate to `analytics` collection
- Look for today's date document (format: YYYY-MM-DD)
  - Example: `2026-04-17`
- Should contain:
  ```json
  {
    "date": "2026-04-17",
    "uniqueVisitors": 1,
    "visitorIds": ["device-id-uuid"],
    "totalClicks": 0,
    "clicksByType": {
      "productClick": 0,
      "categoryClick": 0,
      "buttonClick": 0,
      "linkClick": 0
    },
    "lastUpdated": timestamp
  }
  ```

### 4. Admin Dashboard
- Go to `/admin` page
- Top card should show "Análisis del Día"
- Should display:
  - **Visitantes únicos**: Should be ≥ 1
  - **Clicks**: Should match actual clicks made

### 5. Test Click Tracking
- On homepage, click on a product card
- Go back to `/admin`
- **Clicks** count should increment
- **clicksByType.productClick** should increase

## If nothing appears:

### ❌ Symptom: Can't see POST request in Network tab

**Solution:**
1. Check if `/api/analytics/track/route.ts` exists
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Hard refresh: `Ctrl+Shift+R`

**Check server console output for errors**

### ❌ Symptom: POST request returns 500

**Solution:**
1. Check terminal - server logs should show the error
2. Likely: Firebase Admin SDK not initialized
3. Check `/api/firebase-admin.ts` imports in route.ts

### ❌ Symptom: POST returns 200 but no data in Firestore

**Solution:**
1. Check Firestore Rules (might be still blocking writes)
2. Firestore Rules should be:
   ```
   match /analytics/{docId} {
     allow read: if isAdmin();
     allow create, update: if true;
   }
   ```
3. Redeploy rules if needed: `firebase deploy --only firestore:rules`

### ❌ Symptom: AnalyticsWidget shows 0 everywhere

**Solution:**
1. Check that Firestore document exists for today
2. Hard refresh admin page: `Ctrl+Shift+R`
3. Check browser console for read errors
4. If Firestore auth error, check that today's analytics doc is readable

## Files to check:

- ✅ `app/lib/analytics-db.ts` - Client library (calls API)
- ✅ `app/lib/useAnalytics.ts` - Hook
- ✅ `app/components/AnalyticsWidget.tsx` - Display widget
- ✅ `app/components/ProductoCard.tsx` - Click tracking
- ✅ `app/api/analytics/track/route.ts` - API endpoint (CRITICAL)
- ✅ `app/lib/firebase-admin.ts` - Admin SDK
- ✅ `firestore.rules` - Security rules

## Expected Data Flow:

```
User Action (click product) 
  ↓
ProductoCard calls trackProductClick()
  ↓
analytics-db.ts trackClick() calls fetch("/api/analytics/track")
  ↓
API route.ts receives POST, uses firebase-admin to write to Firestore
  ↓
Firestore document updated with new click count
  ↓
AnalyticsWidget reads via getTodayAnalytics()
  ↓
Admin dashboard displays updated counts
```

---

**Report back with:**
1. Console errors (if any)
2. Network tab status (does POST request exist?)
3. Firestore Console - does today's analytics doc exist?
4. Server terminal output
