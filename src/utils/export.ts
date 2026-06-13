import { GeneratedLesson, Textbook } from "../types";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType
} from "docx";

/**
 * Clean strings of weird characters and trim spaces
 */
const cleanText = (text: string): string => {
  if (!text) return "";
  return text.trim();
};

/**
 * Builds a highly polished *.docx binary container matching OpenXML specification.
 * This files are 100% natively supported by Apple Pages, Microsoft Word, Google Docs, etc.
 */
export function exportToWord(lesson: GeneratedLesson, book: Textbook) {
  const filename = `AI_Methodologist_${lesson.themeTitle.replace(/[^a-zA-Z0-9а-яА-ЯёЁіІїЇєЄґҐ\s-_]/g, "").substring(0, 40)}.docx`;

  const children: any[] = [];

  // 1. HEADER LOGO & TITLE
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "ОСВІТНІЙ КОНСПЕКТ ШІ-МЕТОДИСТА",
          bold: true,
          size: 18, // 9pt
          color: "0ea5e9",
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: lesson.themeTitle,
          bold: true,
          size: 40, // 20pt
          color: "0f172a",
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Адаптивний матеріал за підручником «${book.title}» (${book.subject}, ${book.grade} клас)`,
          italics: true,
          size: 22, // 11pt
          color: "475569",
        })
      ]
    })
  );

  // Divider Table to look like a separator line
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [],
              shading: { fill: "0ea5e9" },
            })
          ]
        })
      ]
    }),
    new Paragraph({ spacing: { before: 200 } })
  );

  // 2. MISSION BRIEFING BANNER
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  spacing: { before: 120, after: 60 },
                  children: [
                    new TextRun({
                      text: "🎮 ВСТУПНИЙ КВЕСТ-ОБЗОР (MISSION BRIEFING)",
                      bold: true,
                      size: 22, // 11pt
                      color: "0891b2",
                    })
                  ]
                }),
                new Paragraph({
                  spacing: { before: 60, after: 120 },
                  children: [
                    new TextRun({
                      text: `«${lesson.missionBriefing}»`,
                      italics: true,
                      size: 24, // 12pt
                      color: "0e7490",
                    })
                  ]
                })
              ],
              shading: { fill: "ecfeff" },
            })
          ]
        })
      ]
    }),
    new Paragraph({ spacing: { before: 300, after: 100 } })
  );

  // 3. SECTION I: THEORETICAL THESES
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "📌 Розділ I. Опорні тези та асоціативні метафори",
          bold: true,
          size: 30, // 15pt
          color: "0f172a",
        })
      ]
    })
  );

  lesson.theses.forEach((thesis, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: 150, after: 60 },
        children: [
          new TextRun({
            text: `Теза ${idx + 1}: ${thesis.title}`,
            bold: true,
            size: 26, // 13pt
            color: "0284c7",
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: thesis.content,
            size: 24, // 12pt
            color: "334155",
          })
        ]
      }),
      // Metaphor card in shading
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    spacing: { before: 100, after: 100 },
                    children: [
                      new TextRun({
                        text: "💡 Асоціативна метафора: ",
                        bold: true,
                        size: 22,
                        color: "15803d",
                      }),
                      new TextRun({
                        text: thesis.metaphor,
                        italics: true,
                        size: 22,
                        color: "166534",
                      })
                    ]
                  })
                ],
                shading: { fill: "f0fdf4" },
              })
            ]
          })
        ]
      }),
      new Paragraph({ spacing: { after: 150 } })
    );
  });

  // 4. SECTION II: FLASHCARDS TABLE
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({
          text: "🗂️ Розділ II. Картки визначень та понять (Flashcards)",
          bold: true,
          size: 30, // 15pt
          color: "0f172a",
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Словник термінів для швидкого повторення та опитування:",
          italics: true,
          size: 22,
          color: "475569",
        })
      ]
    })
  );

  const cardRows = [
    // Header Row
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Термін (Лицьова сторона)",
                  bold: true,
                  size: 22,
                  color: "1e293b",
                })
              ]
            })
          ],
          shading: { fill: "f1f5f9" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Пояснення (Зворотна сторона)",
                  bold: true,
                  size: 22,
                  color: "1e293b",
                })
              ]
            })
          ],
          shading: { fill: "f1f5f9" },
        })
      ]
    }),
    // Data Rows
    ...lesson.flashcards.map((c) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: c.front,
                    bold: true,
                    size: 22,
                    color: "0f172a",
                  })
                ]
              })
            ]
          }),
          new TableCell({
            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: c.back,
                    size: 22,
                    color: "334155",
                  })
                ]
              })
            ]
          })
        ]
      });
    })
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: cardRows,
    }),
    new Paragraph({ spacing: { before: 200 } })
  );

  // 5. SECTION III: INTERACTIVE QUIZ
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({
          text: "📝 Розділ III. Експрес-тест оцінки знань (Quiz)",
          bold: true,
          size: 30, // 15pt
          color: "0f172a",
        })
      ]
    })
  );

  lesson.quiz.forEach((q, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: `Запитання ${idx + 1}: ${q.question}`,
            bold: true,
            size: 24,
            color: "1e293b",
          })
        ]
      })
    );

    q.options.forEach((opt, oIdx) => {
      const char = String.fromCharCode(65 + oIdx);
      const isCorrect = oIdx === q.correctIndex;
      children.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${char}. ${opt}`,
              size: 22,
              color: isCorrect ? "166534" : "475569",
              bold: isCorrect,
            }),
            isCorrect
              ? new TextRun({
                  text: " ✔ (Правильно)",
                  bold: true,
                  size: 20,
                  color: "15803d",
                })
              : null
          ].filter(Boolean) as TextRun[]
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    spacing: { before: 80, after: 80 },
                    children: [
                      new TextRun({
                        text: "Обґрунтування відповіді: ",
                        bold: true,
                        size: 20,
                        color: "475569",
                      }),
                      new TextRun({
                        text: q.explanation,
                        italics: true,
                        size: 20,
                        color: "475569",
                      })
                    ]
                  })
                ],
                shading: { fill: "f8fafc" },
              })
            ]
          })
        ]
      }),
      new Paragraph({ spacing: { after: 150 } })
    );
  });

  // 6. SECTION IV: STEP SOLVER
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({
          text: "➗ Розділ IV. Кроковий практичний тренінг (Step Solver)",
          bold: true,
          size: 30, // 15pt
          color: "0f172a",
        })
      ]
    })
  );

  if (lesson.stepByStepProblems && lesson.stepByStepProblems.length > 0) {
    lesson.stepByStepProblems.forEach((prob, idx) => {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [
            new TextRun({
              text: `Задача ${idx + 1}: ${prob.problem}`,
              bold: true,
              size: 26,
              color: "0f172a",
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 150 },
          children: [
            new TextRun({
              text: `👉 Базові принципи: ${prob.principles}`,
              bold: true,
              italics: true,
              size: 22,
              color: "0369a1",
            })
          ]
        })
      );

      prob.steps.forEach((step, sIdx) => {
        children.push(
          new Paragraph({
            indent: { left: 200 },
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: `Крок ${sIdx + 1}: ${step.title}`,
                bold: true,
                size: 22,
                color: "0284c7",
              })
            ]
          }),
          new Paragraph({
            indent: { left: 200 },
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: step.explanation,
                size: 22,
                color: "475569",
              })
            ]
          }),
          new Paragraph({
            indent: { left: 200 },
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: `↳ Результат кроку: `,
                bold: true,
                size: 20,
                color: "0369a1",
              }),
              new TextRun({
                text: step.result,
                bold: true,
                size: 20,
                color: "0369a1",
              })
            ]
          })
        );
      });
    });
  } else {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "Практичні аналітичні завдання відсутні у цій темі.",
            italics: true,
            size: 22,
            color: "64748b",
          })
        ]
      })
    );
  }

  // Footer metadata
  children.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 100 },
                  children: [
                    new TextRun({
                      text: `Створено цифровим інструментом «ШІ-Методист» • ${new Date().getFullYear()} © Всі права захищено.`,
                      size: 18,
                      color: "94a3b8",
                    })
                  ]
                })
              ],
              shading: { fill: "f8fafc" },
            })
          ]
        })
      ]
    })
  );

  // Construct Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      }
    ]
  });

  // Pack and Download
  Packer.toBlob(doc).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }).catch((err) => {
    console.error("Помилка генерації .docx файлу:", err);
  });
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
          line-height: 1.5;
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
