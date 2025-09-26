# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9afcdabc-8621-451d-bb0a-c88204c2c516

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9afcdabc-8621-451d-bb0a-c88204c2c516) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9afcdabc-8621-451d-bb0a-c88204c2c516) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Backend (FastAPI) Setup

This project now contains a production-ready Python backend for the school management SaaS.

- Framework: FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy
- Auth: JWT (single admin user)
- PDF: ReportLab + Matplotlib
- Calendar: FullCalendar-compatible feed
- Storage: Local file system under `storage/`

### 1) Prerequisites
- Python 3.10+ (3.11 recommended)
- PostgreSQL running locally or accessible via connection string

Create a PostgreSQL database, e.g. via psql:

```bash
psql -U postgres -h localhost -c "CREATE DATABASE edumanage;"
```

### 2) Install Python dependencies

```bash
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
# or cmd
.venv\Scripts\activate

pip install -r requirements.txt
```

### 3) Configure environment (optional)
Create a `.env` file at the project root to override defaults from `app/config.py`:

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/edumanage
JWT_SECRET=change_me
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
STORAGE_DIR=storage
```

### 4) Run the backend

```bash
uvicorn app.main:app --reload
```

- API docs: http://localhost:8000/docs
- Generated files served under: http://localhost:8000/storage

On first start, tables are created and a default admin user is bootstrapped using `ADMIN_USERNAME/ADMIN_PASSWORD`.

### 5) Authenticate

```bash
# Get a token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Use the token in subsequent requests
curl http://localhost:8000/students/ -H "Authorization: Bearer <token>"
```

### 6) Key Endpoints

- Auth
  - POST `/auth/login` (OAuth2 form: username, password)
  - POST `/auth/change-password` (JWT required)
- Students: CRUD under `/students`
- Teachers: CRUD under `/teachers`
- Groups: CRUD under `/groups`
- Courses: CRUD under `/courses`
- Exams: CRUD under `/exams` + POST `/exams/{id}/results` to upsert student scores
- Attendance: CRUD under `/attendance`
- Timetable: CRUD under `/timetable`
- Payments: CRUD under `/payments` + GET `/payments/{id}/receipt` returns a static URL for the PDF receipt
- Reports: GET `/reports/` list, POST `/reports/generate` to generate a PDF (saved in `storage/reports/`)
- Documents: POST `/documents/generate` to create a PDF (saved in `storage/documents/`)
- Events: CRUD under `/events`, and GET `/events/fullcalendar` for a FullCalendar-compatible feed

### Notes
- CORS is enabled for local dev hosts (Vite/React) in `app/main.py` using `BACKEND_CORS_ORIGINS` from `app/config.py`.
- Generated PDFs and charts are stored in `storage/receipts`, `storage/reports`, `storage/documents`.
- You can customize PDF branding and styles in `app/utils/pdf_generator.py`.
