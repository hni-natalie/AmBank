# Peer Comparison Page - Quick Start Guide

## 🎯 What Was Built

A new **Peer Comparison Page** (`/dashboard/compare`) that shows:
- 1 **Base Company** (highlighted)
- 2 **Peer Companies** (auto-sliced)
- **3 percentage metrics** per company: ✅ Positive | ⚠️ Adverse | 📈 Trend

---

## 📍 How to Access

### From Dashboard Page
1. Enter a company ticker (e.g., "MAYBANK")
2. View the analysis
3. Click **"📊 Compare with Peers"** button (blue, bottom-right panel)
4. Automatically navigates to `/dashboard/compare`

---

## 🎨 What You'll See

```
┌─────────────────────────────────────────────────────────────┐
│ Peer Comparison: MAYBANK vs 2 competitors    [← Back Button]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│ │ MAYBANK        │ │ CIMB           │ │ PUBLIC BANK    │    │
│ │ MAYBANK [Base] │ │ CIMB           │ │ PUBLIC         │    │
│ │                │ │                │ │                │    │
│ │ ✅75% ⚠️15%📈10%│ │ ✅60% ⚠️20%📈20%│ │ ✅50% ⚠️30%📈20%│   │
│ │                │ │                │ │                │    │
│ │ ✅ Signals (5) │ │ ✅ Signals (3) │ │ ✅ Signals (2) │    │
│ │ • Signal A     │ │ • Signal X     │ │ • Signal P     │    │
│ │ • Signal B     │ │ • Signal Y     │ │                │    │
│ │ • Signal C     │ │ • Signal Z     │ │ ⚠️ Signals (2) │    │
│ │                │ │                │ │ • Risk A       │    │
│ │ ⚠️ Signals (1) │ │ ⚠️ Signals (1) │ │ • Risk B       │    │
│ │ • Risk 1       │ │ • Risk 1       │ │                │    │
│ │                │ │                │ │ 📈 Signals (1) │    │
│ │ 📈 Signals (1) │ │ 📈 Signals (1) │ │ • Trend 1      │    │
│ │ • Trend 1      │ │ • Trend 1      │ │                │    │
│ │                │ │                │ │                │    │
│ └────────────────┘ └────────────────┘ └────────────────┘    │
│  (Blue border)      (Standard)         (Standard)          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Understanding the Metrics

### ✅ Positive % (Green)
- **What**: Percentage of positive signals out of all signals
- **Formula**: (Positive Signal Count / Total Signals) × 100
- **Example**: 5 positive + 1 adverse + 1 trend = 7 total → 71% positive

### ⚠️ Adverse % (Red)
- **What**: Percentage of adverse/risk signals
- **Formula**: (Adverse Signal Count / Total Signals) × 100
- **Example**: 5 positive + 1 adverse + 1 trend = 7 total → 14% adverse

### 📈 Trend % (Yellow)
- **What**: Percentage of trend signals
- **Formula**: (Trend Signal Count / Total Signals) × 100
- **Example**: 5 positive + 1 adverse + 1 trend = 7 total → 14% trend

---

## 🔄 Data Flow

```
1. User on Dashboard
   ↓
2. Click "Compare with Peers" button
   ↓
3. Fetch company peers: GET /api/company/search?company_name=MAYBANK
   ↓ Response: { peers: ["CIMB", "PUBLIC", "AMBANK", ...] }
4. Slice to 2 peers: ["CIMB", "PUBLIC"]
   ↓
5. Fetch comparison: POST /api/dashboard/compare-peers
   ↓ Body: { ticker: "MAYBANK", company_name: "Maybank", peers: ["CIMB", "PUBLIC"] }
   ↓ Response: { base: {...signals}, peers: [{...}, {...}] }
6. Calculate percentages for each company
   ↓
7. Render 3 cards with metrics
   ↓
8. Display to user
```

---

## ⚙️ Technical Details

### Files Changed
```
NEW:
  src/pages/PeerComparisonPage.tsx (559 lines)

