import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, ChevronDown, RotateCcw } from "lucide-react";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  "What is Luxor PDF?",
  "How much does it cost?",
  "Is there a free trial?",
  "What platforms are supported?",
  "How does PDF expiry work?",
  "Is my data secure?",
];

type MatchRule = { patterns: RegExp[]; response: string };

const KB: MatchRule[] = [
  {
    patterns: [/what is luxor/i, /about luxor/i, /luxor pdf\??$/i, /tell me about/i, /overview/i],
    response:
      "Luxor PDF is a professional PDF suite built for legal teams and businesses. It includes four tools:\n\n• **Luxor PDF Reader** – fast, distraction-free viewing\n• **Luxor PDF Editor** – full annotation & text editing\n• **Luxor eSign** – legally binding e-signatures\n• **Luxor PDF Security** – encryption, expiry dates & remote revoke\n\nAll processing happens 100% locally on your device.",
  },
  {
    patterns: [/pric/i, /cost/i, /how much/i, /plan/i, /subscription/i, /tier/i],
    response:
      "We offer three plans:\n\n💡 **Starter** — $9/mo (or $7/mo yearly)\nFor individuals: PDF reader, basic editor, 5 eSign docs/mo.\n\n🛡️ **Professional** — $24/mo (or $19/mo yearly)\nFull editor, 50 eSign docs, 3 devices, redaction & remote revoke.\n\n🏢 **Enterprise** — $59/mo (or $47/mo yearly)\nUnlimited everything + API access + priority support.\n\nAll plans start with a **14-day free trial**. No credit card needed.",
  },
  {
    patterns: [/free trial/i, /trial/i, /try/i, /test it/i, /demo/i],
    response:
      "Yes! Every plan comes with a **14-day free trial** — no credit card required. Just sign up and you'll have full access to your chosen plan's features for two weeks. You can cancel anytime before the trial ends without being charged.",
  },
  {
    patterns: [/platform/i, /windows/i, /android/i, /mobile/i, /desktop/i, /device/i, /mac/i, /linux/i],
    response:
      "Luxor PDF runs on:\n\n🖥️ **Windows** — native desktop app (Electron-based)\n📱 **Android** — full-featured mobile app\n🌐 **Web** — browser-based access from any device\n\nMac and Linux support are on our roadmap. You can use multiple devices depending on your plan (1 on Starter, 3 on Pro, unlimited on Enterprise).",
  },
  {
    patterns: [/expir/i, /time.?limit/i, /revoke/i, /self.?destruct/i, /access control/i],
    response:
      "Luxor PDF lets you set an **expiry date** on any PDF. Once the date passes, the document becomes inaccessible — even if the recipient already downloaded it.\n\nOn Professional and Enterprise plans you also get **remote revoke**: instantly block access to a document at any time, from anywhere, with one click.\n\nAll enforcement is client-side & server-side so there's no way around it.",
  },
  {
    patterns: [/secure/i, /privacy/i, /encrypt/i, /data/i, /safe/i, /gdpr/i, /private/i],
    response:
      "Security is at the core of Luxor PDF:\n\n🔒 **AES-256 encryption** on all documents\n📴 **100% local processing** — your files never leave your device unless you choose to share\n✅ **Zero telemetry** — we don't track you\n🛡️ **Zero-trust architecture** — we can't read your files even if we wanted to\n\nYour data is yours. Period.",
  },
  {
    patterns: [/esign/i, /e.?sign/i, /signature/i, /sign doc/i],
    response:
      "**Luxor eSign** lets you add legally binding electronic signatures to any PDF. Features include:\n\n• Draw, type, or upload your signature\n• Request signatures from others by email\n• Audit trail with timestamps\n• Certificates of completion\n\nStarter gets 5 docs/mo, Professional gets 50, and Enterprise is unlimited.",
  },
  {
    patterns: [/editor/i, /edit/i, /annotate/i, /annotation/i, /text/i],
    response:
      "**Luxor PDF Editor** lets you:\n\n✏️ Add and edit text directly in any PDF\n🖊️ Annotate with highlights, comments & shapes\n🚫 Advanced redaction (black out sensitive content)\n📝 Fill & sign forms\n\nBasic editing is on the Starter plan. Advanced features like redaction are on Professional and Enterprise.",
  },
  {
    patterns: [/refund/i, /money back/i, /cancel/i, /cancell/i],
    response:
      "You can **cancel anytime** from your account dashboard — no questions asked. If you cancel during a trial, you won't be charged. For paid subscriptions, we offer a 30-day money-back guarantee if you're not satisfied.",
  },
  {
    patterns: [/support/i, /help/i, /contact/i, /reach/i, /email/i, /sales/i],
    response:
      "Our support team is here to help:\n\n📧 **Email:** support@luxorpdf.com\n💼 **Sales:** sales@luxorpdf.com\n\nStarter users get email support. Professional users get priority response. Enterprise customers receive a dedicated account manager.\n\nYou can also browse our documentation at docs.luxorpdf.com.",
  },
  {
    patterns: [/api/i, /integrat/i, /webhook/i, /developer/i, /sdk/i],
    response:
      "**Full API access** is available on the Enterprise plan. It lets you:\n\n• Automate PDF generation and processing\n• Embed Luxor eSign into your own app\n• Trigger remote revoke via webhook\n• Pull audit logs programmatically\n\nContact sales@luxorpdf.com for API documentation and sandbox access.",
  },
  {
    patterns: [/hi\b/i, /hello/i, /hey/i, /good (morning|afternoon|evening)/i, /howdy/i],
    response:
      "Hello! 👋 Welcome to Luxor PDF. I'm here to answer any questions about our PDF suite — features, pricing, security, platforms, and more.\n\nWhat can I help you with today?",
  },
  {
    patterns: [/thank/i, /thanks/i, /cheers/i, /great/i, /awesome/i, /perfect/i],
    response:
      "You're welcome! 😊 Feel free to ask anything else about Luxor PDF. I'm happy to help.",
  },
  {
    patterns: [/bye/i, /goodbye/i, /see you/i, /that's all/i, /nothing else/i],
    response:
      "Thanks for chatting! If you have more questions later, just click the chat bubble. Enjoy Luxor PDF! 🚀",
  },
];

const FALLBACK =
  "I'm not sure I caught that. Here are some things I can help with:\n\n• Plans & pricing\n• Free trial\n• Platform support\n• PDF security & encryption\n• eSign features\n• PDF expiry & remote revoke\n\nJust ask away!";

function getBotResponse(input: string): string {
  const trimmed = input.trim();
  for (const rule of KB) {
    if (rule.patterns.some(p => p.test(trimmed))) {
      return rule.response;
    }
  }
  return FALLBACK;
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function BotMessage({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-line leading-relaxed">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
          : p
      )}
    </span>
  );
}

