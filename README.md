# TaskBoard

A full-stack Kanban task management app with Clerk authentication, Supabase persistence, and a built-in analytics dashboard. Issues can be linked to files in your local `~/Code` directory, and a Model Context Protocol (MCP) server lets Claude query your board directly.

---

## Features

- **Kanban board** — drag-and-drop issues across four columns: To Do, In Progress, In Review, Done
- **Issue management** — create, edit, and delete issues with title, description, priority, status, file references, and tags
- **File references** — autocomplete picker searches your `~/Code` directory so issues link directly to source files
- **Filtering & search** — filter by project (derived from file refs), priority, and tags; full-text search across title and description
- **Dashboard** — completion ring, status breakdown, priority distribution, tag cloud, and per-project metrics
- **Admin dashboard** — view all users, issue counts, and manage roles
- **Role-based access** — admin role stored in Clerk public metadata, enforced on both client and server
- **Email** — Resend integration for transactional email
- **MCP server** — exposes a `list_issues` tool so Claude can read your board state

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS 3 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Animations | Framer Motion |
| Icons | lucide-react |
| Auth (client) | @clerk/react |
| HTTP client | Axios |
| Backend | Express 4, TypeScript |
| Auth (server) | @clerk/express |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| Deployment | Vercel (SPA + serverless function) |
| MCP | Custom stdio MCP server |

---

## Project Structure

```
taskboard/
├── client/                     # React/Vite SPA
│   └── src/
│       ├── components/         # UI components
│       │   ├── Board.tsx        # Kanban board (dnd-kit)
│       │   ├── Column.tsx       # Status column
│       │   ├── Card.tsx         # Issue card
│       │   ├── Header.tsx       # Nav, auth buttons, page switcher
│       │   ├── FilterBar.tsx    # Search + filter controls
│       │   ├── IssueModal.tsx   # Create / edit issue form
│       │   ├── DashboardPage.tsx # Analytics view
│       │   ├── AdminDashboard.tsx
│       │   └── CheckoutModal.tsx
│       ├── hooks/
│       │   └── useAdminRole.ts  # Reads admin role from Clerk metadata
│       ├── App.tsx              # Root component, routing, state
│       ├── api.ts               # Axios client (attaches Clerk JWT)
│       ├── types.ts             # Issue, Status, Priority types
│       ├── utils.ts             # getProject() helper
│       └── main.tsx             # ClerkProvider setup
│
├── server/                     # Express API
│   └── src/
│       ├── routes/
│       │   ├── issues.ts        # CRUD + column-move for issues
│       │   ├── files.ts         # ~/Code directory search (cached)
│       │   ├── admin.ts         # User list + role management
│       │   └── email.ts         # Test email endpoint
│       ├── middleware/
│       │   └── requireAdmin.ts  # JWT claims role check
│       ├── services/
│       │   └── email.ts         # Resend email wrapper
│       ├── db.ts                # Supabase client + query helpers
│       ├── app.ts               # Express app setup
│       └── index.ts             # Server entry (port 3001)
│
├── api/
│   └── index.ts                 # Vercel serverless function entry
│
├── mcp/
│   ├── server.js                # MCP stdio server
│   └── README.md
│
├── vercel.json                  # Build + rewrite config
└── package.json                 # Root dev script (runs both servers)
```

---

## Data Model

### Issue

```typescript
interface Issue {
  id: string;           // UUID v4
  user_id: string;      // Clerk user ID
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  file_refs: string[];  // Absolute paths, e.g. ~/Code/myproject/src/foo.ts
  tags: string[];
  position: number;     // Sort order within the status column
  created_at: string;   // ISO 8601
  updated_at: string;
}
```

"Project" is derived from `file_refs`: the directory immediately under `~/Code/` in any file path becomes that issue's project name.

---

## API Reference

All routes are under `/api` and require a valid Clerk JWT in the `Authorization: Bearer <token>` header.

### Issues — `/api/issues`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List the authenticated user's issues |
| `POST` | `/` | Create an issue |
| `PATCH` | `/:id` | Update an issue |
| `DELETE` | `/:id` | Delete an issue |
| `PATCH` | `/:id/move` | Move to a new column and position |

**Create / update body fields:** `title`, `description`, `status`, `priority`, `file_refs`, `tags`

**Move body:** `{ status, position }`

### Files — `/api/files`

| Method | Path | Description |
|---|---|---|
| `GET` | `/search?q=<query>` | Search `~/Code` (max 25 results, 30s cache) |
| `POST` | `/refresh` | Invalidate the file index cache |

### Admin — `/api/admin` *(admin role required)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard` | User list with issue counts and stats |
| `PATCH` | `/users/:id/role` | Set or remove admin role — body: `{ role: 'admin' | null }` |

### Email — `/api/email`

| Method | Path | Description |
|---|---|---|
| `POST` | `/test` | Send a test email via Resend |

---

## Authentication

Authentication is handled by [Clerk](https://clerk.com).

- The React app wraps everything in `<ClerkProvider>` using `VITE_CLERK_PUBLISHABLE_KEY`.
- `api.ts` calls `getToken()` before each request and sets the `Authorization` header.
- The Express server uses `clerkMiddleware()` and `getAuth(req)` to identify users.
- Admin status lives in Clerk's `publicMetadata.role` field and is read from JWT session claims.

### Local development bypass

To call the API without a Clerk token (e.g., for scripts or Claude Code tools), set two env vars in `server/.env`:

```
LOCAL_API_KEY=your-secret-key
LOCAL_USER_ID=user_xxxx
```

Then pass `Authorization: Bearer your-secret-key`. The server will resolve the request as `LOCAL_USER_ID`.

---

## Environment Variables

### `server/.env`

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<key>

CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

RESEND_API_KEY=re_...

# Local dev bypass (optional)
LOCAL_API_KEY=harness-local-2026
LOCAL_USER_ID=user_xxxx

PORT=3001
```

### `client/.env.local`

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Running Locally

**1. Install all dependencies**

```bash
npm run install:all
```

**2. Set up environment files**

Create `server/.env` and `client/.env.local` with the values above.

**3. Start both servers**

```bash
npm run dev
```

This runs the Express server on `http://localhost:3001` and the Vite dev server on `http://localhost:5173`. Vite proxies all `/api/*` requests to `:3001`.

**4. Sign in**

Open `http://localhost:5173` and sign in with your Clerk credentials.

---

## Deployment

The app is deployed on Vercel. `vercel.json` configures the build:

```json
{
  "installCommand": "npm install && npm install --prefix server && npm install --prefix client",
  "buildCommand": "cd client && npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/((?!api).*)", "destination": "/index.html" }
  ]
}
```

- `/api/*` is routed to the serverless function at `api/index.ts`
- All other routes return `index.html` for client-side routing
- Set all server env vars in the Vercel project settings

---

## MCP Server

The `mcp/` directory contains a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes your board to AI assistants like Claude.

**Available tool:** `list_issues` — returns all issues for the configured user.

**Setup (Claude Desktop):**

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taskboard": {
      "command": "node",
      "args": ["/Users/ljodice/Code/taskboard/mcp/server.js"]
    }
  }
}
```

Restart Claude Desktop. The `list_issues` tool will appear in Claude's tool list.

**Environment:**

The MCP server reads `TASKBOARD_API_URL` (defaults to `http://localhost:3001`) and uses `LOCAL_API_KEY` / `LOCAL_USER_ID` from the server's `.env` for authentication.