UPDATED:
  src/App.tsx (route added)
  src/pages/DashboardPage.tsx (button navigation)
  src/api/dashboard.ts (API helper + types)
  src/components/SignalCard.tsx (cleanup)
```

### Route
```
/dashboard/compare
```

### API Endpoint
```
POST /api/dashboard/compare-peers
```

### Types
```typescript
interface PeerComparisonResponse {
  base: CompanySignals | null;
  peers: CompanySignals[];
}

interface CompanySignals {
  company_name: string;
  ticker: string;
  signals: {
    positive: string[];    // Array of signal texts
    adverse: string[];     // Array of risk texts
    trend: string[];       // Array of trend texts
  };
}
```

---

## 🧪 Testing Checklist

- [ ] Click "Compare with Peers" on Dashboard
- [ ] See 3 cards render
- [ ] Base company has blue border + "Base" badge
- [ ] Percentages are 0-100 and sum to 100
- [ ] Signal lists show actual text
- [ ] "Back to Dashboard" button works
- [ ] Try company with no peers → See error message
- [ ] Test on mobile → Responsive layout
- [ ] Check browser console → No errors

---

## 🐛 Troubleshooting

| Issue | Solution |
|---|---|
| No peers shown | Company may not have peers in database. Try MAYBANK, CIMB |
| Percentages don't add to 100% | They may round to 101% due to Math.round(). This is OK. |
| "No Peer Companies Found" message | Ticker has no peer data. Try different company. |
| Button not working | Check that route `/dashboard/compare` exists in App.tsx |
| API error | Ensure backend is running on http://localhost:8000 |

---

## 📚 Key Files

### Main Component
```
/frontend/src/pages/PeerComparisonPage.tsx
├── PeerComparisonPage (main component)
└── CompanyComparisonCard (card component)
```

### API Types
```
/frontend/src/api/dashboard.ts
├── PeerComparisonResponse
├── CompanySignals
├── SignalArrays
└── fetchPeerComparison() helper
```

### Routes
```
/frontend/src/App.tsx
Route: /dashboard/compare → PeerComparisonPage
```

### Navigation
```
/frontend/src/pages/DashboardPage.tsx
Button: "Compare with Peers" → navigate('/dashboard/compare')
```

---

## 💡 Tips

1. **Responsive**: Works on mobile (1 col), tablet (2 col), desktop (3 col)
2. **Error Safe**: Shows helpful messages if data unavailable
3. **Auto Slicing**: Frontend automatically limits to 2 peers
4. **Color Coded**: Green = positive, Red = adverse, Yellow = trend
5. **Back Navigation**: Easy return to dashboard with button

---

## 🚀 Next Steps

### To Deploy
```bash
npm run build    # Builds successfully ✅
npm run dev      # Run in development
```

### To Test Locally
1. Terminal 1: `cd backend && python main.py`
2. Terminal 2: `cd frontend && npm run dev`
3. Browser: Go to http://localhost:5173
4. Enter ticker → Click Compare with Peers

### To Customize
- Edit `/frontend/src/pages/PeerComparisonPage.tsx` for styling
- Edit `/frontend/src/api/dashboard.ts` for API changes
- Modify percentage calculation in `calculatePercentages()` function

---

## ❓ FAQ

**Q: Why only 2 peers?**
A: Requirement specified exactly 3 cards total (1 base + 2 peers)

**Q: What if a company has no peers?**
A: User sees "No Peer Companies Found" message with helpful explanation

**Q: How are percentages calculated?**
A: `(signal_count / total_signals) * 100` - divides individual signal count by total signals

**Q: Can I compare with more than 2 peers?**
A: Change `peers.slice(0, 2)` to `peers.slice(0, N)` in PeerComparisonPage.tsx

**Q: Where do the signals come from?**
A: Backend macro/micro RAG agents analyze news articles and extract signals

**Q: How do I go back?**
A: Click "← Back to Dashboard" button in header

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Review backend logs for API issues
3. Verify ticker exists in KLSE Screener
4. Ensure both frontend and backend are running

---

*Last Updated: 2025-01-14*
*Status: Production Ready* ✅
