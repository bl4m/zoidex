# Zoidex

Zoidex is a field-observation application for identifying and cataloguing plants, animals, and fungi from photographs. A user can take a picture with a device camera or upload an existing image. The backend sends the image to a vision model, stores the image in Supabase Storage, and saves the resulting observation in a database. The frontend provides the scanning experience and a searchable collection of saved observations.

## Features

- Capture a specimen with a device camera or upload an image.
- Accept JPEG, PNG, WebP, HEIC, and HEIF images up to 10 MB.
- Identify specimens with a structured response from the Groq vision API.
- Classify observations by category and rarity.
- Display toxicity guidance, facts, and an XP reward for each observation.
- Store uploaded images in a Supabase Storage bucket.
- Persist observation metadata with SQLModel.
- Browse and search saved observations in the frontend.
- Provide a local-session fallback when the API is unavailable.
- Apply rate limits to analysis and collection endpoints.

## Technology stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS through the Vite plugin
- Lucide React icons

### Backend

- Python 3.14 or newer
- FastAPI
- SQLModel
- Supabase Storage
- Groq
- SlowAPI
- `uv` for Python dependency management

## Requirements

Install the following before starting development:

- Python 3.14 or newer
- `uv`
- Node.js and npm
- A Supabase project with:
  - a PostgreSQL database
  - an `images` Storage bucket
- A Groq API key with access to the configured vision model

## Configuration

Create a `.env` file in the repository root. The file is ignored by Git and must not be committed.

```dotenv
GROQ_API_KEY=your-groq-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://user:password@host:5432/database
```

The application currently expects the `images` bucket to exist in Supabase. Because the backend requests public URLs after uploading images, configure the bucket and its access policies according to the deployment's security requirements.

## Installation

From the repository root, install the backend dependencies:

```bash
uv sync
```

Install the frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Running locally

Start the backend from the repository root:

```bash
uv run fastapi dev backend/main.py
```

The API is available at `http://127.0.0.1:8000`. FastAPI's interactive documentation is available at:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

In a second terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The Vite development server proxies `/api` requests to the backend at `http://127.0.0.1:8000`. Open the URL printed by Vite, usually `http://localhost:5173`.

## API reference

All application endpoints are prefixed with `/api/v1`.

### Health check

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "ok"
}
```

### Analyse an image

```http
POST /api/v1/analyse-image
Content-Type: multipart/form-data
```

Form fields:

- `image` (required): JPEG, PNG, WebP, HEIC, or HEIF image, no larger than 10 MB.
- `latitude` (optional): observation latitude.
- `longitude` (optional): observation longitude.

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/analyse-image \
  -F "image=@/path/to/specimen.jpg" \
  -F "latitude=51.5074" \
  -F "longitude=-0.1278"
```

The endpoint returns a persisted observation containing:

- `id`
- `species_name`
- `scientific_name`
- `category`
- `rarity`
- `toxicity_warning`
- `fun_fact`
- `xp_reward`
- `latitude`
- `longitude`
- `image_url`
- `created_at`

The endpoint is limited to five requests per minute per client address.

### List observations

```http
GET /api/v1/payloads?count=10&offset=0
```

Query parameters:

- `count`: number of records to return; constrained to 1 through 100.
- `offset`: number of records to skip; values below zero are treated as zero.

This endpoint is also limited to five requests per minute per client address.

## Project structure

```text
.
├── backend/
│   ├── main.py                 # FastAPI application and API routes
│   ├── llm.py                  # Groq image-analysis client
│   └── database/
│       ├── database.py         # Database and Supabase configuration
│       └── models.py           # SQLModel data models
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ScannerView.tsx
│   │   │   └── SpecimenResultModal.tsx
│   │   ├── main.tsx            # Application entry point
│   │   └── style.css
│   ├── package.json
│   └── vite.config.ts
├── pyproject.toml
├── uv.lock
└── README.md
```

## Development commands

From `frontend/`:

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run preview   # Preview the production build locally
```

From the repository root:

```bash
uv run fastapi dev backend/main.py
```

## Error and fallback behavior

If the API cannot be reached during a scan, the frontend keeps the uploaded image and shows an unidentified observation for the current session. This fallback is not persisted and does not perform identification. Start the backend and configure the required services to enable analysis and permanent storage.

The backend returns:

- `400` for unsupported image types.
- `413` for images larger than 10 MB.
- `502` when image analysis or persistence fails.
- `429` when a client exceeds the rate limit.

## Security and deployment notes

- Keep `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and database credentials private.
- Do not expose the Supabase service-role key in frontend code.
- Review the wildcard CORS configuration in `backend/main.py` before deploying to production.
- Review Supabase Storage policies before making uploaded images publicly accessible.
- Replace automatic table creation with a migration workflow before production deployment.

## License

No license has been specified yet. Add a license file and update this section before distributing the project.
