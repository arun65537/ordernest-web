# OrderNest Web

Production-ready React frontend for OrderNest using Vite, Tailwind CSS, React Router v6, and Axios.

## Tech stack

- React + Vite
- Tailwind CSS
- React Router v6
- Axios
- Vite environment variables (`.env`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
# edit .env directly
```

Update `.env` as needed:

```env
VITE_API_GATEWAY_BASE_URL=https://ordernest-api-gateway.onrender.com/
```

3. Start the dev server:

```bash
npm run dev
```

App runs by default at `http://localhost:5173`.

## Available scripts

- `npm run dev` - start development server
- `npm run build` - create production build in `dist`
- `npm run preview` - preview production build locally

## Routing and auth flow

- `/` landing page with Login and Register actions
- `/login` authenticates user and stores JWT in `localStorage` key `token`
- `/register` creates user and redirects to login
- `/products` protected route; fetches inventory and redirects to `/login` if token is missing
- `/dashboard` protected route alias that redirects to `/products`
- Logout clears token and redirects to `/`

## API integration

All Axios instances (`src/api/*.js`) use the API gateway base URL:

```js
baseURL: import.meta.env.VITE_API_GATEWAY_BASE_URL
```

Endpoints used:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/products`

## Deployment

GitHub Actions workflow: `.github/workflows/deploy.yml`

On every push to `master`:

1. Installs dependencies
2. Runs production build
3. Verifies `RENDER_DEPLOY_HOOK_URL` secret exists
4. Triggers Render deploy hook

Render static site settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Redirects/Rewrites:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`
- Environment variables:
  - `VITE_API_GATEWAY_BASE_URL=https://ordernest-api-gateway.onrender.com/`

# ordernest-web


