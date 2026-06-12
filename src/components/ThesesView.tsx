import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, HelpCircle, Lightbulb, Sparkles } from "lucide-react";
import { Thesis } from "../types";

interface ThesesViewProps {
  theses: Thesis[];
  subject: string;
}

export default function ThesesView({ theses, subject }: ThesesViewProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isHistory = subject.toLowerCase().includes("істор") || subject.toLowerCase().includes("history");
  const isScience = /фізик|хім|астрон|біол|геогр|наук|phys|chem|sci/.test(subject.toLowerCase());
  const isLiterature = /літер|мов|психол|мист|муз|liter|lang/.test(subject.toLowerCase());

  // Subject theme styling
  const getThemeClasses = () => {
    if (isHistory) {
      return {
        accentText: "text-amber-400",
        accentBg: "bg-amber-650/20 border-amber-500/30",
        cardBorderActive: "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
        badge: "Брифінг Особливого Відділу",
        badgeBg: "bg-amber-500/20 text-amber-300 border border-amber-500/40"
      };
    } else if (isScience) {
      return {
        accentText: "text-emerald-400",
        accentBg: "bg-emerald-950/20 border-emerald-500/30",
        cardBorderActive: "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
        badge: "Матеріали Слідства ШІ",
        badgeBg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
      };
    } else if (isLiterature) {
      return {
        accentText: "text-purple-400",
        accentBg: "bg-purple-950/20 border-purple-500/30",
        cardBorderActive: "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]",
        badge: "Глибокий Психопрофайл",
        badgeBg: "bg-purple-500/20 text-purple-300 border border-purple-500/40"
      };
    } else {
      return {
        accentText: "text-sky-400",
        accentBg: "bg-sky-950/20 border-sky-500/30",
        cardBorderActive: "border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.2)]",
        badge: "Досьє Квесту знань",
        badgeBg: "bg-sky-500/20 text-sky-300 border border-sky-500/40"
      };
    }
  };

  const themeStyle = getThemeClasses();

  return (
    <div id="theses-section" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className={`w-6 h-6 ${themeStyle.accentText}`} />
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Тези та Метафори теми</h2>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full ${themeStyle.badgeBg}`}>
          {themeStyle.badge}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {theses.map((thesis, idx) => {
          const isActive = activeIndex === idx;

          return (
            <motion.div
              id={`thesis-card-${idx}`}
              key={idx}
              layout="position"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className={`p-5 rounded-xl border bg-slate-850 cursor-pointer transition-all ${
                isActive ? themeStyle.cardBorderActive : "border-slate-800 hover:border-slate-700"
              }`}
              onClick={() => setActiveIndex(isActive ? null : idx)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold uppercase tracking-wider ${themeStyle.accentText}`}>
                      Теза #{idx + 1}
                    </span>
                    <span className="text-slate-400">•</span>
                    <h3 className="text-lg font-semibold text-slate-100">{thesis.title}</h3>
                  </div>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed pt-2">
                    {thesis.content}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-slate-800 flex-shrink-0 text-slate-400 hover:text-slate-200`}>
                  <Lightbulb className={`w-5 h-5 ${isActive ? themeStyle.accentText : ""}`} />
                </div>
              </div>

              {/* Collapsed Analogy / Metaphor */}
              <motion.div
                id={`thesis-metaphor-${idx}`}
                initial={false}
                animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-4"
              >
                <div className={`mt-2 p-4 rounded-lg border flex items-start gap-3 text-sm md:text-base ${themeStyle.accentBg}`}>
                  <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${themeStyle.accentText}`} />
                  <div>
                    <span className={`font-semibold block ${themeStyle.accentText} mb-1 uppercase tracking-widest text-xs`}>
                      Асоціативна метафора (як це зрозуміти):
                    </span>
                    <p className="text-slate-200 italic leading-relaxed">
                      💡 {thesis.metaphor}
                    </p>
                  </div>
                </div>
              </motion.div>

              {!isActive && (
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Натисніть для перегляду пояснювальної аналогії</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
