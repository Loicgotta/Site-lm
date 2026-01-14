import React, { useRef } from 'react'
import { Upload, Image, X, FileImage, Plus, Palette, FileText, Video, Sparkles, LogIn, LogOut, CheckCircle } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, brandGuideFiles, onFilesChange, generationMode, onModeChange, isAuthenticated, onLogin, onLogout }) {
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      const maxSize = 50 * 1024 * 1024 // 50MB for large PDFs
      return validTypes.includes(file.type) && file.size <= maxSize
    })

    if (validFiles.length < files.length) {
      alert('Certains fichiers ont été ignorés. Formats acceptés: JPEG, PNG, WebP, PDF (max 50MB)')
    }

    // Limit to 14 files (Nano Banana Pro limit)
    const newFiles = [...brandGuideFiles, ...validFiles].slice(0, 14)
    onFilesChange(newFiles)
  }

  const handleRemoveFile = (index) => {
    const newFiles = brandGuideFiles.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      const maxSize = 50 * 1024 * 1024 // 50MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })
    const newFiles = [...brandGuideFiles, ...validFiles].slice(0, 14)
    onFilesChange(newFiles)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over')
  }

  if (!isOpen) return null

  return (
    <aside className="sidebar">
      {/* Mode Selector */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Sparkles size={18} />
          <h3>Type de contenu</h3>
        </div>
        <div className="mode-selector">
          <button
            className={`mode-btn ${generationMode === 'image' ? 'active' : ''}`}
            onClick={() => onModeChange('image')}
          >
            <Image size={20} />
            <span>Image</span>
          </button>
          <button
            className={`mode-btn ${generationMode === 'video' ? 'active' : ''}`}
            onClick={() => onModeChange('video')}
          >
            <Video size={20} />
            <span>Vidéo</span>
          </button>
        </div>
        <p className="mode-description">
          {generationMode === 'image'
            ? 'Nano Banana Pro génère des images marketing haute qualité'
            : 'Veo 2 crée des vidéos de haute qualité'
          }
        </p>
      </div>

      {/* Google Auth pour Video */}
      {generationMode === 'video' && (
        <div className="sidebar-section auth-section">
          <div className="sidebar-section-header">
            <LogIn size={18} />
            <h3>Authentification Google</h3>
          </div>
          {isAuthenticated ? (
            <div className="auth-status authenticated">
              <CheckCircle size={20} className="auth-icon" />
              <span>Connecté à Google</span>
              <button className="logout-btn" onClick={onLogout}>
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="auth-status">
              <p className="auth-description">
                Connectez-vous à Google pour utiliser Veo 2
              </p>
              <button className="google-login-btn" onClick={onLogin}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Se connecter avec Google
              </button>
            </div>
          )}
        </div>
      )}

      {/* Brand Guide Upload */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Palette size={18} />
          <h3>Guide de marque</h3>
        </div>
        <p className="sidebar-description">
          {generationMode === 'image'
            ? 'Uploadez votre charte graphique pour des visuels conformes à votre identité.'
            : 'Un agent IA analysera votre guide pour créer des vidéos parfaitement alignées avec votre marque.'
          }
        </p>

        <div
          className="upload-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            style={{ display: 'none' }}
          />
          <div className="upload-icon">
            <Upload size={32} />
          </div>
          <p className="upload-text">
            Glissez-déposez vos fichiers ici
          </p>
          <p className="upload-subtext">
            ou cliquez pour parcourir
          </p>
          <p className="upload-formats">
            JPEG, PNG, WebP, PDF • Max 50MB
          </p>
        </div>

        <div className="files-counter">
          <FileImage size={16} />
          <span>{brandGuideFiles.length} / 14 fichiers</span>
        </div>

        {brandGuideFiles.length > 0 && (
          <div className="uploaded-files">
            {brandGuideFiles.map((file, index) => (
              <div key={index} className="uploaded-file">
                <div className="file-preview">
                  {file.type === 'application/pdf' ? (
                    <div className="pdf-icon">
                      <FileText size={24} />
                    </div>
                  ) : (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                    />
                  )}
                </div>
                <div className="file-info">
                  <span className="file-name" title={file.name}>
                    {file.name.length > 20
                      ? file.name.substring(0, 17) + '...'
                      : file.name}
                  </span>
                  <span className="file-size">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  className="file-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile(index)
                  }}
                  aria-label="Supprimer"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {brandGuideFiles.length < 14 && (
              <button
                className="add-more-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={20} />
                <span>Ajouter plus</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Image size={18} />
          <h3>Paramètres</h3>
        </div>
        <div className="settings-info">
          {generationMode === 'image' ? (
            <>
              <p><strong>Modèle:</strong> Nano Banana Pro</p>
              <p><strong>Résolution:</strong> Jusqu'à 2K</p>
              <p><strong>Format:</strong> PNG</p>
            </>
          ) : (
            <>
              <p><strong>Modèle:</strong> Veo 2</p>
              <p><strong>Résolution:</strong> HD</p>
              <p><strong>Format:</strong> MP4</p>
            </>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <p className="powered-by">
          Propulsé par Google Gemini API
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
