import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, BookOpen, User, HelpCircle, Loader } from "lucide-react";
import { ChatMessage, Textbook } from "../types";
import { getApiUrl } from "../utils/api";

interface TutorChatViewProps {
  pageText: string;
  subject: string;
  bookTitle?: string;
}

export default function TutorChatView({ pageText, subject, bookTitle }: TutorChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips for the student
  const quickPrompts = [
    `Дай мені підказку щодо розв'язання`,
    `Поясни головну формулу простими словами`,
    `Яка історична передумова тут головна?`,
    `Поясни асоціацію або метафору до теми`
  ];

  useEffect(() => {
    // Add initial welcome message from the tutor
    const welcomeId = "welcome-" + Date.now();
    const welcomeMsg: ChatMessage = {
      id: welcomeId,
      role: "model",
      text: `Привіт, друже! 🖐 Я твій персональний АІ-тьютор з предмету "${subject || "Довільний"}". 

Я допомагаю розібратися зі складними завданнями, формулами чи історичними процесами, які є на вибраних сторінках підручника "${bookTitle || "Підручник"}".

Зауваж: я не вирішу задачу замість тебе, а проведу тебе підказками крок за кроком, щоб ти міг освоїти все на всі 100%! 🧠 

Про що поговоримо? Обери підказку знизу або запитай будь-що у полі введення!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
  }, [subject, bookTitle]);

  useEffect(() => {
    // Smooth scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessageId = "msg-" + Date.now();
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Map chat messages helper to format suitable for backend
      // Strip off the welcome message to avoid breaking initial sequence
      const historyToSend = messages
        .filter((m) => !m.id.startsWith("welcome"))
        .map((m) => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch(getApiUrl("/api/tutor-chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageText,
          messages: historyToSend,
          userMessage: textToSend,
          subject
        })
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        console.error("Non-JSON Server Response from tutor-chat:", textError);
        throw new Error(
          `Сервер повернув некоректну відповідь (код ${response.status}). Можливо, сервер перезапускається чи засинає на безкоштовному хостингу.`
        );
      }

      if (response.ok && data.text) {
        const botMessageId = "msg-bot-" + Date.now();
        const botMsg: ChatMessage = {
          id: botMessageId,
          role: "model",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          usedModel: data.usedModel
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(data.error || "Невідома помилка");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errId = "msg-err-" + Date.now();
      const errMsg: ChatMessage = {
        id: errId,
        role: "model",
        text: `⚠️ Ой, сталася невелика мережева помилка під час спроби підключитися до ШІ: ${error.message || error}. Спробуй надіслати повідомлення ще раз!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div id="ai-tutor-container" className="flex flex-col h-[520px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
      
      {/* Tutor header banner */}
      <div className="bg-slate-850 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#38bdf8] to-[#10b981] flex items-center justify-center text-slate-900 font-extrabold text-sm shadow-[0_0_10px_rgba(56,189,248,0.3)]">
              ТЬЮ
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-150">Ваш Наставник</h3>
            <span className="text-[10px] text-slate-400 block tracking-tight">Адаптивні підказки в реальному часі</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-805 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="max-w-[120px] truncate">{bookTitle || "Підручник"}</span>
        </div>
      </div>

      {/* Messages Scroll stage */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-910">
        {messages.map((msg) => {
          const isModel = msg.role === "model";
          return (
            <div
              id={`chat-msg-${msg.id}`}
              key={msg.id}
              className={`flex items-start gap-2.5 ${isModel ? "justify-start" : "justify-end"}`}
            >
              {isModel && (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-[#38bdf8] flex-shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
              )}

              <div className="flex flex-col max-w-[85%] space-y-1">
                <div
                  className={`p-3.5 rounded-2xl text-sm md:text-base leading-relaxed ${
                    isModel
                      ? "bg-slate-850 text-slate-250 border border-slate-800 rounded-tl-none font-normal"
                      : "bg-[#0ea5e9] text-white rounded-tr-none font-medium"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className={`text-[10px] text-slate-500 ${isModel ? "text-left" : "text-right"} flex items-center gap-1.5 flex-wrap ${isModel ? "justify-start" : "justify-end"}`}>
                  <span>{msg.timestamp}</span>
                  {isModel && msg.usedModel && (
                    <>
                      <span>•</span>
                      <span className="text-[9px] text-[#10b981] font-mono bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-500/10">
                        {msg.usedModel === "gemini-3.1-flash-lite" ? "Gemini 3.1 Lite (Резерв)" : "Gemini 3.5 Flash"}
                      </span>
                    </>
                  )}
                </span>
              </div>

              {!isModel && (
                <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center border border-[#0ea5e9]/40 text-[#38bdf8] flex-shrink-0">
                  <User className="w-4 h-4 text-[#38bdf8]" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-[#38bdf8] flex-shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-850 rounded-2xl rounded-tl-none border border-slate-800 flex items-center gap-2">
              <Loader className="w-4 h-4 text-sky-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Тьютор аналізує Вашу думку...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Options & Form panel */}
      <div className="bg-slate-850 p-3 border-t border-slate-800 space-y-3 flex-shrink-0">
        
        {/* Chips for first-turn quick prompts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {quickPrompts.map((prompt, idx) => (
            <button
              id={`quick-prompt-${idx}`}
              key={idx}
              disabled={loading}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-755 disabled:opacity-50 text-[11px] font-medium text-slate-300 hover:text-slate-100 rounded-full border border-slate-700/60 transition-colors whitespace-nowrap cursor-pointer"
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            id="chat-input-text"
            type="text"
            disabled={loading}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Запитайте тьютора про формулу чи підказку тут..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2.5 md:px-4 md:py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
