import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')))

// Proxy endpoint for Fal.ai (POST - submit requests)
app.post('/api/fal/:endpoint(*)', async (req, res) => {
  const falApiKey = process.env.VITE_FAL_KEY
  const endpoint = req.params.endpoint
  const url = `https://queue.fal.run/${endpoint}`

  console.log(`[FAL PROXY] POST ${url}`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falApiKey}`
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()
    console.log(`[FAL PROXY] Response status: ${response.status}`)
    res.status(response.status).json(data)
  } catch (error) {
    console.error('[FAL PROXY] Error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Proxy endpoint for Fal.ai status/result (GET requests)
app.get('/api/fal/:endpoint(*)', async (req, res) => {
  const falApiKey = process.env.VITE_FAL_KEY
  const endpoint = req.params.endpoint
  const url = `https://queue.fal.run/${endpoint}`

  console.log(`[FAL PROXY] GET ${url}`)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${falApiKey}`
      }
    })

    const data = await response.json()
    console.log(`[FAL PROXY] Response status: ${response.status}`)
    res.status(response.status).json(data)
  } catch (error) {
    console.error('[FAL PROXY] Error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`FAL_KEY present: ${!!process.env.VITE_FAL_KEY}`)
})
