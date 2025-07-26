import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000 // 30 seconds timeout
})

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  error => {
    console.error('API Response Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

export const summaryApi = {
  generateSummary(transcript) {
    return api.post('/summaries', { transcript })
  },

  getAllSummaries() {
    return api.get('/summaries')
  },

  getSummaryByPublicId(publicId) {
    return api.get(`/summaries/public/${publicId}`)
  },

  generateSummaryStream(transcript, onData, onError) {
    // Since EventSource doesn't support POST, we'll use fetch for streaming
    return fetch('/api/summaries/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ transcript })
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      function read() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            console.log('Streaming completed')
            return
          }
          
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data.trim() && !data.includes('[ERROR]')) {
                onData(data)
              } else if (data.includes('[ERROR]')) {
                onError(new Error('Streaming generation failed'))
                return
              }
            }
          }
          
          return read()
        })
      }
      
      return read()
    }).catch(error => {
      console.error('Streaming error:', error)
      onError(error)
    })
  }
}

export default api