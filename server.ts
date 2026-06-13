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

/**
 * Executes a Gemini prompt with built-in retries and automatic model failure fallback.
 * Ideal for avoiding "503 High demand" errors during high API utilization.
 */
async function callGeminiWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  },
  requestedModel: string
): Promise<{ response: any; usedModel: string }> {
  const modelsToTry = [requestedModel];
  if (requestedModel === "gemini-3.5-flash") {
    modelsToTry.push("gemini-3.1-flash-lite");
  } else if (requestedModel === "gemini-3.1-flash-lite") {
    modelsToTry.push("gemini-3.5-flash");
  } else {
    // Custom model fallback sequence
    if (!modelsToTry.includes("gemini-3.5-flash")) {
      modelsToTry.push("gemini-3.5-flash");
    }
    if (!modelsToTry.includes("gemini-3.1-flash-lite")) {
      modelsToTry.push("gemini-3.1-flash-lite");
    }
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    // Try each model up to 2 times (initial + 1 retry)
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini Resiliency Engine] Sending request to '${model}' (Attempt ${attempt}/${maxAttempts})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });

        console.log(`[Gemini Resiliency Engine] Success! Resource answered successfully using '${model}'`);
        return { response, usedModel: model };
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || JSON.stringify(err);
        console.info(`[Resiliency Engine Info] Model '${model}' is temporarily busy or rate-limited on attempt ${attempt}. Status: Handled gracefully. Message: ${errMsg}`);

        // Fast path: skip retry if it's a structural client-side error (400)
        const isClientError = errMsg.includes("400") || errMsg.includes("invalid") || errMsg.includes("schema");
        if (isClientError && attempt === 1) {
          console.log(`[Gemini Resiliency Engine] Skipping retries for '${model}' due to validation error.`);
          break;
        }

        if (attempt < maxAttempts) {
          const delay = attempt * 600;
          console.log(`[Gemini Resiliency Engine] Waiting ${delay}ms before next attempt for ${model}...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.info(`[Resiliency Engine Info] Shifting from '${model}' to the next backup model in the fallback queue...`);
  }

  throw new Error(
    `Сервіси ШІ зараз високоперевантажені. Усі спроби з підстраховочними моделями вичерпано. Останній код збою: ${lastError?.message || JSON.stringify(lastError)}`
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS middleware safely to allow GitHub Pages requests to utilize the Render server API
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (origin.indexOf("github.io") !== -1 || origin.indexOf("localhost") !== -1 || origin.indexOf("render.com") !== -1)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

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
      const parser = new PDFParse({ data: dataBuffer });
      const textResult = await parser.getText();
      const pageTexts: { [key: number]: string } = {};
      
      textResult.pages.forEach((page) => {
        pageTexts[page.num] = page.text;
      });

      res.json({
        title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
        subject: req.body.subject || "Довільний предмет",
        grade: req.body.grade || "10",
        totalPages: textResult.pages.length,
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
      const { subject, text, startPage, endPage, customModel, expertStyle } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Текст вибраних сторінок порожній" });
      }

      const ai = getAiClient();
      const modelName = customModel || "gemini-3.5-flash";

      let selectedStyle = expertStyle || "auto";

      // If "auto", detect style based on subject content
      if (selectedStyle === "auto") {
        const subject_lower = (subject || "").toLowerCase();
        const isForeignLanguage =
          subject_lower.includes("англ") || 
          subject_lower.includes("english") || 
          subject_lower.includes("німецьк") || 
          subject_lower.includes("german") || 
          subject_lower.includes("інозем") || 
          subject_lower.includes("франц") || 
          subject_lower.includes("french") ||
          subject_lower.includes("іспан") || 
          subject_lower.includes("spanish") ||
          subject_lower.includes("foreign");

        const isScience = 
          subject_lower.includes("фізик") ||
          subject_lower.includes("хім") ||
          subject_lower.includes("біол") ||
          subject_lower.includes("матем") ||
          subject_lower.includes("геогр") ||
          subject_lower.includes("астрон") ||
          subject_lower.includes("інформ") ||
          subject_lower.includes("алгебр") ||
          subject_lower.includes("геом") ||
          subject_lower.includes("physics") ||
          subject_lower.includes("math") ||
          subject_lower.includes("chem") ||
          subject_lower.includes("biology");

        const isHistory = 
          subject_lower.includes("істор") || 
          subject_lower.includes("history") ||
          subject_lower.includes("суспільств") ||
          subject_lower.includes("право");

        const isLiterature = 
          subject_lower.includes("літер") || 
          subject_lower.includes("літератур") ||
          subject_lower.includes("мов") ||
          subject_lower.includes("укр");

        if (isForeignLanguage) {
          selectedStyle = "immersive";
        } else if (isScience) {
          selectedStyle = "detective";
        } else if (isHistory) {
          selectedStyle = "thriller";
        } else if (isLiterature) {
          selectedStyle = "profiling";
        } else {
          selectedStyle = "quest";
        }
      }

      let style_instruction = "";
      let additional_methodology_guidance = "";

      if (selectedStyle === "immersive") {
        style_instruction = "Стиль: Лінгвістичний коучинг та інтерактивне занурення (Language Immersion Coach). Фокусуйся на живій розмовній практиці, корисній лексиці замість абстрактного зазубрювання та практичних життєвих сценаріях.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ ІНОЗЕМНОЇ МОВИ:
1. 'themeTitle': Має бути яскравою, часто двомовною або містити виразну ключову фразу (наприклад: "Present Perfect: Твій квиток до вільного small-talk").
2. 'missionBriefing': Змоделюй коротку інтригуючу місію або життєвий кейс у розмовному стилі (наприклад, проходження митного контролю, ведення кумедного блогу чи виживання без перекладача).
3. 'theses': Мають суворо розкривати 3 виміри володіння мовою:
   - Теза #1 (Ключовий граматичний паттерн): Простий опис конструкції чи правила з лаконічною формулою. Метафора обов'язкова.
   - Теза #2 (Живий приклад): Реальна фраза або діалог, де цей паттерн працює. Метафора обов'язкова.
   - Теза #3 (Аутентичний нюанс): Тонкощі вживання, сленг або типова помилка, якої треба уникати. Метафора обов'язкова.
4. 'flashcards': Головні слова, вирази або граматичні конструкції.
`;
      } else if (selectedStyle === "detective") {
        style_instruction = "Стиль: Науковий детектив (Scientific Detective). Фокусуйся на причинах та наслідках, експериментах та дослідженні законів природи.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ ПРИРОДНИЧИХ ТА МАТЕМАТИЧНИХ НАУК:
1. 'themeTitle': Має звучати як інтригуюча проблема або науковий парадокс (наприклад: "Чому літаки не падають: Секрет підйомної сили").
2. 'missionBriefing': Змоделюй науково-практичний кейс чи завдання для інженера/дослідника.
3. 'theses': Мають суворо розкривати складні фізико-хімічні/математичні процеси крізь призму побуту та простих метафор:
   - Теза #1 (Суть явища): Фундаментальний закон/формула/поняття. Метафора обов'язкова.
   - Теза #2 (Механізм дії): Як це працює на практиці (наприклад, чому метал розширюється при нагріванні). Метафора обов'язкова.
   - Теза #3 (Практичне застосування): Де цей закон чи метод зумовлює роботу приладів або явищ у реальному світі. Метафора обов'язкова.
4. 'flashcards': Формули або фундаментальні правила/поняття.
`;
      } else if (selectedStyle === "thriller") {
        style_instruction = "Стиль: Політичний / історичний трилер (Political / Historical Thriller). Фокусуйся на інтригах, боротьбі за владу, таємних змовах, причинах конфліктів та вирішальних суспільних виборах.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ ІСТОРІЇ ТА СУСПІЛЬНИХ НАУК:
1. 'themeTitle': Має звучати як динамічний заголовок трилера (наприклад: "Таємна гра УЦР: 4-й Універсал як геополітичний рубіж").
2. 'missionBriefing': Коротка інтригуюча місія про прогнозування ходів опонентів, розкриття таємниць чи дипломатичний виклик.
3. 'theses': Розкривай матеріал як логіку зіткнення інтересів та сил:
   - Теза #1 (Конфлікт сили): Хто і чому протистояв. Метафора обов'язкова.
   - Теза #2 (Секретний важіль): Головна подія, декрет чи компроміс, що змінили хід гри. Метафора обов'язкова.
   - Теза #3 (Уроки історії): Яку ціну заплатило суспільство та який життєвий урок лишився за кулісами. Метафора обов'язкова.
4. 'flashcards': Ключові історичні постаті, дати або поворотні концепції.
`;
      } else if (selectedStyle === "profiling") {
        style_instruction = "Стиль: Психопрофайлінг та мотиви характерів (Psychological Profiling). Фокусуйся на прихованих психологічних мотивах персонажів, авторів, індивідуальних прагненнях та аналізі душевного стану героїв.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ ГУМАНІТАРНИХ ДИСЦИПЛІН ТА ЛІТЕРАТУРИ:
1. 'themeTitle': Інтригуюча назва, що розкриває внутрішній світ твору чи автора (наприклад: "Маски героїв: Психопрофайл Кайдашевої сім'ї").
2. 'missionBriefing': Завдання проаналізувати почуття, розібратися у душевній кризі чи провести розслідування психотипу дійових осіб.
3. 'theses': Мають занурити учня у розуміння характерів:
   - Теза #1 (Внутрішнє роздоріжжя): Основна дилема або травма героя/суспільства. Метафора обов'язкова.
   - Теза #2 (Соціальний резонанс або Крок у глибину): Як конфлікт проявляється в мові чи діях. Метафора обов'язкова.
   - Теза #3 (Катарсис / Життєвий інсайт): Чому цей досвід корисний для нашого емоційного інтелекту. Метафора обов'язкова.
4. 'flashcards': Виразні цитати, символічні образи або художні деталі.
`;
      } else {
        style_instruction = "Стиль: Інтелектуальний квест і системні закономірності (Logical Quest). Фокусуйся на закономірностях, системному мисленні, логічних зв'язках та відкритті прихованих сенсів у матеріалі.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ КВЕСТ-НАВЧАННЯ:
1. 'themeTitle': Інтригуюча системна назва з глибоким сенсом.
2. 'missionBriefing': Практичне завдання-квест для розв'язання інтелектуальної загадки або побудови причинно-наслідкової карти.
3. 'theses': Мають допомогти учневі знайти прихований взаємозв'язок у матеріалі:
   - Теза #1 (Концептуальне ядро): Головна ідея розділу. Метафора обов'язкова.
   - Теза #2 (Глибинний аналіз / Системні шестерні): Чому це важливо і як це працює в ланцюжку. Метафора обов'язкова.
   - Теза #3 (Практичний висновок): Чому це знання корисне для реального життя та прийняття рішень. Метафора обов'язкова.
4. 'flashcards': Визначення, ключові поняття або терміни.
`;
      }

      const prompt = `Ти — висококласний ШІ-методолог, який створює захоплюючі плани уроків згідно з реформами сучасного навчання в Україні.
Дисципліна/Предмет: "${subject || 'Довільний предмет'}".
Цільова аудиторія: учні 10-11 класів.

${style_instruction}
${additional_methodology_guidance}

Будуй відповідь на основі наступного тексту параграфа або розділу підручника.
Зверни особливу увагу на головні визначення, формули, історичні чи літературні аспекти, або лінгвістичні нюанси (якщо сумісно з предметом).

--- ДЖЕРЕЛО ТЕКСТУ ЗІ СТОРІНОК ${startPage}-${endPage} ---
${text}

---
Сформуй відповідь СУВОРО у форматі JSON з компонентами:
1. "themeTitle": Свіжа, інтригуюча назва теми уроку (коротка, яскрава).
2. "missionBriefing": Коротка, мотивуюча вступна місія (до 2-3 речень) у вказаному стилі, що захоплює увагу учня.
3. "theses": Список з точно 3 логічно пов'язаних ультра-коротких тез. Кожна має:
   - 'title': коротка, приваблива назва.
   - 'content': лаконічна, насичена теоретична суть в 2-3 реченнях.
   - 'metaphor': дуже проста, життєва метафора в 1 речення.
4. "flashcards": Список з 5 корисних карток для самоперевірки (front: термін або питання; back: коротке пояснення чи відповідь до 10-12 слів).
5. "quiz": Квіз на 4 коротких запитання для перевірки глибокого розуміння. Кожне має 'question', масив 'options' (рівно 4 коротких варіанти відповідей), 'correctIndex' (індекс від 0 до 3), та 'explanation' (коротке, ємне пояснення вибору).
6. "stepByStepProblems": Масив, що містить рівно 1 об'єкт із захоплюючим практичним завданням чи інтерактивним кейсом за матеріалом.
   Цей об'єкт має описувати 'problem' (умова), 'principles' (головні принципи/формули для вирішення в 1-2 реченнях), та 'steps' (масив кроків, де кожен крок має 'title', 'explanation' - хід думки, та 'result' - конкретний результат або висновок кроку).
`;

      const { response, usedModel } = await callGeminiWithRetryAndFallback(
        ai,
        {
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
        },
        modelName
      );

      const parsedJson = JSON.parse(response.text || "{}");
      parsedJson.usedModel = usedModel;
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

      const { response, usedModel } = await callGeminiWithRetryAndFallback(
        ai,
        {
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        },
        "gemini-3.5-flash"
      );

      res.json({ text: response.text, usedModel });

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
