import { PDFParse } from "pdf-parse";

async function main() {
  console.log("Instantiating...");
  const parser = new PDFParse({ data: Buffer.from([]) });
  console.log("Calling getText()...");
  try {
    const text = await parser.getText();
    console.log("getText finished! Pages:", text);
  } catch (err: any) {
    console.error("getText failed with error:", err.message || err);
  }
}

main();
