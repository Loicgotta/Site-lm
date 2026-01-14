import React, { useState, useCallback, useEffect } from 'react'
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
  const [logs, setLogs] = useState([]) // Logs pour debug
  const [oauthToken, setOauthToken] = useState(null) // Token OAuth pour Veo
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Fonction pour ajouter un log
  const addLog = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR')
    const logEntry = { timestamp, message, data: data ? JSON.stringify(data, null, 2) : null }
    setLogs(prev => [...prev, logEntry])
    console.log(`[${timestamp}] ${message}`, data || '')
  }, [])

  // OAuth Configuration
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET
  const REDIRECT_URI = window.location.origin + '/oauth-callback'
  const SCOPES = 'https://www.googleapis.com/auth/generative-language https://www.googleapis.com/auth/cloud-platform'

  // Fonction pour démarrer l'authentification OAuth
  const startOAuth = useCallback(() => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&access_type=offline` +
      `&prompt=consent`

    addLog('🔐 Démarrage OAuth...', { authUrl })

    // Ouvrir popup OAuth
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      authUrl,
      'oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    // Écouter le callback
    window.oauthCallback = async (code) => {
      addLog('📥 Code OAuth reçu', { code: code.substring(0, 20) + '...' })
      setIsAuthenticating(true)

      try {
        // Échanger le code contre un token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
          })
        })

        const tokenData = await tokenResponse.json()
        addLog('🔑 Token reçu', {
          hasAccessToken: !!tokenData.access_token,
          expiresIn: tokenData.expires_in,
          error: tokenData.error
        })

        if (tokenData.access_token) {
          setOauthToken(tokenData.access_token)
          localStorage.setItem('veo_oauth_token', tokenData.access_token)
          addLog('✅ Authentification réussie!')
        } else {
          throw new Error(tokenData.error_description || tokenData.error || 'Erreur token')
        }
      } catch (err) {
        addLog('❌ Erreur OAuth', { error: err.message })
        setError('Erreur d\'authentification: ' + err.message)
      } finally {
        setIsAuthenticating(false)
      }
    }
  }, [CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPES, addLog])

  // Charger le token depuis localStorage au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem('veo_oauth_token')
    if (savedToken) {
      setOauthToken(savedToken)
      addLog('🔑 Token OAuth chargé depuis localStorage')
    }
  }, [])

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

  // Génération de vidéo avec Veo 2 (API Key)
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

      // Étape 2: Construire le prompt enrichi pour Veo 2
      // Veo fonctionne mieux avec des descriptions visuelles simples
      let fullVideoPrompt = prompt

      if (brandGuidelines) {
        // Combiner le style de marque avec la demande utilisateur
        fullVideoPrompt = `${prompt}. ${brandGuidelines}`
      }

      // Étape 3: Appeler l'API Veo 2 pour générer la vidéo
      addLog('📤 Envoi requête à Veo 2...', { prompt: fullVideoPrompt.substring(0, 200) + '...' })

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning`,
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

      addLog(`📥 Réponse initiale: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        addLog('❌ Erreur API', errorData)
        if (response.status === 404) {
          throw new Error('Veo 2 n\'est pas disponible. Vérifiez que votre clé API a accès à ce modèle.')
        }
        if (response.status === 403) {
          throw new Error('Accès refusé à Veo 2. Ce modèle nécessite un abonnement payant.')
        }
        throw new Error(errorData.error?.message || `Erreur ${response.status}: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      addLog('✅ Opération créée', data)

      const operationName = data.name

      if (operationName) {
        addLog(`🔄 Polling opération: ${operationName}`)

        let videoResult = null
        let attempts = 0
        const maxAttempts = 60

        while (!videoResult && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          attempts++

          const statusResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
            {
              headers: {
                'x-goog-api-key': apiKey
              }
            }
          )

          const statusData = await statusResponse.json()
          addLog(`🔍 Polling #${attempts}`, {
            done: statusData.done,
            hasResponse: !!statusData.response,
            hasError: !!statusData.error,
            metadata: statusData.metadata,
            fullResponse: statusData
          })

          if (statusData.done) {
            // Vérifier si la vidéo a été filtrée par RAI (Responsible AI)
            const generateVideoResponse = statusData.response?.generateVideoResponse
            if (generateVideoResponse?.raiMediaFilteredCount > 0) {
              const reason = generateVideoResponse.raiMediaFilteredReasons?.[0] || 'Contenu filtré par les politiques de sécurité'
              addLog('🚫 Vidéo filtrée par RAI', generateVideoResponse)
              throw new Error(`Vidéo bloquée par Google: ${reason}`)
            }

            // Chercher les vidéos générées dans différents formats de réponse
            if (generateVideoResponse?.generatedSamples) {
              videoResult = generateVideoResponse.generatedSamples
              addLog('✅ Vidéo générée (generateVideoResponse.generatedSamples)', videoResult)
            } else if (statusData.response?.generatedSamples) {
              videoResult = statusData.response.generatedSamples
              addLog('✅ Vidéo générée (generatedSamples)', videoResult)
            } else if (statusData.response?.videos) {
              videoResult = statusData.response.videos
              addLog('✅ Vidéo générée (videos)', videoResult)
            } else if (statusData.error) {
              addLog('❌ Erreur dans la réponse', statusData.error)
              throw new Error(statusData.error.message || JSON.stringify(statusData.error))
            } else {
              addLog('⚠️ Réponse done=true mais pas de vidéo', statusData)
              throw new Error(`Réponse inattendue: ${JSON.stringify(statusData)}`)
            }
          }
        }

        if (!videoResult) {
          addLog('⏰ Timeout après ' + attempts + ' tentatives')
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
        throw new Error('Réponse inattendue de l\'API Veo 2')
      }

    } catch (err) {
      console.error('Video generation error:', err)
      setError(err.message || 'Une erreur est survenue lors de la génération vidéo.')
    } finally {
      setIsGenerating(false)
      setIsAnalyzing(false)
    }
  }, [prompt, brandGuideFiles, brandAnalysis, analyzeBrandGuide, addLog])

  // Handler principal de génération
  const handleGenerate = useCallback(() => {
    if (generationMode === 'image') {
      handleGenerateImage()
    } else {
      handleGenerateVideo()
    }
  }, [generationMode, handleGenerateImage, handleGenerateVideo])

  // Déconnexion OAuth
  const handleLogout = useCallback(() => {
    setOauthToken(null)
    localStorage.removeItem('veo_oauth_token')
    addLog('🔓 Déconnexion OAuth')
  }, [addLog])

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
          logs={logs}
          onClearLogs={() => setLogs([])}
        />
      </div>
    </div>
  )
}

export default App
