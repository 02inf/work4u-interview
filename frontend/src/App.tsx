import { useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useRequest } from "ahooks";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Send, Share2Icon } from "lucide-react";
import { generateSession } from "./services";
// i'm using react-router-dom
import { useNavigate } from "react-router-dom";

enum Template {
  "digest" = "digest",
}
interface Digest {
  id: string;
  overview: string;
  key_decisions: string[];
  action_items: string[];
  created_at: string;
  public_id?: string;
}

function App() {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "http://localhost:8000";

  const navigate = useNavigate();

  // Use ahooks useRequest for fetching past digests
  const { data: pastDigests = [], refresh: refreshDigests } = useRequest(
    async () => {
      const response = await fetch(`${API_BASE}/api/digests`);
      if (!response.ok) {
        throw new Error("Failed to fetch past digests");
      }
      return response.json();
    },
    {
      onError: (err) => {
        console.error("Failed to fetch past digests:", err);
      },
    }
  );

  const { loading: generateSessionLoading, runAsync: runGenerateSession } =
    useRequest(generateSession, {
      manual: true,
    });

  const generateDigestStream = async ({ template }: { template: Template }) => {
    if (!input.trim()) {
      setError("Please enter a transcript");
      return;
    }

    if (input.length > 50000) {
      setError("Transcript is too long (maximum 50,000 characters)");
      return;
    }

    setStreaming(true);
    setStreamContent("");
    setError(null);

    try {
      await fetchEventSource(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input, template, session_id: sessionId }),
        async onopen(response) {
          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}: Failed to generate digest`
            );
          }
        },
        onmessage(event) {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "start") {
              // Handle start event if needed
            } else if (data.type === "content") {
              setStreamContent((prev) => prev + data.text);
            } else if (data.type === "complete") {
              refreshDigests();
            } else if (data.type === "error") {
              setError(data.message);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON
          }
        },
        onclose() {
          setStreaming(false);
        },
        onerror(err) {
          setStreaming(false);
          if (err instanceof TypeError && err.message.includes("fetch")) {
            setError(
              "Cannot connect to server. Please ensure the backend is running."
            );
          } else {
            setError(err instanceof Error ? err.message : "An error occurred");
          }
          throw err; // Stop retrying
        },
      });
    } catch (err) {
      setStreaming(false);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Cannot connect to server. Please ensure the backend is running."
        );
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/digest`;
    navigator.clipboard.writeText(shareUrl);
    // alert("Share link copied to clipboard!");
  };

  const generateNewSession = async () => {
    // call api to generate a new session.
    const ret = await runGenerateSession();

    if (ret?.session_id) {
      navigate(`/${ret.session_id}`);
      setSessionId(ret.session_id);
    }
  };

  return (
    <>
      <div className="flex w-full gap-8 border h-screen p-4">
        <div className="w-[200px] flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              disabled={generateSessionLoading}
              onClick={generateNewSession}
            >
              Start a new session
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="border shadow"
              onClick={copyShareLink}
            >
              <Share2Icon />
            </Button>
          </div>
          <Card className="p-2 flex flex-col gap-2 flex-1">
            <div className="font-bold px-2">Past Digests</div>

            <div className="flex-1 overflow-y-auto">
              {[
                {
                  id: "1",
                  created_at: "2021-01-01",
                  overview: "Overview 1",
                  key_decisions: ["Decision 1"],
                  action_items: ["Action Item 1"],
                },
                {
                  id: "2",
                  created_at: "2021-01-02",
                  overview: "Overview 2",
                  key_decisions: ["Decision 2"],
                  action_items: ["Action Item 2"],
                },
              ].map((digest: Digest) => (
                <div
                  key={digest.id}
                  className="flex items-center overflow-hidden text-sm gap-2 p-2 hover:bg-muted rounded-md hover:cursor-pointer"
                >
                  <span className="text-muted-foreground text-xs">
                    {digest.created_at}
                  </span>
                  <span>{digest.overview}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1 w-full overflow-y-auto">{streamContent}</div>

          <div className="border rounded-2xl p-4 flex flex-col gap-4">
            <Textarea
              className="w-full min-h-48 border-none resize-none shadow"
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="flex justify-between">
              <Button
                size="sm"
                className="rounded-full"
                onClick={() =>
                  generateDigestStream({
                    template: Template.digest,
                  })
                }
                disabled={!sessionId || !input.trim() || streaming}
              >
                Generate Digest
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="border shadow"
                disabled={!sessionId || !input.trim() || streaming}
              >
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
