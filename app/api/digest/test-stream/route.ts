import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Stream API</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        textarea {
            width: 100%;
            height: 150px;
            margin-bottom: 10px;
        }
        #output {
            border: 1px solid #ccc;
            padding: 10px;
            min-height: 200px;
            white-space: pre-wrap;
            background: #f5f5f5;
        }
        button {
            padding: 10px 20px;
            background: #0070f3;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #0051cc;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <h1>Test Stream API</h1>
    <textarea id="transcript" placeholder="Enter meeting transcript here...">
Team Meeting - Q4 Planning

Attendees: John (PM), Sarah (Dev Lead), Mike (Designer), Lisa (Marketing)

John: Let's discuss our Q4 priorities. Sarah, can you start with the tech roadmap?

Sarah: Sure. We need to focus on three main areas: improving performance, adding the new dashboard feature, and upgrading our authentication system.

Mike: For the dashboard, I've already created the mockups. We should review them this week.

Lisa: From marketing perspective, we need the dashboard ready by mid-November for our campaign.

John: That's aggressive but doable. Let's make that our primary focus. Sarah, can your team handle it?

Sarah: Yes, if we postpone the auth upgrade to Q1. We'll need Mike's designs finalized by next week.

Mike: I'll send them by Wednesday.

John: Great. Lisa, prepare the marketing materials assuming a November 15th launch.

Lisa: Will do. I'll need product screenshots by November 10th.

Action items:
- Mike to send dashboard designs by Wednesday
- Sarah's team to start development once designs are ready
- Lisa to prepare marketing campaign for November 15th launch
- John to update stakeholders on Q4 priorities
    </textarea>
    <br>
    <button id="testStream">Test Stream API</button>
    <h3>Output:</h3>
    <div id="output"></div>

    <script>
        document.getElementById('testStream').addEventListener('click', async () => {
            const button = document.getElementById('testStream');
            const output = document.getElementById('output');
            const transcript = document.getElementById('transcript').value;
            
            button.disabled = true;
            output.textContent = 'Streaming...\\n\\n';
            
            try {
                const response = await fetch('/api/digest/stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ transcript })
                });
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const text = decoder.decode(value);
                    const lines = text.split('\\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.text) {
                                    output.textContent += data.text;
                                }
                                if (data.done && data.digest) {
                                    output.textContent += '\\n\\n=== Saved Digest ===\\n';
                                    output.textContent += JSON.stringify(data.digest, null, 2);
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            } catch (error) {
                output.textContent = 'Error: ' + error.message;
            } finally {
                button.disabled = false;
            }
        });
    </script>
</body>
</html>
  `
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}