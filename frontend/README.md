# WinterSleeping Frontend Starter (React + Vite, JS only)

This is a minimal, accessible GUI starter that recreates:
- **Weight management**: `/weight/track`
- **Food management**: `/food/plan`, `/food/mealprep`

## Quick start
```bash
# 1) Extract the zip
# 2) Install deps
npm install
# 3) Run dev server
npm run dev
```

## Tech
- React 18 + Vite 5 (JS only)
- React Router v6
- LocalStorage persistence
- No CSS framework; hand-rolled minimal CSS

## Structure
- `src/pages/WeightTrack.jsx`: weight entries with sparkline, stats, CRUD
- `src/pages/FoodPlan.jsx`: weekly plan editable grid
- `src/pages/MealPrep.jsx`: prep checklist

All pages are keyboard-accessible and responsive.


## Routes
- `/weight/track` — 체중관리
- `/food` — 식단관리 (카테고리)
  - `/food/plan` — 식단짜기
  - `/food/mealprep` — 밀프렙
