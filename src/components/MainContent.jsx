import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  Download,
  Sparkles,
  Image as ImageIcon,
  Video,
  Wand2,
  Clock,
  Palette,
  Brain,
  Play
} from 'lucide-react'
import './MainContent.css'

function MainContent({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  isAnalyzing,
  generatedImages,
  generatedVideos,
  error,
  onClearError,
  onClearHistory,
  onRemoveImage,
  onRemoveVideo,
  brandGuideCount,
  generationMode
}) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const textareaRef = useRef(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set the height to scrollHeight (with min and max constraints handled by CSS)
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200)
      textarea.style.height = `${newHeight}px`
    }
  }, [prompt])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onGenerate()
    }
  }

  const handleDownloadImage = (image) => {
    const link = document.createElement('a')
    link.href = image.data
    link.download = `kilous-demo-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadVideo = (video) => {
    const link = document.createElement('a')
    link.href = video.data
    link.download = `kilous-demo-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const imageExamplePrompts = [
    "Crée une publicité Instagram pour promouvoir notre nouvelle collection",
    "Génère une bannière Facebook pour notre vente flash -30%",
    "Crée un visuel story Instagram pour annoncer un nouveau produit",
    "Génère une affiche publicitaire pour notre campagne de lancement"
  ]

  const videoExamplePrompts = [
    "Crée une vidéo promotionnelle de 8 secondes pour notre nouveau produit",
    "Génère une intro vidéo dynamique pour nos réseaux sociaux",
    "Crée une animation de logo avec transition fluide",
    "Génère un teaser vidéo pour notre événement de lancement"
  ]

  const examplePrompts = generationMode === 'image' ? imageExamplePrompts : videoExamplePrompts
  const hasContent = generatedImages.length > 0 || generatedVideos.length > 0

  return (
    <main className="main-content">
      {/* Hero Section when no content */}
      {!hasContent && !isGenerating && (
        <div className="hero-section animate-fade-in">
          <div className="hero-icon">
            <Sparkles size={48} />
          </div>
          <h1 className="hero-title">Bienvenue sur Kilou's demo</h1>
          <p className="hero-subtitle">
            {generationMode === 'image'
              ? 'Créez des contenus marketing conformes à votre identité de marque avec Nano Banana Pro'
              : 'Générez des vidéos marketing professionnelles avec Veo 3.1 et votre guide de marque'
            }
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Palette size={24} />
              </div>
              <h3>Guide de marque</h3>
              <p>
                {generationMode === 'image'
                  ? 'Uploadez votre charte graphique pour des visuels 100% conformes'
                  : 'Un agent IA analyse votre guide pour des vidéos parfaitement alignées'
                }
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Wand2 size={24} />
              </div>
              <h3>{generationMode === 'image' ? 'IA Marketing' : 'Agent IA'}</h3>
              <p>
                {generationMode === 'image'
                  ? 'Nano Banana Pro crée des pubs, bannières et visuels avec votre logo'
                  : 'Gemini analyse méticuleusement votre identité visuelle'
                }
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                {generationMode === 'image' ? <ImageIcon size={24} /> : <Video size={24} />}
              </div>
              <h3>{generationMode === 'image' ? 'Prêt à publier' : 'Vidéo HD'}</h3>
              <p>
                {generationMode === 'image'
                  ? 'Téléchargez vos créations en haute qualité, prêtes pour vos campagnes'
                  : 'Veo 3.1 génère des vidéos 1080p de 8 secondes avec audio'
                }
              </p>
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

      {/* Gallery Section */}
      {(hasContent || isGenerating) && (
        <div className="gallery-section">
          <div className="gallery-header">
            <h2>
              {generationMode === 'image' ? <ImageIcon size={20} /> : <Video size={20} />}
              {generationMode === 'image' ? 'Images générées' : 'Vidéos générées'}
            </h2>
            {hasContent && (
              <button className="clear-history-btn" onClick={onClearHistory}>
                <Trash2 size={16} />
                Effacer l'historique
              </button>
            )}
          </div>

          <div className="images-grid">
            {/* Generating State */}
            {isGenerating && (
              <div className="generating-card animate-fade-in">
                <div className="generating-content">
                  {isAnalyzing ? (
                    <>
                      <Brain className="generating-spinner" size={40} />
                      <p>Analyse du guide de marque...</p>
                      <span className="generating-hint">L'agent IA extrait votre identité visuelle</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="generating-spinner" size={40} />
                      <p>Génération {generationMode === 'image' ? 'de l\'image' : 'de la vidéo'}...</p>
                      <span className="generating-hint">
                        {generationMode === 'image'
                          ? 'Cela peut prendre quelques secondes'
                          : 'Cela peut prendre jusqu\'à 2 minutes'
                        }
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Generated Images */}
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
                        handleDownloadImage(image)
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

            {/* Generated Videos */}
            {generatedVideos.map((video) => (
              <div
                key={video.id}
                className="image-card video-card animate-slide-up"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="image-wrapper video-wrapper">
                  <video src={video.data} muted />
                  <div className="video-play-icon">
                    <Play size={32} />
                  </div>
                  <div className="image-overlay">
                    <button
                      className="overlay-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadVideo(video)
                      }}
                      title="Télécharger"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      className="overlay-btn delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveVideo(video.id)
                      }}
                      title="Supprimer"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="image-meta">
                  <div className="video-badge">
                    <Video size={12} />
                    <span>Vidéo</span>
                  </div>
                  <p className="image-prompt" title={video.prompt}>
                    {video.prompt.length > 60
                      ? video.prompt.substring(0, 57) + '...'
                      : video.prompt}
                  </p>
                  <span className="image-time">
                    <Clock size={12} />
                    {new Date(video.timestamp).toLocaleTimeString('fr-FR', {
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
              {generationMode === 'video' && (
                <span className="agent-indicator">
                  <Brain size={12} />
                  Agent IA actif
                </span>
              )}
            </div>
          )}
          <div className="prompt-input-wrapper">
            <textarea
              ref={textareaRef}
              className="prompt-input"
              placeholder={generationMode === 'image'
                ? "Décrivez l'image que vous souhaitez générer..."
                : "Décrivez la vidéo que vous souhaitez générer..."
              }
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
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
                  onClick={() => handleDownloadImage(selectedImage)}
                >
                  <Download size={18} />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="image-modal" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedVideo(null)}
            >
              <X size={24} />
            </button>
            <video
              src={selectedVideo.data}
              controls
              autoPlay
              loop
            />
            <div className="modal-info">
              <p className="modal-prompt">{selectedVideo.prompt}</p>
              <div className="modal-actions">
                <button
                  className="modal-btn"
                  onClick={() => handleDownloadVideo(selectedVideo)}
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
