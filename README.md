# AI Invoice Intelligence App (Azure OCR + Next.js)

This project is a full-stack invoice document analysis tool powered by **Azure Form Recognizer** (OCR). It's designed to showcase how AI can be used to extract structured data (like invoice totals, vendor name, line items, etc.) from unstructured PDF/PNG documents.

---

## Project Structure

```
InvoiceAnalysisAI/
├── Frontend/                 # Next.js React application
│   ├── components/          # React UI components
│   ├── pages/               # Next.js pages
│   ├── services/            # API service layer
│   ├── styles/              # CSS and Tailwind styles
│   ├── utils/               # Utility functions
│   └── public/              # Static assets
├── Backend/                  # Express.js API server
│   └── src/
│       ├── routes/          # API route handlers
│       ├── services/        # Business logic (Azure OCR)
│       └── middleware/      # Express middleware
└── package.json             # Root monorepo configuration
```

---

## Live Demo
[View Deployed App Here](https://invoice-analysis-ai.vercel.app/)

---

## Tech Stack

### Frontend
- Next.js 15+
- React 18
- TypeScript
- TailwindCSS
- Axios

### Backend
- Node.js
- Express.js
- TypeScript
- Multer (file uploads)
- Azure Form Recognizer SDK

---

## Setup Instructions

### 1. Clone the Repo
```bash
git clone https://github.com/moscharrito/InvoiceAnalysisAI.git
cd InvoiceAnalysisAI
```

### 2. Install Dependencies
```bash
npm install
```
This will install dependencies for both Frontend and Backend workspaces.

### 3. Setup Environment Variables

**Backend (.env)**
```bash
cd Backend
cp .env.example .env
```
Edit `Backend/.env`:
```env
AZURE_ENDPOINT=https://<your-region>.api.cognitive.microsoft.com/
AZURE_KEY=<your-api-key>
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)**
```bash
cd Frontend
cp .env.example .env
```
Edit `Frontend/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start Development Servers

**Run both Frontend and Backend concurrently:**
```bash
npm run dev
```

**Or run separately:**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Features
- Upload PDF or image invoice
- Sends document to Azure Form Recognizer via Backend API
- Extracts:
  - Vendor name
  - Invoice number
  - Invoice date
  - Total amount
  - Line items (description, quantity, price)
- Displays data in clean Tailwind UI
- Option to download or copy extracted data as JSON

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/invoice/status` | Check Azure configuration status |
| POST | `/api/invoice/analyze` | Analyze uploaded invoice |

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
Made by Moshood Bolaji Salaudeen. [LinkedIn](https://linkedin.com/in/moshood-bolaji-salaudeen)

---

## License
MIT
