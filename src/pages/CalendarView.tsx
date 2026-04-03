import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  getYear
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, DollarSign, Settings2, Check } from 'lucide-react'
import { WorkEntry } from '../types'
import { getFrenchHolidays, getSeason, getDSTChange, getFeast } from '../../electron/calendar'

interface CalendarOptions {
  showHolidays: boolean;
  showSeasons: boolean;
  showDST: boolean;
  showFeasts: boolean;
  showEnterprise: boolean;
}

export default function CalendarView() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showOptions, setShowOptions] = useState(false)
  
  const [options, setOptions] = useState<CalendarOptions>(() => {
    const saved = localStorage.getItem('calendar_options')
    return saved ? JSON.parse(saved) : {
      showHolidays: true,
      showSeasons: true,
      showDST: true,
      showFeasts: false,
      showEnterprise: true
    }
  })

  useEffect(() => {
    localStorage.setItem('calendar_options', JSON.stringify(options))
  }, [options])

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    try {
      const data = await window.api.getEntries()
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }

  // Génération des jours du calendrier
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const getEntryForDay = (day: Date) => {
    return entries.find(e => isSameDay(parseISO(e.date), day))
  }

  const handleDayClick = (day: Date, entry?: WorkEntry) => {
    if (entry) {
      navigate(`/edit/${entry.id}`)
    } else {
      const dateStr = format(day, 'yyyy-MM-dd')
      navigate(`/add?date=${dateStr}`)
    }
  }

  if (loading) return <div className="fade-in" style={{ padding: '40px', textAlign: 'center' }}>Chargement du calendrier...</div>

  return (
    <div className="fade-in calendar-page" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>Vue Mensuelle</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarIcon size={24} /> 
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className={`btn ${showOptions ? 'btn-primary' : ''}`} 
            onClick={() => setShowOptions(!showOptions)}
            title="Options d'affichage"
            style={{ padding: '8px', position: 'relative' }}
          >
            <Settings2 size={20} />
            {showOptions && (
              <div className="options-dropdown card fade-in" onClick={e => e.stopPropagation()}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--accent-color)', textTransform: 'uppercase' }}>Affichage</h4>
                <div className="option-item" onClick={() => setOptions(prev => ({ ...prev, showEnterprise: !prev.showEnterprise }))}>
                  <div className={`checkbox ${options.showEnterprise ? 'active' : ''}`}>{options.showEnterprise && <Check size={12}/>}</div>
                  Entreprises
                </div>
                <div className="option-item" onClick={() => setOptions(prev => ({ ...prev, showHolidays: !prev.showHolidays }))}>
                  <div className={`checkbox ${options.showHolidays ? 'active' : ''}`}>{options.showHolidays && <Check size={12}/>}</div>
                  Jours Fériés
                </div>
                <div className="option-item" onClick={() => setOptions(prev => ({ ...prev, showSeasons: !prev.showSeasons }))}>
                  <div className={`checkbox ${options.showSeasons ? 'active' : ''}`}>{options.showSeasons && <Check size={12}/>}</div>
                  Saisons
                </div>
                <div className="option-item" onClick={() => setOptions(prev => ({ ...prev, showDST: !prev.showDST }))}>
                  <div className={`checkbox ${options.showDST ? 'active' : ''}`}>{options.showDST && <Check size={12}/>}</div>
                  Heure Dété/Hiver
                </div>
                <div className="option-item" onClick={() => setOptions(prev => ({ ...prev, showFeasts: !prev.showFeasts }))}>
                  <div className={`checkbox ${options.showFeasts ? 'active' : ''}`}>{options.showFeasts && <Check size={12}/>}</div>
                  Fêtes / Événements
                </div>
              </div>
            )}
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
          <button className="btn" onClick={prevMonth} title="Mois précédent">
            <ChevronLeft size={20} />
          </button>
          <button className="btn" onClick={() => setCurrentMonth(new Date())} style={{ fontSize: '12px' }}>
            Aujourd'hui
          </button>
          <button className="btn" onClick={nextMonth} title="Mois suivant">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="calendar-grid-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* En-tête des jours de la semaine */}
        <div className="calendar-weekday-header">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="weekday-label">{day}</div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="calendar-grid" style={{ flex: 1 }}>
          {calendarDays.map((day, idx) => {
            const entry = getEntryForDay(day)
            const isSelectedMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())
            
            const holidays = options.showHolidays ? getFrenchHolidays(getYear(day)) : []
            const holiday = holidays.find(h => isSameDay(h.date, day))
            const season = options.showSeasons ? getSeason(day) : null
            const dst = options.showDST ? getDSTChange(day) : null
            const feast = options.showFeasts ? getFeast(day) : null

            return (
              <div 
                key={idx} 
                className={`calendar-day ${!isSelectedMonth ? 'outside' : ''} ${isToday ? 'today' : ''} ${entry ? 'has-entry' : ''}`}
                onClick={() => handleDayClick(day, entry)}
              >
                <div className="day-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="day-number">{format(day, 'd')}</div>
                  <div className="day-events">
                    {holiday && <span className="dot holiday" title={holiday.label}></span>}
                    {season && <span className="dot season" title={season}></span>}
                    {dst && <span className="dot dst" title={dst}></span>}
                  </div>
                </div>
                
                <div className="day-content">
                  {holiday && options.showHolidays && (
                    <div className="event-label holiday-label">{holiday.label}</div>
                  )}
                  {season && options.showSeasons && (
                    <div className="event-label season-label">{season}</div>
                  )}
                  {dst && options.showDST && (
                    <div className="event-label dst-label">{dst}</div>
                  )}
                  {feast && options.showFeasts && (
                    <div className="event-label feast-label">{feast}</div>
                  )}

                  {entry && (
                    <div className="entry-box">
                      {entry.is_leave ? (
                        <span className="badge-leave">
                          {entry.enterprise === 'Jour Férié' ? 'FÉRIÉ' : 'CONGÉ'}
                        </span>
                      ) : (
                        <div className="day-stats">
                          {options.showEnterprise && (
                            <div className="enterprise-name" style={{ color: 'var(--accent-color)', fontSize: '12px', fontWeight: 800, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {entry.enterprise}
                            </div>
                          )}
                          <div className="stat-row hours" style={{ fontSize: '13px' }}>
                            <Clock size={12} /> {entry.total_hours.toFixed(1)}h
                          </div>
                          <div className="stat-row earnings" style={{ fontSize: '13px' }}>
                            <DollarSign size={12} /> {entry.total_net.toFixed(2)}€
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .calendar-weekday-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 8px;
          background-color: var(--sidebar-bg);
          border-radius: var(--radius-sm);
        }
        .weekday-label {
          padding: 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 1px;
          background-color: var(--border-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .calendar-day {
          background-color: var(--card-bg);
          height: 100%;
          min-height: 100px;
          padding: 10px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .calendar-day:hover {
          background-color: rgba(76, 194, 255, 0.05);
          z-index: 2;
        }
        .calendar-day.outside {
          background-color: rgba(0, 0, 0, 0.2);
          opacity: 0.3;
        }
        .calendar-day.today {
          background-color: rgba(76, 194, 255, 0.05);
        }
        .calendar-day.today .day-number {
          background-color: var(--accent-color);
          color: white;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
        }
        .day-number {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .day-events {
          display: flex;
          gap: 2px;
        }
        .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
        }
        .dot.holiday { background-color: #e74c3c; }
        .dot.season { background-color: #2ecc71; }
        .dot.dst { background-color: #f1c40f; }

        .event-label {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .holiday-label { background-color: rgba(231, 76, 60, 0.1); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.2); }
        .season-label { background-color: rgba(46, 204, 113, 0.1); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.2); }
        .dst-label { background-color: rgba(241, 196, 15, 0.1); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.2); }
        .feast-label { background-color: rgba(155, 89, 182, 0.1); color: #9b59b6; border: 1px solid rgba(155, 89, 182, 0.2); }

        .entry-box {
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px dashed var(--border-color);
        }

        .options-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 200px;
          padding: 16px;
          background-color: var(--sidebar-bg);
          border: 1px solid var(--border-color);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .option-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 0;
        }
        .option-item:hover { color: var(--text-primary); }
        .checkbox {
          width: 16px;
          height: 16px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .checkbox.active {
          background-color: var(--accent-color);
          border-color: var(--accent-color);
          color: white;
        }

        .day-content {
          display: flex;
          flex-direction: column;
        }
        .day-stats {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-row {
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .stat-row.hours { color: var(--text-secondary); }
        .stat-row.earnings { color: #2ecc71; }
        
        .badge-leave {
          font-size: 8px;
          padding: 2px 4px;
          background-color: rgba(230, 126, 34, 0.1);
          color: #e67e22;
          border-radius: 3px;
          font-weight: 800;
          border: 1px solid rgba(230, 126, 34, 0.2);
          text-align: center;
        }
      `}} />
    </div>
  )
}
