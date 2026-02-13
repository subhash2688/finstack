'use client';

import { useRef, useEffect, useState, FormEvent } from 'react';
import { X, Send, Sparkles } from 'lucide-react';

const STARTER_PROMPTS = [
  'What AP vendors handle PO matching?',
  'Compare Anaplan vs Pigment for forecasting',
  'Which AR steps have the highest AI impact?',
  'What are the key FP&A workflow steps?',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

import { CopilotEngagementContext } from '@/lib/ai/copilot-context';

interface CopilotPanelProps {
  onClose: () => void;
  currentProcessId?: string;
  engagementContext?: CopilotEngagementContext;
}

let messageCounter = 0;
function nextId() {
  return `msg-${++messageCounter}`;
}

export function CopilotPanel({ onClose, currentProcessId, engagementContext }: CopilotPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Use a ref for messages so the async sendMessage always sees the latest
  const messagesRef = useRef<Message[]>([]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(userMessage: string) {
    if (!userMessage.trim() || isLoading) return;

    setError(null);

    const userMsg: Message = {
      id: nextId(),
      role: 'user',
      content: userMessage.trim(),
    };

    const updatedMessages = [...messagesRef.current, userMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    const assistantId = nextId();

    try {
      abortRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          currentProcessId,
          engagementContext,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Add empty assistant message to stream into
      const withAssistant = [...updatedMessages, { id: assistantId, role: 'assistant' as const, content: '' }];
      messagesRef.current = withAssistant;
      setMessages(withAssistant);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // Update the assistant message with accumulated content
        const updated = messagesRef.current.map((m) =>
          m.id === assistantId ? { ...m, content: assistantContent } : m
        );
        messagesRef.current = updated;
        setMessages(updated);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      console.error('Copilot error:', errorMsg);
      setError(errorMsg);
      // Remove the empty assistant message on error
      const cleaned = messagesRef.current.filter((m) => m.id !== assistantId);
      messagesRef.current = cleaned;
      setMessages(cleaned);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 w-[400px] max-h-[520px] bg-white rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Lighthouse AI</h3>
            <p className="text-[10px] text-gray-500">Process & vendor intelligence</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[300px]">
        {messages.length === 0 && !isLoading && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center pt-4">
              Ask me about workflows, vendors, or processes.
            </p>
            <div className="space-y-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-gray-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.role === 'assistant' ? (
                <MarkdownContent content={message.content} />
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-3.5 py-2.5 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <span>{error}</span>
              <button
                onClick={() => {
                  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUser) {
                    setError(null);
                    sendMessage(lastUser.content);
                  }
                }}
                className="underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t px-3 py-2.5 flex items-center gap-2 bg-white"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about vendors, workflows..."
          className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

/** Minimal markdown renderer for links, bold, bullets */
function MarkdownContent({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Bullet points
        if (line.match(/^\s*[-*]\s/)) {
          const text = line.replace(/^\s*[-*]\s/, '');
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-emerald-500 mt-0.5 shrink-0">&#8226;</span>
              <span><InlineMarkdown text={text} /></span>
            </div>
          );
        }

        // Headers
        if (line.match(/^###\s/)) {
          return <p key={i} className="font-semibold text-xs uppercase tracking-wide text-gray-500 pt-1">{line.replace(/^###\s/, '')}</p>;
        }
        if (line.match(/^##\s/)) {
          return <p key={i} className="font-semibold text-sm pt-1">{line.replace(/^##\s/, '')}</p>;
        }

        return <p key={i}><InlineMarkdown text={line} /></p>;
      })}
    </div>
  );
}

/** Renders inline markdown: **bold**, [links](url) */
function InlineMarkdown({ text }: { text: string }) {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    const linkIndex = linkMatch?.index ?? Infinity;
    const boldIndex = boldMatch?.index ?? Infinity;

    if (linkIndex === Infinity && boldIndex === Infinity) {
      parts.push(remaining);
      break;
    }

    if (linkIndex < boldIndex && linkMatch) {
      if (linkIndex > 0) parts.push(remaining.slice(0, linkIndex));
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          className="text-emerald-600 underline hover:text-emerald-800"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkIndex + linkMatch[0].length);
    } else if (boldMatch && boldIndex !== undefined) {
      if (boldIndex > 0) parts.push(remaining.slice(0, boldIndex));
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldIndex + boldMatch[0].length);
    }
  }

  return <>{parts}</>;
}
