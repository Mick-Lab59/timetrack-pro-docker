import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, Settings as SettingsIcon, Calendar as CalendarIcon, Plus, Building } from 'lucide-react'
import { format, parseISO, startOfISOWeek, isWithinInterval, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import Dashboard from './pages/Dashboard'
import AddEntry from './pages/AddEntry'
import SearchPage from './pages/Search'
import CalendarView from './pages/CalendarView'
import Enterprises from './pages/Enterprises'
import Settings from './pages/Settings'
import NotificationToast from './components/NotificationToast'

function Layout({ children }: { children: React.ReactNode }) {
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [notification, setNotification] = useState<{ message: string, type: 'info' | 'success' | 'warning' } | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    loadMonthsAndCheckStats()
  }, [location.pathname]) 

  const loadMonthsAndCheckStats = async () => {
    try {
      const entries = await window.api.getEntries()
      
      // 1. Charger les mois pour la sidebar
      const monthsSet = new Set<string>()
      entries.forEach(e => {
        const d = parseISO(e.date)
        monthsSet.add(format(d, 'yyyy-MM'))
      })
      const sortedMonths = Array.from(monthsSet).sort().reverse()
      setAvailableMonths(sortedMonths.slice(0, 12))

      // 2. Logique de Notification (uniquement sur la page d'accueil)
      if (location.pathname === '/' && !notification) {
        checkDailyAndWeeklyStats(entries)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const checkDailyAndWeeklyStats = (entries: any[]) => {
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const weekStart = startOfISOWeek(now)
    const weekEnd = addDays(weekStart, 6)

    // Calcul semaine
    const weekEntries = entries.filter(e => {
      const d = parseISO(e.date)
      return isWithinInterval(d, { start: weekStart, end: weekEnd }) && !e.is_leave
    })
    const weekHours = weekEntries.reduce((sum, e) => sum + e.total_hours, 0)

    // Check aujourd'hui
    const hasEntryToday = entries.some(e => e.date === todayStr)
    const currentHour = now.getHours()

    // Priorité aux messages : 
    // 1. Rappel de fin de journée (après 16h et pas de saisie)
    if (currentHour >= 16 && !hasEntryToday) {
      setNotification({
        message: `N'oubliez pas d'enregistrer vos heures du jour ! 🕒🖋️`,
        type: 'warning'
      })
    } 
    // 2. Stats de la semaine (si > 0h)
    else if (weekHours > 0) {
      setNotification({
        message: `Vous avez déjà travaillé ${weekHours.toFixed(2)}h cette semaine ! Beau boulot ! 🚀💪`,
        type: 'success'
      })
    }
    // 3. Message d'accueil par défaut si rien du tout
    else if (!hasEntryToday) {
      setNotification({
        message: `Bonne journée sur TimeTrack Pro ! Prêt pour une nouvelle saisie ? 😊`,
        type: 'info'
      })
    }
  }

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2 style={{ padding: '0 16px', marginBottom: '24px', color: 'var(--accent-color)' }}>TimeTrack Pro</h2>
        
        <NavLink to="/" className={({ isActive }) => `sidebar-item ${isActive && !location.pathname.includes('/month/') && location.pathname !== '/calendar' ? 'active' : ''}`}>
          <Home size={18} />
          Accueil
        </NavLink>

        <NavLink to="/calendar" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <CalendarIcon size={18} />
          Calendrier
        </NavLink>
        
        <NavLink to="/search" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <Search size={18} />
          Recherche
        </NavLink>

        <NavLink to="/enterprises" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <Building size={18} />
          Entreprises
        </NavLink>

        {availableMonths.length > 0 && (
          <div style={{ marginTop: '20px', padding: '0 16px' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '12px' }}>Parcourir par mois</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {availableMonths.map(monthId => (
                <NavLink 
                  key={monthId} 
                  to={`/month/${monthId}`} 
                  className={({ isActive }) => `sidebar-item month-link ${isActive ? 'active' : ''}`}
                  style={{ fontSize: '13px', padding: '8px 12px' }}
                >
                  <CalendarIcon size={14} />
                  {format(parseISO(`${monthId}-01`), 'MMMM yyyy', { locale: fr })}
                </NavLink>
              ))}
            </div>
          </div>
        )}
        
        <NavLink to="/settings" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} style={{ marginTop: 'auto' }}>
          <SettingsIcon size={18} />
          Paramètres
        </NavLink>
      </nav>
      
      <main className="main-content">
        {children}
      </main>

      <button className="fab nudge-animation" onClick={() => navigate('/add')} title="Ajouter des heures">
        <Plus size={32} />
      </button>

      {notification && (
        <NotificationToast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  )
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/month/:monthId" element={<Dashboard />} />
          <Route path="/add" element={<AddEntry />} />
          <Route path="/edit/:id" element={<AddEntry />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/enterprises" element={<Enterprises />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
