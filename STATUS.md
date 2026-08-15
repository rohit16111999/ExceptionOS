implemented
- Next.js dashboard with deterministic local demo, in-memory order/case simulator, policy and learned-skill memory, agent collaboration timeline, and calculated evaluation metrics.
- LangGraph workflow implements normalize → retrieve → Resolver/Critic deliberation → escalation or execute/verify, with a human correction retry loop.

test results
- `npm test`: 5 passing tests.
- `npm run typecheck`: passing.
- `npm run build`: passing production build.

current architecture
- Single Next.js TypeScript application. `lib/workflow.ts` owns the LangGraph graph; `lib/memory.ts` provides local deterministic persistence and retrieval; the API route exposes the demo flow.

environment variables
- None required. External adapters are intentionally deferred; local DEMO mode is default.

remaining integration work
- Replace the in-memory adapter with Supabase/pgvector, and implement Band, Terac, Linq, payment, and Render adapters in LIVE mode.

known risks
- Demo state is process-local and resets on server restart; only the partial-shipment family has a learned-answer flow in this checkpoint.
