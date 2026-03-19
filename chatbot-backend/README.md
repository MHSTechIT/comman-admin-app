# Chatbot Backend (FastAPI)

Backend for the Chatbot admin module. Connects to Supabase project `mktzrhqaxxclisxckmed`.

## Setup

```bash
cd chatbot-backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

## Environment

Copy `.env.example` to `.env` and fill in your credentials.

## Run

```bash
python main.py
```

Server runs at **http://localhost:8003**

## Endpoints

- `GET /admin/documents` - List uploaded documents/links
- `POST /admin/upload` - Upload document (PDF, TXT, DOCX)
- `POST /admin/add-link` - Add reference link
- `DELETE /admin/documents/{id}` - Delete document
- `GET /admin/leads` - List enrollment leads
- `POST /admin/submit-enrollment` - Submit enrollment form
