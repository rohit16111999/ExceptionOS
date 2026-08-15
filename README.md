# Edgecase Labs — ExceptionOS

> Every edge case becomes automation.

ExceptionOS is an AI-powered operational exception-handling system for e-commerce teams. It turns a human correction for a new edge case into reusable procedural knowledge, so analogous future cases can resolve autonomously with an auditable decision trail.

## Architecture

Next.js + TypeScript powers the dashboard and API surface; LangGraph controls the deterministic case workflow. Band provides multi-agent collaboration, Terac MCP handles human escalation, Linq provides messaging intake and updates, and Render Workflows runs case execution.

## Three specialists

- **Memory Specialist** retrieves policies and learned skills.
- **Resolution Specialist** proposes an operational action from the available evidence.
- **Policy Critic** independently approves or blocks the proposed action.

## Golden demo

`Unknown exception → human correction → learned skill → analogous case resolves autonomously`

The deterministic dashboard demo shows the critic escalating an unsupported case, compiles the correction into a skill, retries the original case, then avoids human intervention on a distinct analogous case.

## Run locally

```bash
npm install
npm run dev
```

```bash
npm test
npm run typecheck
npm run build
```

## Live app

Render URL: `TBD`

## Hackathon sponsor integrations

- **Band** — remote multi-agent collaboration
- **Terac MCP** — human-in-the-loop escalation
- **Linq** — SMS/iMessage/RCS operational messaging
- **Render Workflows** — durable workflow execution
