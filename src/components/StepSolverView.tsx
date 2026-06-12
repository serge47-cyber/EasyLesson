import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Sparkles, HelpCircle, Eye, EyeOff, BrainCircuit, CheckCircle2 } from "lucide-react";
import { StepByStepProblem } from "../types";

interface StepSolverViewProps {
  problems: StepByStepProblem[];
  subject: string;
}

export default function StepSolverView({ problems, subject }: StepSolverViewProps) {
  // Map problem index to current revealed step index (0 means none, 1 means step 1, etc.)
  const [revealedSteps, setRevealedSteps] = useState<{ [problemIdx: number]: number }>({});

  const isHistory = subject.toLowerCase().includes("істор") || subject.toLowerCase().includes("history");
  const isScience = /фізик|хім|астрон|біол|геогр|наук|phys|chem|sci/.test(subject.toLowerCase());
  const isLiterature = /літер|мов|психол|мист|муз|liter|lang/.test(subject.toLowerCase());

  const getAccentColors = () => {
    if (isHistory) return { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" };
    if (isScience) return { text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" };
    if (isLiterature) return { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/5" };
    return { text: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/5" };
  };

  const colors = getAccentColors();

  const handleRevealNext = (problemIdx: number, totalSteps: number) => {
    const current = revealedSteps[problemIdx] || 0;
    if (current < totalSteps) {
      setRevealedSteps({
        ...revealedSteps,
        [problemIdx]: current + 1
      });
    }
  };

  const handleResetReveal = (problemIdx: number) => {
    setRevealedSteps({
      ...revealedSteps,
      [problemIdx]: 0
    });
  };

  if (!problems || problems.length === 0) return null;

  return (
    <div id="step-solver-section" className="space-y-8">
      <div className="flex items-center gap-3">
        <BrainCircuit className={`w-6 h-6 ${colors.text}`} />
        <h2 className="text-xl font-bold text-slate-100">Покроковий розбір складних завдань</h2>
      </div>

      <div className="space-y-8">
        {problems.map((prob, pIndex) => {
          const totalSteps = prob.steps ? prob.steps.length : 0;
          const currentRevealed = revealedSteps[pIndex] || 0;
          const isAllRevealed = currentRevealed === totalSteps;

          return (
            <div
              id={`problem-block-${pIndex}`}
              key={pIndex}
              className="p-5 md:p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 shadow-md"
            >
              {/* Problem Statement Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${colors.bg} ${colors.text} border ${colors.border}`}>
                    Завдання {pIndex + 1}
                  </span>
                  <span className="text-xs text-slate-500">Рівень: 10-11 Клас</span>
                </div>
                <h3 className="text-base md:text-lg text-slate-100 font-medium leading-relaxed font-sans">
                  {prob.problem}
                </h3>
              </div>

              {/* Step 0: General Principles & Algorithm (EXPLAINED FIRST) */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-cyan-400"></span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#38bdf8]">
                    🧠 Базові принципи та алгоритм рішення
                  </span>
                </div>
                <p className="text-slate-350 text-sm md:text-base leading-relaxed pl-4 font-normal italic">
                  {prob.principles}
                </p>
                <div className="text-xs text-slate-500 pl-4">
                  💡 Наша філософія — розібратися у закономірності розв'язку. Прочитайте принципи вище перед вивченням детальних кроків.
                </div>
              </div>

              {/* Interactive revealable steps */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between border-b border-slate-850 pb-2">
                  <span>Хід розв'язання</span>
                  <span>{currentRevealed} з {totalSteps} кроків відкрито</span>
                </div>

                <div className="relative pl-4 border-l border-slate-800 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {prob.steps.slice(0, currentRevealed).map((step, sIdx) => (
                      <motion.div
                        id={`problem-${pIndex}-step-${sIdx}`}
                        key={sIdx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="relative space-y-2 group"
                      >
                        {/* Step count indicator */}
                        <span className={`absolute -left-[25px] top-0.5 flex items-center justify-center w-5.5 h-5.5 rounded-full text-xs font-bold font-mono bg-slate-800 text-slate-200 border border-slate-700`}>
                          {sIdx + 1}
                        </span>

                        <div className="p-4 bg-slate-850/60 rounded-xl border border-slate-800/80 group-hover:border-slate-800 transition-colors">
                          <h4 className="text-sm md:text-base font-semibold text-slate-100 flex items-center gap-2">
                            <span>{step.title}</span>
                            <span className="text-xs font-normal text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.2 rounded-full">
                              Проаналізовано
                            </span>
                          </h4>
                          <p className="text-slate-300 text-sm leading-relaxed mt-1.5 font-normal">
                            {step.explanation}
                          </p>

                          {/* Collapsible Action details or step final output */}
                          <div className={`mt-3 p-3 bg-slate-900 border ${colors.border} rounded-lg flex items-center gap-3`}>
                            <HelpCircle className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wide">Результат кроку</span>
                              <code className="text-xs md:text-sm font-semibold font-mono text-slate-200">
                                {step.result}
                              </code>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Progress bar */}
                {totalSteps > 0 && (
                  <div className="w-full bg-slate-800 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full bg-sky-400 transition-all duration-350`}
                      style={{ width: `${(currentRevealed / totalSteps) * 100}%` }}
                    />
                  </div>
                )}

                {/* Revealer buttons */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  {currentRevealed > 0 && (
                    <button
                      id={`reset-problem-${pIndex}-btn`}
                      onClick={() => handleResetReveal(pIndex)}
                      className="px-4 py-2 text-xs bg-slate-905 hover:bg-slate-850 hover:text-slate-200 text-slate-400 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                    >
                      Скинути кроки
                    </button>
                  )}

                  {!isAllRevealed ? (
                    <button
                      id={`reveal-next-problem-${pIndex}-btn`}
                      onClick={() => handleRevealNext(pIndex, totalSteps)}
                      className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 hover:scale-[1.01] cursor-pointer ml-auto ${
                        currentRevealed === 0
                          ? "bg-sky-520 text-slate-900 bg-[#38bdf8] hover:bg-[#0284c7]"
                          : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      }`}
                    >
                      <span>
                        {currentRevealed === 0
                          ? "Відкрити перший крок вирішення 🚀"
                          : `Відкрити наступний крок (Крок ${currentRevealed + 1}) 🔒`}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs md:text-sm text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 rounded-xl ml-auto">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Повний розв'язок розкрито та проаналізовано!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
