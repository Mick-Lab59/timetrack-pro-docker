import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Info, HelpCircle, ShieldCheck, Download, Upload, Monitor } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({
    net_ratio: '0.77',
    currency: '€',
    auto_backup: 'false'
  })
  const [dbPath, setDbPath] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettingsAndPath()
  }, [])

  const loadSettingsAndPath = async () => {
    try {
      const data = await window.api.getSettings()
      // @ts-ignore
      const path = await window.api.getDbPath()
      setDbPath(path)
      const s: Record<string, string> = {}
      data.forEach(item => {
        s[item.key] = item.value || ''
      })
      setSettings(prev => ({ ...prev, ...s }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string, value: string) => {
    await window.api.updateSetting(key, value)
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleExportBackup = async () => {
    const success = await window.api.exportBackup()
    if (success) alert('Sauvegarde exportée avec succès !')
  }

  const handleImportBackup = async () => {
    if (!confirm('Attention : Cette opération écrasera TOUTES vos données actuelles (heures et paramètres). Voulez-vous continuer ?')) {
      return
    }
    const result = await window.api.importBackup()
    if (result.success) {
      alert('Sauvegarde restaurée avec succès ! L\'application va se recharger.')
      window.location.reload()
    } else if (result.error) {
      alert(`Erreur lors de la restauration : ${result.error}`)
    }
  }

  if (loading) return <div className="fade-in" style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '32px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>Configuration</p>
        <h1>Paramètres de l'application</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <section className="card">
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SettingsIcon size={20} /> Calcul & Revenus
          </h2>
          
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Taux de conversion Brut → Net (%) 
              <span title="Exemple: 0.77 pour un prélèvement de 23%" style={{ cursor: 'help', color: 'var(--accent-color)' }}>
                <Info size={14} />
              </span>
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                max="1" 
                value={settings.net_ratio} 
                onChange={e => handleSave('net_ratio', e.target.value)} 
                style={{ width: '120px' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                (soit {(parseFloat(settings.net_ratio) * 100).toFixed(0)}% du brut perçu en net)
              </span>
            </div>
          </div>

          <div className="input-group">
            <label>Devise</label>
            <input 
              type="text" 
              value={settings.currency} 
              onChange={e => handleSave('currency', e.target.value)} 
              style={{ width: '80px' }}
            />
          </div>
        </section>

        <section className="card" style={{ borderLeft: '4px solid #2ecc71' }}>
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} /> Sécurité & Sauvegarde
          </h2>
          
          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.auto_backup === 'true'} 
                onChange={e => handleSave('auto_backup', e.target.checked ? 'true' : 'false')}
              />
              Sauvegarde automatique (à chaque modification)
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '24px' }}>
              Crée une copie de sécurité dans le dossier backups à chaque changement.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn" onClick={handleExportBackup} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(52, 152, 219, 0.1)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)' }}>
              <Download size={16} /> Exporter une sauvegarde
            </button>
            <button className="btn" onClick={handleImportBackup} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c' }}>
              <Upload size={16} /> Restaurer une sauvegarde
            </button>
          </div>
        </section>

        <section className="card" style={{ borderLeft: '4px solid #3498db' }}>
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor size={20} /> Application & Système
          </h2>
          
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.start_with_windows === 'true'} 
                onChange={e => handleSave('start_with_windows', e.target.checked ? 'true' : 'false')}
              />
              Démarrer avec Windows
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '24px' }}>
              L'application se lancera automatiquement au démarrage du PC et restera discrète dans la barre d'état.
            </p>
          </div>
        </section>

        <section className="card" style={{ borderLeft: '4px solid #f39c12' }}>
          <h2 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             Gestion des Données
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Localisation actuelle de votre base de données :
          </p>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace', border: '1px solid var(--border-color)' }}>
            {dbPath}
          </div>
        </section>


        <section className="card">
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={20} /> À propos de TimeTrack Pro
          </h2>
          <p style={{ marginBottom: '8px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            Le réflexe pro pour vos heures de travail
          </p>
          <p style={{ marginBottom: '12px' }}>
            TimeTrack Pro est une application moderne conçue pour simplifier la gestion de vos heures de travail, créée par Mick-Lab.
          </p>
          <ul style={{ listStyle: 'none', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <li style={{ marginBottom: '8px' }}>✔ Calcul automatique des gains</li>
            <li style={{ marginBottom: '8px' }}>✔ Gestion intelligente des pauses</li>
            <li style={{ marginBottom: '8px' }}>✔ Export compatible Google Sheets / Excel</li>
            <li style={{ marginBottom: '8px' }}>✔ Stockage local sécurisé (JSON Portable)</li>
          </ul>
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Version 1.2.5 (Windows Portable)</span>
            <span style={{ opacity: 0.7 }}>Créée par Mick-Lab</span>
          </div>
        </section>

      </div>
    </div>
  )
}

