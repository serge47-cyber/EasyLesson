import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Upload, 
  Sparkles, 
  BrainCircuit, 
  ChevronRight, 
  Check, 
  Layers, 
  GraduationCap, 
  BookMarked,
  Info,
  ChevronLeft,
  Settings,
  HelpCircle,
  FilePlus,
  Loader,
  Trash2,
  RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Textbook, GeneratedLesson } from "./types";

// Import custom views
import ThesesView from "./components/ThesesView";
import FlashcardsView from "./components/FlashcardsView";
import QuizView from "./components/QuizView";
import StepSolverView from "./components/StepSolverView";
import TutorChatView from "./components/TutorChatView";

const DEFAULT_TEXTBOOKS: Textbook[] = [
  {
    id: "hist-10",
    title: "Історія України. 10 Клас",
    grade: "10",
    subject: "Історія України",
    totalPages: 5,
    pages: {
      1: "Українська революція 1917–1921 років зародилася в Києві на початку березня 1917 року. Було створено перший загальноукраїнський представницький орган — Українську Центральну Раду (УЦР) під керівництвом авторитетного історика Михайла Грушевського. Цей орган об'єднав українських політиків, інтелектуалів та представників військових.",
      2: "Протягом 1917 року УЦР видала серію ключових законів — Універсалів. Перший Універсал проголосив автономію українських земель у складі демократичної Росії: 'Хай буде Україна вільною'. Другий Універсал був важким компромісом з Тимчасовим урядом, що викликало гостру критику самостійників та військові сутички в Києві.",
      3: "У листопаді 1917 року, після більшовицького перевороту в Петрограді, УЦР видала Третій Універсал, яким офіційно проголосила створення Української Народної Республіки (УНР) у федеративному зв'язку з демократичною Росією. Було введено 8-годинний робочий день та скасовано право приватної власності на великі поміщицькі землі.",
      4: "Початок збройного наступу більшовицьких військ Муравйова на Київ та початок самостійного виходу УНР на міжнародну арену у Бресті змусили лідерів Центральної Ради до рішучого кроку. 22 січня 1918 року було ухвалено Четвертий Універсал, який декларував: 'Од нині Українська Народна Республіка стає самостійною, ні від кого незалежною, вільною, суверенною державою українського народу'.",
      5: "Проголошення повної незалежності в 4-му Універсалі стало тріумфом національного відродження. Проте республіка зіткнулася з гострою військовою загрозою більшовиків у січні-лютому 1918 року. Оборона Києва, героїчна битва під Крутами та складне утримання влади продемонстрували надважу ціну свободи в умовах геополітичного трилера початку 20 століття."
    }
  },
  {
    id: "phys-11",
    title: "Фізика та Астрономія. 11 Клас",
    grade: "11",
    subject: "Фізика",
    totalPages: 5,
    pages: {
      1: "Квантова фізика — це наука про приховану природу мікросвіту, де діють закони, що суперечать класичному здоровому глузду. На межі 19-20 століть фізика зіткнулася з таємничим явищем зовнішнього фотоефекту — випромінюванням електронів твердими речовинами під дією світла. Електродинаміка Максвелла не могла пояснити, чому енергія вибитих електронів не залежить від яскравості світла.",
      2: "Російський фізик Олександр Столєтов детально вивчив це явище та встановив закони фотоефекту: 1) Кількість вибитих фотоелектронів щосекунди прямо пропорційна інтенсивності падаючого світла. 2) Максимальна кінетична енергія вибитих електронів лінійно зростає зі збільшенням частоти світла і не залежить від його інтенсивності. Класичні фізики були шоковані: чому яскравіше світло не дає електронам більше енергії?",
      3: "Було виявлено ще одну несподіванку — існування червоної межі фотоефекту. Це мінімальна частота світла (або максимальна довжина хвилі), нижче якої фотоефект припиняється повністю, яким би потужним та довготривалим не було опромінення. Наприклад, навіть тьмяне фіолетове світло вибиває електрони, а надзвичайно потужний прожектор червоного світла не виб'є жодного.",
      4: "Загадку розв'язав Альберт Ейнштейн у 1905 році, за що згодом отримав Нобелівську премію. Він запропонував інженерний хак класичної фізики: світло поширюється та поглинається не неперервною хвилею, а крихітними порціями — квантами світла (фотонами). Кожний фотон має строго квантовану енергію E = h*v, де h — стала Планка (6.63e-34 Дж*с), а v — частота випромінювання.",
      5: "Ейнштейн вивів фундаментальне рівняння фотоефекту: h*v = A_вих + E_к_макс. Фотон цілком поглинається одним електроном. Частина його енергії витрачається на роботу виходу (A_вих) — зусилля, необхідне для відриву електрона від атомів металу, а решта перетворюється на максимальну кінетичну енергію (E_к_макс) фотоелектрона. Сьогодні фотоефект працює у сонячних батареях, супутникових датчиках та камерах нічного бачення."
    }
  }
];

