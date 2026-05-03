import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus,
  Send,
  Trash2,
  Copy,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Check,
} from "lucide-react";
import {
  useListAssistantConversations,
  useCreateAssistantConversation,
  useGetAssistantConversation,
  useDeleteAssistantConversation,
  usePostAssistantMessage,
  getListAssistantConversationsQueryKey,
  getGetAssistantConversationQueryKey,
  type AssistantConversation,
  type AssistantMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shell/PageHeader";

type AgentMode = AssistantConversation["agentMode"];

const MODES: { value: AgentMode; label: string; blurb: string }[] = [
  {
    value: "general",
    label: "General",
    blurb: "All-purpose business operator",
  },
  {
    value: "revenue_recovery",
    label: "Revenue Recovery",
    blurb: "Find leaks and recover lost deals",
  },
  {
    value: "outbound_sales",
    label: "Outbound Sales",
    blurb: "Build pipeline from cold",
  },
  {
    value: "follow_up",
    label: "Follow-Up",
    blurb: "Sequence the next touches",
  },
  { value: "proposal", label: "Proposal", blurb: "Draft and refine proposals" },
  {
    value: "seo_content",
    label: "SEO Content",
    blurb: "Topical SEO and articles",
  },
];

const SUGGESTIONS: { mode: AgentMode; prompts: string[] }[] = [
  {
    mode: "general",
    prompts: [
      "What's the highest-leverage thing I can do today?",
      "Summarize the state of my pipeline.",
      "What follow-ups are due this week?",
      "Where am I losing the most revenue right now?",
    ],
  },
  {
    mode: "revenue_recovery",
    prompts: [
      "Walk me through my biggest revenue leaks.",
      "Draft a reactivation message for a 90-day-cold lead.",
      "Which missed calls should I respond to first?",
    ],
  },
  {
    mode: "outbound_sales",
    prompts: [
      "Write a 3-step cold email sequence for accounting firms.",
      "Suggest 5 LinkedIn outreach openers for HVAC owners.",
      "Build me a list of objection responses for pricing.",
    ],
  },
  {
    mode: "follow_up",
    prompts: [
      "Plan a 5-touch follow-up for an inbound demo no-show.",
      "Write a soft check-in for a deal that went quiet.",
      "Suggest the right cadence for a $25k proposal.",
    ],
  },
  {
    mode: "proposal",
    prompts: [
      "Draft a proposal outline for a 10-day AI engine engagement.",
      "Strengthen the ROI section of a proposal.",
      "Write a 3-tier pricing block.",
    ],
  },
  {
    mode: "seo_content",
    prompts: [
      "Give me 10 article ideas around 'missed call automation'.",
      "Outline a long-form post on speed-to-lead.",
      "Suggest internal links for a blog about lead reactivation.",
    ],
  },
];

function modePromptsFor(mode: AgentMode): string[] {
  return SUGGESTIONS.find((s) => s.mode === mode)?.prompts ?? SUGGESTIONS[0].prompts;
}

function MarkdownBubble({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-pre:my-2 prose-headings:my-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

interface MessageBubbleProps {
  message: AssistantMessage;
  onCopy: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

function MessageBubble({
  message,
  onCopy,
  onRegenerate,
  isRegenerating,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
      data-testid={`bubble-${message.role}`}
    >
      <div
        className={cn(
          "group max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border/70 bg-card/70 text-foreground backdrop-blur",
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
        ) : (
          <MarkdownBubble content={message.content} />
        )}
        <div
          className={cn(
            "mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => {
              onCopy();
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            data-testid={`button-copy-${message.id}`}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
          </Button>
          {!isUser && onRegenerate && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={onRegenerate}
              disabled={isRegenerating}
              data-testid={`button-regenerate-${message.id}`}
            >
              {isRegenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1">Regenerate</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ visible }: { visible: boolean }) {
  const [chars, setChars] = useState(0);
  useEffect(() => {
    if (!visible) {
      setChars(0);
      return;
    }
    const id = window.setInterval(
      () => setChars((c) => (c + 1) % 4),
      400,
    );
    return () => window.clearInterval(id);
  }, [visible]);
  if (!visible) return null;
  const dots = ".".repeat(chars + 1);
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground backdrop-blur">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Thinking{dots}
        </span>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AgentMode>("general");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useListAssistantConversations({
    query: {
      queryKey: getListAssistantConversationsQueryKey(),
      staleTime: 10_000,
    },
  });
  const conversations = conversationsQuery.data ?? [];

  const conversationQuery = useGetAssistantConversation(activeId ?? "", {
    query: {
      queryKey: getGetAssistantConversationQueryKey(activeId ?? ""),
      enabled: !!activeId,
    },
  });
  const messages = conversationQuery.data?.messages ?? [];
  const conversation = conversationQuery.data?.conversation ?? null;

  // Sync mode with the active conversation
  useEffect(() => {
    if (conversation?.agentMode) setMode(conversation.agentMode);
  }, [conversation?.agentMode]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, regeneratingId]);

  const createConversation = useCreateAssistantConversation();
  const deleteConversation = useDeleteAssistantConversation();
  const postMessage = usePostAssistantMessage();

  const isSending = postMessage.isPending;

  function invalidate() {
    qc.invalidateQueries();
  }

  async function handleNewChat() {
    const created = await createConversation.mutateAsync({
      data: { agentMode: mode },
    });
    setActiveId(created.id);
    invalidate();
  }

  async function ensureConversationId(): Promise<string> {
    if (activeId) return activeId;
    const created = await createConversation.mutateAsync({
      data: { agentMode: mode },
    });
    setActiveId(created.id);
    return created.id;
  }

  async function handleSend(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    try {
      const id = await ensureConversationId();
      setInput("");
      await postMessage.mutateAsync({
        id,
        data: { content: trimmed, agentMode: mode },
      });
      invalidate();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send message.";
      toast({
        title: "Assistant error",
        description: message,
        variant: "destructive",
      });
    }
  }

  async function handleRegenerate(targetMessageId: string) {
    if (!activeId) return;
    // Find the user message that preceded this assistant message
    const idx = messages.findIndex((m) => m.id === targetMessageId);
    if (idx <= 0) return;
    let priorUser: AssistantMessage | undefined;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        priorUser = messages[i];
        break;
      }
    }
    if (!priorUser) return;
    setRegeneratingId(targetMessageId);
    try {
      await postMessage.mutateAsync({
        id: activeId,
        data: {
          content: priorUser.content,
          agentMode: mode,
          regenerate: true,
        },
      });
      invalidate();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to regenerate.";
      toast({
        title: "Regenerate failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteConversation.mutateAsync({ id });
      if (activeId === id) setActiveId(null);
      invalidate();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete.";
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      });
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(input);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void handleSend(input);
  }

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].id;
    }
    return null;
  }, [messages]);

  const suggestionList = modePromptsFor(mode);
  const isEmpty = messages.length === 0;

  return (
    <div className="space-y-6" data-testid="page-assistant">
      <PageHeader
        eyebrow="Business Assistant"
        title="Your AI operating partner"
        description="Ask anything about your pipeline, follow-ups, revenue leaks, or campaigns. Switch modes to focus the assistant."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        {/* Left rail */}
        <Card className="flex h-[70vh] flex-col border-border/70 bg-card/60 p-3 backdrop-blur">
          <Button
            type="button"
            onClick={handleNewChat}
            disabled={createConversation.isPending}
            className="w-full justify-start gap-2"
            data-testid="button-new-chat"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
          <div className="mt-3 px-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            History
          </div>
          <ScrollArea className="mt-2 flex-1">
            <div className="space-y-1 pr-2">
              {conversationsQuery.isLoading ? (
                <>
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </>
              ) : conversations.length === 0 ? (
                <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                  No conversations yet. Start a new chat to begin.
                </div>
              ) : (
                conversations.map((c) => {
                  const active = c.id === activeId;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover-elevate",
                        active && "bg-sidebar-accent",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveId(c.id)}
                        className="flex flex-1 items-center gap-2 truncate text-left"
                        data-testid={`button-conversation-${c.id}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {c.title ?? "New conversation"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Delete conversation"
                        data-testid={`button-delete-${c.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Main pane */}
        <Card className="flex h-[70vh] flex-col border-border/70 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div className="min-w-0 flex-1 truncate text-sm font-medium">
              {conversation?.title ?? "New conversation"}
            </div>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as AgentMode)}
            >
              <SelectTrigger
                className="h-8 w-[180px] text-xs"
                data-testid="select-mode"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    data-testid={`option-mode-${m.value}`}
                  >
                    <div>
                      <div className="text-sm">{m.label}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {m.blurb}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div
              ref={scrollRef}
              className="absolute inset-0 overflow-y-auto px-4 py-4"
            >
              {conversationQuery.isLoading && activeId ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : isEmpty ? (
                <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-accent/20 text-accent">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      What do you want to work on?
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pick a starting prompt — or just type one in.
                    </div>
                  </div>
                  <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                    {suggestionList.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => void handleSend(p)}
                        disabled={isSending}
                        className="rounded-lg border border-border/70 bg-card/40 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover-elevate hover:text-foreground"
                        data-testid="button-suggestion"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      onCopy={() =>
                        navigator.clipboard?.writeText(m.content).catch(() => {})
                      }
                      onRegenerate={
                        m.id === lastAssistantId
                          ? () => handleRegenerate(m.id)
                          : undefined
                      }
                      isRegenerating={regeneratingId === m.id}
                    />
                  ))}
                  <StreamingBubble visible={isSending && !regeneratingId} />
                </div>
              )}
            </div>
          </div>

          {postMessage.isError && (
            <div className="flex items-center gap-2 border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                {postMessage.error instanceof Error
                  ? postMessage.error.message
                  : "Failed to send message."}
              </span>
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 border-t border-border/70 p-3"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask the assistant…  (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="min-h-[60px] resize-none bg-background/40"
              disabled={isSending}
              data-testid="input-message"
            />
            <Button
              type="submit"
              disabled={isSending || !input.trim()}
              className="h-[60px] gap-2"
              data-testid="button-send"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
