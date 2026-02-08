# ClaimScan

ClaimScan is a property insurance claims processing application. It combines Azure Form Recognizer for invoice OCR with Azure OpenAI GPT-4o for multimodal claims analysis. Adjusters submit invoices and damage photos, and the system extracts invoice data, analyzes damage evidence, and produces a structured coverage recommendation.

## How It Works

1. A user creates a claim with policy details and cause of loss.
2. Invoices (PDF/images) are uploaded and sent through Azure Form Recognizer to extract vendor info, line items, and totals.
3. Damage photos are uploaded as supporting evidence.
4. Azure OpenAI GPT-4o receives the OCR data and damage images together, then returns a structured analysis: line-item assessments, damage severity, coverage determination, depreciation, and an adjuster narrative.
5. If the LLM is unavailable, the system falls back to rule-based analysis (flat 85% coverage, 10% depreciation, $1,000 deductible).

## Project Structure

```
InvoiceAnalysisAI/
├── Backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (Claim, ClaimInvoice, ClaimEvidence)
│   └── src/
│       ├── index.ts                # Express server entry point
│       ├── routes/
│       │   ├── claims.ts           # Claims CRUD, document upload, LLM analysis
│       │   └── invoice.ts          # Standalone invoice analysis endpoint
│       ├── services/
│       │   ├── azureOCR.ts         # Azure Form Recognizer integration and field parsing
│       │   ├── claimAnalysis.ts    # Azure OpenAI GPT-4o claims analysis
│       │   ├── claimService.ts     # Prisma database operations for claims
│       │   └── imageStorage.ts     # Evidence image storage and resizing
│       ├── middleware/             # CORS, error handling
│       └── lib/                    # Prisma client singleton
├── Frontend/
│   ├── pages/
│   │   ├── index.tsx               # Claims list and creation
│   │   └── upload.tsx              # Document upload and analysis results
│   ├── components/
│   │   ├── ClaimInput.tsx          # Claim creation form
│   │   ├── UploadForm.tsx          # Dual drop zone (invoices + evidence photos)
│   │   ├── InvoiceCard.tsx         # Extracted invoice data display
│   │   ├── AdjusterNarrative.tsx   # LLM narrative and confidence score
│   │   ├── DamageAssessmentCard.tsx# Damage severity and observations
│   │   ├── LineItemAssessment.tsx  # Per-item cost assessment table
│   │   └── DecisionTrace.tsx       # Processing pipeline visualization
│   ├── services/
│   │   └── api.ts                  # Axios API client
│   ├── types/
│   │   └── claim.ts                # TypeScript interfaces for claims and LLM results
│   └── styles/                     # Tailwind CSS
└── package.json                    # npm workspaces root
```

## Tech Stack

**Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS, Axios

**Backend:** Express.js, TypeScript, Prisma ORM, PostgreSQL, Multer
## Live Demo
[View Deployed App Here](https://invoice-analysis-frontend.vercel.app/)

**AI/ML:** Azure Form Recognizer (prebuilt-invoice model), Azure OpenAI GPT-4o

**Deployment:** Frontend on Vercel, Backend on Render

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- Azure Form Recognizer resource
- Azure OpenAI resource with a GPT-4o deployment (optional, falls back to rules)

### 1. Clone and install

```bash
git clone https://github.com/moscharrito/InvoiceAnalysisAI.git
cd InvoiceAnalysisAI
npm install
```

### 2. Configure environment variables

**Backend/.env**

```
DATABASE_URL=postgresql://user:password@host:5432/claimscan
AZURE_ENDPOINT=https://<your-region>.api.cognitive.microsoft.com/
AZURE_KEY=<form-recognizer-key>
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_KEY=<openai-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Frontend/.env**

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Initialize the database

```bash
cd Backend
npx prisma db push
```

### 4. Run

```bash
# From the root directory, runs both frontend and backend
npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:5000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/claims | Create a new claim |
| GET | /api/claims | List all claims |
| GET | /api/claims/:id | Get claim details |
| POST | /api/claims/:id/documents | Upload invoices and evidence photos, triggers LLM analysis |
| POST | /api/claims/:id/evidence | Upload evidence photos only |
| POST | /api/claims/:id/analyze | Re-run LLM analysis on existing documents |
| POST | /api/invoice/analyze | Standalone invoice OCR (no claim context) |

## License

MIT
