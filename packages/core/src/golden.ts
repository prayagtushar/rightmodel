import type { Tier } from "./types.js";

export interface GoldenCase {
  task: string;
  tier: Tier;
}

export const GOLDEN: GoldenCase[] = [
  { task: "What does HTTP 304 mean?", tier: "easy" },
  { task: "Explain what a JavaScript closure is", tier: "easy" },
  { task: "What is the difference between let and const?", tier: "easy" },
  { task: "Show me the git command to undo the last commit", tier: "easy" },
  { task: "Rename the variable temp to userCount in utils.py", tier: "easy" },
  { task: "Fix the typo in the README heading", tier: "easy" },
  { task: "What port does Postgres listen on by default?", tier: "easy" },
  { task: "What does the spread operator do in const b = { ...a }?", tier: "easy" },
  { task: "Explain the difference between == and === in JavaScript", tier: "easy" },
  { task: "How do I center a div with flexbox?", tier: "easy" },
  { task: "What is the time complexity of binary search?", tier: "easy" },
  { task: "Show the npm command to install a package as a dev dependency", tier: "easy" },
  { task: "Add a comment above the parse function explaining its input format", tier: "easy" },
  { task: "What is a pnpm workspace?", tier: "easy" },
  { task: "Explain what SELECT count(*) FROM users GROUP BY city returns", tier: "easy" },
  { task: "List the files in this repo that import lodash", tier: "easy" },
  { task: "What does the 304 Not Modified response tell the browser to do?", tier: "easy" },
  { task: "Rename the CSS class btn-primary to button-primary in styles.css", tier: "easy" },
  { task: "What is the default branch name git uses now?", tier: "easy" },
  { task: "Explain this regex: ^a.*b$", tier: "easy" },
  {
    task: "Fix the failing test in test_auth.py, it started failing after the token refactor",
    tier: "medium",
  },
  {
    task: "Add input validation to the signup endpoint so empty emails are rejected with a 400",
    tier: "medium",
  },
  {
    task: "Write a unit test for the parseDuration function covering hours, minutes and invalid input",
    tier: "medium",
  },
  {
    task: "Debug why the login page redirects to home even when the password is wrong",
    tier: "medium",
  },
  {
    task: "Add a verbose flag to the CLI that prints each processed file to stderr",
    tier: "medium",
  },
  { task: "Convert the fetchUser callback function in api.js to async await", tier: "medium" },
  {
    task: "Fix this crash:\nTraceback (most recent call last):\n  File app.py, line 12, in handler\nKeyError: 'user_id'",
    tier: "medium",
  },
  {
    task: "Update the Dockerfile so the build uses node 20 and caches the npm install layer",
    tier: "medium",
  },
  {
    task: "Add pagination to the GET /orders endpoint, 20 items per page with a next cursor",
    tier: "medium",
  },
  { task: "Write a SQL migration that adds an index on orders.created_at", tier: "medium" },
  {
    task: "The date picker shows the wrong month for UTC+5:30 users, find the off-by-one and fix it",
    tier: "medium",
  },
  {
    task: "Add error handling to fetchUser so network failures show a toast instead of a blank page",
    tier: "medium",
  },
  {
    task: "Extract the duplicated validation logic in signup.ts and login.ts into a shared helper",
    tier: "medium",
  },
  {
    task: "Add a loading spinner to the dashboard while the metrics request is in flight",
    tier: "medium",
  },
  {
    task: "Write a script that recursively renames all .jpeg files to .jpg under a folder",
    tier: "medium",
  },
  { task: "Mock the S3 client in upload.test.ts so the test suite runs offline", tier: "medium" },
  { task: "Add keyboard arrow navigation to the dropdown component in Select.tsx", tier: "medium" },
  { task: "Cache the results of getExchangeRates in memory for ten minutes", tier: "medium" },
  {
    task: "Add a health check endpoint that reports database connectivity and uptime",
    tier: "medium",
  },
  { task: "Fix the flaky retry test by replacing the sleep with a fake timer", tier: "medium" },
  {
    task: "Refactor the payment module in src/pay.ts, src/stripe.ts and src/checkout.ts to support multiple providers, keep the public API backward compatible, then update the tests",
    tier: "hard",
  },
  {
    task: "Migrate the app from Express to Fastify, update every middleware, then make sure all forty tests still pass",
    tier: "hard",
  },
  {
    task: "Design and implement rate limiting across all public endpoints using Redis, with per-user and per-IP limits and integration tests",
    tier: "hard",
  },
  {
    task: "Rewrite the sync engine so conflicts resolve with last-writer-wins, then add tests for concurrent edits from three clients",
    tier: "hard",
  },
  {
    task: "Implement optimistic UI updates for the todo list: 1. update the local store 2. sync to the server 3. roll back on failure with a toast",
    tier: "hard",
  },
  {
    task: "Architect a plugin system so third parties can add custom exporters without touching core, then port the CSV exporter to it",
    tier: "hard",
  },
  {
    task: "Migrate the database from MongoDB to Postgres: write the schema, the data migration script, and update all queries in src/models/user.ts and src/models/order.ts",
    tier: "hard",
  },
  {
    task: "The dashboard takes eight seconds to load. Profile it, fix the N+1 queries in src/api/metrics.ts, then add caching and show before and after timings",
    tier: "hard",
  },
  {
    task: "Integrate SSO with both Google and Okta, then add role mapping from SAML attributes to our permission system",
    tier: "hard",
  },
  {
    task: "Rewrite the file watcher to use debounced batching, then update src/indexer.ts and src/queue.ts to consume batches instead of single events",
    tier: "hard",
  },
  {
    task: "Redesign the error handling strategy across the API layer: typed errors, a global handler, consistent status codes, then migrate all routes in src/routes/",
    tier: "hard",
  },
  {
    task: "Implement offline mode: persist mutations to IndexedDB, replay them on reconnect, then handle conflicts and add tests for the replay ordering",
    tier: "hard",
  },
  {
    task: "Optimize the image pipeline in src/images/resize.ts and src/images/upload.ts: stream instead of buffering, add backpressure, then measure memory before and after",
    tier: "hard",
  },
  {
    task: "Rewrite the search feature to use Postgres full text search, migrate the existing filters, then benchmark it against the current LIKE queries",
    tier: "hard",
  },
  {
    task: "Implement a job queue with retries and exponential backoff, then move the email sender and the report generator in src/jobs/ onto it",
    tier: "hard",
  },
  {
    task: "Refactor the state management from prop drilling to a store, update Header.tsx, Sidebar.tsx and Cart.tsx, then remove the dead context providers",
    tier: "hard",
  },
  {
    task: "Design a versioned public API: add /v1 prefixes, deprecation headers, then write the migration guide and update the client SDK in packages/sdk/",
    tier: "hard",
  },
  {
    task: "Integrate Stripe webhooks end to end: signature verification, idempotent handlers, retries, then add contract tests with recorded payloads",
    tier: "hard",
  },
  {
    task: "Implement multi-tenancy: add tenant_id to the schema, scope every query in src/db/, then write tests proving cross-tenant isolation",
    tier: "hard",
  },
  {
    task: "Overhaul the build: migrate from webpack to vite, fix the env handling, then get the bundle under 300kb and document what moved",
    tier: "hard",
  },
];
