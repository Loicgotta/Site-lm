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
  const [hasUploadedImage, setHasUploadedImage] = useState(0) // 0 = pas d'image, 1 = image uploadée
  const [videoDuration, setVideoDuration] = useState('8s') // Durée de la vidéo: '4s', '6s', ou '8s'
  const [lastGeneratedImage, setLastGeneratedImage] = useState(null) // Mémoire de la dernière image générée pour modifications
  const [chatMessages, setChatMessages] = useState([]) // Messages de chat (user + assistant)

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

  // Debug des variables d'environnement au démarrage
  useEffect(() => {
    console.log('=== DEBUG ENV VARS ===')
    console.log('VITE_FAL_KEY présent:', !!import.meta.env.VITE_FAL_KEY)
    console.log('VITE_GEMINI_API_KEY présent:', !!import.meta.env.VITE_GEMINI_API_KEY)
    console.log('Toutes les vars VITE_*:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
    if (import.meta.env.VITE_FAL_KEY) {
      console.log('VITE_FAL_KEY longueur:', import.meta.env.VITE_FAL_KEY.length)
      console.log('VITE_FAL_KEY préfixe:', import.meta.env.VITE_FAL_KEY.substring(0, 8) + '...')
    }
    console.log('======================')
  }, [])

  const handleFilesChange = useCallback((files) => {
    setBrandGuideFiles(files)
    // Reset brand analysis when files change
    setBrandAnalysis(null)
    // Vérifier si une image est uploadée (recherche robuste par type MIME ou extension)
    const imageFile = files.find(f => {
      if (f.type && f.type.startsWith('image/')) return true
      const ext = f.name?.toLowerCase().split('.').pop()
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
    })
    const hasImage = imageFile ? 1 : 0
    setHasUploadedImage(hasImage)
    console.log('📁 Fichiers uploadés:', files.length, '| Image détectée:', hasImage, imageFile ? `(${imageFile.name})` : '')
  }, [])

  const handlePromptChange = useCallback((newPrompt) => {
    setPrompt(newPrompt)
  }, [])

  const handleModeChange = useCallback((mode) => {
    setGenerationMode(mode)
  }, [])

  const handleVideoDurationChange = useCallback((duration) => {
    setVideoDuration(duration)
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

  // Génération d'image avec Nano Banana Pro (avec mémoire de conversation)
  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Veuillez entrer un prompt pour générer une image.')
      return
    }

    // Ajouter le message utilisateur au chat
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    }
    setChatMessages(prev => [...prev, userMessage])

    const currentPrompt = prompt
    setPrompt('') // Vider le champ de saisie

    setIsGenerating(true)
    setError(null)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      const imageParts = await Promise.all(brandGuideFiles.map(fileToBase64))

      // Si une image a été générée précédemment, l'inclure pour permettre des modifications
      if (lastGeneratedImage) {
        // Extraire les données base64 de l'image précédente
        const base64Match = lastGeneratedImage.data.match(/^data:([^;]+);base64,(.+)$/)
        if (base64Match) {
          imageParts.push({
            inlineData: {
              mimeType: base64Match[1],
              data: base64Match[2]
            }
          })
        }
      }

      let fullPrompt = currentPrompt
      if (brandGuideFiles.length > 0 || lastGeneratedImage) {
        const hasLastImage = lastGeneratedImage ? '\n\nIMAGE PRÉCÉDENTE: Une image générée précédemment est fournie. Si l\'utilisateur demande une modification, applique les changements sur cette image.' : ''
        fullPrompt = `INSTRUCTIONS: Tu es un expert en création de contenus marketing.${brandGuideFiles.length > 0 ? ` Analyse attentivement le guide de marque fourni dans les ${brandGuideFiles.length} fichier(s) de référence ci-joints.` : ''}${hasLastImage}

${brandGuideFiles.length > 0 ? `GUIDE DE MARQUE À RESPECTER STRICTEMENT:
- Utilise EXACTEMENT les mêmes couleurs (palette de couleurs)
- Reproduis le logo tel qu'il apparaît dans le guide
- Respecte la typographie et le style visuel
- Maintiens la cohérence avec l'identité de marque

` : ''}DEMANDE DU CLIENT:
${currentPrompt}

${brandGuideFiles.length > 0 ? `IMPORTANT: L'image générée DOIT être 100% conforme au guide de marque fourni, comme si elle était créée par l'équipe design de la marque.` : ''}`
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
              prompt: currentPrompt,
              timestamp: new Date().toISOString(),
              type: 'image'
            })
          }
        }
      }

      if (newImages.length === 0) {
        throw new Error('Aucune image n\'a été générée. Essayez avec un prompt différent.')
      }

      // Sauvegarder la dernière image générée pour la mémoire de conversation
      setLastGeneratedImage(newImages[0])
      setGeneratedImages(prev => [...newImages, ...prev])

      // Ajouter la réponse assistant au chat
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: newImages[0].data,
        type: 'image',
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Une erreur est survenue lors de la génération.')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, brandGuideFiles, lastGeneratedImage])

  // Agent IA pour analyser le prompt et décider des paramètres vidéo
  const analyzeVideoRequest = useCallback(async (userPrompt, hasImage) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY

    const analysisPrompt = `Tu es un agent IA qui analyse les demandes de génération vidéo.

DEMANDE UTILISATEUR: "${userPrompt}"
IMAGE FOURNIE: ${hasImage ? 'Oui' : 'Non'}

Analyse cette demande et réponds UNIQUEMENT en JSON valide avec ce format:
{
  "useImageToVideo": ${hasImage ? 'true ou false selon si l\'image doit être animée' : 'false'},
  "duration": "8s",
  "aspectRatio": "16:9",
  "resolution": "720p",
  "generateAudio": true,
  "enhancedPrompt": "prompt amélioré et détaillé pour la génération vidéo"
}

Règles:
- useImageToVideo: true SEULEMENT si une image est fournie ET que l'utilisateur veut l'animer
- duration: "4s", "6s" ou "8s" (défaut: "8s")
- aspectRatio: "16:9" ou "9:16" (défaut: "16:9")
- resolution: "720p" ou "1080p" (défaut: "720p")
- enhancedPrompt: améliore le prompt pour une meilleure génération vidéo

Réponds UNIQUEMENT avec le JSON, sans autre texte.`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: analysisPrompt }] }],
            generationConfig: { temperature: 0.3 }
          })
        }
      )

      if (!response.ok) {
        throw new Error('Erreur analyse agent')
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

      // Nettoyer le JSON (enlever les backticks markdown si présents)
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      return JSON.parse(cleanJson)
    } catch (err) {
      console.error('Agent analysis error:', err)
      // Valeurs par défaut si l'agent échoue
      return {
        useImageToVideo: hasImage,
        duration: "8s",
        aspectRatio: "16:9",
        resolution: "720p",
        generateAudio: true,
        enhancedPrompt: userPrompt
      }
    }
  }, [])

  // Génération de vidéo avec Fal.ai Veo 3.1
  const handleGenerateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Veuillez entrer un prompt pour générer une vidéo.')
      return
    }

    // Ajouter le message utilisateur au chat
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    }
    setChatMessages(prev => [...prev, userMessage])

    const currentPrompt = prompt
    setPrompt('') // Vider le champ de saisie

    setIsGenerating(true)
    setIsAnalyzing(true)
    setError(null)

    try {
      const falApiKey = import.meta.env.VITE_FAL_KEY
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY

      // Debug: Vérifier que la clé API Fal.ai est présente
      addLog('🔍 Vérification des variables d\'environnement...', {
        VITE_FAL_KEY_present: !!falApiKey,
        VITE_GEMINI_API_KEY_present: !!geminiApiKey,
        available_vars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
      })

      if (!falApiKey) {
        addLog('❌ ERREUR: Clé API Fal.ai manquante (VITE_FAL_KEY)', {
          tip: 'Sur Render: ajoutez VITE_FAL_KEY dans Environment Variables et redéployez'
        })
        throw new Error('Clé API Fal.ai non configurée. Sur Render, ajoutez la variable VITE_FAL_KEY puis cliquez sur "Manual Deploy" > "Clear build cache & deploy"')
      }
      addLog('🔑 Clé API Fal.ai détectée', {
        keyPrefix: falApiKey.substring(0, 8) + '...',
        keyLength: falApiKey.length
      })

      // Utiliser la variable d'état hasUploadedImage pour déterminer si une image est présente
      // Recherche robuste de l'image: par type MIME ou par extension
      const imageFile = brandGuideFiles.find(f => {
        if (f.type && f.type.startsWith('image/')) return true
        // Fallback: vérifier par extension si type est vide
        const ext = f.name?.toLowerCase().split('.').pop()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
      })

      addLog('📁 État des fichiers uploadés', {
        hasUploadedImage: hasUploadedImage,
        nombreFichiers: brandGuideFiles.length,
        fichiers: brandGuideFiles.map(f => ({ name: f.name, type: f.type || 'type inconnu' })),
        imageFile: imageFile ? { name: imageFile.name, type: imageFile.type, size: imageFile.size } : null
      })

      // DÉCISION SIMPLIFIÉE: Si hasUploadedImage = 1, on utilise TOUJOURS image-to-video
      const useImageToVideo = hasUploadedImage === 1

      addLog('🎯 Décision image-to-video', {
        hasUploadedImage,
        useImageToVideo,
        raison: useImageToVideo ? 'Image uploadée → image-to-video' : 'Pas d\'image → text-to-video'
      })

      setIsAnalyzing(false)

      // Étape 1: Déterminer l'endpoint Fal.ai
      const endpoint = useImageToVideo
        ? 'fal-ai/veo3.1/image-to-video'
        : 'fal-ai/veo3.1'

      addLog('🎯 Endpoint sélectionné', { endpoint })

      // Étape 2: Préparer le body de la requête avec le PROMPT ORIGINAL (non modifié)
      const inputParams = {
        prompt: currentPrompt, // Prompt original sans modification
        duration: videoDuration,
        aspect_ratio: '16:9',
        resolution: '720p',
        generate_audio: true
      }

      addLog('📝 Prompt envoyé (non modifié)', { prompt: currentPrompt })

      // Si image-to-video, convertir l'image en base64 data URL et l'ajouter à la requête
      if (useImageToVideo) {
        const imageToSend = imageFile

        addLog('🔍 Préparation image pour envoi', {
          imageToSend: imageToSend ? { name: imageToSend.name, type: imageToSend.type, size: imageToSend.size } : 'AUCUNE IMAGE TROUVÉE!'
        })

        if (imageToSend) {
          addLog('🖼️ Conversion de l\'image en base64...', {
            fileName: imageToSend.name,
            fileType: imageToSend.type,
            fileSize: imageToSend.size
          })

          const reader = new FileReader()
          const imageDataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(imageToSend)
          })
          inputParams.image_url = imageDataUrl

          addLog('✅ Image convertie et ajoutée au body', {
            dataUrlLength: imageDataUrl.length,
            dataUrlPrefix: imageDataUrl.substring(0, 50) + '...'
          })
        } else {
          addLog('⚠️ ERREUR: Image attendue mais non trouvée!', {
            hasUploadedImage,
            brandGuideFilesCount: brandGuideFiles.length,
            fichiers: brandGuideFiles.map(f => ({ name: f.name, type: f.type }))
          })
          throw new Error('Image uploadée introuvable. Veuillez ré-uploader l\'image.')
        }
      }

      // Format Fal.ai REST API: les paramètres sont directement dans le body (pas de wrapper "input")
      const requestBody = inputParams

      // Log détaillé du body final
      addLog(`📤 Envoi requête via proxy (/api/fal/${endpoint})...`, {
        bodyKeys: Object.keys(requestBody),
        prompt: prompt.substring(0, 200) + '...',
        duration: requestBody.duration,
        aspect_ratio: requestBody.aspect_ratio,
        resolution: requestBody.resolution,
        generate_audio: requestBody.generate_audio,
        image_url_present: !!requestBody.image_url,
        image_url_length: requestBody.image_url ? requestBody.image_url.length : 0
      })

      // Étape 5: Appeler l'API Fal.ai via le proxy (évite les problèmes CORS)
      const response = await fetch(`/api/fal/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      addLog(`📥 Réponse initiale: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        addLog('❌ Erreur API Fal.ai', errorData)
        throw new Error(errorData.detail || errorData.message || `Erreur ${response.status}`)
      }

      const data = await response.json()
      addLog('✅ Requête acceptée', data)

      // Étape 6: Récupérer le request_id
      const requestId = data.request_id
      if (!requestId) {
        throw new Error('Pas de request_id dans la réponse')
      }

      addLog(`✅ Requête soumise avec request_id: ${requestId}`)

      // Étape 7: Attendre 2 minutes puis appeler le webhook pour récupérer la vidéo
      addLog('⏳ Attente de 2 minutes avant de récupérer la vidéo...')
      await new Promise(resolve => setTimeout(resolve, 120000)) // 120 secondes = 2 minutes

      // Appeler le webhook n8n pour récupérer l'URL de la vidéo
      const webhookUrl = 'https://n8n.srv793731.hstgr.cloud/webhook/Kilou-video-images'
      addLog('📡 Appel du webhook pour récupérer la vidéo...', { webhookUrl, requestId })

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_id: requestId })
      })

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text().catch(() => '')
        addLog('❌ Erreur webhook', { status: webhookResponse.status, errorText })
        throw new Error(`Erreur webhook: ${webhookResponse.status}`)
      }

      // Le webhook renvoie l'URL de la vidéo (peut être en texte brut ou JSON)
      const responseText = await webhookResponse.text()
      addLog('📦 Réponse du webhook (brute)', { responseText: responseText.substring(0, 200) })

      // Essayer de parser en JSON, sinon utiliser le texte directement comme URL
      let videoUrl
      try {
        const webhookData = JSON.parse(responseText)
        // Format: [{ "video": { "url": "..." } }]
        videoUrl = webhookData?.[0]?.video?.url || webhookData?.video?.url || webhookData?.url
      } catch {
        // Si ce n'est pas du JSON, c'est directement l'URL
        videoUrl = responseText.trim()
      }
      addLog('🎬 URL vidéo extraite', { videoUrl })

      if (videoUrl) {
        const newVideo = {
          id: Date.now() + Math.random(),
          data: videoUrl,
          prompt: currentPrompt,
          timestamp: new Date().toISOString(),
          type: 'video'
        }
        setGeneratedVideos(prev => [newVideo, ...prev])
        addLog('🎬 Vidéo ajoutée à la galerie', { url: videoUrl })

        // Ajouter la réponse assistant au chat
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: videoUrl,
          type: 'video',
          timestamp: new Date().toISOString()
        }
        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        addLog('⚠️ URL vidéo vide dans la réponse webhook')
        throw new Error('URL de la vidéo non trouvée dans la réponse du webhook')
      }

    } catch (err) {
      console.error('Video generation error:', err)
      setError(err.message || 'Une erreur est survenue lors de la génération vidéo.')
    } finally {
      setIsGenerating(false)
      setIsAnalyzing(false)
    }
  }, [prompt, brandGuideFiles, hasUploadedImage, videoDuration, addLog])

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
    setLastGeneratedImage(null) // Réinitialiser la mémoire de conversation
    setChatMessages([]) // Réinitialiser l'historique du chat
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
          videoDuration={videoDuration}
          onVideoDurationChange={handleVideoDurationChange}
        />
        <MainContent
          prompt={prompt}
          onPromptChange={handlePromptChange}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isAnalyzing={isAnalyzing}
          chatMessages={chatMessages}
          error={error}
          onClearError={() => setError(null)}
          onClearHistory={handleClearHistory}
          brandGuideCount={brandGuideFiles.length}
          generationMode={generationMode}
        />
      </div>
    </div>
  )
}

export default App
