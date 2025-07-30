import { useEffect, useState, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useRequest } from "ahooks";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Send, Share2Icon, Trash2 } from "lucide-react";
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

enum ChatRender {
  "text" = "text",
  "structured" = "structured",
}

interface ChatItem {
  role: Role;
  content: string;
  status: ChatStatus;
  render: ChatRender;
  data?: any;
}

function App() {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  // const [streamContent, setStreamContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = "http://localhost:8000";

  const navigate = useNavigate();

  // Use ahooks useRequest for fetching past digests
  const { data: sessions = [], refresh: refreshSessions } = useRequest(
    getSessions,
    {
      onError: (err) => {
        console.error("Failed to fetch past digests:", err);
      },
      debounceWait: 50,
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
    setChatItems((old) => [
      ...old,
      { role: Role.user, content: input, status: ChatStatus.complete, render: ChatRender.text },
      { role: Role.assistant, content: "", status: ChatStatus.pending, render: 
        template === Template.digest ? ChatRender.structured : ChatRender.text },
    ]);
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
              if (data.render === "streaming") {
                setChatItems((old) => {
                  const newItems = [...old];
                  const lastItem = newItems[newItems.length - 1];
                  if (lastItem.status === ChatStatus.pending) {
                    lastItem.content += data.text;
                  }
                  return newItems;
                });
              }
            } else if (data.type === "complete") {
              setChatItems((old) => {
                const newItems = [...old];
                const lastItem = newItems[newItems.length - 1];
                if (lastItem.status === ChatStatus.pending) {
                  lastItem.status = ChatStatus.complete;
                }

                lastItem.data = data?.chat;
                return newItems;
              });
              refreshSessions();
            } else if (data.type === "error") {
              setChatItems((old) => {
                const newItems = [...old];
                const lastItem = newItems[newItems.length - 1];
                if (lastItem.status === ChatStatus.pending) {
                  lastItem.status = ChatStatus.error;
                }
                return newItems;
              });
              // toast.error(data.message);
            }
          } catch (e) {
            console.log(e);
            setChatItems((old) => {
              const newItems = [...old];
              const lastItem = newItems[newItems.length - 1];
              if (lastItem.status === ChatStatus.pending) {
                lastItem.status = ChatStatus.error;
              }
              return newItems;
            });
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

  const clearChats = async () => {
    if (!confirm('Are you sure you want to clear all chats? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/chats/clear?session_id=${sessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setChatItems([]);
        toast.success('All chats cleared successfully!');
      } else {
        toast.error('Failed to clear chats');
      }
    } catch (error) {
      console.error('Failed to clear chats:', error);
      toast.error('Failed to clear chats');
    }
  };

  const generateNewSession = async () => {
    // call api to generate a new session.
    const ret = await runGenerateSession();

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
      getSessionChats(sessionId).then((chats) => {
        const historyChatItem = chats?.reduce((acc, rawChat) => {
          const newAcc = [...acc];
          newAcc.push(
            {
              role: Role.user,
              content: rawChat.original_transcript,
              status: ChatStatus.complete,
              render: ChatRender.text,
            },
            {
              role: Role.assistant,
              content: rawChat.summary,
              status: ChatStatus.complete,
              render: rawChat.overview ? ChatRender.structured : ChatRender.text,
              data: rawChat.overview ? {
                overview: rawChat.overview,
                key_decisions: rawChat.key_decisions,
                action_items: rawChat.action_items,
              } : undefined,
            }
          );
          return newAcc;
        }, [] as ChatItem[]);
        setChatItems(historyChatItem || []);
      });
    }
  }, [sessionId]);

  // Auto-scroll to bottom when chat items change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems]);

  console.log(chatItems)

  return (
    <>
      <div className="flex w-full gap-8 border h-screen p-4">
        <div className="w-[200px] flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              disabled={generateSessionLoading}
              onClick={generateNewSession}
              size="icon"
            >
              New
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="border shadow"
              onClick={copyShareLink}
            >
              <Share2Icon />
            </Button>

            {sessionId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearChats}
                  className="text-red-500 hover:text-red-700 p-1 h-auto border shadow"
                >
                  <Trash2 size={14} />
                </Button>
              )}
          </div>
          <Card className="p-2 flex flex-col gap-2 flex-1">
            <div className="flex justify-between items-center px-2">
              <div className="font-bold">Past Digests</div>
            </div>

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
              <div
                key={index}
                className={cn(
                  item.role === Role.user
                    ? "bg-primary-foreground"
                    : "bg-gray-400 text-amber-50",
                  "p-2 rounded-md text-sm shadow border"
                )}
              >
                <div className="font-bold">{item.role.charAt(0).toUpperCase() + item.role.slice(1)}: </div>
                <div className="my-2 h-[1px] bg-gray-200"></div>
                <div className="flex flex-col gap-2">
                  <h3>Summary</h3>
                  <ReactMarkdown>{item.content}</ReactMarkdown>
                  <div className="my-2 h-[1px] bg-gray-200"></div>
                  <h3>Overview</h3>
                  <ReactMarkdown>{item.data?.overview}</ReactMarkdown>
                  <h3>Key Decisions</h3>
                  <ul>
                    {item.data?.key_decisions.map((decision: string) => (
                      <li key={decision}>* {decision}</li>
                    ))}
                  </ul>
                  <h3>Action Items</h3>
                  <ul>
                    {item.data?.action_items.map((action: string) => (
                      <li key={action}>* {action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border rounded-2xl p-4 flex flex-col gap-4 max-h-[300px]">
            <Textarea
            value={input}
              className="w-full min-h-48 border-none resize-none shadow"
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your meeting transcript here, and click 'Generate Digest' to get a summary of the meeting or free chat."
            />

            <div className="flex justify-between">
              <div className="text-sm">
                <span>{input.length} / 50000</span>
                {error && <span className="text-red-500">{error}</span>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setInput("");
                    generateStream({
                      template: Template.digest,
                    });
                  }}
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
                    setInput("");
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
