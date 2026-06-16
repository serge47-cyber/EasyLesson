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
 * Clears any remaining LaTeX formatting and strips out dollar signs ($) in formulas
 * to make sure they are printed using only clear mathematical unicode characters.
 */
function cleanFormulaSymbols(txt: string): string {
  if (!txt) return txt;
  return txt
    .replace(/\\cdot/g, " · ")
    .replace(/\\times/g, " · ")
    .replace(/\\div/g, " / ")
    .replace(/\\frac\s*\{\s*([^}]+)\s*\}\s*\{\s*([^}]+)\s*\}/g, "($1)/($2)")
    .replace(/\$/g, ""); // Strip out all "$" characters completely
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
  // Map custom model strings to recommended Gemini series 3 models
  // gemini-3.5-flash and gemini-3.1-flash-lite are the recommended models for text tasks
  const realRequestedModel = requestedModel === "gemini-3.1-flash-lite" ? "gemini-3.1-flash-lite" : "gemini-3.5-flash";
  
  const modelsToTry = [realRequestedModel];
  if (realRequestedModel === "gemini-3.5-flash") {
    modelsToTry.push("gemini-3.1-flash-lite");
  } else {
    modelsToTry.push("gemini-3.5-flash");
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
        // Return matching the original front-end alias representation so front-end does not break
        const returnedModelName = model === "gemini-3.1-flash-lite" ? "gemini-3.1-flash-lite" : "gemini-3.5-flash";
        return { response, usedModel: returnedModelName };
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
      const ai = getAiClient();
      const modelName = customModel || "gemini-3.5-flash";

      let selectedStyle = expertStyle || "auto";

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
          subject_lower.includes("сусп") ||
          subject_lower.includes("право") ||
          subject_lower.includes("громад");

        const isLiterature = 
          subject_lower.includes("літер") || 
          subject_lower.includes("укр") || 
          subject_lower.includes("заруб") || 
          subject_lower.includes("худож") || 
          subject_lower.includes("art") || 
          subject_lower.includes("literature");

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
3. 'theses': Мають детально та динамічно (від 3 до 6 тез, залежно від багатства та обсягу матеріалу) розкривати виміри володіння мовою (граматичні паттерни, лаконічні формули, живі приклади та автентичні нюанси/типові помилки). Створи саме стільки тез, скільки потрібно, щоб повністю розкрити тему (від 3 до 6), не обмежуючись штучно цифрой 3. Кожна теза повинна розкривати один чіткий корисний аспект. Метафора є обов'язковою для кожної тези.
4. 'flashcards': Головні слова, вирази або граматичні конструкції.
`;
      } else if (selectedStyle === "detective") {
        style_instruction = "Стиль: Науковий детектив (Scientific Detective). Фокусуйся на причинах та наслідках, експериментах та дослідженні законів природи.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ ПРИРОДНИЧИХ ТА МАТЕМАТИЧНИХ НАУК:
1. 'themeTitle': Має звучати як інтригуюча проблема або науковий парадокс (наприклад: "Чому літаки не падають: Секрет підйомної сили").
2. 'missionBriefing': Змоделюй науково-практичний кейс чи завдання для інженера/дослідника.
3. 'theses': Мають детально та динамічно (від 3 до 6 тез, залежно від багатства та обсягу матеріалу) розкривати процеси або закони крізь призму побуту та простих пояснень (суть явища, механізми дії, практичне застосування та формули). Створи саме стільки тез, скільки потрібно, щоб повністю розкрити тему (від 3 до 6), не обмежуючись штучно цифрой 3. Кожна теза повинна розкривати один чіткий корисний аспект. Метафора є обов'язковою для кожної тези.
4. 'flashcards': Формули або фундаментальні правила/поняття.
`;
      } else if (selectedStyle === "thriller") {
        style_instruction = "Стиль: Политичний / історичний трилер (Political / Historical Thriller). Фокусуйся на інтригах, боротьбі за владу, таємних змовах, причинах конфліктів та вирішальних суспільних виборах.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ ІСТОРІЇ ТА СУСПІЛЬНИХ НАУК:
1. 'themeTitle': Має звучати як динамічний заголовок трилера (наприклад: "Таємна гра УЦР: 4-й Універсал як геополітичний рубіж").
2. 'missionBriefing': Коротка інтригуюча місія про прогнозування ходів опонентів, розкриття таємниць чи дипломатичний виклик.
3. 'theses': Мають детально та динамічно (від 3 до 6 тез, залежно від багатства та обсягу матеріалу) розкривати матеріал як логіку зіткнення інтересів, сил чи подій (хто і чому протистояв, секретні важелі, доленосні рішення та важливі історичні уроки). Створи саме стільки тез, скільки потрібно, щоб повністю розкрити тему (від 3 до 6), не обмежуючись штучно цифрой 3. Кожна теза повинна розкривати один чіткий корисний аспект. Метафора є обов'язковою для кожної тези.
4. 'flashcards': Історичні дати, персоналії або головні терміни.
`;
      } else if (selectedStyle === "profiling") {
        style_instruction = "Стиль: Психопрофайлінг та аналіз мотивів (Psychoprofiling). Фокусуйся на психології персонажів, мотивації авторів, прихованих підтекстах, конфліктах цінностей та аналізі художньої душі.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ ЛІТЕРАТУРИ ТА МИСТЕЦТВА:
1. 'themeTitle': Має звучати як психологічний профіль або інтригуючий аналіз (наприклад: "Психопат чи герой: Розгадка мотивів Гамлета").
2. 'missionBriefing': Коротка інтригуюча місія, що пропонує заглянути в підсвідомість героїв або розкрити задум автора.
3. 'theses': Мають детально та динамічно (від 3 до 6 тез, залежно від багатства та обсягу матеріалу) розкривати характери, символізм, художні засоби або конфлікти. Створи саме стільки тез, скільки потрібно, щоб повністю розкрити тему (від 3 до 6). Кожна теза повинна розкривати один чіткий корисний аспект. Метафора є обов'язковою для кожної тези.
4. 'flashcards': Ключові поняття, символи або характеристики персонажів.
`;
      } else {
        style_instruction = "Стиль: Інтелектуальний квест та логічна головоломка (Quest & Logic Puzzle). Фокусуйся на пошуку закономірностей, детективній логіці, квесті-розслідуванні та розв'язанні захоплюючих задач.";
        additional_methodology_guidance = `
ОСОБЛИВІ МЕТОДИЧНІ ВИМОГИ ДЛЯ ДОВІЛЬНОГО ПРЕДМЕТА:
1. 'themeTitle': Має містити елемент загадки або виклику (наприклад: "Квест-код: Розв'язання системних рівнянь").
2. 'missionBriefing': Коротка інтригуюча місія-квест для розв'язання інтелектуальної загадки або побудови причинно-наслідкової карти.
3. 'theses': Мають детально та динамічно (від 3 до 6 тез, залежно від багатства та обсягу матеріалу) допомогти учневі розкрити зв'язки в матеріалі (концептуальне ядро теми, аналіз механізмів або системних шестерень, глибинні закономірності та корисні висновки для реального життя). Створи саме стільки тез, скільки потрібно, щоб повністю розкрити тему (від 3 до 6), не обмежуючись штучно цифрой 3. Кожна теза повинна розкривати один чіткий корисний аспект. Метафора є обов'язковою для кожної тези.
4. 'flashcards': Визначення, ключові поняття або терміни.
`;
      }

      const isSinglePage = Number(startPage) === Number(endPage) && Number(startPage) > 0;
      let singlePageSolverGuidance = "";

      if (isSinglePage) {
        singlePageSolverGuidance = `
=== СПЕЦІАЛЬНИЙ СУПЕР-РЕЖИМ: «Розв'язувач завдань сторінки» ===
Увага! Користувач вибрав розбір всього ОДНІЄЇ конкретної сторінки ${startPage}. Це прямий сигнал того, що на цій сторінці знаходяться нумеровані завдання, вправи, запитання чи домашня робота:
1. Обов'язково уважно проскануй надану сторінку на наявність будь-яких нумерованих питань (наприклад, "1.", "2."), вправ, задач чи запитань для перевірки матеріалу.
2. Виокреми КОЖНЕ таке запитання/задачу і детально розпиши його розв'язання у масиві 'stepByStepProblems'. 
3. Замість загальних змодельованих або сторонніх прикладів, масив 'stepByStepProblems' повинен містити СУВОРО знайдені на цій конкретній сторінці запитання чи індивідуальні завдання! Якщо на сторінці є кілька завдань (наприклад, 4 або 5 вправ), згенеруй відповідні детальні об'єкти для КОЖНОГО з них у масиві 'stepByStepProblems' (дозволяється генерація від 1 до 6 об'єктів/завдань у цьому режимі!).
4. Для кожного завдання в 'problem' запиши його точну умову чи текст виразного нумерованого питання з підручника.
5. У 'principles' лаконічно опиши базове теоретичне правило чи закон, який є ключем до відповіді.
6. У 'steps' розпиши покроковий детальний алгоритм або хід думки до отримання фінального результату/відповіді.
7. Якщо на цій сторінці взагалі немає жодних вправ чи питань, то спроектуй 2-3 розумні, глибокі прикладні завдання чи аналітичні питання за змістом цієї сторінки та розпиши їх детальні розв'язки.
8. Назву теми 'themeTitle' обов'язково сформулюй у форматі: "Практикум: [назва теми] (стор. ${startPage})".
`;
      }

      const prompt = `Ти — висококласний ШІ-методолог, який створює захоплюючі плани уроків згідно з реформами сучасного навчання в Україні.
Дисципліна/Предмет: "${subject || 'Довільний предмет'}".
Цільова аудиторія: учні 10-11 класів.

${style_instruction}
${additional_methodology_guidance}
${singlePageSolverGuidance}

Будуй відповідь на основі наступного тексту параграфа або розділу підручника.
Зверни особливу увагу на головні визначення, формули, історичні чи літературні аспекти, або лінгвістичні нюанси (якщо сумісно з предметом).

--- ДЖЕРЕЛО ТЕКСТУ ЗІ СТОРІНОК ${startPage}-${endPage} ---
${text}

---
Сформуй відповідь СУВОРО у форматі JSON з компонентами:
1. "themeTitle": Свіжа, інтригуюча назва теми уроку (коротка, яскрава). Якщо ввімкнено супер-режим розв'язувача сторінки, суворо дотримуйся його правила іменування.
2. "missionBriefing": Коротка, мотивуюча вступна місія (до 2-3 речень) у вказаному стилі, що захоплює увагу учня.
3. "theses": Список із необхідної кількості (від 3 до 6) логічно пов'язаних тез, щоб повністю розкрити тему для повноти її засвоєння. Кожна теза має:
   - 'title': коротка, приваблива назва.
   - 'content': лаконічна, насичена теоретична суть в 2-3 реченнях.
   - 'metaphor': дуже проста, життєва метафора в 1 речення.
4. "flashcards": Список з 5 корисних карток для самоперевірки (front: термін або питання; back: коротке пояснення чи відповідь до 10-12 слів).
5. "quiz": Квіз на 4 коротких запитання для перевірки глибокого розуміння. Кожне має 'question', масив 'options' (рівно 4 коротких варіанти відповідей), 'correctIndex' (індекс від 0 до 3), та 'explanation' (коротке, ємне пояснення вибору).
6. "stepByStepProblems": Масив, що містить від 1 до 6 об'єктів (або від 1 до 3, якщо не ввімкнено супер-режим розв'язувача сторінки) з практичними розрахунковими задачами, складними математичними чи науковими прикладами, маркованими у параграфі питаннями, або вправами для покрокового розбору. Обов'язково знайди та покроково розбери реальні вправи, приклади розв'язання, прикладні сценарії або складні концептуальні питання, що містяться в тексті підручника! Якщо в джерелі немає явних прикладів чи задач, змоделюй відповідні тематичні практичні завдання високого рівня. Кожен об'єкт у масиві має описувати 'problem' (умова конкретного завдання, прикладу чи питання), 'principles' (головні принципи, закони, корисні закономірності чи формули для вирішення в 1-2 реченнях), та 'steps' (масив кроків розв'язання, де кожен крок має 'title' - назва кроку, 'explanation' - глибокий аналіз та хід думки, та 'result' - конкретний результат або проміжний висновок цього кроку).

КРИТИЧНІ ПРАВИЛА ЧИСТОТИ ФОРМУЛ:
- КАТЕГОРИЧНО ЗАБОРОНЕНО використовувати LaTeX-символи, LaTeX-розмітку чи закривати формули в знаки долара (наприклад, жодних $P = F \\cdot v$ чи \\times або \\cdot).
- Будь-які формули та рівняння мають бути записані просто чистою мовою або звичайним текстом із класичними, зрозумілими математичними unicode-символами (наприклад: "P = F · v" або "E = m · c²", де як знак множення використовується крапка "·", як знак ділення — "/", ступінь — "²" або "³").
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

      let responseText = response.text || "{}";
      responseText = cleanFormulaSymbols(responseText);
      const parsedJson = JSON.parse(responseText);
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
Твоя мета: допомагати учневі освоювати складний матеріал та розв’язувати завдання, задачі, формули чи приклади та розуміти складні концепції.

КРИТИЧНО ВАЖЛИВЕ ПРАВИЛО:
- НІКОЛИ не давай фінальну відповідь або повне готове розв'язання відразу!
- ПРАВИЛА ЧИСТОТИ ФОРМУЛ: КАТЕГОРИЧНО ЗАБОРОНЕНО використовувати LaTeX-розмітку або знаки долара (ніколи не пиши $...$ або $$...$$, а також \\cdot чи \\times). Записуй будь-які математичні формули звичайним текстом із зрозумілими символами (наприклад: "P = F · v", де знак множення — це крапка "·", ділення — "/" або ":", ступені — "²", "³").
- Завжди веди діалог адаптивно: спочатку дай акуратну підказку (hint), пояснюй фундаментальні принципи, які лежать в основі задачі.
- Спонукай дитину до самостійного мислення. Став навідні запитання (наприклад: "А за якою формулою ми можемо знайти силу струму, якщо відома напруга?", "Який закон термодинаміки тут працює?").
- Якщо учень наполегливо просить розв'язати за нього: м'яко відмов та запропонуй зробити перший крок разом. Пояснюй хід думки.
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

      let responseText = response.text || "";
      responseText = cleanFormulaSymbols(responseText);
      res.json({ text: responseText, usedModel });

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
