import React, { useState, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import './App.css'

function App() {
  const [brandGuideFiles, setBrandGuideFiles] = useState([])
  const [prompt, setPrompt] = useState('')
  const [generatedImages, setGeneratedImages] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleFilesChange = useCallback((files) => {
    setBrandGuideFiles(files)
  }, [])

  const handlePromptChange = useCallback((newPrompt) => {
    setPrompt(newPrompt)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Veuillez entrer un prompt pour générer une image.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY

      // Convert files to base64
      const imagePartsPromises = brandGuideFiles.map(async (file) => {
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
      })

      const imageParts = await Promise.all(imagePartsPromises)

      // Build the prompt with brand guide context for marketing content
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

      // Call Gemini API with Nano Banana Pro model (gemini-3-pro-image-preview)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                ...imageParts,
                { text: fullPrompt }
              ]
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

      // Extract generated images from response
      const newImages = []
      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData) {
            newImages.push({
              id: Date.now() + Math.random(),
              data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
              prompt: prompt,
              timestamp: new Date().toISOString()
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

  const handleClearHistory = useCallback(() => {
    setGeneratedImages([])
  }, [])

  const handleRemoveImage = useCallback((imageId) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId))
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
        />
        <MainContent
          prompt={prompt}
          onPromptChange={handlePromptChange}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          generatedImages={generatedImages}
          error={error}
          onClearError={() => setError(null)}
          onClearHistory={handleClearHistory}
          onRemoveImage={handleRemoveImage}
          brandGuideCount={brandGuideFiles.length}
        />
      </div>
    </div>
  )
}

export default App
