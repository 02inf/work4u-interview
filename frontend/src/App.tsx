import { useState, useEffect } from 'react'
import './App.css'

interface Digest {
  id: string
  overview: string
  key_decisions: string[]
  action_items: string[]
  created_at: string
  public_id?: string
}

function App() {
  const [transcript, setTranscript] = useState('')
  const [currentDigest, setCurrentDigest] = useState<Digest | null>(null)
  const [pastDigests, setPastDigests] = useState<Digest[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input')

  const API_BASE = 'http://localhost:8000'

  useEffect(() => {
    fetchPastDigests()
  }, [])

  const fetchPastDigests = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/digests`)
      if (response.ok) {
        const digests = await response.json()
        setPastDigests(digests)
      }
    } catch (err) {
      console.error('Failed to fetch past digests:', err)
    }
  }

  const generateDigest = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript')
      return
    }

    if (transcript.length > 50000) {
      setError('Transcript is too long (maximum 50,000 characters)')
      return
    }

    setLoading(true)
    setError(null)
    setCurrentDigest(null)

    try {
      const response = await fetch(`${API_BASE}/api/digest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to generate digest`)
      }

      const digest = await response.json()
      setCurrentDigest(digest)
      fetchPastDigests()
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please ensure the backend is running.')
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const generateDigestStream = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript')
      return
    }

    if (transcript.length > 50000) {
      setError('Transcript is too long (maximum 50,000 characters)')
      return
    }

    setStreaming(true)
    setStreamContent('')
    setCurrentDigest(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/digest/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = `HTTP ${response.status}: Failed to generate digest`
        try {
          const errorData = JSON.parse(text)
          errorMessage = errorData.detail || errorMessage
        } catch {
          // Fallback to default message
        }
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream available')
      }

      let digestId = ''
      let publicId = ''
      let hasReceivedData = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        hasReceivedData = true
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'start') {
                digestId = data.digest_id
                publicId = data.public_id
              } else if (data.type === 'content') {
                setStreamContent(prev => prev + data.text)
              } else if (data.type === 'complete') {
                setCurrentDigest({
                  ...data.digest,
                  created_at: data.digest.created_at
                })
                fetchPastDigests()
              } else if (data.type === 'error') {
                setError(data.message)
                return
              }
            } catch (e) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }

      if (!hasReceivedData) {
        throw new Error('No data received from stream')
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please ensure the backend is running.')
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    } finally {
      setStreaming(false)
    }
  }

  const copyShareLink = (publicId: string) => {
    const shareUrl = `${window.location.origin}/digest/${publicId}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Meeting Digest</h1>
        <p>Transform meeting transcripts into structured summaries</p>
      </header>

      <nav className="tab-nav">
        <button 
          className={`tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          New Digest
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Past Digests ({pastDigests.length})
        </button>
      </nav>

      {activeTab === 'input' && (
        <main className="main-content">
          <div className="input-section">
            <div className="input-header">
              <h2>Meeting Transcript</h2>
              <span className={`char-count ${transcript.length > 50000 ? 'over-limit' : ''}`}>
                {transcript.length.toLocaleString()} / 50,000 characters
              </span>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              className="transcript-input"
              rows={10}
            />
            <div className="button-group">
              <button 
                onClick={generateDigest}
                disabled={loading || streaming || !transcript.trim()}
                className="generate-btn"
              >
                {loading ? 'Generating...' : 'Generate Digest'}
              </button>
              <button 
                onClick={generateDigestStream}
                disabled={loading || streaming || !transcript.trim()}
                className="generate-btn stream-btn"
              >
                {streaming ? 'Streaming...' : 'Stream Digest'}
              </button>
            </div>
            {error && <div className="error">{error}</div>}
          </div>

          {(currentDigest || streaming) && (
            <div className="digest-section">
              <div className="digest-header">
                <h2>Meeting Digest</h2>
                {currentDigest?.public_id && (
                  <button 
                    onClick={() => copyShareLink(currentDigest.public_id!)}
                    className="share-btn"
                  >
                    Share
                  </button>
                )}
              </div>
              
              <div className="digest-content">
                {streaming && !currentDigest && (
                  <div className="streaming-content">
                    <h3>Generating Summary...</h3>
                    <div className="stream-text">
                      {streamContent}
                      <span className="cursor">|</span>
                    </div>
                  </div>
                )}

                {currentDigest && (
                  <>
                    <div className="overview">
                      <h3>Overview</h3>
                      <p>{currentDigest.overview}</p>
                    </div>

                    <div className="key-decisions">
                      <h3>Key Decisions</h3>
                      <ul>
                        {currentDigest.key_decisions.map((decision, index) => (
                          <li key={index}>{decision}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="action-items">
                      <h3>Action Items</h3>
                      <ul>
                        {currentDigest.action_items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {activeTab === 'history' && (
        <div className="history-section">
          <h2>Past Digests</h2>
          {pastDigests.length === 0 ? (
            <p className="no-digests">No digests yet. Create your first one!</p>
          ) : (
            <div className="digests-grid">
              {pastDigests.map((digest) => (
                <div key={digest.id} className="digest-card">
                  <div className="digest-card-header">
                    <span className="digest-date">
                      {new Date(digest.created_at).toLocaleDateString()}
                    </span>
                    {digest.public_id && (
                      <button 
                        onClick={() => copyShareLink(digest.public_id!)}
                        className="share-btn-small"
                      >
                        Share
                      </button>
                    )}
                  </div>
                  <div className="digest-preview">
                    <p>{digest.overview.substring(0, 150)}...</p>
                    <div className="digest-stats">
                      <span>{digest.key_decisions.length} decisions</span>
                      <span>{digest.action_items.length} action items</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
