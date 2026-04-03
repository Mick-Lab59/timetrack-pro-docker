import { useState, useEffect } from 'react'
import { Building, Edit3, Check, X, Search } from 'lucide-react'

export default function Enterprises() {

  const [enterprises, setEnterprises] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadEnterprises()
  }, [])

  const loadEnterprises = async () => {
    try {
      const entries = await window.api.getEntries()
      const unique = Array.from(new Set(entries.map(e => e.enterprise))).filter(Boolean).sort()
      setEnterprises(unique)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (name: string) => {
    setEditingName(name)
    setNewName(name)
  }

  const handleCancelEdit = () => {
    setEditingName(null)
    setNewName('')
  }

  const handleRename = async () => {
    if (!editingName || !newName.trim() || editingName === newName.trim()) {
      handleCancelEdit()
      return
    }

    const result = await window.api.renameEnterprise(editingName, newName.trim())
    if (result.success) {
      alert(`Entreprise renommée avec succès ! ${result.count} entrées mises à jour.`)
      loadEnterprises()
      handleCancelEdit()
    } else {
      alert(`Erreur : ${result.error}`)
    }
  }

  const filteredEnterprises = enterprises.filter(ent => 
    ent.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="fade-in" style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>Gestion</p>
          <h1>Vos Entreprises</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Gérez et renommez globalement les entreprises enregistrées.</p>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Rechercher une entreprise..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ width: '100%', paddingLeft: '36px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredEnterprises.map(ent => (
          <div key={ent} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(0, 120, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
                <Building size={20} />
              </div>
              
              {editingName === ent ? (
                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                  <input 
                    autoFocus
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                    style={{ flex: 1, padding: '4px 8px', fontSize: '14px' }}
                  />
                </div>
              ) : (
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{ent}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {editingName === ent ? (
                <>
                  <button className="btn" style={{ padding: '6px', color: '#2ecc71' }} onClick={handleRename} title="Confirmer">
                    <Check size={16} />
                  </button>
                  <button className="btn" style={{ padding: '6px', color: '#ff4d4d' }} onClick={handleCancelEdit} title="Annuler">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button className="btn" style={{ padding: '4px', opacity: 0.6 }} onClick={() => handleStartEdit(ent)} title="Renommer">
                  <Edit3 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredEnterprises.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
            <Building size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Aucune entreprise trouvée.</p>
          </div>
        )}
      </div>
    </div>
  )
}
