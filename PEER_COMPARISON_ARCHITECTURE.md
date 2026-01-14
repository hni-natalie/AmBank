# Peer Comparison Page - Visual Guide & Architecture

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PEER COMPARISON PAGE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Peer Comparison                    ← Back to Dashboard Button       │
│  MAYBANK vs 2 competitors                                            │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ MAYBANK         │  │ CIMB         │  │ PUBLIC BANK  │            │
│  │ MAYBANK         │  │ CIMB         │  │ PUBLIC       │            │
│  │ [Base Badge]    │  │              │  │              │            │
│  │                 │  │              │  │              │            │
│  │ ┌─────┬──────┬──┐ │ ┌──────┬───┬──┐ │ ┌──────┬───┬──┐            │
│  │ │✅   │⚠️    │📈│ │ │✅    │⚠️ │📈│ │ │✅    │⚠️ │📈│            │
│  │ │75%  │15%  │10%│ │ │60%   │20%│20%│ │ │50%   │30%│20%│         │
│  │ └─────┴──────┴──┘ │ │└──────┴───┴──┘ │ │└──────┴───┴──┘         │
│  │                 │  │              │  │              │            │
│  │ ✅ Signals (5)  │  │ ✅ Signals (3)  │  │ ✅ Signals (2)        │
│  │ • Signal A      │  │ • Signal X      │  │ • Signal P           │
│  │ • Signal B      │  │ • Signal Y      │  │                       │
│  │ • Signal C      │  │ • Signal Z      │  │ ⚠️ Signals (2)        │
│  │                 │  │                 │  │ • Risk A              │
│  │ ⚠️ Signals (1)   │  │ ⚠️ Signals (1)   │  │ • Risk B              │
│  │ • Risk 1        │  │ • Risk 1        │  │                       │
│  │                 │  │                 │  │ 📈 Signals (1)        │
│  │ 📈 Signals (1)   │  │ 📈 Signals (1)   │  │ • Trend 1             │
│  │ • Trend 1       │  │ • Trend 1       │  │                       │
│  └─────────────────┘  │ └──────────────┘  │ └──────────────┘       │
│                       │                    │                        │
│  (Blue Border)        │  (Standard)        │  (Standard)           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Mobile (1 col):     Tablet (1-2 cols):      Desktop (3 cols):
[Card 1]            [Card 1] [Card 2]       [Card 1] [Card 2] [Card 3]
[Card 2]            [Card 3]
[Card 3]
```

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER INTERACTION                                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    Click "Compare with Peers"
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ NAVIGATION                                                          │
│ DashboardPage → navigate('/dashboard/compare')                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    PeerComparisonPage.tsx loads
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STATE INITIALIZATION                                                │
│ • Get ticker, companyName from Zustand store (useAppStore)         │
│ • Initialize loading=true, error=null, comparison=null             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                        useEffect triggers
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ API CALL #1: GET /api/company/search                               │
│ Input: ticker (e.g., "MAYBANK")                                    │
│ Output: { peers: ["CIMB", "PUBLIC", ...] }                         │
│ Action: Extract peers array                                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    Slice peers to maximum 2
                    peers = ["CIMB", "PUBLIC"]
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ API CALL #2: POST /api/dashboard/compare-peers                     │
│                                                                     │
│ Request Body:                                                       │
│ {                                                                   │
│   "ticker": "MAYBANK",                                             │
│   "company_name": "Maybank",                                       │
│   "peers": ["CIMB", "PUBLIC"]  // Exactly 2, sliced                │
│ }                                                                   │
│                                                                     │
│ Response:                                                           │
│ {                                                                   │
│   "base": {                                                         │
│     "company_name": "Maybank",                                     │
│     "ticker": "MAYBANK",                                           │
│     "signals": {                                                   │
│       "positive": ["Signal A", "Signal B", ...],  // Array         │
│       "adverse": ["Risk 1"],                                       │
│       "trend": ["Trend 1"]                                         │
│     }                                                              │
│   },                                                               │
│   "peers": [                                                       │
│     { "company_name": "CIMB", ... },                               │
│     { "company_name": "PUBLIC", ... }                              │
│   ]                                                                │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PERCENTAGE CALCULATION (Frontend)                                   │
│                                                                     │
│ For each company (base + 2 peers):                                  │
│   total = positive.length + adverse.length + trend.length           │
│   positivePercent = (positive.length / total) * 100                 │
│   adversePercent = (adverse.length / total) * 100                   │
│   trendPercent = (trend.length / total) * 100                       │
│                                                                     │
│ Example:                                                            │
│   positive: 5, adverse: 1, trend: 1 → total: 7                     │
│   positive: 71% | adverse: 14% | trend: 14%                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ UI RENDERING                                                        │
│ • Create 3 cards (base + 2 peers)                                   │
│ • Base card: Blue border, "Base" badge                              │
│ • Each card shows 3 metric boxes with percentages                   │
│ • Below metrics: Signal lists with actual text                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                        USER SEES RESULTS
```

## 📦 Component Structure

