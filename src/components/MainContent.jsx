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
  Palette,
  Brain,
  Play,
  User,
  Bot
} from 'lucide-react'
import './MainContent.css'

function MainContent({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  isAnalyzing,
  chatMessages,
  error,
  onClearError,
  onClearHistory,
  brandGuideCount,
  generationMode
}) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const textareaRef = useRef(null)
  const chatEndRef = useRef(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200)
      textarea.style.height = `${newHeight}px`
    }
  }, [prompt])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isGenerating])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onGenerate()
    }
  }

  const handleDownloadImage = (imageData) => {
    const link = document.createElement('a')
    link.href = imageData
    link.download = `kilous-demo-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadVideo = (videoUrl) => {
    const link = document.createElement('a')
    link.href = videoUrl
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
  const hasMessages = chatMessages.length > 0

  return (
    <main className="main-content">
      {/* Hero Section when no messages */}
      {!hasMessages && !isGenerating && (
        <div className="hero-section animate-fade-in">
          <div className="hero-icon">
            <Sparkles size={48} />
          </div>
          <h1 className="hero-title">Bienvenue sur Kilou's demo</h1>
          <p className="hero-subtitle">
            {generationMode === 'image'
              ? 'Créez des contenus marketing conformes à votre identité de marque'
              : 'Générez des vidéos marketing professionnelles'
            }
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Palette size={24} />
              </div>
              <h3>Documents de référence</h3>
              <p>Uploadez vos fichiers pour guider la génération</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Wand2 size={24} />
              </div>
              <h3>IA Créative</h3>
              <p>Génération intelligente basée sur vos instructions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                {generationMode === 'image' ? <ImageIcon size={24} /> : <Video size={24} />}
              </div>
              <h3>{generationMode === 'image' ? 'Modification facile' : 'Vidéo HD'}</h3>
              <p>
                {generationMode === 'image'
                  ? 'Demandez des modifications sur vos images générées'
                  : 'Vidéos haute qualité prêtes à publier'
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

      {/* Chat Section */}
      {(hasMessages || isGenerating) && (
        <div className="chat-section">
          <div className="chat-header">
            <h2>
              <Sparkles size={20} />
              Conversation
            </h2>
            {hasMessages && (
              <button className="clear-history-btn" onClick={onClearHistory}>
                <Trash2 size={16} />
                Effacer
              </button>
            )}
          </div>

          <div className="chat-messages">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? (
                    <User size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div className="message-content">
                  {message.role === 'user' ? (
                    <p className="message-text">{message.content}</p>
                  ) : message.type === 'image' ? (
                    <div className="message-media">
                      <img
                        src={message.content}
                        alt="Image générée"
                        onClick={() => setSelectedImage({ data: message.content })}
                      />
                      <div className="media-actions">
                        <button
                          className="media-action-btn"
                          onClick={() => handleDownloadImage(message.content)}
                          title="Télécharger"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ) : message.type === 'video' ? (
                    <div className="message-media video-media">
                      <video
                        src={message.content}
                        onClick={() => setSelectedVideo({ data: message.content })}
                      />
                      <div className="video-play-overlay" onClick={() => setSelectedVideo({ data: message.content })}>
                        <Play size={32} />
                      </div>
                      <div className="media-actions">
                        <button
                          className="media-action-btn"
                          onClick={() => handleDownloadVideo(message.content)}
                          title="Télécharger"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="message-text">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Generating State */}
            {isGenerating && (
              <div className="chat-message assistant-message">
                <div className="message-avatar">
                  <Bot size={20} />
                </div>
                <div className="message-content">
                  <div className="generating-indicator">
                    {isAnalyzing ? (
                      <>
                        <Brain className="generating-spinner" size={20} />
                        <span>Analyse en cours...</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="generating-spinner" size={20} />
                        <span>
                          {generationMode === 'image'
                            ? 'Génération de l\'image...'
                            : 'Génération de la vidéo (environ 2 min)...'
                          }
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
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
              <span>{brandGuideCount} fichier{brandGuideCount > 1 ? 's' : ''} de référence</span>
            </div>
          )}
          <div className="prompt-input-wrapper">
            <textarea
              ref={textareaRef}
              className="prompt-input"
              placeholder={generationMode === 'image'
                ? "Décrivez l'image souhaitée ou demandez une modification..."
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
            <img src={selectedImage.data} alt="Image générée" />
            <div className="modal-info">
              <div className="modal-actions">
                <button
                  className="modal-btn"
                  onClick={() => handleDownloadImage(selectedImage.data)}
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
              <div className="modal-actions">
                <button
                  className="modal-btn"
                  onClick={() => handleDownloadVideo(selectedVideo.data)}
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
