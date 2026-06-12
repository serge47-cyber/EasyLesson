import express from "express";
import path from "path";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini Client safely on the server
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and UrlEncoded parsers with higher limits for large textbook assets
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // Limit PDF to 100MB safely
  });

  // REST API Endpoints
  
  // Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // PDF Text Extractor
  app.post("/api/upload", upload.single("pdf"), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Будь ласка, завантажте файл у форматі PDF" });
      }
      
      const dataBuffer = req.file.buffer;
      const pageTexts: { [key: number]: string } = {};
      
      // Instantiate modern PDFParse class from pdf-parse package (converting Buffer to Uint8Array)
      const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
      const textResult = await parser.getText();
      const numPages = textResult.total;
      
      textResult.pages.forEach((page) => {
        pageTexts[page.num] = page.text;
      });
      
      res.json({
        title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
        subject: req.body.subject || "Довільний предмет",
        grade: req.body.grade || "10",
        totalPages: numPages,
        pages: pageTexts
      });
    } catch (error: any) {
      console.error("PDF upload error:", error);
      res.status(500).json({ error: "Помилка при зчитуванні PDF: " + (error.message || error) });
    }
  });

  // AI-Methodologist generation endpoint
  app.post("/api/generate-lesson", async (req: any, res: any) => {
    try {
      const { subject, text, startPage, endPage, customModel } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Текст вибраних сторінок порожній" });
      }

      const ai = getAiClient();
      const modelName = customModel || "gemini-3.5-flash";

      let style_instruction = "Стиль: Інтелектуальний квест. Фокусуйся на закономірностях та системному мисленні.";
      const subject_lower = (subject || "").toLowerCase();
      if (subject_lower.includes("істор") || subject_lower.includes("history") || subject_lower.includes("укр") || subject_lower.includes("сусп")) {
        style_instruction = "Стиль: Політичний / історичний трилер. Додай інтриги, розкривай таємниці подій, підкреслюй приховані причини, наслідки та зіткнення інтересів.";
      } else if (subject_lower.includes("літер") || subject_lower.includes("мов") || subject_lower.includes("психол") || subject_lower.includes("культ") || subject_lower.includes("мист")) {
        style_instruction = "Стиль: Психопрофайлінг та глибокий аналіз характерів, прихованих мотивів персонажів чи авторів.";
      } else if (subject_lower.includes("фізик") || subject_lower.includes("хім") || subject_lower.includes("астрон") || subject_lower.includes("біол") || subject_lower.includes("геогр") || subject_lower.includes("наук")) {
        style_instruction = "Стиль: Науковий детектив та інженерний хакінг. Руйнуй поширені міфи, показуй практичну логіку фізичного світу, закони природи як суперсили.";
      }

      const cacheBuster = Date.now().toString();

      const prompt = `
Ти — елітний український методист середньої освіти та UI/UX дизайнер інтерактивного цифрового контенту. 
Унікальний ID запиту: ${cacheBuster}

Проаналізуй наданий оригінальний текст підручника за сторінки ${startPage}-${endPage} та перетвори його на новий високоінтерактивний, автономний, захоплюючий навчальний посібник для школяра 10-11 класу (15-17 років) українською мовою.

Предмет: ${subject || "Довільний предмет"}
Стиль викладу: ${style_instruction}

КРИТИЧНА ВИМОГА: Текст відповідей має бути максимально стислим, динамічним, без зайвої "води", довгих вступів та складних конструкцій. Пиши короткими, влучними реченнями. Це критично важливо для швидкості інтерфейсу.

--- ДЖЕРЕЛО ТЕКСТУ ЗІ СТОРІНОК ${startPage}-${endPage} ---
${text}
---------------------------------

Сформуй відповідь СУВОРО у форматі JSON з компонентами:
1. "themeTitle": Свіжа, інтригуюча назва теми уроку (коротка, яскрава).
2. "missionBriefing": Коротка, мотивуюча вступна місія (до 2-3 речень) у вказаному стилі, що захоплює увагу учня.
3. "theses": Список з точно 3 логічно пов'язаних ультра-коротких тез. Кожна має:
   - 'title': коротка, приваблива назва.
   - 'content': лаконічна, насичена теоретична суть в 2-3 реченнях.
   - 'metaphor': дуже проста, життєва метафора в 1 речення.
4. "flashcards": Список з 4 корисних карток для самоперевірки (front: термін або питання; back: коротке пояснення чи відповідь до 10-12 слів).
5. "quiz": Квіз на 3 коротких запитання для перевірки глибокого розуміння. Кожне має 'question', масив 'options' (рівно 4 коротких варіанти відповідей), 'correctIndex' (індекс від 0 до 3), та 'explanation' (коротке, ємне пояснення вибору).
6. "stepByStepProblems": Рівно 1 захоплююче практичне завдання чи інтерактивний кейс за матеріалом.
   Опиши 'problem' (умова), 'principles' (головні принципи/формули для вирішення в 1-2 реченнях), та 'steps' (масив кроків, де кожен крок має 'title', 'explanation' - хід думки, та 'result' - конкретний результат або висновок кроку).
`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              themeTitle: { type: Type.STRING },
              missionBriefing: { type: Type.STRING },
              theses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    metaphor: { type: Type.STRING }
                  },
                  required: ["title", "content", "metaphor"]
                }
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING }
                  },
                  required: ["front", "back"]
                }
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["question", "options", "correctIndex", "explanation"]
                }
              },
              stepByStepProblems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    problem: { type: Type.STRING },
                    principles: { type: Type.STRING },
                    steps: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                          result: { type: Type.STRING }
                        },
                        required: ["title", "explanation", "result"]
                      }
                    }
                  },
                  required: ["problem", "principles", "steps"]
                }
              }
            },
            required: ["themeTitle", "missionBriefing", "theses", "flashcards", "quiz", "stepByStepProblems"]
          }
        }
      });

      const parsedJson = JSON.parse(response.text || "{}");
      res.json(parsedJson);

    } catch (error: any) {
      console.error("AI Generation error:", error);
      res.status(500).json({ error: "Помилка ШІ-генерації: " + (error.message || error) });
    }
  });

  // Adaptive Tutor Chat endpoint
  app.post("/api/tutor-chat", async (req: any, res: any) => {
    try {
      const { pageText, messages, userMessage, subject } = req.body;
      if (!userMessage) {
        return res.status(400).json({ error: "Повідомлення порожнє" });
      }

      const ai = getAiClient();

      const systemInstruction = `Ти — розумний ШІ-тьютор для українських учнів 10-11 класів середньої школи (тобі 16-річний друг та мудрий наставник).
Предмет, що вивчається: "${subject || "Дозволений шкільний предмет"}".
Твоя мета: допомагати учневі освоювати складний матеріал та розв'язувати завдання, задачі, формули чи приклади та розуміти складні концепції.

КРИТИЧНО ВАЖЛИВЕ ПРАВИЛО:
- НІКОЛИ не давай фінальну відповідь або повне готове розв'язання відразу!
- Завжди веди діалог адаптивно: спочатку дай акуратну підказку (hint), пояснюй фундаментальні принципи, які лежать в основі задачі.
- Спонукай дитину до самостійного мислення. Став навідні запитання (наприклад: "А за якою формулою ми можемо знайти силу струму, якщо відома напруга?", "Який закон термодинаміки тут працює?").
- Якщо учень наполегливо просить розв'язати за нього: м'яко відмов та запропонуй зробити перший крок разом. Пояснюй хід думок.
- Спілкуйся гарною, живою українською мовою, підбадьорюй дитину ("Молодець!", "Майже!", "Чудова спроба!", "Не хвилюйся, це дійсно крута задача, розберімося разом!").
- Складність має строго відповідати рівню 10-11 класу.

Текст сторінок підручника, який учень зараз розглядає як джерело знань:
-------------------
${pageText || "Текст сторінок підручника недоступний."}
-------------------
`;

      const contents: any[] = [];
      
      // Map user histories safely to compatible parts
      if (messages && messages.length > 0) {
        messages.forEach((m: any) => {
          contents.push({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }]
          });
        });
      }
      
      // Push modern user message
      contents.push({
        role: "user",
        parts: [{ text: userMessage }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });

    } catch (error: any) {
      console.error("AI Tutor Chat error:", error);
      res.status(500).json({ error: "Помилка Тьютора: " + (error.message || error) });
    }
  });

  // Global Express Error Handling Middleware (Catches Multer size limits or other issues)
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global express error handler:", err);
    
    // Customize Multer-specific error codes
    let status = err.status || 500;
    let errorMessage = err.message || "Внутрішня помилка сервера при обробці запиту";
    
    if (err.code === "LIMIT_FILE_SIZE") {
      status = 413;
      errorMessage = "Файл занадто великий. Максимальний дозволений розмір файлу — 100 МБ.";
    }

    res.status(status).json({
      error: errorMessage
    });
  });

  // Serve Frontend Assets using Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Methodologist Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Failed to start server", e);
});
