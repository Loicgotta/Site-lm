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

    const analysisPrompt = `Tu es un expert en analyse de guides de marque et en direction artistique. Analyse MÉTICULEUSEMENT les ${brandGuideFiles.length} fichier(s) de guide de marque fournis.

EXTRAIS ET DÉCRIS EN DÉTAIL:

1. **PALETTE DE COULEURS**:
   - Couleur primaire (code hex si visible, sinon description précise)
   - Couleurs secondaires
   - Couleurs d'accent
   - Couleurs à éviter

2. **LOGO ET IDENTITÉ VISUELLE**:
   - Description détaillée du logo
   - Formes et symboles utilisés
   - Espace de protection autour du logo
   - Variations du logo (horizontal, vertical, monochrome)

3. **TYPOGRAPHIE**:
   - Police principale (titres)
   - Police secondaire (corps de texte)
   - Style typographique général (moderne, classique, bold, léger)

4. **STYLE VISUEL ET DIRECTION ARTISTIQUE**:
   - Ambiance générale (luxueuse, décontractée, professionnelle, fun)
   - Style photographique préféré
   - Textures et motifs récurrents
   - Éclairage préféré (naturel, studio, dramatique)

5. **TON ET PERSONNALITÉ DE MARQUE**:
   - Valeurs de la marque
   - Ton de communication (formel, amical, inspirant)
   - Émotions à transmettre

6. **ÉLÉMENTS GRAPHIQUES**:
   - Icônes et pictogrammes
   - Patterns ou motifs
   - Cadres et bordures
   - Effets visuels caractéristiques

IMPORTANT: Sois TRÈS PRÉCIS et EXHAUSTIF. Ces informations seront utilisées pour générer des vidéos parfaitement conformes à l'identité de marque.

Réponds en format structuré avec des bullet points clairs.`

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
      let fullVideoPrompt = prompt

      if (brandGuidelines) {
        fullVideoPrompt = `[DIRECTIVES DE MARQUE - RESPECTER IMPÉRATIVEMENT]

${brandGuidelines}

[FIN DES DIRECTIVES DE MARQUE]

---

DEMANDE VIDÉO DU CLIENT:
${prompt}

---

INSTRUCTIONS DE PRODUCTION:
- La vidéo DOIT respecter STRICTEMENT toutes les directives de marque ci-dessus
- Utiliser UNIQUEMENT les couleurs de la palette de marque
- Intégrer le logo de manière naturelle si pertinent
- Maintenir le ton et l'ambiance définis dans le guide
- La qualité visuelle doit refléter le positionnement de la marque
- Chaque frame doit être cohérente avec l'identité visuelle de la marque`
      }

      // Étape 3: Appeler l'API Veo 3.1 pour générer la vidéo
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:generateVideos?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: fullVideoPrompt,
            config: {
              aspectRatio: "16:9",
              numberOfVideos: 1,
              durationSeconds: 8,
              personGeneration: "allow_adult"
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
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
            `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
          )

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()

            if (statusData.done) {
              if (statusData.response?.generatedVideos) {
                videoResult = statusData.response.generatedVideos
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
          data: video.video?.uri || `data:video/mp4;base64,${video.video?.videoBytes}`,
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
