"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { chatService } from "@/services/chat.service";
import {
  Calendar,
  MessageSquare,
  MessagesSquare,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneOff,
  SendHorizontal,
  ShieldCheck,
  User,
  Video,
  VideoOff,
} from "lucide-react";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender?: { id: string; fullName: string | null };
};

type CallState = "idle" | "calling" | "in-call";
type ConversationListItem = {
  conversationId: string;
  appointmentId: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  startAt: string;
  doctor?: {
    user?: {
      id: string;
      fullName: string | null;
      whatsappNumber?: string | null;
    };
  };
  patient?: {
    user?: {
      id: string;
      fullName: string | null;
      whatsappNumber?: string | null;
    };
  };
  patientName?: string;
  lastMessage?: {
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
  } | null;
};

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
  ];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold shrink-0 ${color}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null);
  // Start as false — becomes true once localStorage is read
  const [authChecked, setAuthChecked] = useState(false);
  const [me, setMe] = useState<any>(null);
  // Start as true to avoid a flash of empty state before the effect runs
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  selectedConvIdRef.current = selectedConvId;

  // ── Step 1: read localStorage — this is the only source of truth for auth ──
  useEffect(() => {
    const t = window.localStorage.getItem("accessToken");
    setToken(t);
    setAuthChecked(true);
    // If no token, nothing to load
    if (!t) {
      setLoading(false);
      return;
    }
    import("@/services/auth.service").then(({ authService }) => {
      authService
        .me(t)
        .then((d: any) => setMe(d))
        .catch(console.error);
    });
    chatService
      .listConversations(t)
      .then((d: any) => setConversations(Array.isArray(d) ? d : []))
      .catch((err: any) => setFetchError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // ── Step 2: load conversations — only after auth is resolved ──
  useEffect(() => {
    if (!authChecked) return;
    if (!token) {
      setLoading(false);
      setConversations([]);
      return;
    }
    setLoading(true);
    setFetchError(null);
    chatService
      .listConversations(token)
      .then((d: any) => setConversations(Array.isArray(d) ? d : []))
      .catch((err: any) => setFetchError((err as Error).message))
      .finally(() => setLoading(false));
  }, [token, authChecked]);

  // ── Socket ──
  useEffect(() => {
    if (!token) return;
    const url =
      process.env.NEXT_PUBLIC_WS_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:4000";
    const socket = io(url, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("conversation:message", (msg: Message) => {
      if (msg.conversationId !== selectedConvIdRef.current) return;
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on(
      "conversation:typing",
      ({ conversationId }: { conversationId: string }) => {
        if (conversationId !== selectedConvIdRef.current) return;
        setIsTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // ── Load messages when conversation selected ──
  useEffect(() => {
    if (!token || !selectedConvId) return;
    setMessagesLoading(true);
    setIsTyping(false);
    chatService
      .listMessages(token, selectedConvId)
      .then((d: any) => setMessages(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setMessagesLoading(false));
    socketRef.current?.emit("conversation:join", {
      conversationId: selectedConvId,
    });
  }, [token, selectedConvId]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Call timer ──
  useEffect(() => {
    if (callState === "in-call") {
      setCallDuration(0);
      callTimerRef.current = setInterval(
        () => setCallDuration((s) => s + 1),
        1000,
      );
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState]);

  // ── Auto-select first conversation ──
  useEffect(() => {
    if (loading || conversations.length === 0) return;
    const hasSelected =
      selectedConvId &&
      conversations.some((c) => c.conversationId === selectedConvId);
    if (hasSelected) return;
    setSelectedConvId(conversations[0].conversationId);
  }, [loading, conversations, selectedConvId]);

  const filteredConvs = useMemo(
    () =>
      conversations.filter((c) => {
        const name =
          c.doctor?.user?.fullName ??
          c.patient?.user?.fullName ??
          c.patientName ??
          "";
        return name.toLowerCase().includes(search.toLowerCase());
      }),
    [conversations, search],
  );

  const selectedConv = useMemo(
    () =>
      conversations.find((c) => c.conversationId === selectedConvId) ?? null,
    [conversations, selectedConvId],
  );

  const otherName = selectedConv
    ? me?.role === "DOCTOR"
      ? (selectedConv.patientName ??
        selectedConv.patient?.user?.fullName ??
        "Patient")
      : (selectedConv.doctor?.user?.fullName ?? "Doctor")
    : "";

  const sendMessage = useCallback(async () => {
    if (!token || !selectedConvId || !sendText.trim() || sending) return;
    const text = sendText.trim();
    setSendText("");
    setSending(true);
    try {
      socketRef.current?.emit("conversation:message", {
        conversationId: selectedConvId,
        text,
      });
      await chatService.sendMessage(token, selectedConvId, text);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }, [token, selectedConvId, sendText, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    socketRef.current?.emit("conversation:typing", {
      conversationId: selectedConvId,
    });
  };

  function startCall(type: "audio" | "video") {
    setCallType(type);
    setCallState("calling");
    setTimeout(() => setCallState("in-call"), 2000);
  }

  function endCall() {
    setCallState("idle");
    setMicMuted(false);
    setCamOff(false);
    setCallDuration(0);
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    for (const msg of messages) {
      const d = new Date(msg.createdAt).toDateString();
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: msg.createdAt, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [messages]);

  // ── Sidebar content logic — single source of truth ──
  // We have exactly 4 mutually exclusive states for the sidebar list area:
  // 1. Auth not yet checked (or loading) → spinner
  // 2. Auth checked, no token → sign in prompt
  // 3. Loading conversations → spinner with label
  // 4. Loaded → show list (or empty/error states)
  const sidebarState: "checking" | "unauthenticated" | "loading" | "ready" =
    !authChecked
      ? "checking"
      : !token
        ? "unauthenticated"
        : loading
          ? "loading"
          : "ready";

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#f5faf8]">
      {/* ── Call Overlay ── */}
      {callState !== "idle" && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-6">
          {callType === "video" && callState === "in-call" && (
            <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-7xl opacity-20 text-zinc-500">
                  <Video />
                </span>
              </div>
              <div className="absolute bottom-4 right-4 w-36 aspect-video bg-zinc-800 rounded-xl border-2 border-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-zinc-500">
                  <User />
                </span>
              </div>
            </div>
          )}
          {(callType === "audio" || callState === "calling") && (
            <div className="flex flex-col items-center gap-4">
              <Avatar name={otherName || "?"} size={96} />
              <h2 className="text-white text-2xl font-semibold">{otherName}</h2>
              <p className="text-zinc-400 text-sm animate-pulse">
                {callState === "calling"
                  ? callType === "video"
                    ? "Starting video call…"
                    : "Calling…"
                  : formatDuration(callDuration)}
              </p>
            </div>
          )}
          {callState === "in-call" && callType === "video" && (
            <p className="text-zinc-400 text-sm">
              {formatDuration(callDuration)}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2">
            {callType === "video" && (
              <button
                onClick={() => setCamOff((v) => !v)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOff ? "bg-red-500 text-white" : "bg-zinc-700 text-white hover:bg-zinc-600"}`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {camOff ? <VideoOff /> : <Video />}
                </span>
              </button>
            )}
            <button
              onClick={() => setMicMuted((v) => !v)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micMuted ? "bg-red-500 text-white" : "bg-zinc-700 text-white hover:bg-zinc-600"}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {micMuted ? <MicOff /> : <Mic />}
              </span>
            </button>
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined text-[24px]">
                <PhoneOff />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="w-80 lg:w-96 shrink-0 bg-white border-r border-outline-variant/40 flex flex-col">
        <div className="px-4 py-4 border-b border-outline-variant/40">
          <h2
            className="font-semibold text-[18px] text-[#171d1c] mb-3"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Messages
          </h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-9 pr-3 py-2 bg-surface-container rounded-lg text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/20">
          {/* State 1 & 3: spinner — covers both "not checked yet" and "loading convs" */}
          {(sidebarState === "checking" || sidebarState === "loading") && (
            <div className="p-6 text-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              {sidebarState === "loading" && (
                <p className="text-xs text-outline mt-2">
                  Loading conversations…
                </p>
              )}
            </div>
          )}

          {/* State 2: not logged in */}
          {sidebarState === "unauthenticated" && (
            <div className="p-6 text-center text-sm text-outline">
              Please sign in to view your conversations.
            </div>
          )}

          {/* State 4: ready — show error, empty, or list */}
          {sidebarState === "ready" && (
            <>
              {fetchError && (
                <div className="p-4 text-xs text-red-600 bg-red-50 m-3 rounded-lg">
                  {fetchError}
                </div>
              )}

              {!fetchError && filteredConvs.length === 0 && (
                <div className="p-6 text-center text-sm text-outline">
                  {conversations.length === 0
                    ? "No confirmed appointments with chat available."
                    : "No results for your search."}
                </div>
              )}

              {!fetchError &&
                filteredConvs.map((c) => {
                  const name =
                    me?.role === "DOCTOR"
                      ? (c.patientName ??
                        c.patient?.user?.fullName ??
                        "Patient")
                      : (c.doctor?.user?.fullName ?? "Doctor");
                  const isSelected = c.conversationId === selectedConvId;
                  return (
                    <button
                      key={c.appointmentId}
                      type="button"
                      onClick={() => setSelectedConvId(c.conversationId)}
                      className={`w-full p-4 flex items-start gap-3 text-left transition-colors border-l-4 ${
                        isSelected
                          ? "bg-[#f0f5f2] border-primary"
                          : "border-transparent hover:bg-[#f0f5f2] cursor-pointer"
                      }`}
                    >
                      <div className="relative">
                        <Avatar name={name} size={48} />
                        {c.status === "CONFIRMED" && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-sm font-semibold text-[#171d1c] truncate">
                            {name}
                          </span>
                          <span className="text-[11px] text-outline ml-2 shrink-0">
                            {new Date(c.startAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs text-[#3d4947] truncate">
                            {new Date(c.startAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${c.status === "CONFIRMED" ? "bg-primary text-white" : "bg-surface-container text-[#3d4947]"}`}
                          >
                            {c.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </>
          )}
        </div>
      </aside>

      {/* ── Chat Window ── */}
      <section className="flex-1 flex flex-col overflow-hidden bg-[#f5faf8]">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-outline">
            <span className="material-symbols-outlined text-7xl opacity-30">
              <MessageSquare />
            </span>
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="bg-white border-b border-outline-variant/40 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={otherName} size={40} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="font-semibold text-[15px] text-[#171d1c]"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {otherName}
                    </h2>
                    {me?.role === "PATIENT" && (
                      <span className="bg-secondary-container text-secondary text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[11px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          <ShieldCheck />
                        </span>
                        Verified Doctor
                      </span>
                    )}
                  </div>
                  {isTyping ? (
                    <p className="text-xs text-primary animate-pulse">
                      Typing…
                    </p>
                  ) : (
                    <p className="text-xs text-outline">
                      {selectedConv.status === "CONFIRMED"
                        ? "Online"
                        : selectedConv.status}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startCall("audio")}
                  title="Audio Call"
                  className="p-2 rounded-lg text-outline hover:bg-surface-container hover:text-[#171d1c] transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    <Phone />
                  </span>
                </button>
                <button
                  onClick={() => startCall("video")}
                  title="Video Call"
                  className="p-2 rounded-lg text-outline hover:bg-surface-container hover:text-[#171d1c] transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    <Video />
                  </span>
                </button>
                <div className="w-px h-5 bg-outline-variant mx-1" />
                <a
                  href={`/appointments/${selectedConv.appointmentId}`}
                  className="p-2 rounded-lg text-outline hover:bg-surface-container hover:text-[#171d1c] transition-colors"
                  title="View Appointment"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    <Calendar />
                  </span>
                </a>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 bg-[#f5faf8]">
              {messagesLoading && (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              )}
              {!messagesLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-outline">
                  <span className="material-symbols-outlined text-5xl opacity-30">
                    <MessagesSquare />
                  </span>
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              )}
              {!messagesLoading &&
                groupedMessages.map(({ date, messages: msgs }) => (
                  <div key={date} className="flex flex-col gap-3">
                    <div className="flex items-center justify-center">
                      <span className="bg-surface-container text-outline text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
                        {formatDate(date)}
                      </span>
                    </div>
                    {msgs.map((msg) => {
                      const isMine = msg.senderId === me?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 max-w-[75%] ${isMine ? "self-end flex-row-reverse" : "self-start"}`}
                        >
                          {!isMine && (
                            <Avatar
                              name={msg.sender?.fullName ?? otherName}
                              size={28}
                            />
                          )}
                          <div className="flex flex-col gap-0.5">
                            <div
                              className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isMine ? "bg-primary-container text-on-primary-container rounded-br-none" : "bg-white border border-border-surface-container-highest text-[#171d1c] rounded-bl-none"}`}
                            >
                              {msg.body}
                            </div>
                            <div
                              className={`flex items-center gap-1 ${isMine ? "justify-end mr-1" : "ml-1"}`}
                            >
                              <span className="text-[10px] text-outline">
                                {formatTime(msg.createdAt)}
                              </span>
                              {isMine && (
                                <span className="material-symbols-outlined text-[13px] text-primary">
                                  done_all
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              {isTyping && (
                <div className="flex items-end gap-2 self-start">
                  <Avatar name={otherName} size={28} />
                  <div className="bg-white border border-border-surface-container-highest px-3 py-2.5 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-outline-variant rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-outline-variant/40 px-4 py-3">
              <div className="flex items-end gap-2 bg-[#f5faf8] border border-outline-variant rounded-xl px-2 py-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <button
                  className="p-2 text-outline hover:text-primary transition-colors shrink-0"
                  title="Attach"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    <Paperclip />
                  </span>
                </button>
                <textarea
                  ref={textareaRef}
                  value={sendText}
                  onChange={(e) => {
                    setSendText(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message… (Enter to send)"
                  rows={1}
                  maxLength={2000}
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-sm text-[#171d1c] placeholder:text-outline py-2.5 min-h-[40px] max-h-32"
                />
                <button
                  onClick={sendMessage}
                  disabled={!sendText.trim() || sending}
                  title="Send"
                  className="p-2 bg-primary text-white rounded-lg hover:bg-[#005049] transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {sending ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      <SendHorizontal />
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-outline mt-1 text-right">
                {sendText.length}/2000
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
