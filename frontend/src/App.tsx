import { useState } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useRequest } from 'ahooks'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Textarea } from './components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Badge } from './components/ui/badge'

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
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'history' | 'chat'>('input')
  const [chatMessage, setChatMessage] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [chatStreaming, setChatStreaming] = useState(false)

  const API_BASE = 'http://localhost:8000'

  // Use ahooks useRequest for fetching past digests
  const { data: pastDigests = [], refresh: refreshDigests } = useRequest(
    async () => {
      const response = await fetch(`${API_BASE}/api/digests`)
      if (!response.ok) {
        throw new Error('Failed to fetch past digests')
      }
      return response.json()
    },
    {
      onError: (err) => {
        console.error('Failed to fetch past digests:', err)
      }
    }
  )

  // Use ahooks useRequest for generating digest
  const { loading: generateLoading, run: runGenerateDigest } = useRequest(
    async (transcriptText: string) => {
      const response = await fetch(`${API_BASE}/api/digest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to generate digest`)
      }

      return response.json()
    },
    {
      manual: true,
      onSuccess: (digest) => {
        setCurrentDigest(digest)
        refreshDigests()
        setError(null)
      },
      onError: (err) => {
        if (err instanceof TypeError && err.message.includes('fetch')) {
          setError('Cannot connect to server. Please ensure the backend is running.')
        } else {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      }
    }
  )

  const generateDigest = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript')
      return
    }

    if (transcript.length > 50000) {
      setError('Transcript is too long (maximum 50,000 characters)')
      return
    }

    setCurrentDigest(null)
    runGenerateDigest(transcript)
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
      await fetchEventSource(`${API_BASE}/api/digest/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
        async onopen(response) {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to generate digest`)
          }
        },
        onmessage(event) {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'start') {
              // Handle start event if needed
            } else if (data.type === 'content') {
              setStreamContent(prev => prev + data.text)
            } else if (data.type === 'complete') {
              setCurrentDigest({
                ...data.digest,
                created_at: data.digest.created_at
              })
              refreshDigests()
            } else if (data.type === 'error') {
              setError(data.message)
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON
          }
        },
        onclose() {
          setStreaming(false)
        },
        onerror(err) {
          setStreaming(false)
          if (err instanceof TypeError && err.message.includes('fetch')) {
            setError('Cannot connect to server. Please ensure the backend is running.')
          } else {
            setError(err instanceof Error ? err.message : 'An error occurred')
          }
          throw err // Stop retrying
        }
      })
    } catch (err) {
      setStreaming(false)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please ensure the backend is running.')
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }
  }

  const copyShareLink = (publicId: string) => {
    const shareUrl = `${window.location.origin}/digest/${publicId}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  const testGeminiChat = async () => {
    if (!chatMessage.trim()) {
      setError('Please enter a message')
      return
    }

    setChatStreaming(true)
    setChatResponse('')
    setError(null)

    try {
      await fetchEventSource(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatMessage }),
        async onopen(response) {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to chat`)
          }
        },
        onmessage(event) {
          try {
            const data = JSON.parse(event.data)
            
            if (data.content) {
              setChatResponse(prev => prev + data.content)
            } else if (data.done) {
              // Stream completed
            } else if (data.error) {
              setError(data.error)
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON
          }
        },
        onclose() {
          setChatStreaming(false)
        },
        onerror(err) {
          setChatStreaming(false)
          if (err instanceof TypeError && err.message.includes('fetch')) {
            setError('Cannot connect to server. Please ensure the backend is running.')
          } else {
            setError(err instanceof Error ? err.message : 'An error occurred')
          }
          throw err // Stop retrying
        }
      })
    } catch (err) {
      setChatStreaming(false)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please ensure the backend is running.')
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-primary text-4xl font-bold mb-2">AI Meeting Digest</h1>
        <p className="text-muted-foreground text-lg">Transform meeting transcripts into structured summaries</p>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'input' | 'history' | 'chat')} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">New Digest</TabsTrigger>
          <TabsTrigger value="history">Past Digests ({pastDigests.length})</TabsTrigger>
          <TabsTrigger value="chat">Chat Test</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Meeting Transcript</CardTitle>
                  <Badge variant={transcript.length > 50000 ? 'destructive' : 'secondary'}>
                    {transcript.length.toLocaleString()} / 50,000 characters
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste your meeting transcript here..."
                  className="min-h-[200px]"
                  rows={10}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={generateDigest}
                    disabled={generateLoading || streaming || !transcript.trim()}
                    className="flex-1"
                  >
                    {generateLoading ? 'Generating...' : 'Generate Digest'}
                  </Button>
                  <Button 
                    onClick={generateDigestStream}
                    disabled={generateLoading || streaming || !transcript.trim()}
                    variant="secondary"
                    className="flex-1"
                  >
                    {streaming ? 'Streaming...' : 'Stream Digest'}
                  </Button>
                </div>
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {(currentDigest || streaming) && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Meeting Digest</CardTitle>
                    {currentDigest?.public_id && (
                      <Button 
                        onClick={() => copyShareLink(currentDigest.public_id!)}
                        variant="outline"
                        size="sm"
                      >
                        Share
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {streaming && !currentDigest && (
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="text-lg font-medium mb-3">Generating Summary...</h3>
                      <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[2rem]">
                        {streamContent}
                        <span className="animate-pulse text-primary">|</span>
                      </div>
                    </div>
                  )}

                  {currentDigest && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Overview</h3>
                        <p className="text-muted-foreground leading-relaxed">{currentDigest.overview}</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-3">Key Decisions</h3>
                        <ul className="list-disc pl-6 space-y-2">
                          {currentDigest.key_decisions.map((decision, index) => (
                            <li key={index} className="text-muted-foreground leading-relaxed">{decision}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-3">Action Items</h3>
                        <ul className="list-disc pl-6 space-y-2">
                          {currentDigest.action_items.map((item, index) => (
                            <li key={index} className="text-muted-foreground leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="px-4">
            <h2 className="text-2xl font-semibold mb-6">Past Digests</h2>
            {pastDigests.length === 0 ? (
              <p className="text-center text-muted-foreground italic py-8">No digests yet. Create your first one!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastDigests.map((digest: Digest) => (
                  <Card key={digest.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {new Date(digest.created_at).toLocaleDateString()}
                        </span>
                        {digest.public_id && (
                          <Button 
                            onClick={() => copyShareLink(digest.public_id!)}
                            variant="outline"
                            size="sm"
                          >
                            Share
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed mb-4">{digest.overview.substring(0, 150)}...</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{digest.key_decisions.length} decisions</span>
                        <span>{digest.action_items.length} action items</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Gemini Chat Streaming Test</h2>
            <Card className="mb-6">
              <CardContent className="pt-6 space-y-4">
                <Textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Enter your message to test streaming chat..."
                  className="min-h-[120px]"
                  rows={3}
                />
                <Button 
                  onClick={testGeminiChat}
                  disabled={chatStreaming || !chatMessage.trim()}
                  className="w-full"
                >
                  {chatStreaming ? 'Streaming...' : 'Send Message'}
                </Button>
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {(chatResponse || chatStreaming) && (
              <Card>
                <CardHeader>
                  <CardTitle>Response:</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[2rem] p-4 bg-muted rounded-md">
                    {chatResponse}
                    {chatStreaming && <span className="animate-pulse text-primary">|</span>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default App
