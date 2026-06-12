import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ShieldAlert, BookOpen, RotateCcw, AlertCircle, ArrowRight } from "lucide-react";
import { QuizQuestion } from "../types";

interface QuizViewProps {
  quiz: QuizQuestion[];
  subject: string;
}

export default function QuizView({ quiz, subject }: QuizViewProps) {
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  const isHistory = subject.toLowerCase().includes("істор") || subject.toLowerCase().includes("history");
  const isScience = /фізик|хім|астрон|біол|геогр|наук|phys|chem|sci/.test(subject.toLowerCase());
  const isLiterature = /літер|мов|психол|мист|муз|liter|lang/.test(subject.toLowerCase());

  const handleOptionSelect = (index: number) => {
    if (selectedOptionIndex !== null) return; // Prevent double selecting
    setSelectedOptionIndex(index);
    if (index === quiz[currentQuestIndex].correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestIndex < quiz.length - 1) {
      setCurrentQuestIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestIndex(0);
    setSelectedOptionIndex(null);
    setQuizFinished(false);
    setScore(0);
  };

  if (!quiz || quiz.length === 0) return null;

  const currentQuestion = quiz[currentQuestIndex];
  const isCorrect = selectedOptionIndex === currentQuestion?.correctIndex;

  return (
    <div id="quiz-block" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className={`w-6 h-6 ${isHistory ? 'text-amber-400' : isScience ? 'text-emerald-400' : isLiterature ? 'text-purple-400' : 'text-sky-400'}`} />
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">Перевірка розуміння (Бліц-квіз)</h2>
        </div>
        <div className="text-sm font-medium text-slate-400">
          Запитання <span className="text-slate-100 font-mono font-bold">{currentQuestIndex + 1}</span> з <span className="font-mono">{quiz.length}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!quizFinished ? (
          <motion.div
            id={`quiz-question-card-${currentQuestIndex}`}
            key={currentQuestIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Question Text */}
            <div className="p-5 md:p-6 bg-slate-900 border border-slate-800 rounded-xl">
              <h3 className="text-base md:text-lg font-semibold text-slate-250 leading-relaxed font-sans">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Options */}
            <div className="grid gap-3 sm:grid-cols-1">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOptionIndex === idx;
                const isCorrectOption = idx === currentQuestion.correctIndex;
                const hasSelected = selectedOptionIndex !== null;

                let optionStyles = "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-850";
                if (hasSelected) {
                  if (isCorrectOption) {
                    optionStyles = "border-emerald-500 bg-emerald-950/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                  } else if (isSelected) {
                    optionStyles = "border-rose-500 bg-rose-950/20 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.1)]";
                  } else {
                    optionStyles = "border-slate-800 bg-slate-900/40 text-slate-500 cursor-not-allowed opacity-60";
                  }
                }

                return (
                  <button
                    id={`quiz-option-${idx}`}
                    key={idx}
                    disabled={hasSelected}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-4 text-left rounded-xl border text-sm md:text-base font-medium transition-all flex items-center justify-between cursor-pointer ${optionStyles}`}
                  >
                    <span>{option}</span>
                    {hasSelected && isCorrectOption && (
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 ml-3" />
                    )}
                    {hasSelected && isSelected && !isCorrectOption && (
                      <X className="w-5 h-5 text-rose-400 flex-shrink-0 ml-3" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Action Footer */}
            {selectedOptionIndex !== null && (
              <motion.div
                id="quiz-explanation-box"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-xl border ${
                  isCorrect
                    ? "bg-emerald-950/10 border-emerald-500/30"
                    : "bg-rose-950/10 border-rose-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1 rounded bg-rose-500/20 text-rose-400 flex-shrink-0 mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  )}
                  <div className="space-y-1 w-full">
                    <span className={`font-bold block text-sm ${isCorrect ? "text-emerald-400" : "text-rose-400"} uppercase tracking-wider`}>
                      {isCorrect ? "Влучно розгадано! 🎯" : "Хибний слід... 🔍"}
                    </span>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed pt-1 font-normal">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    id="next-quiz-question-btn"
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-slate-850 hover:bg-slate-755 border border-slate-700 text-slate-100 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentQuestIndex < quiz.length - 1 ? "Наступне питання" : "Завершити квіз"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-sky-400" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Finished State */
          <motion.div
            id="quiz-finished-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-6"
          >
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100/5 border border-slate-700">
              <AlertCircle className={`w-8 h-8 ${score === quiz.length ? 'text-emerald-400' : 'text-sky-400'}`} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-100">Результат Вашого бліцу</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                {score === quiz.length
                  ? "Чудова робота! Ви повністю оволоділи матеріалом цих сторінок підручника. 🕵️‍♂️"
                  : "Непогано, але деякі речі вимагають увані. Перечитайте тези або зверніться до нашого АІ-тьютора за підказкою!"}
              </p>
            </div>

            <div className="text-5xl font-mono font-bold text-slate-100 flex items-center justify-center gap-2">
              <span className={score === quiz.length ? "text-emerald-400" : "text-sky-450"}>{score}</span>
              <span className="text-slate-600 text-3xl">/</span>
              <span className="text-slate-500 text-3xl">{quiz.length}</span>
            </div>

            <div className="flex justify-center gap-4">
              <button
                id="restart-quiz-btn"
                onClick={handleRestart}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Спробувати знову</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
