import React, { useState } from 'react'
import {
  Send,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  Download,
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Clock,
  Palette
} from 'lucide-react'
import './MainContent.css'

function MainContent({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  generatedImages,
  error,
  onClearError,
  onClearHistory,
  onRemoveImage,
  brandGuideCount
}) {
  const [selectedImage, setSelectedImage] = useState(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onGenerate()
    }
  }

  const handleDownload = (image) => {
    const link = document.createElement('a')
    link.href = image.data
    link.download = `kilous-demo-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const examplePrompts = [
    "Un logo minimaliste pour une startup tech",
    "Une bannière de réseaux sociaux professionnelle",
    "Une illustration pour une landing page",
    "Un design de carte de visite moderne"
  ]

  return (
    <main className="main-content">
      {/* Hero Section when no images */}
      {generatedImages.length === 0 && !isGenerating && (
        <div className="hero-section animate-fade-in">
          <div className="hero-icon">
            <Sparkles size={48} />
          </div>
          <h1 className="hero-title">Bienvenue sur Kilou's demo</h1>
          <p className="hero-subtitle">
            Générez des images uniques en suivant votre guide de marque avec Nano Banana Pro
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Palette size={24} />
              </div>
              <h3>Guide de marque</h3>
              <p>Uploadez jusqu'à 14 images de référence pour garder une cohérence visuelle</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Wand2 size={24} />
              </div>
              <h3>IA Avancée</h3>
              <p>Nano Banana Pro génère des images haute qualité jusqu'à 2K de résolution</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <ImageIcon size={24} />
              </div>
              <h3>Export Facile</h3>
              <p>Téléchargez vos créations en un clic au format PNG</p>
            </div>
          </div>

          <div className="example-prompts">
            <p className="example-title">Essayez ces exemples :</p>
            <div className="example-chips">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  className="example-chip"
                  onClick={() => onPromptChange(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generated Images Gallery */}
      {(generatedImages.length > 0 || isGenerating) && (
        <div className="gallery-section">
          <div className="gallery-header">
            <h2>
              <ImageIcon size={20} />
              Images générées
            </h2>
            {generatedImages.length > 0 && (
              <button className="clear-history-btn" onClick={onClearHistory}>
                <Trash2 size={16} />
                Effacer l'historique
              </button>
            )}
          </div>

          <div className="images-grid">
            {isGenerating && (
              <div className="generating-card animate-fade-in">
                <div className="generating-content">
                  <Loader2 className="generating-spinner" size={40} />
                  <p>Génération en cours...</p>
                  <span className="generating-hint">Cela peut prendre quelques secondes</span>
                </div>
              </div>
            )}

            {generatedImages.map((image) => (
              <div
                key={image.id}
                className="image-card animate-slide-up"
                onClick={() => setSelectedImage(image)}
              >
                <div className="image-wrapper">
                  <img src={image.data} alt={image.prompt} />
                  <div className="image-overlay">
                    <button
                      className="overlay-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(image)
                      }}
                      title="Télécharger"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      className="overlay-btn delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveImage(image.id)
                      }}
                      title="Supprimer"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="image-meta">
                  <p className="image-prompt" title={image.prompt}>
                    {image.prompt.length > 60
                      ? image.prompt.substring(0, 57) + '...'
                      : image.prompt}
                  </p>
                  <span className="image-time">
                    <Clock size={12} />
                    {new Date(image.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-banner animate-slide-up">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={onClearError} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Prompt Input Area */}
      <div className="prompt-section">
        <div className="prompt-container">
          {brandGuideCount > 0 && (
            <div className="brand-guide-indicator">
              <Palette size={14} />
              <span>{brandGuideCount} fichier{brandGuideCount > 1 ? 's' : ''} de guide de marque</span>
            </div>
          )}
          <div className="prompt-input-wrapper">
            <textarea
              className="prompt-input"
              placeholder="Décrivez l'image que vous souhaitez générer..."
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isGenerating}
            />
            <button
              className="generate-btn"
              onClick={onGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <Loader2 className="btn-spinner" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="prompt-hint">
            Appuyez sur Entrée pour générer • Shift+Entrée pour nouvelle ligne
          </p>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <img src={selectedImage.data} alt={selectedImage.prompt} />
            <div className="modal-info">
              <p className="modal-prompt">{selectedImage.prompt}</p>
              <div className="modal-actions">
                <button
                  className="modal-btn"
                  onClick={() => handleDownload(selectedImage)}
                >
                  <Download size={18} />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default MainContent
