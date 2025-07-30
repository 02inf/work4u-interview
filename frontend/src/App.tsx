import { useEffect, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useRequest } from "ahooks";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Send, Share2Icon } from "lucide-react";
import { generateSession, getSessionChats, getSessions } from "./services";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import type { components } from "./services/schema";
import { cn } from "./lib/utils";

enum Template {
  "digest" = "digest",
  "chat" = "chat",
}

enum Role {
  "user" = "user",
  "assistant" = "assistant",
}

enum ChatStatus {
  "pending" = "pending",
  "streaming" = "streaming",
  "complete" = "complete",
  "error" = "error",
}

interface ChatItem {
  role: Role;
  content: string;
  status: ChatStatus
}

function App() {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  // const [streamContent, setStreamContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "http://localhost:8000";

  const navigate = useNavigate();

  // Use ahooks useRequest for fetching past digests
  const { data: sessions = [], refresh: refreshSessions } = useRequest(
    getSessions,
    {
      onError: (err) => {
        console.error("Failed to fetch past digests:", err);
      },
      debounceWait: 50
    }
  );

  const { loading: generateSessionLoading, runAsync: runGenerateSession } =
    useRequest(generateSession, {
      manual: true,
    });

  const generateStream = async ({ template }: { template: Template }) => {
    if (!input.trim()) {
      setError("Please enter input");
      return;
    }

    if (input.length > 50000) {
      setError("Transcript is too long (maximum 50,000 characters)");
      return;
    }

    setStreaming(true);
    setChatItems(old => [...old, { role: Role.user, content: input, status: ChatStatus.pending }]);
    setError(null);

    try {
      await fetchEventSource(`${API_BASE}/api/v1/chat`, {
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
              setChatItems(old => {
                const newItems = [...old];
                const lastItem = newItems[newItems.length - 1];
                if (lastItem.status === ChatStatus.pending) {
                  lastItem.content += data.text;
                }
                return newItems;
              })
            } else if (data.type === "complete") {
              setChatItems(old => {
                const newItems = [...old];
                const lastItem = newItems[newItems.length - 1];
                if (lastItem.status === ChatStatus.pending) {
                  lastItem.status = ChatStatus.complete;
                }
                return newItems;
              })
              refreshSessions();
            } else if (data.type === "error") {
              setChatItems(old => {
                const newItems = [...old];
                const lastItem = newItems[newItems.length - 1];
                if (lastItem.status === ChatStatus.pending) {
                  lastItem.status = ChatStatus.error;
                }
                return newItems;
              })
              // toast.error(data.message);
            }
          } catch (e) {
            console.log(e);
            setChatItems(old => {
              const newItems = [...old];
              const lastItem = newItems[newItems.length - 1];
              if (lastItem.status === ChatStatus.pending) {
                lastItem.status = ChatStatus.error;
              }
              return newItems;
            })
            // Ignore parsing errors for incomplete JSON
          }
        },
        onclose() {
          setStreaming(false);
        },
        onerror(err) {
          setStreaming(false);
          if (err instanceof TypeError && err.message.includes("fetch")) {
            toast.error(
              "Cannot connect to server. Please ensure the backend is running."
            );
          } else {
            toast.error(
              err instanceof Error ? err.message : "An error occurred"
            );
          }
          throw err; // Stop retrying
        },
      });
    } catch (err) {
      setStreaming(false);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        toast.error(
          "Cannot connect to server. Please ensure the backend is running."
        );
      } else {
        toast.error(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Share link copied to clipboard!");
  };

  const generateNewSession = async () => {
    // call api to generate a new session.
    const ret = await runGenerateSession();
    debugger;

    if (ret?.session_id) {
      navigate(`/${ret.session_id}`);
      setSessionId(ret.session_id);
    }
  };

  useEffect(() => {
    const sessionId = window.location.pathname.split("/")[1];
    if (sessionId) {
      setSessionId(sessionId);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      getSessionChats(sessionId).then(chats => {
        const historyChatItem = chats?.reduce((acc, rawChat) => {
          const newAcc = [...acc];
          newAcc.push({
            role: Role.user,
            content: rawChat.original_transcript,
            status: ChatStatus.complete,
          }, {
            role: Role.assistant,
            content: rawChat.overview,
            status: ChatStatus.complete,
          })
          return newAcc;
        }, [] as ChatItem[])
        setChatItems(historyChatItem || []);
      });
    }
  }, [sessionId]);

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
              {sessions?.map(
                (session: components["schemas"]["SessionResponse"]) => (
                  <div
                    key={session.session_id}
                    className="flex items-center overflow-hidden text-sm gap-2 p-2 hover:bg-muted rounded-md hover:cursor-pointer"
                  >
                    <span className="text-muted-foreground text-xs">
                      {session.created_at}
                    </span>
                    {/* <span>{digest.overview}</span> */}
                  </div>
                )
              )}
            </div>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1 w-full overflow-y-auto flex flex-col gap-2">
            {chatItems.map((item, index) => (
              <div key={index} className={cn(item.role === Role.user ? "bg-primary-foreground" : "bg-gray-500 text-amber-50", "p-2 rounded-md text-sm shadow border")}>
                <div className="text-xs font-bold">{item.role}: </div>
                <div>
                  <ReactMarkdown>{item.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>

          <div className="border rounded-2xl p-4 flex flex-col gap-4">
            <Textarea
              className="w-full min-h-48 border-none resize-none shadow"
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your meeting transcript here, and click 'Generate Digest' to get a summary of the meeting or free chat."
            />

            <div className="flex justify-between">
              <div className="text-sm">
                <span>
                  {input.length} / 50000
                </span>
                {error && <span className="text-red-500">{error}</span>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    generateStream({
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
                  onClick={() => {
                    generateStream({
                      template: Template.chat,
                    });
                  }}
                >
                  <Send />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
