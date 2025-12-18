# Server (minimal scaffold)

This is a minimal Node/Express + SQLite scaffold intended to be run locally alongside the demo frontend.

Quick start

1. Install dependencies:

```bash
# Server (ERP demo)

This server provides a lightweight JSON-backed API for the Candy demo and can also serve the demo UI statically.

Quick start

```bash
cd server
npm install
npm run init-db   # create server/data.json seed if missing
npm start         # starts server on http://localhost:4000
```

Open the demo in your browser at:

http://localhost:4000/

Notes
- The server listens on `0.0.0.0:4000` by default so you can access it from the host machine.
- Production data is stored in `server/data.json` (simple JSON file).
- Change production capacity via API:

```bash
curl -X POST http://localhost:4000/api/settings -H 'Content-Type: application/json' -d '{"key":"production_capacity","value":3}'
```

VS Code run
- Use the integrated terminal in VS Code and run `npm start` in the `server` folder.
- Optionally add a launch configuration to run `npm start` as a task/launch in VS Code for the demo presentation.
