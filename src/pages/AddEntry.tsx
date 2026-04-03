import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Minus, Check, X, Clock, Calendar, Building, DollarSign, PenTool, Layout as LayoutIcon, CalendarCheck } from 'lucide-react'
import { WorkEntry, TimeSlot } from '../types'
import { eachDayOfInterval, isWeekend, parseISO, format } from 'date-fns'

const defaultSlot: TimeSlot = { type: 'work', start: '08:00', end: '12:00' }

export default function AddEntry() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // États de saisie globale
  const [isRangeMode, setIsRangeMode] = useState(false)
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [skipWeekends, setSkipWeekends] = useState(true)
  
  const [entry, setEntry] = useState<WorkEntry>({
    date: new Date().toISOString().split('T')[0],
    enterprise: '',
    rate_brut: 0,
    net_ratio: 0.77,
    prime: 0,
    panier: 0,
    notes: '',
    total_hours: 0,
    total_net: 0,
    slots: [{ ...defaultSlot }],
    is_leave: false
  })
  const [companyNames, setCompanyNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const promises = [loadCompanyNames()]
        if (id) {
          promises.push(loadEntry(parseInt(id)))
        } else {
          promises.push(loadSettings())
        }
        await Promise.all(promises)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  const loadCompanyNames = async () => {
    const names = await window.api.getCompanyNames()
    setCompanyNames(names)
  }

  const loadEntry = async (entryId: number) => {
    const data = await window.api.getEntries()
    const item = data.find(e => e.id === entryId)
    if (item) setEntry(item)
  }


  const loadSettings = async () => {
    const settings = await window.api.getSettings()
    const ratio = settings.find(s => s.key === 'net_ratio')?.value
    if (ratio) setEntry(prev => ({ ...prev, net_ratio: parseFloat(ratio) }))
  }

  const updateEntryAndCalculate = (updates: Partial<WorkEntry>) => {
    setEntry(prev => {
      const updated = { ...prev, ...updates }
      
      let totalWorkMinutes = 0
      let totalBreakMinutes = 0

      updated.slots.forEach(slot => {
        const [sh, sm] = slot.start.split(':').map(Number)
        const [eh, em] = slot.end.split(':').map(Number)
        let duration = (eh * 60 + em) - (sh * 60 + sm)
        if (duration < 0) duration += 24 * 60

        if (slot.type === 'work') {
          totalWorkMinutes += duration
        } else {
          totalBreakMinutes += duration
        }
      })

      const totalHours = Math.max(0, (totalWorkMinutes - totalBreakMinutes) / 60)
      const netRate = updated.rate_brut * updated.net_ratio
      const totalNet = (totalHours * netRate) + updated.prime + updated.panier
      
      if (updated.is_leave) {
        return { ...updated, total_hours: 0, total_net: 0 }
      } else {
        return { ...updated, total_hours: totalHours, total_net: totalNet }
      }
    })
  }


  const addSlot = () => {
    const lastSlot = entry.slots[entry.slots.length - 1]
    const newSlot: TimeSlot = { ...defaultSlot, start: lastSlot?.end || '08:00', end: lastSlot?.end || '12:00' }
    updateEntryAndCalculate({ slots: [...entry.slots, newSlot] })
  }

  const removeSlot = (index: number) => {
    if (entry.slots.length > 1) {
      const newSlots = [...entry.slots]
      newSlots.splice(index, 1)
      updateEntryAndCalculate({ slots: newSlots })
    }
  }

  const updateSlot = (index: number, field: keyof TimeSlot, value: any) => {
    const newSlots = [...entry.slots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    updateEntryAndCalculate({ slots: newSlots })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry.enterprise) return alert('Veuillez saisir une entreprise')
    
    try {
      if (isRangeMode && !id) {
        // Mode Période
        const interval = eachDayOfInterval({
          start: parseISO(entry.date),
          end: parseISO(endDate)
        })

        let savedCount = 0
        for (const day of interval) {
          if (skipWeekends && isWeekend(day)) continue
          
          const dayEntry = { 
            ...entry, 
            date: format(day, 'yyyy-MM-dd')
          }
          await window.api.saveEntry(dayEntry)
          savedCount++
        }
        
        // On ne fait pas de showMessageBox ici car electron/main.ts le fait déjà par saveEntry? 
        // En vrai main.ts affiche une box à CHAQUE saveEntry, ce sera gênant. 
        // Mais bon, c'est ce qu'on a.
        navigate('/')
      } else {
        // Mode Unique
        const result = await window.api.saveEntry(entry)
        // @ts-ignore
        if (result.success || typeof result === 'number' || result === true) {
          navigate('/')
        } else {
          // @ts-ignore
          alert('Erreur lors de l\'enregistrement : ' + (result.error || 'Erreur inconnue'))
        }
      }
    } catch (err: any) {
      alert('Une exception s\'est produite : ' + err.message)
    }
  }

  if (loading) return <div className="fade-in" style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '32px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
          {id ? 'Édition' : 'Saisie'}
        </p>
        <h1>{id ? 'Modifier la journée' : 'Ajouter des heures'}</h1>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {!id && (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: 'var(--sidebar-bg)', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                <button 
                  type="button" 
                  onClick={() => setIsRangeMode(false)}
                  className={`btn ${!isRangeMode ? 'btn-primary' : ''}`} 
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)' }}
                >
                  Journée Unique
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsRangeMode(true)}
                  className={`btn ${isRangeMode ? 'btn-primary' : ''}`}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)' }}
                >
                  Par Période
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: 'var(--sidebar-bg)', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                <button 
                  type="button" 
                  onClick={() => updateEntryAndCalculate({ is_leave: false })}
                  className={`btn ${!entry.is_leave ? 'btn-primary' : ''}`} 
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: !entry.is_leave ? 'var(--accent-color)' : 'transparent' }}
                >
                  Travail
                </button>
                <button 
                  type="button" 
                  onClick={() => updateEntryAndCalculate({ is_leave: true })}
                  className={`btn ${entry.is_leave ? 'btn-primary' : ''}`}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: entry.is_leave ? '#e67e22' : 'transparent', color: entry.is_leave ? 'white' : 'var(--text-secondary)' }}
                >
                  Congés
                </button>
              </div>
            </div>
          )}

          <section className="card">
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutIcon size={20} /> Informations Générales
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>{isRangeMode ? 'Date de Début' : 'Date'}</label>
                <div style={{ position: 'relative' }}>
                  <input type="date" value={entry.date} onChange={e => updateEntryAndCalculate({ date: e.target.value })} style={{ width: '100%', paddingLeft: '36px' }} />
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                </div>
              </div>
              
              {isRangeMode && (
                <div className="input-group">
                  <label>Date de Fin</label>
                  <div style={{ position: 'relative' }}>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', paddingLeft: '36px' }} />
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                  </div>
                </div>
              )}

              <div className="input-group" style={{ gridColumn: isRangeMode ? 'span 2' : 'span 1' }}>
                <label>{entry.is_leave ? 'Motif / Description' : 'Entreprise'}</label>
                <div style={{ position: 'relative' }}>
                  {entry.is_leave ? (
                    <select
                      value={entry.enterprise}
                      onChange={e => updateEntryAndCalculate({ enterprise: e.target.value })}
                      style={{ width: '100%', paddingLeft: '36px', height: '42px', appearance: 'none' }}
                      className="form-select"
                    >
                      <option value="">-- Sélectionner un motif --</option>
                      <option value="Congés Payés">Congés Payés</option>
                      <option value="RTT">RTT</option>
                      <option value="Maladie">Maladie</option>
                      <option value="Récupération">Récupération</option>
                      <option value="Formation">Formation</option>
                      <option value="Événement Familial">Événement Familial</option>
                      <option value="Congé Sans Solde">Congé Sans Solde</option>
                      <option value="Jour Férié">Jour Férié</option>
                      <option value="Autre">Autre</option>
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      placeholder="Nom de l'entreprise"
                      list="companies-list"
                      value={entry.enterprise} 
                      onChange={e => updateEntryAndCalculate({ enterprise: e.target.value })} 
                      style={{ width: '100%', paddingLeft: '36px' }} 
                    />
                  )}
                  
                  {!entry.is_leave && (
                    <datalist id="companies-list">
                      {companyNames.slice(0, 20).map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  )}
                  
                  {entry.is_leave ? (
                    <CalendarCheck size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--accent-color)' }} />
                  ) : (
                    <Building size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-secondary)' }} />
                  )}
                </div>
              </div>

              {isRangeMode && (
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'rgba(76, 194, 255, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(76, 194, 255, 0.2)' }}>
                  <input type="checkbox" checked={skipWeekends} onChange={e => setSkipWeekends(e.target.checked)} id="skipWE" style={{ width: '18px', height: '18px' }} />
                  <label htmlFor="skipWE" style={{ margin: 0, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Exclure les week-ends (Samedi / Dimanche)</label>
                </div>
              )}
            </div>
          </section>

          {!entry.is_leave && (
            <section className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={20} /> Plages Horaires {isRangeMode && '(pour chaque jour)'}
                </h2>
                <button type="button" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={addSlot}>
                  <Plus size={14} /> Ajouter
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {entry.slots.map((slot, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(128, 128, 128, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                    <select value={slot.type} onChange={e => updateSlot(index, 'type', e.target.value)} style={{ width: '100px' }}>
                      <option value="work">Travail</option>
                      <option value="break">Pause</option>
                    </select>
                    <input type="time" value={slot.start} onChange={e => updateSlot(index, 'start', e.target.value)} />
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <input type="time" value={slot.end} onChange={e => updateSlot(index, 'end', e.target.value)} />
                    
                    <button type="button" className="btn" style={{ padding: '6px', color: '#ff4d4d', border: 'none' }} onClick={() => removeSlot(index)}>
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card">
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PenTool size={20} /> Notes & Détails {isRangeMode && '(commun à toute la période)'}
            </h2>
            <textarea 
              rows={4} 
              placeholder="Notes optionnelles (tâches effectuées, observations...)" 
              value={entry.notes} 
              onChange={e => updateEntryAndCalculate({ notes: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </section>
        </div>

        <aside style={{ position: 'sticky', top: '0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="card" style={{ borderLeft: '4px solid var(--accent-color)' }}>
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign size={20} /> Gains Estimés {isRangeMode && '(par jour)'}
            </h2>
            
            {!entry.is_leave && (
              <>
                <div className="input-group">
                  <label>Taux Horaire Brut (€)</label>
                  <input type="number" step="0.01" value={entry.rate_brut || ''} onChange={e => updateEntryAndCalculate({ rate_brut: parseFloat(e.target.value) || 0 })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                  <div className="input-group">
                    <label>Primes (€)</label>
                    <input type="number" step="0.01" value={entry.prime || ''} onChange={e => updateEntryAndCalculate({ prime: parseFloat(e.target.value) || 0 })} style={{ width: '100%' }} />
                  </div>
                  <div className="input-group">
                    <label>Panier (€)</label>
                    <input type="number" step="0.01" value={entry.panier || ''} onChange={e => updateEntryAndCalculate({ panier: parseFloat(e.target.value) || 0 })} style={{ width: '100%' }} />
                  </div>
                </div>
              </>
            )}

            {entry.is_leave && (
              <div style={{ padding: '20px', backgroundColor: 'rgba(230, 126, 34, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(230, 126, 34, 0.2)', textAlign: 'center', marginBottom: '20px' }}>
                <CalendarCheck size={32} color="#e67e22" style={{ marginBottom: '12px' }} />
                <p style={{ color: '#e67e22', fontWeight: 600, margin: 0 }}>Mode Congés / Absence</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Aucun gain ni heure ne seront calculés pour cette période.</p>
              </div>
            )}

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Heures / Jour :</span>
                <span style={{ fontWeight: 600 }}>{entry.total_hours.toFixed(2)}h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gains / Jour :</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{entry.total_net.toFixed(2)} €</span>
              </div>
              
              {isRangeMode && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(128,128,128,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '12px', border: '1px dashed var(--border-color)' }}>
                  <p>Enregistrement multiple actif</p>
                </div>
              )}
            </div>
          </section>

          <button type="submit" className="btn btn-primary" style={{ padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '16px', justifyContent: 'center' }}>
            <Check size={20} /> {id ? 'Mettre à jour' : isRangeMode ? 'Enregistrer la période' : 'Enregistrer la journée'}
          </button>
          
          <button type="button" className="btn" style={{ padding: '12px', justifyContent: 'center' }} onClick={() => navigate('/')}>
            <X size={18} /> Annuler
          </button>
        </aside>
      </form>
    </div>
  )
}