export function Chatbot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "bot",
      text: "Hi there! 👋 I'm Luxor, your PDF assistant.\n\nAsk me anything about our products, pricing, or features!",
      time: nowTime(),
    },
  ]);
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: Date.now(), from: "user", text: trimmed, time: nowTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const response = getBotResponse(trimmed);
      setTyping(false);
      const botMsg: Message = { id: Date.now() + 1, from: "bot", text: response, time: nowTime() };
      setMessages(prev => [...prev, botMsg]);
      if (!open) setUnread(u => u + 1);
    }, 700 + Math.random() * 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function reset() {
    setMessages([{
      id: 0,
      from: "bot",
      text: "Hi there! 👋 I'm Luxor, your PDF assistant.\n\nAsk me anything about our products, pricing, or features!",
      time: nowTime(),
    }]);
  }

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-5 z-[200] w-[360px] rounded-3xl overflow-hidden shadow-2xl flex flex-col bg-white border border-slate-100"
            style={{ maxHeight: "min(520px, 80vh)" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm leading-tight">Luxor Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/70 text-xs">Online · Replies instantly</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={reset}
                  title="Start over"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.from === "bot" && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow">
                      <Bot className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                    </div>
                  )}
                  <div className={`max-w-[82%] ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                      msg.from === "user"
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm"
                    }`}>
                      {msg.from === "bot" ? <BotMessage text={msg.text} /> : msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow">
                    <Bot className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 1 && (
              <div className="px-4 pt-2 pb-1 bg-slate-50 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all duration-150 font-medium shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-slate-100">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask me anything…"
                  className="flex-1 h-10 px-4 rounded-2xl bg-slate-100 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition-all shadow-md shadow-violet-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-center text-[10px] text-slate-400 mt-2">Powered by Luxor PDF · Support available 24/7</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger bubble */}
      <div className="fixed bottom-5 right-5 z-[201]">
        <motion.button
          onClick={() => setOpen(v => !v)}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-xl shadow-violet-500/40 text-white transition-colors"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="w-6 h-6" strokeWidth={2} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && !open && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
            >
              {unread}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl bg-violet-500 opacity-30 animate-ping pointer-events-none" />
        )}
      </div>
    </>
  );
}
