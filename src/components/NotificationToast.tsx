import { useState, useEffect } from 'react'
import { Bell, CheckCircle, Clock, X } from 'lucide-react'

interface NotificationToastProps {
  message: string;
  type: 'info' | 'success' | 'warning';
  onClose: () => void;
}

export default function NotificationToast({ message, type, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Petit délai pour déclencher l'animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-fermeture après 8 secondes pour laisser le temps de lire
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} color="#2ecc71" />;
      case 'warning': return <Clock size={20} color="#e67e22" />;
      default: return <Bell size={20} color="var(--accent-color)" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#2ecc71';
      case 'warning': return '#e67e22';
      default: return 'var(--accent-color)';
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '100px', // Au-dessus du FAB
        right: isVisible ? '32px' : '-400px',
        width: '320px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        boxShadow: 'var(--shadow-md)',
        zIndex: 2000,
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}
    >
      <div style={{ marginTop: '2px' }}>
        {getIcon()}
      </div>
      
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)', fontWeight: 500 }}>
          {message}
        </p>
      </div>

      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 500);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <X size={16} />
      </button>
    </div>
  );
}
