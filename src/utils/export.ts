import { GeneratedLesson, Textbook } from "../types";

/**
 * Strips HTML tags or parses back ticks/bold styling to cleaner text for document output
 */
const cleanText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Builds a highly polished Microsoft Word compatible HTML bundle.
 * Word parses this format perfectly and natively displays tables, borders, colors and spacing.
 */
export function exportToWord(lesson: GeneratedLesson, book: Textbook) {
  const filename = `AI_Methodologist_${lesson.themeTitle.replace(/[^a-zA-Z0-9а-яА-ЯёЁіІїЇєЄґҐ\s-_]/g, "").substring(0, 40)}.doc`;
  
  let thesesHtml = "";
  lesson.theses.forEach((thesis, idx) => {
    thesesHtml += `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; background-color: #ffffff; border-radius: 8px;">
        <h3 style="color: #0369a1; font-size: 15px; margin: 0 0 8px 0; font-family: sans-serif;">
          Теза #${idx + 1}: ${thesis.title}
        </h3>
        <p style="font-size: 13.5px; color: #334155; line-height: 1.6; font-family: sans-serif; margin: 0;">
          ${thesis.content}
        </p>
        <div style="margin-top: 12px; padding: 12px; background-color: #f0fdf4; border-left: 3.5px solid #10b981; border-radius: 4px;">
          <p style="font-size: 13px; color: #15803d; font-style: italic; font-family: sans-serif; margin: 0;">
            <strong>💡 Асоціативна метафора:</strong> ${thesis.metaphor}
          </p>
        </div>
      </div>
    `;
  });

  let cardsHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: sans-serif;">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
          <th style="border: 1px solid #cbd5e1; padding: 10px; font-size: 13px; text-align: left; font-weight: bold; width: 45%;">Термін / Питання (Лицьова сторона)</th>
          <th style="border: 1px solid #cbd5e1; padding: 10px; font-size: 13px; text-align: left; font-weight: bold; width: 55%;">Пояснення / Відповідь (Зворотна сторона)</th>
        </tr>
      </thead>
      <tbody>
  `;
  lesson.flashcards.forEach((card) => {
    cardsHtml += `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 12.5px; color: #0f172a; font-weight: bold; vertical-align: top;">${card.front}</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 12.5px; color: #334155; vertical-align: top;">${card.back}</td>
      </tr>
    `;
  });
  cardsHtml += `</tbody></table>`;

  let quizHtml = "";
  lesson.quiz.forEach((q, idx) => {
    let optionsHtml = "";
    q.options.forEach((opt, oIdx) => {
      const char = String.fromCharCode(65 + oIdx); // A, B, C, D
      const isCorrect = oIdx === q.correctIndex;
      optionsHtml += `
        <li style="margin-bottom: 5px; font-size: 13px; font-family: sans-serif; color: ${isCorrect ? "#166534" : "#475569"};">
          <strong>${char}.</strong> ${opt} ${isCorrect ? "<em>(Правильна відповідь)</em>" : ""}
        </li>
      `;
    });

    quizHtml += `
      <div style="margin-bottom: 25px; padding-left: 15px; border-left: 3px solid #64748b;">
        <h4 style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 0 0 10px 0; font-family: sans-serif;">
          Запитання #${idx + 1}: ${q.question}
        </h4>
        <ul style="list-style-type: none; padding-left: 0; margin-bottom: 10px;">
          ${optionsHtml}
        </ul>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; font-size: 12px; color: #475569; border-radius: 4px; font-family: sans-serif; margin-top: 8px;">
          <strong>Пояснення:</strong> ${q.explanation}
        </div>
      </div>
    `;
  });

  let solutionHtml = "";
  if (lesson.stepByStepProblems && lesson.stepByStepProblems.length > 0) {
    lesson.stepByStepProblems.forEach((prob, idx) => {
      let stepsMarkup = "";
      prob.steps.forEach((step, sIdx) => {
        stepsMarkup += `
          <div style="margin-top: 10px; padding: 12px; background-color: #f8fafc; border-left: 3px solid #38bdf8; border-radius: 4px;">
            <p style="font-size: 13px; font-weight: bold; color: #0284c7; margin: 0 0 6px 0; font-family: sans-serif;">
              Крок ${sIdx + 1}: ${step.title}
            </p>
            <p style="font-size: 12.5px; color: #475569; margin: 0 0 6px 0; font-family: sans-serif; line-height: 1.5;">
              ${step.explanation}
            </p>
            <p style="font-size: 12.5px; font-family: monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 3px; color: #0369a1; display: inline-block; margin: 0;">
              <strong>Результат кроку:</strong> ${step.result}
            </p>
          </div>
        `;
      });

      solutionHtml += `
        <div style="margin-bottom: 30px; border: 1px solid #e2e8f0; padding: 18px; background-color: #ffffff; border-radius: 8px;">
          <h4 style="font-size: 15px; font-weight: bold; color: #0f172a; margin: 0 0 8px 0; font-family: sans-serif;">
            Задача #${idx + 1}: ${prob.problem}
          </h4>
          <p style="font-size: 13.0px; color: #475569; font-style: italic; margin-bottom: 12px; font-family: sans-serif;">
            <strong>Базові принципи:</strong> ${prob.principles}
          </p>
          <div style="space-y-4">
            ${stepsMarkup}
          </div>
        </div>
      `;
    });
  } else {
    solutionHtml = "<p style='font-size: 13px; color: #64748b; font-style: italic;'>Пов'язані завдання відсутні у цьому розділі.</p>";
  }

  const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${lesson.themeTitle}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; margin: 40px; padding: 0; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
      
      <!-- HEADER BLOCK -->
      <div style="text-align: center; border-bottom: 3px solid #06b6d4; padding-bottom: 15px; margin-bottom: 30px;">
        <span style="font-size: 11px; font-weight: bold; color: #06b6d4; text-transform: uppercase; letter-spacing: 2px; font-family: Arial, sans-serif;">
          Класний Інтерактивний Матеріал ШІ
        </span>
        <h1 style="font-size: 26px; color: #0f172a; margin: 10px 0 5px 0; font-family: sans-serif; font-weight: 800;">
          ${lesson.themeTitle}
        </h1>
        <p style="font-size: 13px; color: #64748b; margin: 0; font-family: sans-serif;">
          Створено АІ-Методистом на базі підручника &laquo;<strong>${book.title}</strong>&raquo; (&nbsp;${book.subject}&nbsp;) • Клас ${book.grade}
        </p>
      </div>

      <!-- COLD COMPACT DETAIL INFORMATION -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 30px; font-family: sans-serif;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 50%; font-size: 12.5px; color: #475569; padding: 3px 0;"><strong>Навчальна дисципліна:</strong> ${book.subject}</td>
            <td style="width: 50%; font-size: 12.5px; color: #475569; padding: 3px 0; text-align: right;"><strong>Орієнтовний клас:</strong> ${book.grade} клас</td>
          </tr>
          <tr>
            <td style="width: 50%; font-size: 12.5px; color: #475569; padding: 3px 0;"><strong>Джерело:</strong> параграф/розділ підручника</td>
            <td style="width: 50%; font-size: 12.5px; color: #475569; padding: 3px 0; text-align: right;"><strong>Дата створення:</strong> ${new Date().toLocaleDateString("uk-UA")}</td>
          </tr>
        </table>
      </div>

      <!-- MISSION BRIEFING -->
      <div style="background-color: #ecfeff; border-left: 4px solid #06b6d4; padding: 18px; margin-bottom: 33px; border-radius: 4px;">
        <h2 style="font-size: 16px; font-weight: bold; color: #0891b2; margin: 0 0 8px 0; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;">
          🎮 Вступний Виклик-Місія для Учнів (Mission Briefing)
        </h2>
        <p style="font-size: 14px; font-style: italic; color: #0e7490; margin: 0; font-family: sans-serif; line-height: 1.6;">
          &ldquo;${lesson.missionBriefing}&rdquo;
        </p>
      </div>

      <!-- PART 1: THESES -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 19px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 18px; font-family: sans-serif; font-weight: 700;">
          📌 Розділ I. Опорні тези та асоціативні метафори
        </h2>
        <p style="font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 15px; font-family: sans-serif;">
          Ключові теоретичні конспекти уроку, забезпечені яскравими життєвими паралелями для миттєвого розуміння учнями:
        </p>
        ${thesesHtml}
      </div>

      <!-- PART 2: FLASHCARDS -->
      <div style="margin-bottom: 40px; page-break-before: always;">
        <h2 style="font-size: 19px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 18px; font-family: sans-serif; font-weight: 700;">
          🗂️ Розділ II. Картки термінів та понять (Flashcards)
        </h2>
        <p style="font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 15px; font-family: sans-serif;">
          Рекомендовані картки для інтерактивного закріплення, експрес-опитування або групової роботи:
        </p>
        ${cardsHtml}
      </div>

      <!-- PART 3: QUIZ -->
      <div style="margin-bottom: 40px; page-break-before: always;">
        <h2 style="font-size: 19px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 18px; font-family: sans-serif; font-weight: 700;">
          📝 Розділ III. Експрес-тест оцінки знань (Interactive Quiz)
        </h2>
        <p style="font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 15px; font-family: sans-serif;">
          Завдання закритого типу для здійснення миттєвого зрізу знань на уроці:
        </p>
        ${quizHtml}
      </div>

      <!-- PART 4: STEP-BY-STEP -->
      <div style="margin-bottom: 30px; page-break-before: always;">
        <h2 style="font-size: 19px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 18px; font-family: sans-serif; font-weight: 700;">
          ➗ Розділ IV. Кроковий практичний тренінг (Step Solver)
        </h2>
        <p style="font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 15px; font-family: sans-serif;">
          Адаптивне аналітичне розв'язання практичних викликів чи задач на підставі базових принципів теми:
        </p>
        ${solutionHtml}
      </div>

      <!-- FOOTER -->
      <div style="text-align: center; border-top: 1.5px solid #cbd5e1; padding-top: 15px; margin-top: 50px; font-family: sans-serif;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          Розроблено за допомогою цифрового інструменту «ШІ-Методист» на хмарній платформі Render.
        </p>
        <p style="font-size: 10px; color: #b4befe; margin: 4px 0 0 0;">
          &copy; ${new Date().getFullYear()} Усі навчальні матеріали генеровані динамічно в освітніх цілях.
        </p>
      </div>

    </body>
    </html>
  `;

  // Standard Blob trick for browser downloads
  const blob = new Blob(["\ufeff", docContent], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
}

/**
 * Creates an elegant print-only pop-up window configured for perfect styling and 
 * invokes the browser native PDF/Print save dialog.
 */
export function exportToPrintPDF(lesson: GeneratedLesson, book: Textbook) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Будь ласка, дозвольте спливаючі вікна для експорту в PDF/друк!");
    return;
  }

  let thesesMarkup = "";
  lesson.theses.forEach((t, i) => {
    thesesMarkup += `
      <div class="card">
        <div class="card-header">Теза #${i + 1}: ${t.title}</div>
        <p>${t.content}</p>
        <div class="metaphor">
          <strong>💡 Асоціативна метафора:</strong> ${t.metaphor}
        </div>
      </div>
    `;
  });

  let cardsMarkup = "";
  lesson.flashcards.forEach((c) => {
    cardsMarkup += `
      <tr>
        <td style="font-weight: bold; width: 40%; font-size: 12.5px;">${c.front}</td>
        <td style="color: #334155; font-size: 12.5px;">${c.back}</td>
      </tr>
    `;
  });

  let quizMarkup = "";
  lesson.quiz.forEach((q, i) => {
    let opts = "";
    q.options.forEach((opt, oIdx) => {
      const isCorrect = oIdx === q.correctIndex;
      opts += `
        <li class="${isCorrect ? 'correct' : ''}">
          <strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt} 
          ${isCorrect ? ' <span class="badge">Правильна відповідь</span>' : ''}
        </li>
      `;
    });
    quizMarkup += `
      <div class="quiz-q">
        <div class="quiz-title">Запитання #${i + 1}: ${q.question}</div>
        <ul>${opts}</ul>
        <div class="quiz-exp"><strong>Пояснення:</strong> ${q.explanation}</div>
      </div>
    `;
  });

  let solverMarkup = "";
  if (lesson.stepByStepProblems && lesson.stepByStepProblems.length > 0) {
    lesson.stepByStepProblems.forEach((p, idx) => {
      let steps = "";
      p.steps.forEach((st, sIdx) => {
        steps += `
          <div class="step-card">
            <div class="step-title">Крок ${sIdx + 1}: ${st.title}</div>
            <div class="step-body">${st.explanation}</div>
            <div class="step-result">Результат кроку: <code>${st.result}</code></div>
          </div>
        `;
      });

      solverMarkup += `
        <div class="card" style="border-left: 4px solid #0284c7;">
          <div class="card-header" style="color: #0c4a6e;">Задача #${idx + 1}: ${p.problem}</div>
          <div class="metaphor" style="background-color: #f0f9ff; border-left: 3px solid #0ea5e9; color: #0369a1; margin-bottom: 12px;">
            <strong>Базові принципи:</strong> ${p.principles}
          </div>
          ${steps}
        </div>
      `;
    });
  } else {
    solverMarkup = `<p style="font-style: italic; color: #94a3b8;">Пов'язані інтерактивні завдання наразі відсутні.</p>`;
  }

  const printDocument = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${lesson.themeTitle}</title>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          color: #1e293b;
          margin: 0;
          padding: 30px;
          background-color: #ffffff;
        }

        header {
          text-align: center;
          border-bottom: 3px solid #0ea5e9;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }

        h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 8px 0 4px 0;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .meta-container {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px 18px;
          margin-bottom: 30px;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
        }

        .mission-box {
          background-color: #ecfeff;
          border-left: 4px solid #06b6d4;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 35px;
        }

        .mission-box h2 {
          font-size: 14px;
          font-weight: 700;
          color: #0891b2;
          margin: 0 0 6px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .mission-box p {
          font-size: 13.5px;
          font-style: italic;
          color: #0e7490;
          margin: 0;
        }

        h2.section-header {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 6px;
          margin-top: 40px;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .section-desc {
          font-size: 12px;
          color: #64748b;
          font-style: italic;
          margin-bottom: 15px;
        }

        .card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          background-color: #ffffff;
          page-break-inside: avoid;
        }

        .card-header {
          font-size: 14px;
          font-weight: 700;
          color: #0284c7;
          margin-bottom: 8px;
        }

        .card p {
          font-size: 13px;
          color: #334155;
          margin: 0 0 10px 0;
        }

        .metaphor {
          font-size: 12.5px;
          background-color: #f0fdf4;
          border-left: 3px solid #10b981;
          padding: 10px;
          border-radius: 4px;
          color: #166534;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          page-break-inside: avoid;
        }

        th, td {
          border: 1px solid #cbd5e1;
          padding: 10px;
          text-align: left;
        }

        th {
          background-color: #f1f5f9;
          font-size: 12.5px;
          font-weight: 700;
        }

        .quiz-q {
          padding: 14px;
          border-left: 3px solid #64748b;
          margin-bottom: 20px;
          background-color: #f8fafc;
          border-radius: 4px;
          page-break-inside: avoid;
        }

        .quiz-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        ul {
          list-style: none;
          padding-left: 0;
          margin: 0 0 10px 0;
        }

        li {
          font-size: 13px;
          padding: 4px 8px;
          margin-bottom: 4px;
          color: #334155;
          border-radius: 4px;
        }

        li.correct {
          background-color: #f0fdf4;
          color: #166534;
          font-weight: 600;
        }

        .badge {
          font-size: 10px;
          background-color: #dcfce7;
          color: #15803d;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
          margin-left: 6px;
        }

        .quiz-exp {
          font-size: 12px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 8px;
          color: #475569;
          border-radius: 4px;
        }

        .step-card {
          margin-top: 10px;
          padding: 10px;
          background-color: #f8fafc;
          border-left: 3px solid #38bdf8;
          border-radius: 4px;
          page-break-inside: avoid;
        }

        .step-title {
          font-size: 13px;
          font-weight: 700;
          color: #0369a1;
          margin-bottom: 4px;
        }

        .step-body {
          font-size: 12.5px;
          color: #334155;
          margin-bottom: 6px;
        }

        .step-result {
          font-size: 12px;
          color: #0369a1;
        }

        code {
          font-family: monospace;
          background-color: #e0f2fe;
          padding: 2px 6px;
          border-radius: 3px;
        }

        footer {
          margin-top: 50px;
          border-top: 1px solid #cbd5e1;
          padding-top: 15px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
        }

        .no-print-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #0ea5e9;
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 30px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
          z-index: 1000;
          transition: transform 0.2s, background-color 0.2s;
        }

        .no-print-btn:hover {
          background-color: #0284c7;
          transform: translateY(-2px);
        }

        @media print {
          body {
            padding: 0;
            margin: 1.5cm;
          }
          .no-print-btn {
            display: none !important;
          }
          .card, .quiz-q, table {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <button class="no-print-btn" onclick="window.print()">🖨️ Друкувати або зберегти в PDF</button>

      <header>
        <span style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.15em;">
          Конспект адаптивного уроку / ШІ-Методист
        </span>
        <h1>${lesson.themeTitle}</h1>
        <div class="subtitle">
          За підручником &ldquo;${book.title}&rdquo; (${book.subject}) &bull; Оцінка ступеня: ${book.grade} клас
        </div>
      </header>

      <div class="meta-container">
        <div><strong>Клас:</strong> ${book.grade} • <strong>Предмет:</strong> ${book.subject}</div>
        <div><strong>Служба:</strong> АІ-Методист • <strong>Дата:</strong> ${new Date().toLocaleDateString("uk-UA")}</div>
      </div>

      <div class="mission-box">
        <h2>🎮 Місія-Профіль уроку (Вступний виклик)</h2>
        <p>&ldquo;${lesson.missionBriefing}&rdquo;</p>
      </div>

      <h2 class="section-header">📌 Розділ I. Опорні тези та асоціативні метафори</h2>
      <div class="section-desc">Ключові конспекти змісту розділу з яскравими асоціативними метафорами:</div>
      ${thesesMarkup}

      <h2 class="section-header">🗂️ Розділ II. Картки визначень та понять (Flashcards)</h2>
      <div class="section-desc">Опорний словник термінів для швидкого опитування та запам'ятовування:</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40%">Термін / Лицьова сторона</th>
            <th>Пояснення / Зворотна сторона</th>
          </tr>
        </thead>
        <tbody>
          ${cardsMarkup}
        </tbody>
      </table>

      <h2 class="section-header" style="page-break-before: always;">📝 Розділ III. Експрес-тест оцінки знань</h2>
      <div class="section-desc">Діагностичний міні-квіз для перевірки початкового засвоєння матеріалу:</div>
      ${quizMarkup}

      <h2 class="section-header" style="page-break-before: always;">➗ Розділ IV. Крокове розкриття та розв'язання</h2>
      <div class="section-desc">Приклади детальних аналітичних рішень за обраним матеріалом:</div>
      ${solverMarkup}

      <footer>
        Створено цифровим помічником «АІ-Методист» на платформі AI Studio. Доступно для вільного використання вчителями. &copy; ${new Date().getFullYear()}
      </footer>

      <script>
        // Auto launch print option on window opened
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printDocument);
  printWindow.document.close();
}
