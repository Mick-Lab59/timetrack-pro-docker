import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Search as SearchIcon, Download, Edit3, Trash2 } from 'lucide-react'
import { WorkEntry } from '../types'

export default function SearchPage() {
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<WorkEntry[]>([])
  const [filters, setFilters] = useState({
    query: '',
    startDate: '',
    endDate: '',
    minGain: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadEntries()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, entries])

  const loadEntries = async () => {
    const data = await window.api.getEntries()
    setEntries(data)
    setFilteredEntries(data)
  }

  const applyFilters = () => {
    let result = [...entries]

    if (filters.query) {
      const q = filters.query.toLowerCase()
      result = result.filter(e => 
        e.enterprise.toLowerCase().includes(q) || 
        e.notes.toLowerCase().includes(q)
      )
    }

    if (filters.startDate) {
      result = result.filter(e => e.date >= filters.startDate)
    }

    if (filters.endDate) {
      result = result.filter(e => e.date <= filters.endDate)
    }

    if (filters.minGain) {
      result = result.filter(e => e.total_net >= parseFloat(filters.minGain))
    }

    setFilteredEntries(result)
  }

  const handleExport = async () => {
    if (filteredEntries.length === 0) return alert('Aucune donnée à exporter')
    
    // Simple CSV conversion
    const header = ['Date', 'Entreprise', 'HEURES_TRAVAILLEES', 'Total_H', 'Taux Brut', 'Ratio', 'Primes', 'Panier', 'Gain Net', 'Notes']
    const rows = filteredEntries.map(e => {
      const slotsStr = e.is_leave ? 'CONGÉ/ABSENCE' : (e.slots || []).map(s => `${s.start}-${s.end}`).join(' / ')
      const dateFormatted = format(parseISO(e.date), 'dd/MM/yyyy')
      
      return [
        dateFormatted,
        `"${e.enterprise}"`,
        `"${slotsStr}"`,
        e.total_hours.toFixed(2),
        e.rate_brut.toFixed(2),
        e.net_ratio.toFixed(2),
        e.prime.toFixed(2),
        e.panier.toFixed(2),
        e.total_net.toFixed(2),
        `"${e.notes.replace(/\n/g, ' ')}"`
      ]
    })
    
    const csvContent = [header, ...rows].map(r => r.join(';')).join('\n')
    
    const fileName = `Export_TimeTrackPro_${filters.startDate || 'all'}_${filters.endDate || 'now'}.csv`
    
    const success = await window.api.exportCSV(csvContent, fileName)


    if (success) alert('Exportation réussie !')
  }


  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette entrée ?')) {
      await window.api.deleteEntry(id)
      loadEntries()
    }
  }

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '32px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>Recherche</p>
        <h1>Exploration de vos données</h1>
      </header>

      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Mots-clés (Entreprise, Notes)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Rechercher..." value={filters.query} onChange={e => setFilters({ ...filters, query: e.target.value })} style={{ width: '100%', paddingLeft: '36px' }} />
              <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Période du</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} style={{ width: '100%' }} />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Période au</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} style={{ width: '100%' }} />
          </div>

          <button className="btn btn-primary" style={{ padding: '10px 24px' }} onClick={handleExport}>
            <Download size={18} /> Exporter (.csv)
          </button>
        </div>
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ fontWeight: 600 }}>{filteredEntries.length} résultats trouvés</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Gain total sur la sélection : </span>
            <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
              {filteredEntries.reduce((acc, curr) => acc + curr.total_net, 0).toFixed(2)} €
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '0' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Entreprise</th>
                <th>Heures</th>
                <th>Gain Net</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(entry => (
                <tr key={entry.id}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>
                    {entry.enterprise}
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '2px' }}>
                      {entry.is_leave ? 'CONGÉ/ABSENCE' : entry.slots?.map(s => `${s.start}-${s.end}`).join(' / ')}
                    </div>
                  </td>

                  <td>{entry.total_hours.toFixed(2)}h</td>
                  <td style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{entry.total_net.toFixed(2)} €</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {entry.notes}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn" style={{ padding: '6px' }} onClick={() => navigate(`/edit/${entry.id}`)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn" style={{ padding: '6px', color: '#ff4d4d' }} onClick={() => entry.id && handleDelete(entry.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Aucun résultat correspondant à vos filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
