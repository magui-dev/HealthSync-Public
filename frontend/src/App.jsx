import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import BoardList from './pages/BoardList.jsx'
import BoardDetail from './pages/BoardDetail.jsx'
import BoardEditor from './pages/BoardEditor.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Topbar from './components/Topbar.jsx'
import Home from './pages/Home.jsx'
import WeightTrack from './pages/WeightTrack.jsx'
import FoodPlan from './pages/FoodPlan.jsx'
import MealPrep from './pages/MealPrep.jsx'
import FoodLayout from './pages/FoodLayout.jsx'

export default function App() {
  return (
    <div>
      <header className="header" role="banner">
        <div className="header-inner container">
          <div className="brand" aria-label="WinterSleeping Starter">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12"/>
              <path d="M5 15c3 2 6 2 9 0 1.5-1 3.5-1 5 0" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M7 8h0M12 7h0M17 9h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>SecondProject UI</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <NavLink to="/" end>홈</NavLink>
            <NavLink to="/weight/track">체중관리</NavLink>
            <NavLink to="/food">식단관리</NavLink>
          </nav>
        </div>
      </header>

      <Topbar />

      <main className="container" role="main">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/weight/track" element={<WeightTrack/>} />
          <Route path="/food" element={<FoodLayout/>}>
            <Route index element={<Navigate to="plan" replace />} />
            <Route path="plan" element={<FoodPlan/>} />
            <Route path="mealprep" element={<MealPrep/>} />
          </Route>
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/board" element={<BoardList/>} />
          <Route path="/board/new" element={<ProtectedRoute><BoardEditor/></ProtectedRoute>} />
          <Route path="/board/:id" element={<BoardDetail/>} />
          <Route path="/board/:id/edit" element={<ProtectedRoute><BoardEditor/></ProtectedRoute>} />
        </Routes>
      </main>

      <footer className="footer container" role="contentinfo">
        <small>© {new Date().getFullYear()} WinterSleeping Starter — React + Vite</small>
      </footer>
    </div>
  )
}