```
PeerComparisonPage.tsx (Main Component)
├── State Management:
│   ├── comparison: PeerComparisonResponse
│   ├── loading: boolean
│   ├── error: string | null
│   └── ticker, companyName from store
│
├── Effects:
│   └── useEffect: Fetch company search + peer comparison
│
├── Render States:
│   ├── Loading: Spinner + message
│   ├── No Ticker: "No Company Selected" + redirect button
│   ├── Error: "No Peer Companies Found" + redirect button
│   └── Success: Comparison cards grid
│
└── Components:
    └── CompanyComparisonCard (Reusable)
        ├── Props:
        │   ├── company: CompanySignals
        │   ├── percentages: { positive, adverse, trend }
        │   └── isBase: boolean
        │
        ├── Sections:
        │   ├── Header: Company name + ticker + Base badge
        │   ├── Metrics: 3 percentage boxes (color-coded)
        │   └── Signal Lists: Positive/Adverse/Trend signals
        │
        └── Styling:
            ├── Base: Blue border (2px) + light blue background
            ├── Peers: Standard gray border
            └── Responsive: Grid layout with auto-fit
```

## 🎯 Key Implementation Details

### 1. **Percentage Calculation**
```typescript
const calculatePercentages = (signals) => {
  const total = 
    (signals.positive?.length ?? 0) +
    (signals.adverse?.length ?? 0) +
    (signals.trend?.length ?? 0);
  
  if (total === 0) return { positive: 0, adverse: 0, trend: 0 };
  
  return {
    positive: Math.round(((signals.positive?.length ?? 0) / total) * 100),
    adverse: Math.round(((signals.adverse?.length ?? 0) / total) * 100),
    trend: Math.round(((signals.trend?.length ?? 0) / total) * 100),
  };
};
```

### 2. **Peer Slicing (Max 2)**
```typescript
// In PeerComparisonPage.tsx
const peersToAnalyze = peersList.slice(0, 2);

// In API helper (dashboard.ts)
const peersToSend = peers.slice(0, 2);
```

### 3. **Error Handling Strategy**
```
API Call Success?
├─ YES → Peers found?
│        ├─ YES → Render comparison cards
│        └─ NO → Show "No Peer Companies Found"
└─ NO → Show error message
```

### 4. **Color Scheme**
```
✅ Positive:  #10b981 (Green) background: #f0fdf4
⚠️ Adverse:   #ef4444 (Red) background: #fef2f2
📈 Trend:    #f59e0b (Yellow) background: #fffbeb
Base Card:   Blue border (#3b82f6) + light blue background (#dbeafe)
```

## 🔗 File Dependencies

```
PeerComparisonPage.tsx
├── Imports:
│   ├── react (useState, useEffect)
│   ├── react-router-dom (useNavigate)
│   ├── ../store/appStore (useAppStore)
│   └── ../api/dashboard (PeerComparisonResponse, CompanySignals)
│
└── Exports:
    ├── PeerComparisonPage (default export)
    └── CompanyComparisonCard (internal component)

App.tsx (Router)
├── Imports: PeerComparisonPage
└── Route: <Route path="/dashboard/compare" element={<PeerComparisonPage />} />

DashboardPage.tsx (Navigation Source)
├── Button onClick: navigate('/dashboard/compare')
└── Uses useAppStore to pass ticker + company name

dashboard.ts (API Types & Helpers)
├── Types: PeerComparisonResponse, CompanySignals, SignalArrays
└── Function: fetchPeerComparison() (with peer slicing)
```

## 🧪 Error Scenarios

| Scenario | Handler | User Message |
|---|---|---|
| No ticker in store | Check on mount | "No Company Selected" + Button to Dashboard |
| API returns no peers | Empty array check | "No Peer Companies Found" + Explanation |
| API network error | Try-catch | Error text displayed + Retry by back-navigate |
| Empty signals array | Render "No signals" | Placeholder text in signal lists |
| 0 total signals | Return 0% all | Shows 0% for all categories |

## 📊 Response Size Example

```
Request:
{
  "ticker": "MAYBANK",
  "company_name": "Maybank",
  "peers": ["CIMB", "PUBLIC"]
}
→ ~100 bytes

Response:
{
  "base": {
    "company_name": "Maybank",
    "ticker": "MAYBANK",
    "signals": {
      "positive": ["...", "...", "..."],       // Array of strings
      "adverse": ["..."],                      // Variable length
      "trend": ["...", "..."]
    }
  },
  "peers": [
    { same structure } × 2
  ]
}
→ ~2-5 KB (typical)
```

## ✅ Deployment Checklist

- [ ] No TypeScript compilation errors
- [ ] All imports resolve correctly
- [ ] Routes properly registered in App.tsx
- [ ] Button navigation URL correct (/dashboard/compare)
- [ ] API endpoint matches backend (/api/dashboard/compare-peers)
- [ ] Error states render properly
- [ ] Loading state visible
- [ ] Responsive layout tested (mobile/tablet/desktop)
- [ ] Signal arrays properly handled (empty + populated)
- [ ] Percentage calculation correct (0-100 range)
- [ ] Colors render correctly (green/red/yellow backgrounds)
- [ ] Back button works from Peer Comparison page
- [ ] Browser console clean (no errors)
