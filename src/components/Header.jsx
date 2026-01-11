import React from 'react'
import { Menu, Sparkles, Settings, HelpCircle } from 'lucide-react'
import './Header.css'

function Header({ sidebarOpen, onToggleSidebar }) {
  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <div className="header-logo">
          <div className="logo-icon">
            <Sparkles size={24} />
          </div>
          <span className="logo-text">Kilou's demo</span>
        </div>
      </div>

      <div className="header-center">
        <div className="header-model-selector">
          <span className="model-label">Modèle:</span>
          <span className="model-name">Nano Banana Pro</span>
          <div className="model-badge">Image</div>
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" aria-label="Aide">
          <HelpCircle size={20} />
        </button>
        <button className="header-icon-btn" aria-label="Paramètres">
          <Settings size={20} />
        </button>
        <div className="header-avatar">
          <span>K</span>
        </div>
      </div>
    </header>
  )
}

export default Header
