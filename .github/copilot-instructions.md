# Copilot / AI agent instructions — erp-cake-factory

Purpose
- Help AI agents be productive quickly: where core logic lives, app architecture, edit patterns, and gotchas.

Big picture
- Client-side single-page app (no backend). UI, state and data live in JS and HTML.
- Two forms of the app exist: a consolidated single-file version in the UI demo and small modular JS files under the `Candy/ js/` folder. The canonical, runnable page is `Candy/project/index.html`.

Where to look first
- Read [README.md](README.md) for project goals and high-level context.
- Open the main demo: [Candy/project/index.html](Candy/project/index.html#L1-L40) (contains full app initialization, seed data and DOM wiring).
- Module files (mirrors): [Candy/ js/app.js](Candy/ js/app.js), [Candy/ js/products.js](Candy/ js/products.js), [Candy/ js/orders.js](Candy/ js/orders.js), [Candy/ js/cart.js](Candy/ js/cart.js), [Candy/ js/inventory.js](Candy/ js/inventory.js), [Candy/ js/reports.js](Candy/ js/reports.js), [Candy/ js/suppliers.js](Candy/ js/suppliers.js), [Candy/ js/roles.js](Candy/ js/roles.js), [Candy/ js/utils.js](Candy/ js/utils.js).

Architecture & data flows (concise)
- Global in-memory state (no persistence): `PRODUCTS`, `materials`, `suppliers`, `cartItems`, `orders`, `payments`, `currentUser`.
- User actions -> update globals -> call `render*()` functions -> update DOM -> occasionally call `rebuildReports()`/`refreshSummary()`.
- Orders lifecycle: add to cart -> `createOrderFromCart()` -> added to `orders` -> `markOrderPaid()` / `updateOrderStatus()` -> `payments` updated -> reports reflect totals.
- Inventory: `addMaterialMovement()` updates `materials` and `renderMaterialsTable()`.
- Role-based UI: `ROLE_ACCESS` object + `data-access` attributes on admin `card` elements. See `applyRoleAccess()` in the code.

Project-specific conventions and patterns
- Imperative DOM manipulation (no frameworks). Look for `document.getElementById`, `querySelectorAll`, `.innerHTML` and `addEventListener` usage.
- Naming: visual renderers are `renderX()`; actions are verbs like `addSupplier`, `addToCart`, `markOrderPaid`.
- Status badges use helper `renderStatusBadge()` and `renderPaymentBadge()` (see index.html helper block).
- Role gating: set `data-access` on `.card` and rely on `ROLE_ACCESS` mapping.

Key files to edit and keep in sync
- Edit `Candy/project/index.html` when changing behavior or markup used at runtime (it's the canonical demo). After edits, mirror intentionally into `Candy/ js/` files if you want modular sources.
- If you change helper signatures (e.g., `formatMoney`, `getProductById`), update both the single-file demo and the modular JS files.

Developer workflows & debugging
- No build step: open `Candy/project/index.html` in a browser. For a simple local server use:
  - `python3 -m http.server` (run from `Candy/project/`) or `npx http-server`.
- Use browser DevTools console: global arrays (`orders`, `materials`, `PRODUCTS`, `cartItems`) are accessible for interactive testing.
- Useful runtime helpers to call in console: `seedDemoData()`, `rebuildReports()`, `refreshSummary()`.

Notable quirks & gotchas
```markdown
# Copilot / AI agent instructions — erp-cake-factory

Purpose
- Get an AI up to speed fast: where runtime logic lives, how data flows, and project quirks.

Quick snapshot
- Single-page client app. The canonical runtime is `Candy/project/index.html` (self-contained demo).
- A modular copy exists under the oddly-named `Candy/ js/` directory (note the leading space).

Start here
- Open the canonical demo: [Candy/project/index.html](Candy/project/index.html#L1-L40).
- Read the human README for domain context: [README.md](README.md).

Runtime architecture (core facts)
- All data is global, in-memory: `PRODUCTS`, `materials`, `suppliers`, `cartItems`, `orders`, `payments`, `currentUser`.
- UI is imperative DOM manipulation. Pattern: user action -> update globals -> call `render*()` -> DOM update -> optional `rebuildReports()` / `refreshSummary()`.
- Orders: add to cart -> `createOrderFromCart()` -> add to `orders` -> `markOrderPaid()` / `updateOrderStatus()` -> update `payments` and reports.

Project conventions & examples
- Canonical file: `Candy/project/index.html` — change here first for fast iteration. See `getProductById()` and `PRODUCTS` near [Candy/project/index.html#L800-L820].
- Mirrored modules: `Candy/ js/*.js` — use only to keep modular sources synchronized after editing the demo.
- Renderer/action naming: `renderX()` for UI, verbs like `addSupplier`, `addToCart`, `markOrderPaid` for actions.
- Role gating: `ROLE_ACCESS` + `data-access` attributes on `.card`; `applyRoleAccess()` applies permissions (see `[Candy/ js/roles.js](Candy/ js/roles.js#L1-L40)` and `[Candy/project/index.html#L400-L440]`).

Developer workflows
- No build step. Run the demo by serving `Candy/project/` (recommended):
  - `python3 -m http.server` (run from `Candy/project/`) or
  - `npx http-server` (run from `Candy/project/`).
- For server-side routes (if testing backend), see `server/` and run `npm start` there when applicable.
- Use DevTools console to inspect/modify runtime globals (e.g., `orders`, `materials`, `PRODUCTS`, `cartItems`). Helpful helpers: `seedDemoData()`, `rebuildReports()`, `refreshSummary()`.

Notable quirks (do not forget)
- Directory name contains a leading space: `Candy/ js/`. Use exact path when editing or running scripts.
- Duplicate logic: `Candy/project/index.html` contains a full, runnable copy of the app; many `Candy/ js/` files are mirrors. Prefer editing the canonical demo and then mirror changes intentionally.
- No persistence: runtime data resets on reload unless you call `seedDemoData()`.

Editing guidance
- Keep function signatures identical between the demo and modular files when syncing changes (e.g., `formatMoney`, `getProductById`).
- Small UI tweaks: edit `Candy/project/index.html` only.
- Larger refactors: decide with maintainer whether to make `Candy/ js/` the source of truth; otherwise update both.

Testing & verification
- Manual: run the demo, exercise flows: login as `admin` -> create orders -> mark paid -> validate reports.
- Automated: server tests live under `server/tests/` (see `server/tests/run-tests.js`). Run server tests from `server/` when relevant.

When in doubt
- Ask the maintainer whether `Candy/project/index.html` or `Candy/ js/` should be treated as canonical for your change.

Examples & quick links
- Demo entry: [Candy/project/index.html](Candy/project/index.html#L1-L40)
- Cart logic (render + events): [Candy/ js/cart.js](Candy/ js/cart.js#L1-L120)
- Roles: [Candy/ js/roles.js](Candy/ js/roles.js#L1-L40)

---
If you want, I can expand examples (small code snippets) for common edits like adding a product, creating an order, or syncing changes into `Candy/ js/`.

```
