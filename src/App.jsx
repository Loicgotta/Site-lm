import React, { useState, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import './App.css'

function App() {
  const [brandGuideFiles, setBrandGuideFiles] = useState([])
  const [prompt, setPrompt] = useState('')
  const [generatedImages, setGeneratedImages] = useState([])
  const [generatedVideos, setGeneratedVideos] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [generationMode, setGenerationMode] = useState('image') // 'image' or 'video'
  const [brandAnalysis, setBrandAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFilesChange = useCallback((files) => {
    setBrandGuideFiles(files)
    // Reset brand analysis when files change
    setBrandAnalysis(null)
  }, [])

  const handlePromptChange = useCallback((newPrompt) => {
    setPrompt(newPrompt)
  }, [])

  const handleModeChange = useCallback((mode) => {
    setGenerationMode(mode)
  }, [])

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1]
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Agent IA pour analyser le guide de marque avec Gemini
  const analyzeBrandGuide = useCallback(async () => {
    if (brandGuideFiles.length === 0) return null

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY

    // Convert all files to base64
    const fileParts = await Promise.all(brandGuideFiles.map(fileToBase64))

    const analysisPrompt = `Analyse ce guide de marque et génère une DESCRIPTION VISUELLE CONCISE pour la création de vidéos.

Réponds UNIQUEMENT avec un paragraphe de style visuel (max 200 mots) qui décrit:
- Les couleurs dominantes (ex: "bleu navy #1a365d, blanc, touches dorées")
- Le style visuel (ex: "moderne et épuré", "luxueux et sophistiqué", "dynamique et coloré")
- L'ambiance (ex: "professionnelle", "chaleureuse", "énergique")
- Les éléments distinctifs du logo si visible

Format de réponse attendu (exemple):
"Style visuel: moderne et minimaliste. Couleurs: bleu profond comme couleur principale, blanc pour les espaces, accents dorés. Ambiance: professionnelle et premium. Éclairage: naturel et lumineux. Le logo est géométrique avec des lignes épurées."

Sois CONCIS et DESCRIPTIF pour permettre la génération de vidéos cohérentes.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              ...fileParts,
              { text: analysisPrompt }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error('Erreur lors de l\'analyse du guide de marque')
    }

    const data = await response.json()
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return analysisText
  }, [brandGuideFiles])

  // Génération d'image avec Nano Banana Pro
  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Veuillez entrer un prompt pour générer une image.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      const imageParts = await Promise.all(brandGuideFiles.map(fileToBase64))

      let fullPrompt = prompt
      if (brandGuideFiles.length > 0) {
        fullPrompt = `INSTRUCTIONS: Tu es un expert en création de contenus marketing. Analyse attentivement le guide de marque fourni dans les ${brandGuideFiles.length} fichier(s) de référence ci-joints.

GUIDE DE MARQUE À RESPECTER STRICTEMENT:
- Utilise EXACTEMENT les mêmes couleurs (palette de couleurs)
- Reproduis le logo tel qu'il apparaît dans le guide
- Respecte la typographie et le style visuel
- Maintiens la cohérence avec l'identité de marque

DEMANDE DU CLIENT:
${prompt}

IMPORTANT: L'image générée DOIT être 100% conforme au guide de marque fourni, comme si elle était créée par l'équipe design de la marque.`
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [...imageParts, { text: fullPrompt }]
            }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
              temperature: 0.7
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Erreur lors de la génération')
      }

      const data = await response.json()
      const newImages = []

      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData) {
            newImages.push({
              id: Date.now() + Math.random(),
              data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
              prompt: prompt,
              timestamp: new Date().toISOString(),
              type: 'image'
            })
          }
        }
      }

      if (newImages.length === 0) {
        throw new Error('Aucune image n\'a été générée. Essayez avec un prompt différent.')
      }

      setGeneratedImages(prev => [...newImages, ...prev])
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Une erreur est survenue lors de la génération.')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, brandGuideFiles])

  // Génération de vidéo avec Veo 3.1
  const handleGenerateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Veuillez entrer un prompt pour générer une vidéo.')
      return
    }

    setIsGenerating(true)
    setIsAnalyzing(true)
    setError(null)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY

      // Étape 1: Analyser le guide de marque avec l'agent IA
      let brandGuidelines = ''
      if (brandGuideFiles.length > 0) {
        if (!brandAnalysis) {
          const analysis = await analyzeBrandGuide()
          setBrandAnalysis(analysis)
          brandGuidelines = analysis
        } else {
          brandGuidelines = brandAnalysis
        }
      }

      setIsAnalyzing(false)

      // Étape 2: Construire le prompt enrichi pour Veo 3.1
      // Veo fonctionne mieux avec des descriptions visuelles simples
      let fullVideoPrompt = prompt

      if (brandGuidelines) {
        // Combiner le style de marque avec la demande utilisateur
        fullVideoPrompt = `${prompt}. ${brandGuidelines}`
      }

      // Étape 3: Appeler l'API Veo 3.1 pour générer la vidéo
      // Format minimal selon la documentation officielle
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            instances: [{
              prompt: fullVideoPrompt
            }]
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Vérifier si c'est une erreur d'accès au modèle
        if (response.status === 404) {
          throw new Error('Veo 3.1 est en paid preview. Vérifiez que votre clé API a accès à ce modèle dans Google AI Studio.')
        }
        if (response.status === 403) {
          throw new Error('Accès refusé à Veo 3.1. Ce modèle nécessite un abonnement paid preview.')
        }
        throw new Error(errorData.error?.message || 'Erreur lors de la génération vidéo')
      }

      const data = await response.json()

      // Veo 3.1 retourne une opération asynchrone, on doit polling pour le résultat
      const operationName = data.name

      if (operationName) {
        // Polling pour attendre la fin de la génération
        let videoResult = null
        let attempts = 0
        const maxAttempts = 60 // 5 minutes max (5s * 60)

        while (!videoResult && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // Attendre 5 secondes

          const statusResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
            {
              headers: {
                'x-goog-api-key': apiKey
              }
            }
          )

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()

            if (statusData.done) {
              // Format de réponse Veo 3.1
              if (statusData.response?.generatedSamples) {
                videoResult = statusData.response.generatedSamples
              } else if (statusData.response?.videos) {
                videoResult = statusData.response.videos
              } else if (statusData.error) {
                throw new Error(statusData.error.message || 'Erreur lors de la génération vidéo')
              }
            }
          }

          attempts++
        }

        if (!videoResult) {
          throw new Error('Timeout: La génération de la vidéo prend trop de temps.')
        }

        // Ajouter les vidéos générées
        const newVideos = videoResult.map(video => ({
          id: Date.now() + Math.random(),
          data: video.video?.uri || video.uri || video.gcsUri || `data:video/mp4;base64,${video.bytesBase64Encoded || video.video?.videoBytes}`,
          prompt: prompt,
          timestamp: new Date().toISOString(),
          type: 'video',
          brandAnalysis: brandGuidelines
        }))

        setGeneratedVideos(prev => [...newVideos, ...prev])
      } else {
        throw new Error('Réponse inattendue de l\'API Veo 3.1')
      }

    } catch (err) {
      console.error('Video generation error:', err)
      setError(err.message || 'Une erreur est survenue lors de la génération vidéo.')
    } finally {
      setIsGenerating(false)
      setIsAnalyzing(false)
    }
  }, [prompt, brandGuideFiles, brandAnalysis, analyzeBrandGuide])

  // Handler principal de génération
  const handleGenerate = useCallback(() => {
    if (generationMode === 'image') {
      handleGenerateImage()
    } else {
      handleGenerateVideo()
    }
  }, [generationMode, handleGenerateImage, handleGenerateVideo])

  const handleClearHistory = useCallback(() => {
    setGeneratedImages([])
    setGeneratedVideos([])
  }, [])

  const handleRemoveImage = useCallback((imageId) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId))
  }, [])

  const handleRemoveVideo = useCallback((videoId) => {
    setGeneratedVideos(prev => prev.filter(vid => vid.id !== videoId))
  }, [])

  return (
    <div className="app">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="app-body">
        <Sidebar
          isOpen={sidebarOpen}
          brandGuideFiles={brandGuideFiles}
          onFilesChange={handleFilesChange}
          generationMode={generationMode}
          onModeChange={handleModeChange}
        />
        <MainContent
          prompt={prompt}
          onPromptChange={handlePromptChange}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isAnalyzing={isAnalyzing}
          generatedImages={generatedImages}
          generatedVideos={generatedVideos}
          error={error}
          onClearError={() => setError(null)}
          onClearHistory={handleClearHistory}
          onRemoveImage={handleRemoveImage}
          onRemoveVideo={handleRemoveVideo}
          brandGuideCount={brandGuideFiles.length}
          generationMode={generationMode}
        />
      </div>
    </div>
  )
}

export default App