export default function App() {
  const [textbooks, setTextbooks] = useState<Textbook[]>(DEFAULT_TEXTBOOKS);
  const [selectedBookId, setSelectedBookId] = useState<string>("phys-11");
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(3);
  
  // PDF upload state
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState("Фізика");
  const [uploadGrade, setUploadGrade] = useState("10");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Lesson Generation state
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [activeTab, setActiveTab] = useState<"theses" | "cards" | "quiz" | "solver" | "chat">("theses");
  const [apiError, setApiError] = useState<string | null>(null);
  const [customModel, setCustomModel] = useState("gemini-3.5-flash");

  // Local storage for hidden default books
  const [hiddenBookIds, setHiddenBookIds] = useState<string[]>([]);

  useEffect(() => {
    const savedHidden = localStorage.getItem("ai_methodologist_hidden_books");
    if (savedHidden) {
      try {
        setHiddenBookIds(JSON.parse(savedHidden));
      } catch (err) {
        console.error("Error parsing hidden books list:", err);
      }
    }
  }, []);

  // Local storage cache for persistence of custom textbooks
  useEffect(() => {
    const savedBooksJson = localStorage.getItem("ai_methodologist_books");
    if (savedBooksJson) {
      try {
        const parsed = JSON.parse(savedBooksJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with default textbooks
          const merged = [...DEFAULT_TEXTBOOKS, ...parsed.filter((b: any) => !DEFAULT_TEXTBOOKS.some(db => db.id === b.id))];
          setTextbooks(merged);
        }
      } catch (err) {
        console.error("Local storage textbook parse error:", err);
      }
    }
  }, []);

  const visibleTextbooks = textbooks.filter(book => !hiddenBookIds.includes(book.id));
  const activeBook = visibleTextbooks.find((b) => b.id === selectedBookId) || visibleTextbooks[0];

  // Auto-adjust selectedBookId and page limits when list alters
  useEffect(() => {
    if (visibleTextbooks.length > 0) {
      const isStillAvailable = visibleTextbooks.some(b => b.id === selectedBookId);
      if (!isStillAvailable) {
        setSelectedBookId(visibleTextbooks[0].id);
      }
    } else {
      setSelectedBookId("");
    }
  }, [hiddenBookIds, textbooks]);

  const handleDeleteBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isDefaultBook = bookId.startsWith("hist") || bookId.startsWith("phys");

    if (isDefaultBook) {
      const updatedHidden = [...hiddenBookIds, bookId];
      setHiddenBookIds(updatedHidden);
      localStorage.setItem("ai_methodologist_hidden_books", JSON.stringify(updatedHidden));
    } else {
      const updatedBooks = textbooks.filter(b => b.id !== bookId);
      setTextbooks(updatedBooks);
      const customBooks = updatedBooks.filter(b => !DEFAULT_TEXTBOOKS.some(db => db.id === b.id));
      localStorage.setItem("ai_methodologist_books", JSON.stringify(customBooks));
    }

    if (selectedBookId === bookId) {
      setGeneratedLesson(null);
    }
  };

  const handleRestoreDemoBooks = () => {
    setHiddenBookIds([]);
    localStorage.removeItem("ai_methodologist_hidden_books");
    setSelectedBookId("phys-11");
  };

  // Auto-adjust pages context when active book changes
  useEffect(() => {
    if (activeBook) {
      setStartPage(1);
      setEndPage(Math.min(activeBook.totalPages, 3));
    }
  }, [selectedBookId]);

  // Robust page navigation/input handlers
  const handleStartPageChange = (valStr: string) => {
    if (valStr === "") {
      setStartPage(0);
      return;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;

    const maxPages = activeBook ? activeBook.totalPages : 1;
    const page = Math.max(1, Math.min(maxPages, val));
    setStartPage(page);
    
    // Automatically shift end page if start page exceeds it
    if (page > endPage && endPage !== 0) {
      setEndPage(page);
    }
  };

  const handleEndPageChange = (valStr: string) => {
    if (valStr === "") {
      setEndPage(0);
      return;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;

    const maxPages = activeBook ? activeBook.totalPages : 1;
    const page = Math.max(startPage, Math.min(maxPages, val));
    setEndPage(page);
  };

  const handleStartPageBlur = () => {
    if (startPage <= 0) {
      setStartPage(1);
    }
    const maxPages = activeBook ? activeBook.totalPages : 1;
    if (startPage > maxPages) {
      setStartPage(maxPages);
    }
  };

  const handleEndPageBlur = () => {
    const maxPages = activeBook ? activeBook.totalPages : 1;
    if (endPage < startPage || endPage <= 0) {
      setEndPage(startPage);
    } else if (endPage > maxPages) {
      setEndPage(maxPages);
    }
  };

  // Handle PDF file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  // Perform client-side PDF parsing using pdf.js from CDN
  const parsePdfClientSide = (file: File, onProgress: (msg: string) => void): Promise<Textbook> => {
    return new Promise((resolve, reject) => {
      const scriptId = "pdfjs-script";
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      const startParsing = async () => {
        try {
          onProgress("Ініціалізація локального оцифрувальника...");
          const pdfjsLib = (window as any)["pdfjs-dist/build/pdf"];
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

          loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
            if (progressData.total > 0) {
              const pct = Math.round((progressData.loaded / progressData.total) * 100);
              onProgress(`Завантаження в пам'ять: ${pct}%`);
            }
          };

          const pdf = await loadingTask.promise;
          const totalPages = pdf.numPages;
          const pages: { [key: number]: string } = {};

          for (let i = 1; i <= totalPages; i++) {
            onProgress(`Локальне оцифрування: сторінка ${i} з ${totalPages} (${Math.round((i / totalPages) * 100)}%)`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            pages[i] = pageText || " ";
          }

          resolve({
            id: "book-" + Date.now(),
            title: uploadTitle || file.name.replace(/\.[^/.]+$/, ""),
            grade: uploadGrade,
            subject: uploadSubject,
            totalPages,
            pages
          });
        } catch (err) {
          reject(err);
        }
      };

      if (!script) {
        onProgress("Підключення локальних оцифрувальних бібліотек...");
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = () => {
          setTimeout(startParsing, 150);
        };
        script.onerror = () => reject(new Error("Не вдалося завантажити локальний PDF-парсер."));
        document.head.appendChild(script);
      } else {
        if ((window as any)["pdfjs-dist/build/pdf"]) {
          startParsing();
        } else {
          script.addEventListener("load", startParsing);
        }
      }
    });
  };

  // Perform Textbook File Upload/Parsing with client-side primary and server fallback
  const handleUploadTextbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setApiError("Будь ласка, виберіть файл PDF.");
      return;
    }

    setUploadingPdf(true);
    setApiError(null);
    setUploadProgress("Ініціалізація...");

    try {
      let parsedBook: Textbook;
      try {
        parsedBook = await parsePdfClientSide(selectedFile, (progressMsg) => {
          setUploadProgress(progressMsg);
        });
      } catch (clientErr: any) {
        console.warn("Client-side PDF parsing failed, falling back to server:", clientErr);
        setUploadProgress("Помилка локального оцифрування. Спроба обробки сервером...");

        const formData = new FormData();
        formData.append("pdf", selectedFile);
        formData.append("title", uploadTitle || selectedFile.name.replace(/\.[^/.]+$/, ""));
        formData.append("subject", uploadSubject);
        formData.append("grade", uploadGrade);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Не вдалося зчитати PDF ні локально, ні сервером.");
        }

        parsedBook = {
          id: "book-" + Date.now(),
          title: data.title,
          grade: data.grade,
          subject: data.subject,
          totalPages: data.totalPages,
          pages: data.pages
        };
      }

      // Add newly parsed textbook to list
      const updatedBooks = [...textbooks, parsedBook];
      setTextbooks(updatedBooks);

      // Save custom ones in local storage
      const customBooks = updatedBooks.filter(b => !DEFAULT_TEXTBOOKS.some(db => db.id === b.id));
      localStorage.setItem("ai_methodologist_books", JSON.stringify(customBooks));

      setSelectedBookId(parsedBook.id);
      setShowUploadForm(false);
      setSelectedFile(null);
      setUploadTitle("");
    } catch (error: any) {
      console.error("General parse error:", error);
      setApiError("Помилка завантаження підручника: " + (error.message || error));
    } finally {
      setUploadingPdf(false);
      setUploadProgress("");
    }
  };

  // Generate customized AI interactive materials
  const handleGenerateLesson = async () => {
    if (!activeBook) return;

    // Enforce strict boundaries right before generating
    let sPage = startPage;
    let ePage = endPage;
    const maxPages = activeBook.totalPages;
    if (sPage <= 0) sPage = 1;
    if (sPage > maxPages) sPage = maxPages;
    if (ePage <= 0 || ePage < sPage) ePage = sPage;
    if (ePage > maxPages) ePage = maxPages;

    setStartPage(sPage);
    setEndPage(ePage);

    setGeneratingLesson(true);
    setApiError(null);
    setGeneratedLesson(null);

    // Grab continuous page text within range
    const pageTextCollection: string[] = [];
    for (let pNum = sPage; pNum <= ePage; pNum++) {
      if (activeBook.pages[pNum]) {
        pageTextCollection.push(activeBook.pages[pNum]);
      }
    }

    if (pageTextCollection.length === 0) {
      setApiError("Вибраний діапазон сторінок порожній або тексти не зчитані.");
      setGeneratingLesson(false);
      return;
    }

    const fullPageText = pageTextCollection.join("\n\n");

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeBook.subject,
          text: fullPageText,
          startPage: sPage,
          endPage: ePage,
          customModel
        })
      });

      const data = await response.json();
      if (response.ok && data.themeTitle) {
        setGeneratedLesson(data);
        setActiveTab("theses");
      } else {
        throw new Error(data.error || "Збій генерації матеріалів ШІ.");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      setApiError("Сталася помилка при генерації: " + (error.message || error));
    } finally {
      setGeneratingLesson(false);
    }
  };

  // Helper values for subject styling info
  const isHistory = activeBook?.subject.toLowerCase().includes("істор");
  const isScience = /фізик|хім|астрон|біол|геогр|наук/.test(activeBook?.subject.toLowerCase());
  const isLiterature = /літер|мов|психол|мист|муз/.test(activeBook?.subject.toLowerCase());

  const getSubjectStyleBadge = () => {
    if (isHistory) return { label: "🕯️ Політичний / історичний трилер", text: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    if (isScience) return { label: "🔬 Науковий детектив та інженерний хак", text: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (isLiterature) return { label: "🎭 Психопрофайлінг та мотиви характерів", text: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
    return { label: "🧩 Інтелектуальний квест та системні закономірності", text: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
  };

  const styleBadge = getSubjectStyleBadge();

  return (
    <div className="min-h-screen bg-slate-910 text-slate-100 flex md:flex-row flex-col font-sans overflow-x-hidden">
      
      {/* Left Navigation Rail */}
      <nav className="w-full md:w-20 bg-slate-905 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col items-center justify-between md:justify-start py-4 md:py-8 px-4 md:px-0 gap-6 md:gap-10 shrink-0 z-30">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform duration-200">
          <span className="text-xl font-black text-white">M</span>
        </div>
        
        <div className="flex md:flex-col gap-4 md:gap-6">
          <div className="w-10 h-10 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-center text-cyan-400 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:bg-slate-755 transition-colors" title="Полиця підручників">
            <BookMarked className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 flex items-center justify-center text-[#0ea5e9] shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-pulse" title="Методист ШІ">
            <BrainCircuit className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-755 hover:text-slate-200 transition-colors" title="Програма квестів">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* User Account / Email Badge at Bottom */}
        <div className="md:mt-auto relative group flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-emerald-400 p-[2px] cursor-pointer shadow-md">
            <div className="w-full h-full rounded-full bg-slate-905 flex items-center justify-center text-xs font-bold text-slate-200 uppercase">
              S
            </div>
          </div>
          {/* Custom tooltip box */}
          <div className="absolute left-1/2 md:left-14 top-12 md:top-1/2 -translate-x-1/2 md:-translate-x-0 md:-translate-y-1/2 opacity-0 group-hover:opacity-100 bg-slate-850 border border-slate-700 text-[11px] text-slate-200 px-3 py-1.5 rounded-lg pointer-events-none transition-all duration-200 shadow-2xl whitespace-nowrap z-50">
            <span className="font-bold text-white block">Асистент Сергій</span>
            <span className="text-[10px] text-slate-400">serge47@gmail.com</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* GLOBAL TOP NAV */}
        <header className="bg-slate-905/70 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 md:px-8 flex-shrink-0 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#0ea5e9] text-slate-900 p-2 rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(14,165,233,0.3)]">
                <GraduationCap className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
                  АІ-Методист <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent text-xs font-bold uppercase tracking-widest border border-cyan-500/30 px-1.5 py-0.2 rounded">Школа 10/11</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-normal">
                  Персональний ШІ-дизайнер інтерактивних уроків та адаптивних розв'язань
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Active Section Label with dynamic badge */}
              <div className="hidden lg:flex items-center gap-2 text-cyan-400 text-xs bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Активний режим: {generatedLesson ? `Урок / ${activeBook.subject}` : "Вибір підручника"}</span>
              </div>

              {/* Global parameters/model selection popup */}
              <div className="flex items-center gap-2 bg-slate-850 border border-slate-755/65 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Модель:</span>
                <select
                  id="select-model"
                  value={customModel} 
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="bg-transparent text-slate-100 focus:outline-none focus:ring-0 font-mono font-bold cursor-pointer"
                >
                  <option value="gemini-3.5-flash" className="bg-slate-900">Gemini 3.5 Flash</option>
                  <option value="gemini-3.1-flash-lite" className="bg-slate-900">Gemini 3.1 Flash Lite</option>
                </select>
              </div>
            </div>
          </div>
        </header>

      {/* ERROR TOAST BAR */}
      {apiError && (
        <div className="bg-rose-950/40 border-b border-rose-500/30 text-rose-300 py-2.5 px-6 text-center text-xs md:text-sm flex items-center justify-center gap-2 flex-shrink-0 animate-fade-in relative z-25">
          <Info className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{apiError}</span>
          <button 
            onClick={() => setApiError(null)} 
            className="ml-3 font-bold hover:text-white underline cursor-pointer"
          >
            Закрити
          </button>
        </div>
      )}

      {/* MAIN CONTAINER STREAM */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Textbook Shelves & Generation Forms */}
        <div className="w-full lg:w-[360px] flex-shrink-0 space-y-6">
          
          {/* Section: Shelf Selection */}
          <div className="bg-slate-905 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm md:text-base font-extrabold text-slate-100">Полиця підручників</h2>
              </div>
              <button
                id="toggle-upload-form-btn"
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
              >
                <FilePlus className="w-3.5 h-3.5 text-sky-400" />
                <span>Завантажити PDF</span>
              </button>
            </div>

            {/* Dropdown / shelf list */}
            {!showUploadForm ? (
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {visibleTextbooks.length === 0 ? (
                  <div className="text-center py-6 px-4 border border-dashed border-slate-850 rounded-xl bg-slate-950/20 space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">Полиця порожня. Усі підручники приховано або видалено.</p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleRestoreDemoBooks}
                        className="w-full py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <RefreshCcw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Відновити демо-книги</span>
                      </button>
                      <button
                        onClick={() => setShowUploadForm(true)}
                        className="w-full py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        Завантажити новий PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {visibleTextbooks.map((book) => {
                        const isSelected = book.id === selectedBookId;
                        const isDefaultBook = book.id.startsWith("hist") || book.id.startsWith("phys");

                        return (
                          <div
                            id={`book-item-${book.id}`}
                            key={book.id}
                            onClick={() => {
                              setSelectedBookId(book.id);
                              if (generatedLesson) {
                                // Clear because book changed, user should generate new one
                                setGeneratedLesson(null);
                              }
                            }}
                            className={`group p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 relative ${
                              isSelected 
                                ? "border-sky-500 bg-sky-955/10 bg-slate-850" 
                                : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700"
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${isSelected ? "bg-sky-500/20 text-sky-300" : "bg-slate-800 text-slate-400"} flex-shrink-0`}>
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1 pr-6">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-850 border border-slate-800 px-1.5 py-0.1 rounded-md">
                                  Клас {book.grade}
                                </span>
                                {isDefaultBook && (
                                  <span className="text-[9px] font-bold font-sans text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.1 rounded-md select-none">
                                    ДЕМО ШІ
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs md:text-sm font-bold text-slate-200 truncate">{book.title}</h4>
                              <p className="text-[10px] text-slate-400">{book.subject} • {book.totalPages} стор.</p>
                            </div>
                            
                            {/* Delete/Hide button */}
                            <button
                              id={`delete-book-btn-${book.id}`}
                              onClick={(e) => handleDeleteBook(book.id, e)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              title={isDefaultBook ? "Приховати цей демо-підручник" : "Видалити завантажений підручник"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {hiddenBookIds.length > 0 && (
                      <button
                        onClick={handleRestoreDemoBooks}
                        className="w-full mt-2.5 py-1.5 border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl text-[11px] text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCcw className="w-3 h-3 text-cyan-400" />
                        <span>Відновити приховані демо-книги ({hiddenBookIds.length})</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Toggle PDF Upload view */
              <motion.form 
                id="pdf-upload-form"
                onSubmit={handleUploadTextbook} 
                className="space-y-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-xs font-bold text-slate-100 flex items-center justify-between pb-1">
                  <span>Додати підручник (PDF)</span>
                  <button 
                    type="button" 
                    onClick={() => setShowUploadForm(false)} 
                    className="text-slate-400 hover:text-slate-200 text-[10px] underline cursor-pointer"
                  >
                    Скасувати
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Назва підручника</label>
                  <input
                    id="upload-title-input"
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Наприклад: Біологія 10 клас"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Предмет</label>
                    <select
                      id="upload-subject-select"
                      value={uploadSubject}
                      onChange={(e) => setUploadSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="Фізика">Фізика</option>
                      <option value="Історія України">Історія України</option>
                      <option value="Українська література">Українська література</option>
                      <option value="Хімія">Хімія</option>
                      <option value="Астрономія">Астрономія</option>
                      <option value="Біологія">Біологія</option>
                      <option value="Геометрія">Геометрія</option>
                      <option value="Інший предмет">Інший предмет</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Клас</label>
                    <select
                      id="upload-grade-select"
                      value={uploadGrade}
                      onChange={(e) => setUploadGrade(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="10">10 Клас</option>
                      <option value="11">11 Клас</option>
                    </select>
                  </div>
                </div>

                {/* File picker */}
                <div className="border border-dashed border-slate-800 rounded-lg p-3 text-center bg-slate-950 hover:bg-slate-905 transition-colors cursor-pointer relative">
                  <input
                    id="upload-file-input"
                    type="file"
                    accept=".pdf"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 mx-auto text-slate-500" />
                    <p className="text-[10px] text-slate-400 font-medium">
                      {selectedFile ? selectedFile.name : "Оберіть файл PDF"}
                    </p>
                    <span className="text-[9px] text-slate-650 block">Макс. розмір 100МБ</span>
                  </div>
                </div>

                <button
                  id="submit-pdf-btn"
                  type="submit"
                  disabled={uploadingPdf || !selectedFile}
                  className="w-full py-2 bg-sky-500 hover:bg-[#0ea5e9] disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {uploadingPdf ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadProgress || "Зчитування сторінок..."}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Завантажити та розпізнати</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </div>

          {/* Section: Lesson Parameters (Start/End pages) */}
          <div className="bg-slate-905 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Параметри опрацювання</span>
            </h3>

            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Початкова сторінка</label>
                  <input
                    id="param-start-page"
                    type="number"
                    min="1"
                    max={activeBook ? activeBook.totalPages : 1}
                    value={startPage === 0 ? "" : startPage}
                    onChange={(e) => handleStartPageChange(e.target.value)}
                    onBlur={handleStartPageBlur}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
                
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Кінцева сторінка</label>
                  <input
                    id="param-end-page"
                    type="number"
                    min={startPage}
                    max={activeBook ? activeBook.totalPages : 1}
                    value={endPage === 0 ? "" : endPage}
                    onChange={(e) => handleEndPageChange(e.target.value)}
                    onBlur={handleEndPageBlur}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Page limitation advisory badge */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <p>
                  Порада ШІ: оптимальний обсяг для генерації одного уроку — <span className="font-bold text-white">1–3 сторінки</span>. Це забезпечує максимальну якість методичних тез та безпомилковість квізів.
                </p>
              </div>

              {/* AI Expert styling style display */}
              <div className="space-y-1 pt-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Стилізація ШІ-Експерта</span>
                <span className={`px-3 py-2 rounded-xl text-xs font-semibold block border text-center ${styleBadge.text}`}>
                  {styleBadge.label}
                </span>
              </div>

              {/* Main execution button */}
              <button
                id="generate-lesson-btn"
                onClick={handleGenerateLesson}
                disabled={generatingLesson || uploadingPdf || !activeBook}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 hover:from-cyan-400 hover:to-emerald-300 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 rounded-xl text-xs md:text-sm font-extrabold tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {generatingLesson ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Створюємо урок ШІ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Згенерувати Інтерактивний Урок</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Lesson Stage */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {generatingLesson ? (
              /* A beautiful engaging loader to avoid boring white screen */
              <motion.div
                id="lesson-generating-stage"
                key="generating"
                className="h-full min-h-[460px] bg-slate-905 border border-slate-800 rounded-2xl flex flex-col justify-center items-center text-center p-8 space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-850 border-t-sky-400 animate-spin flex items-center justify-center"></div>
                  <BrainCircuit className="w-10 h-10 text-sky-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Методичний ШІ-дизайнер компонує урок</h3>
                  <div className="max-w-md text-slate-400 text-sm leading-relaxed space-y-1 font-mono">
                    <p className="animate-pulse">⚡ Зчитування сторінок [{startPage} - {endPage}] підручника {activeBook.title}...</p>
                    <p className="text-slate-500">✍️ Переклад у тези у стилі "{styleBadge.label.split(' ')[1]}"...</p>
                    <p className="text-slate-500">🎲 Формування квізів для тренування розумових м'язів...</p>
                    <p className="text-slate-500">🧗‍♂️ Структурування рішень завдань Крок-за-Кроком...</p>
                  </div>
                </div>
              </motion.div>
            ) : generatedLesson ? (
              /* ACTIVE INTERACTIVE LESSON MODULE */
              <motion.div
                id="interactive-lesson-stage"
                key="lesson-view"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Lesson Header Card */}
                <div className="bg-slate-905 border border-slate-800 p-5 md:p-6 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/20 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          {activeBook.subject}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-md">
                          Стор. {startPage} - {endPage}
                        </span>
                        {generatedLesson.usedModel && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-sans animate-fade-in">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Модель: {generatedLesson.usedModel === "gemini-3.1-flash-lite" ? "Gemini 3.1 Flash Lite (Резерв через навантаження)" : "Gemini 3.5 Flash"}</span>
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-100 uppercase tracking-tight leading-snug">
                        {generatedLesson.themeTitle}
                      </h2>
                    </div>
                    {/* Clear active lesson to return to preloading illustration choice */}
                    <button
                      id="close-lesson-btn"
                      onClick={() => setGeneratedLesson(null)}
                      className="px-4 py-2 border border-slate-800 bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs font-medium cursor-pointer transition-all hover:bg-slate-850"
                    >
                      Назад до вибору сторінок
                    </button>
                  </div>

                  {/* Objective Mission Briefing Panel with immersive style */}
                  <div className="p-4 bg-slate-850/50 border border-slate-800/80 rounded-xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-[#38bdf8] block uppercase tracking-wider mb-0.5">Вступна місія уроку (Briefing):</span>
                      <p className="text-slate-200 text-sm md:text-base leading-relaxed italic">
                        "{generatedLesson.missionBriefing}"
                      </p>
                    </div>
                  </div>

                  {/* Modules segment switcher pill buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-850 pt-4">
                    <button
                      id="tab-theses"
                      onClick={() => setActiveTab("theses")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "theses"
                          ? "bg-sky-522 bg-[#0ea5e9] text-slate-950"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      ⚡ Конспект-Тези
                    </button>

                    <button
                      id="tab-cards"
                      onClick={() => setActiveTab("cards")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "cards"
                          ? "bg-sky-522 bg-[#0ea5e9] text-slate-950"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      📋 Флеш-картки
                    </button>

                    <button
                      id="tab-quiz"
                      onClick={() => setActiveTab("quiz")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "quiz"
                          ? "bg-sky-522 bg-[#0ea5e9] text-slate-950"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      ❓ Бліц-квіз
                    </button>

                    <button
                      id="tab-solver"
                      onClick={() => setActiveTab("solver")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "solver"
                          ? "bg-sky-522 bg-[#0ea5e9] text-slate-950"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      🧩 Розбір задач
                    </button>

                    <button
                      id="tab-chat"
                      onClick={() => setActiveTab("chat")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "chat"
                          ? "bg-sky-522 bg-[#0ea5e9] text-slate-950"
                          : "bg-slate-900 border border-slate-805 text-slate-400 hover:text-white ml-auto"
                      }`}
                    >
                      💬 АІ-Тьютор
                    </button>
                  </div>
                </div>

                {/* Submodule render box */}
                <div className="bg-slate-905 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
                  {activeTab === "theses" && (
                    <ThesesView theses={generatedLesson.theses} subject={activeBook.subject} />
                  )}
                  {activeTab === "cards" && (
                    <FlashcardsView cards={generatedLesson.flashcards} subject={activeBook.subject} />
                  )}
                  {activeTab === "quiz" && (
                    <QuizView quiz={generatedLesson.quiz} subject={activeBook.subject} />
                  )}
                  {activeTab === "solver" && (
                    <StepSolverView problems={generatedLesson.stepByStepProblems} subject={activeBook.subject} />
                  )}
                  {activeTab === "chat" && (
                    <TutorChatView 
                      pageText={Object.entries(activeBook.pages)
                        .filter(([num]) => parseInt(num) >= startPage && parseInt(num) <= endPage)
                        .map(([_, txt]) => txt)
                        .join("\n\n")} 
                      subject={activeBook.subject} 
                      bookTitle={activeBook.title}
                    />
                  )}
                </div>

              </motion.div>
            ) : (
              /* WELCOME BLANK ILLUSTRATIVE STATE */
              <motion.div
                id="idle-illustration-stage"
                key="welcome"
                className="h-full min-h-[520px] bg-slate-905 border border-slate-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Ambient glow decoration */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-sky-500/5 blur-3xl" />
                
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                  <BrainCircuit className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-lg relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-100">Ласкаво просимо в АІ-Методист підручників!</h3>
                  <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                    Цей застосунок перетворює сухі сторінки шкільних підручників 10–11 класів на повноцінні інтерактивні уроки-квести для легкого засвоєння.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 w-full max-w-2xl relative z-10">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-left">
                    <span className="text-normal block">⚡</span>
                    <h4 className="text-xs font-bold text-slate-150 uppercase tracking-wide">Конспекти & Метафори</h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Суха теорія трансформується у пристрастні логічні тези та яскраві життєві аналогії.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-left">
                    <span className="text-normal block">📋 / ❓</span>
                    <h4 className="text-xs font-bold text-slate-150 uppercase tracking-wide">Картки & Квізи</h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Тренуйте пам'ять флеш-картками та закріплюйте матеріал інтерактивними бліц-квізами.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-left">
                    <span className="text-normal block">🧩 / 💬</span>
                    <h4 className="text-xs font-bold text-slate-150 uppercase tracking-wide">Покрокові рішалки</h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Рішення задач вивчається строго крок за кроком з адаптивними підказками живого АІ-тьютора.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-850/30 border border-slate-800/80 rounded-xl max-w-md text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  <span>Оберіть ліворуч підручник, вкажіть сторінки та натисніть «Згенерувати інтерактивний урок»!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-910 border-t border-slate-800/60 py-4 text-center text-xs text-slate-500 flex-shrink-0 mt-auto">
        <p>© 2026 АІ-Методист підручників • Спеціалізовано для школярів 10-11 класів за новими програмами та держстандартами України.</p>
      </footer>

      </div> {/* Close Main Content Column wrapper with proper height mapping */}
    </div> /* Close main wrapper layout */
  );
}
