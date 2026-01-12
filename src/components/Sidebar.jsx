import React, { useRef } from 'react'
import { Upload, Image, X, FileImage, Plus, Palette, FileText } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, brandGuideFiles, onFilesChange }) {
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
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Palette size={18} />
          <h3>Guide de marque</h3>
        </div>
        <p className="sidebar-description">
          Uploadez jusqu'à 14 fichiers de référence (logos, couleurs, typographie, PDF de charte graphique)
          pour que l'IA génère des images cohérentes avec votre identité visuelle.
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

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Image size={18} />
          <h3>Paramètres</h3>
        </div>
        <div className="settings-info">
          <p>
            <strong>Modèle:</strong> Nano Banana Pro
          </p>
          <p>
            <strong>Résolution:</strong> Jusqu'à 2K
          </p>
          <p>
            <strong>Format:</strong> PNG
          </p>
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
