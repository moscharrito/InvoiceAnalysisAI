# AI Invoice Intelligence App (Azure OCR + Next.js)

This project is a full-stack invoice document analysis tool powered by **Azure Form Recognizer** (OCR). It's designed to showcase how AI can be used to extract structured data (like invoice totals, vendor name, line items, etc.) from unstructured PDF/PNG documents.

---

## Live Demo
[ View Deployed App Here](https://invoice-analysis-ai.vercel.app/)
---

## Tech Stack
- **Frontend:** Next.js 15+, TypeScript, TailwindCSS, Zustand
- **Backend:** Node.js (Express), Azure SDK
- **AI/OCR:** Azure Form Recognizer (Document Intelligence)
- **Storage (Optional):** PostgreSQL, Drizzle ORM
- **Deployment:** Replit or Vercel

---

## Setup Instructions

### 1. Clone the Repo
```bash
git clone https://github.com/moscharrito/InvoiceAnalysisAI.git
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Azure Form Recognizer
- Go to Azure Portal → Create "Form Recognizer" resource
- Note the **Endpoint** and **API Key**
- Add them to your `.env.local`:
```env
AZURE_FORM_RECOGNIZER_ENDPOINT=https://<your-region>.api.cognitive.microsoft.com/
AZURE_FORM_RECOGNIZER_KEY=<your-api-key>
```

### 4. Start Dev Server
```bash
npm run dev
```

---

## Features
- Upload PDF or image invoice
- Sends document to Azure Form Recognizer
- Extracts:
  - Vendor name
  - Invoice number
  - Invoice date
  - Total amount
  - Line items (description, quantity, price)
- Displays data in clean Tailwind UI
- Option to download or copy extracted data

---

## Azure Integration Sample (Node.js Backend)
```ts
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";

const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
const key = process.env.AZURE_FORM_RECOGNIZER_KEY;

const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));

async function analyzeInvoice(fileBuffer: Buffer) {
  const poller = await client.beginAnalyzeDocument("prebuilt-invoice", fileBuffer);
  const { documents } = await poller.pollUntilDone();

  return documents[0]; // return structured invoice data
}
```

---

## Future Features
- [ ] Save documents to PostgreSQL
- [ ] Build a summary dashboard with D3.js/Recharts
- [ ] Add multi-page invoice support
- [ ] Role-based authentication (NextAuth.js)

---

## Contributing
Pull requests are welcome! For major changes, please open an issue first.

---

## Contact
Made with ❤️ by Moshood Bolaji Salaudeen. [LinkedIn](https://linkedin.com/in/moshood-bolaji-salaudeen)

---

## 📜 License
MIT
