import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, DollarSign, Building, Trash2, Calendar, Filter, ChevronLeft, ChevronRight, X, Package, TrendingUp, BarChart as BarChartIcon } from 'lucide-react'
import { WorkEntry, TimeSlot } from '../types'
import { startOfMonth, endOfMonth, format, isWithinInterval, parseISO, getISOWeek, startOfISOWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, 
  AreaChart, Area
} from 'recharts'

const ENTRIES_PER_PAGE = 15

export default function Dashboard() {
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState<{start: string, end: string} | null>(null)
  const [stats, setStats] = useState({ totalHours: 0, totalNet: 0 })
  const [selectedEntry, setSelectedEntry] = useState<WorkEntry | null>(null)
  const navigate = useNavigate()
  const { monthId } = useParams()

  useEffect(() => {
    const init = async () => {
      if (monthId) {
        // Mode Filtrage par navigation latérale
        const start = startOfMonth(parseISO(`${monthId}-01`))
        const end = endOfMonth(start)
        setDateRange({
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
        })
      } else {
        // Mode Persistance / Accueil
        const settings = await window.api.getSettings()
        const savedStart = settings.find(s => s.key === 'dash_start')?.value
        const savedEnd = settings.find(s => s.key === 'dash_end')?.value

        const defaultStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
        const defaultEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

        setDateRange({
          start: savedStart || defaultStart,
          end: savedEnd || defaultEnd
        })
      }
      loadEntries()
    }
    init()
  }, [monthId])

  const loadEntries = async () => {
    const data = await window.api.getEntries()
    const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setEntries(sorted)
  }

  const filteredEntries = useMemo(() => {
    if (!dateRange) return []
    return entries.filter(entry => {
      try {
        return isWithinInterval(parseISO(entry.date), {
          start: parseISO(dateRange.start),
          end: parseISO(dateRange.end)
        })
      } catch (e) {
        return true
      }
    })
  }, [entries, dateRange])

  // Données pour le graphique des 35h (Hebdomadaire)
  const weeklyData = useMemo(() => {
    if (!dateRange || filteredEntries.length === 0) return []
    
    const weeks: Record<string, { weekNum: number, hours: number, label: string }> = {}
    
    filteredEntries.forEach(entry => {
      const d = parseISO(entry.date)
      const weekNum = getISOWeek(d)
      const start = format(startOfISOWeek(d), 'dd MMM', { locale: fr })
      const key = `${format(d, 'yyyy')}-W${weekNum}`
      
      if (!weeks[key]) {
        weeks[key] = { weekNum, hours: 0, label: `Semaine ${weekNum} (${start})` }
      }
      weeks[key].hours += entry.total_hours || 0
    })

    return Object.values(weeks).sort((a, b) => a.weekNum - b.weekNum)
  }, [filteredEntries])

  // Données pour le graphique des revenus cumulés (Trends)
  const trendsData = useMemo(() => {
    if (!dateRange || filteredEntries.length === 0) return []
    
    const sorted = [...filteredEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let cumulative = 0
    
    return sorted.map(entry => {
      cumulative += entry.total_net || 0
      return {
        date: format(parseISO(entry.date), 'dd/MM'),
        net: entry.total_net,
        cumul: cumulative
      }
    })
  }, [filteredEntries])

  useEffect(() => {
    const h = filteredEntries.reduce((acc, curr) => acc + (curr.total_hours || 0), 0)
    const n = filteredEntries.reduce((acc, curr) => acc + (curr.total_net || 0), 0)
    setStats({ totalHours: h, totalNet: n })
    setCurrentPage(1)
  }, [filteredEntries])

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ENTRIES_PER_PAGE
    return filteredEntries.slice(start, start + ENTRIES_PER_PAGE)
  }, [filteredEntries, currentPage])

  const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE)

  const handleDateChange = async (type: 'start' | 'end', value: string) => {
    if (!dateRange) return
    const newRange = { ...dateRange, [type]: value }
    setDateRange(newRange)
    await window.api.updateSetting(`dash_${type}`, value)
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (confirm('Supprimer cette entrée ?')) {
      await window.api.deleteEntry(id)
      setSelectedEntry(null)
      loadEntries()
    }
  }

  const handleEdit = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    navigate(`/edit/${id}`)
  }

  const formatSlotsSummary = (slots: TimeSlot[]) => {
    if (!slots || slots.length === 0) return 'Aucun horaire'
    return slots.map(s => `${s.start}-${s.end}`).join(' / ')
  }

  if (!dateRange) return <div className="fade-in" style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>Tableau de bord</p>
          <h1>Aperçu de votre activité</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--card-bg)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <div className="input-group" style={{ marginBottom: 0 }}>
            <input type="date" value={dateRange.start} onChange={e => handleDateChange('start', e.target.value)} style={{ padding: '6px 8px', fontSize: '13px' }} />
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>au</span>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <input type="date" value={dateRange.end} onChange={e => handleDateChange('end', e.target.value)} style={{ padding: '6px 8px', fontSize: '13px' }} />
          </div>
        </div>
      </header>

      {/* Cartes Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(0, 120, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
            <Clock size={24} />
          </div>
          <div>
            <p>Heures (Période)</p>
            <h2 style={{ fontSize: '24px' }}>{stats.totalHours.toFixed(2)}h</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(76, 194, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p>Gains (Net)</p>
            <h2 style={{ fontSize: '24px' }}>{stats.totalNet.toFixed(2)} €</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(128, 128, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <Building size={24} />
          </div>
          <div>
            <p>Dernière Entreprise</p>
            <h2 style={{ fontSize: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
              {entries[0]?.enterprise || '---'}
            </h2>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChartIcon size={18} color="var(--accent-color)" /> Objectif 35h Hebdomadaire
          </h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="var(--text-secondary)" unit="h" />
                <Tooltip 
                  cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
                  formatter={(value: any) => [`${value} h`, 'heures']}
                />
                <ReferenceLine y={35} stroke="#ff4d4d" strokeDasharray="5 5" label={{ position: 'right', value: '35h', fill: '#ff4d4d', fontSize: 10 }} />
                <Bar dataKey="hours" fill="var(--accent-color)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} color="#2ecc71" /> Évolution Cumulée des Revenus
          </h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2ecc71" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="var(--text-secondary)" unit="€" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
                  formatter={(value: any) => [value ? `${Number(value).toFixed(2)} €` : '0.00 €', 'cumul']}
                />
                <Area type="monotone" dataKey="cumul" stroke="#2ecc71" fillOpacity={1} fill="url(#colorNet)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historique */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="history-section">Historique ({filteredEntries.length} entrées)</h2>
        </div>
        
        <div className="card" style={{ padding: '0', position: 'relative' }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Date / Horaires</th>
                <th style={{ textAlign: 'left', width: '100px' }}>Type</th>
                <th style={{ textAlign: 'left' }}>Entreprise / Motif</th>
                <th style={{ textAlign: 'right' }}>Heures</th>
                <th style={{ textAlign: 'right' }}>Gain Net</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.map(entry => (
                <tr key={entry.id} onClick={() => setSelectedEntry(entry)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <Calendar size={14} color="var(--accent-color)" />
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                    {!entry.is_leave && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', marginLeft: '22px' }}>
                        {formatSlotsSummary(entry.slots)}
                      </div>
                    )}
                  </td>
                  <td>
                    {entry.is_leave ? (
                      <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: 'rgba(230, 126, 34, 0.1)', color: '#e67e22', borderRadius: '4px', fontWeight: '800', border: '1px solid rgba(230, 126, 34, 0.2)', textTransform: 'uppercase' }}>
                        {entry.enterprise === 'Jour Férié' ? 'FÉRIÉ' : 'CONGÉ'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', borderRadius: '4px', fontWeight: '800', border: '1px solid rgba(46, 204, 113, 0.2)', textTransform: 'uppercase' }}>
                        TRAVAIL
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <div>
                      {entry.is_leave && entry.enterprise === 'Jour Férié' ? '---' : entry.enterprise}
                    </div>
                    {entry.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '2px', fontStyle: 'italic', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.notes}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {entry.is_leave ? <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>---</span> : `${entry.total_hours.toFixed(2)}h`}
                  </td>
                  <td style={{ textAlign: 'right', color: entry.is_leave ? 'var(--text-secondary)' : 'var(--accent-color)', fontWeight: 'bold' }}>
                    {entry.is_leave ? <span style={{ opacity: 0.5 }}>---</span> : `${entry.total_net.toFixed(2)} €`}
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Aucune donnée pour cette période.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '20px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                className="btn" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ opacity: currentPage === 1 ? 0.3 : 1 }}
              >
                <ChevronLeft size={18} />
              </button>
              
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                Page {currentPage} sur {totalPages}
              </span>

              <button 
                className="btn" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal Détail (inchangé) */}
      {selectedEntry && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '4px' }}>Détails de l'entrée</p>
                <h2 style={{ fontSize: '24px' }}>{selectedEntry.enterprise}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                  <Calendar size={16} />
                  <span>{new Date(selectedEntry.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              <button className="btn" onClick={() => setSelectedEntry(null)} style={{ border: 'none', background: 'transparent', padding: '8px' }}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Heures Totales</div>
                  <div className="detail-value" style={{ color: 'var(--accent-color)' }}>{selectedEntry.total_hours.toFixed(2)}h</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Gain Net</div>
                  <div className="detail-value" style={{ color: '#2ecc71' }}>{selectedEntry.total_net.toFixed(2)} €</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Taux Horaire</div>
                  <div className="detail-value">{selectedEntry.rate_brut} € (Brut)</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Prime / Bonus</div>
                  <div className="detail-value">{selectedEntry.prime || 0} €</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <section>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="var(--accent-color)" /> Chronologie des horaires
                  </h3>
                  <div className="slots-list">
                    {selectedEntry.slots.map((slot, index) => (
                      <div key={index} className="slot-row" style={{ backgroundColor: slot.type === 'break' ? 'rgba(231, 76, 60, 0.05)' : 'rgba(0, 120, 212, 0.05)', borderLeftColor: slot.type === 'break' ? '#e74c3c' : 'var(--accent-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 600 }}>{slot.start} - {slot.end}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            ({slot.type === 'work' ? 'Travail' : 'Pause'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={16} color="var(--accent-color)" /> Panier & Notes
                    </h3>
                    <div className="detail-item" style={{ marginBottom: '16px' }}>
                      <div className="detail-label">Frais de Panier</div>
                      <div className="detail-value">{selectedEntry.panier || 0} €</div>
                    </div>
                    {selectedEntry.notes && (
                      <div style={{ padding: '16px', backgroundColor: 'rgba(128, 128, 128, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px', lineHeight: '1.6' }}>
                        <div className="detail-label" style={{ marginBottom: '8px' }}>Note de la journée</div>
                        {selectedEntry.notes}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn" style={{ color: '#e74c3c', borderColor: '#e74c3c', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => selectedEntry.id && handleDelete(e, selectedEntry.id)}>
                <Trash2 size={16} /> Supprimer
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn" onClick={() => setSelectedEntry(null)}>Fermer</button>
                <button className="btn btn-primary" onClick={(e) => selectedEntry.id && handleEdit(e, selectedEntry.id)}>Modifier</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
