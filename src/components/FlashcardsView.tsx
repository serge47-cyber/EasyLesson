import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, RefreshCw, Layers } from "lucide-react";
import { Flashcard } from "../types";

interface FlashcardsViewProps {
  cards: Flashcard[];
  subject: string;
  onTabChange?: (tab: "theses" | "cards" | "quiz" | "solver" | "chat") => void;
}

export default function FlashcardsView({ cards, subject, onTabChange }: FlashcardsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const isHistory = subject.toLowerCase().includes("істор") || subject.toLowerCase().includes("history");
  const isScience = /фізик|хім|астрон|біол|геогр|наук|phys|chem|sci/.test(subject.toLowerCase());
  const isLiterature = /літер|мов|психол|мист|муз|liter|lang/.test(subject.toLowerCase());

  const getAccentColor = () => {
    if (isHistory) return "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20";
    if (isScience) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20";
    if (isLiterature) return "text-purple-400 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20";
    return "text-sky-400 bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20";
  };

  const getBorderColor = () => {
    if (isHistory) return "border-amber-500/50 hover:border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.05)]";
    if (isScience) return "border-emerald-500/50 hover:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]";
    if (isLiterature) return "border-purple-500/50 hover:border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.05)]";
    return "border-sky-500/50 hover:border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.05)]";
  };

  const isFinished = currentIndex === cards.length;
  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < cards.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else {
        setCurrentIndex(cards.length);
      }
    }, 150);
  };

  if (!cards || cards.length === 0) return null;

  if (isFinished) {
    return (
      <div id="flashcards-finished-section" className="space-y-6 flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-slate-100/5 border border-slate-800 animate-pulse">
          <Layers className="w-8 h-8 text-purple-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl md:text-2xl font-bold text-slate-100 font-sans">🎉 Усі картки успішно вивчено!</h3>
          <p className="text-slate-400 text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
            Ви щойно проглянули всю колоду з <strong className="text-slate-200">{cards.length}</strong> флеш-карток. Чудова підготовка для самоконтролю!
          </p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5 w-full max-w-md">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#38bdf8] text-center md:text-left">🏁 Що робити далі?</h4>
          <div className="flex flex-col gap-2">
            {onTabChange && (
              <>
                <button
                  onClick={() => onTabChange("quiz")}
                  className="w-full py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-350 border border-emerald-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  ❓ Натисніть тут для проходження Бліц-квізу
                </button>
                <button
                  onClick={() => onTabChange("solver")}
                  className="w-full py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-450 hover:text-sky-300 border border-sky-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  🧩 Покроковий розбір складних задач
                </button>
                <button
                  onClick={() => onTabChange("chat")}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-250 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  💬 Задати питання Тьютору ШІ у чаті
                </button>
              </>
            )}
            <button
              onClick={() => setCurrentIndex(0)}
              className="w-full mt-2 py-2 border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-850/60 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
            >
              🔄 Пройти картки заново
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="flashcards-section" className="space-y-6 flex flex-col items-center">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className={`w-6 h-6 ${isHistory ? 'text-amber-400' : isScience ? 'text-emerald-400' : isLiterature ? 'text-purple-400' : 'text-sky-400'}`} />
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Картки для Загадок та Формул</h2>
        </div>
        <div className="text-sm font-medium text-slate-400">
          Картка <span className="text-slate-100 font-mono font-bold">{currentIndex + 1}</span> з <span className="font-mono">{cards.length}</span>
        </div>
      </div>

      {/* 3D Flashcard Stage */}
      <div className="w-full max-w-lg h-[280px] perspective-1000 my-4 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          id="flashcard-card"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative w-full h-full transform-style-3d w-full"
        >
          {/* FRONT side of the card */}
          <div
            id="flashcard-front"
            className={`absolute inset-0 backface-hidden p-8 flex flex-col items-center justify-center border-2 border-slate-800 bg-slate-900 rounded-2xl ${
              isFlipped ? "" : getBorderColor()
            } transition-colors`}
          >
            <span className="absolute top-4 left-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Запитання / Концепт
            </span>
            <div className="text-center">
              <p className="text-lg md:text-xl font-semibold text-slate-100 leading-relaxed max-h-[160px] overflow-y-auto px-2">
                {currentCard?.front}
              </p>
            </div>
            <div className="absolute bottom-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
              <span>Натисніть для перегляду звороту</span>
            </div>
          </div>

          {/* BACK side of the card */}
          <div
            id="flashcard-back"
            className={`absolute inset-0 backface-hidden p-8 flex flex-col items-center justify-center border-2 bg-slate-850 rounded-2xl transform rotateY-180 ${getBorderColor()} transition-colors`}
          >
            <span className="absolute top-4 left-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              ШІ Пояснення / Відповідь
            </span>
            <div className="text-center w-full">
              <p className="text-base md:text-lg text-slate-200 leading-relaxed max-h-[165px] overflow-y-auto px-4 font-normal">
                {currentCard?.back}
              </p>
            </div>
            <div className={`absolute bottom-4 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${getAccentColor()}`}>
              Перевірено методистом
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Panel */}
      <div className="flex items-center gap-6">
        <button
          id="prev-flashcard-btn"
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700/60 rounded-full text-slate-350 hover:text-slate-100 transition-colors cursor-pointer"
          title="Попередня картка"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          id="flip-flashcard-btn"
          onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
          className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-755 border border-slate-700/60 rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-sky-400" />
          <span>Перевернути</span>
        </button>

        <button
          id="next-flashcard-btn"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700/60 rounded-full text-slate-350 hover:text-slate-100 transition-colors cursor-pointer"
          title="Наступна картка"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center max-w-xs mt-2">
        Клацайте по самій картці або натискайте «Перевернути», щоб перевірити себе.
      </p>
    </div>
  );
}
