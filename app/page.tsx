"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Integration = { status: "LIVE" | "DEMO" | "READY"; reason: string };
type DashboardData = {
  cases: Array<{ id: string; family: string; customer: string; detail: string; status: string; humanUsed: boolean; resolution?: string; question?: string }>;
  activeCaseId?: string;
  skills: Array<{ id: string; title: string; content: string; confidence: number; source: string }>;
  events: Array<{ id: string; caseId: string; sender: string; recipient?: string; message: string; timestamp: string }>;
  metrics: { autonomousRate: number; escalationRate: number; unsupportedRate: number };
  integrations: { environment: "RENDER" | "LOCAL"; band: Integration; terac: Integration; linq: Integration };
};

const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

export default function Home() {
  const [data, setData] = useState<DashboardData>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [autoNotice, setAutoNotice] = useState("");
  const autoCaseRef = useRef("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/demo", { cache: "no-store" });
      if (!response.ok) throw new Error("Command center unavailable");
      setData(await response.json());
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load operations state");
    }
  }, []);

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 2500);
    return () => window.clearInterval(poll);
  }, [load]);

  async function run(action: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      if (!response.ok) throw new Error("Workflow action failed");
      setData(await response.json());
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workflow action failed");
    } finally {
      setBusy(false);
    }
  }

  const active = data?.cases.find((item) => item.id === data.activeCaseId) || data?.cases[0];
  const activeEvents = useMemo(() => data?.events.filter((event) => event.caseId === active?.id) || [], [data?.events, active?.id]);
  const latest = (sender: string) => activeEvents.find((event) => event.sender === sender);
  const memoryEvent = latest("Memory");
  const resolverEvent = latest("Resolver");
  const criticEvent = latest("Critic");
  const humanEvent = latest("Human");
  const skill = data?.skills[0];
  const isLinq = Boolean(active?.id.startsWith("linq-"));
  const isAnalogous = active?.id === "case-002";
  const interventionAvoided = Boolean(isAnalogous && active?.status === "RESOLVED" && !active.humanUsed);
  const criticBlocked = active?.status === "HUMAN_REQUIRED";
  const criticApproved = active?.status === "RESOLVED";
  const integration = data?.integrations;

  useEffect(() => {
    if (!active || !isLinq || active.status !== "HUMAN_REQUIRED" || autoCaseRef.current === active.id) return;
    autoCaseRef.current = active.id;
    let launched = false;
    const timer = window.setTimeout(async () => {
      launched = true;
      setAutoNotice("DEMO CORRECTION FALLBACK — Terac response payload unavailable");
      await run("answer");
      await new Promise((resolve) => window.setTimeout(resolve, 2400));
      await run("analogous");
    }, 5000);
    return () => { if (!launched) { window.clearTimeout(timer); autoCaseRef.current = ""; } };
  }, [active?.id, active?.status, isLinq]);

  const stages = [
    ["01", "INCOMING", active ? "complete" : "idle"],
    ["02", "MEMORY", memoryEvent ? "complete" : active ? "active" : "idle"],
    ["03", "RESOLUTION", resolverEvent ? "complete" : "idle"],
    ["04", "POLICY CRITIC", criticBlocked ? "blocked" : criticApproved ? "complete" : criticEvent ? "active" : "idle"],
    ["05", criticBlocked ? "HUMAN" : "EXECUTE", criticBlocked ? "blocked" : active?.status === "RESOLVED" ? "complete" : "idle"],
    ["06", "LEARNED", skill ? "complete" : "idle"],
  ];

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">E</span><span>EDGECASE LABS</span></div>
        <div className="status-strip">
          <StatusChip label={`${integration?.environment || "LOCAL"} LIVE`} live={integration?.environment === "RENDER"} />
          <StatusChip label={`BAND ${integration?.band.status || "DEMO"}`} live={integration?.band.status === "LIVE"} />
          <StatusChip label={`TERAC ${integration?.terac.status || "DEMO"}`} live={integration?.terac.status === "LIVE"} />
          <StatusChip label={`LINQ ${integration?.linq.status || "READY"}`} live={integration?.linq.status === "LIVE"} />
        </div>
      </header>

      <section className="hero-command">
        <div>
          <p className="kicker">AUTONOMOUS EXCEPTION OPERATIONS</p>
          <h1>Exception<span>OS</span></h1>
          <h2>Every edge case becomes automation.</h2>
          <p className="positioning">ExceptionOS asks a human once when AI agents hit a novel operational decision, turns that correction into reusable knowledge, and resolves analogous cases automatically.</p>
        </div>
        <div className="hero-actions">
          {stripeLink && <a className="pilot-button" href={stripeLink} target="_blank" rel="noreferrer">START EXCEPTIONOS PILOT <span>$3</span></a>}
          {stripeLink && <small>Founding Pilot · $3 one-time · Secure checkout by Stripe</small>}
          <div className="demo-controls"><button onClick={() => run("run")} disabled={busy}>RUN DEMO FALLBACK</button><button className="quiet" onClick={() => run("reset")} disabled={busy}>RESET DEMO</button></div>
        </div>
      </section>

      {error && <div className="error-banner">SYSTEM NOTICE · {error}</div>}
      {autoNotice && <div className="error-banner">{autoNotice}</div>}

      <section className={`customer-channel ${isLinq ? "live-inbound" : ""}`}>
        <div className="section-heading">
          <div><p className="kicker">LIVE CUSTOMER CHANNEL</p><h3>{isLinq ? "LIVE INBOUND · LINQ" : active ? "DEMO FALLBACK CASE" : "Waiting for customer exception…"}</h3></div>
          <span className="evidence cyan">LINQ {integration?.linq.status || "READY"}</span>
        </div>
        {active ? <div className="customer-message"><div><span className="case-id">{active.id}</span><strong>{active.customer}</strong><small>{isLinq ? maskPhone(active.customer) : formatFamily(active.family)}</small></div><blockquote>“{active.detail}”</blockquote><time>{activeEvents[activeEvents.length - 1] ? new Date(activeEvents[activeEvents.length - 1].timestamp).toLocaleTimeString() : "Ready"}</time></div> : <p className="waiting-copy">Send an exception through the Linq channel, or use the clearly labeled demo fallback for a deterministic stage run.</p>}
      </section>

      <section className="pipeline-shell">
        <div className="section-heading"><div><p className="kicker">LIVE DECISION PIPELINE</p><h3>{active ? formatFamily(active.family) : "Awaiting case"}</h3></div><span className="evidence">RENDER WORKFLOW · processException READY</span></div>
        <div className="pipeline">
          {stages.map(([number, label, state], index) => <div className={`stage ${state}`} key={label}><span>{number}</span><b>{label}</b><i>{state}</i>{index < stages.length - 1 && <em>→</em>}</div>)}
        </div>
      </section>

      <section className="agents-section">
        <div className="section-heading"><div><p className="kicker">LIVE AGENT COORDINATION · BAND</p><h3>Three specialists. One safe decision.</h3></div><span className="evidence green">BAND {integration?.band.status || "DEMO"}</span></div>
        <div className="agent-grid">
          <AgentCard role="MEMORY SPECIALIST" purpose="Search policies and learned operational skills." event={memoryEvent?.message} state={memoryEvent ? "COMPLETE" : active ? "THINKING" : "WAITING"} accent="cyan" bandStatus={integration?.band.status || "DEMO"} />
          <AgentCard role="RESOLUTION SPECIALIST" purpose="Propose the safest action from case facts and memory." event={resolverEvent?.message} state={resolverEvent ? "COMPLETE" : memoryEvent ? "THINKING" : "WAITING"} accent="violet" bandStatus={integration?.band.status || "DEMO"} />
          <AgentCard role="POLICY CRITIC" purpose="Challenge unsupported assumptions and policy violations." event={criticEvent?.message} state={criticBlocked ? "BLOCKED" : criticApproved ? "APPROVED" : criticEvent ? "THINKING" : "WAITING"} accent={criticBlocked ? "red" : criticApproved ? "green" : "amber"} verdict bandStatus={integration?.band.status || "DEMO"} />
        </div>
      </section>

      <section className="human-learning-grid">
        <article className={`human-panel ${criticBlocked ? "attention" : ""}`}>
          <div className="panel-icon">!</div><p className="kicker">HUMAN REQUIRED</p><h3>{criticBlocked ? "Novel operational edge case detected." : "No active escalation"}</h3>
          <span className="evidence amber">TERAC {integration?.terac.status || "DEMO"}</span>
          {active?.question ? <><div className="blocking-question"><small>MINIMUM BLOCKING QUESTION</small><p>{active.question}</p></div><p className="human-state">WAITING FOR HUMAN</p>{isLinq ? <><div className="auto-armed">AUTO FALLBACK ARMED · waiting 5 seconds for Terac payload</div><small className="truth-label">No paid Terac request is created by this fallback.</small></> : <><button onClick={() => run("answer")} disabled={busy}>APPLY DEMO HUMAN CORRECTION</button><small className="truth-label">DEMO FALLBACK · no Terac credits spent</small></>}</> : humanEvent ? <><div className="blocking-question received"><small>HUMAN RESPONSE RECEIVED</small><p>“{humanEvent.message}”</p></div><p className="human-state complete">CORRECTION COMPILED</p><small className="truth-label">DEMO FALLBACK RESPONSE · Terac connection remains available</small></> : <p className="panel-empty">The Policy Critic escalates only when retrieved operational knowledge is insufficient.</p>}
        </article>

        <article className={`skill-panel ${skill ? "learned" : ""}`}>
          <div className="memory-orbit">◎</div><p className="kicker">OPERATIONAL MEMORY</p><h3>{skill ? "NEW OPERATIONAL SKILL LEARNED" : "Waiting for first human correction"}</h3>
          {skill ? <><div className="skill-title"><strong>{skill.title}</strong><span>{Math.round(skill.confidence * 100)}% confidence</span></div><small>LEARNED PROCEDURE</small><p className="procedure">{skill.content}</p><div className="source-row"><span>Source</span><b>Human correction</b></div><button className="analogous-button" onClick={() => run("analogous")} disabled={busy}>RUN NEW ANALOGOUS EXCEPTION →</button></> : <p className="panel-empty">A human answer is compiled into structured, reusable procedural knowledge.</p>}
        </article>
      </section>

      {interventionAvoided && <section className="success-hero"><span>✓</span><div><p className="kicker">KNOWN EXCEPTION · POLICY CRITIC APPROVED</p><h2>HUMAN INTERVENTION AVOIDED</h2><p>Resolved autonomously for {active?.customer} using the operational skill learned from the previous human correction.</p></div><strong>0 humans</strong></section>}

      <section className="experiment">
        <div><p className="kicker">BEFORE LEARNING</p><strong>Novel case</strong><span>Human interventions: {data?.cases[0]?.humanUsed ? 1 : "Awaiting run"}</span></div>
        <em>→</em>
        <div><p className="kicker">AFTER LEARNING</p><strong>Analogous case</strong><span>Human interventions: {isAnalogous && active?.status === "RESOLVED" ? 0 : "Awaiting run"}</span></div>
        <aside><p className="kicker">CAUSAL RESULT</p><b>{interventionAvoided ? "HUMAN DEPENDENCY REDUCED" : "AWAITING EVALUATION"}</b><small>For this learned exception family</small></aside>
      </section>

      <section className="audit-section">
        <div className="section-heading"><div><p className="kicker">AUDIT TRAIL</p><h3>Live operational evidence</h3></div><span>{activeEvents.length} events</span></div>
        <div className="audit-list">{activeEvents.length ? activeEvents.slice(0, 8).map((event) => <div key={event.id}><span className={`audit-dot ${event.sender.toLowerCase()}`}></span><b>{event.sender}{event.recipient ? ` → ${event.recipient}` : ""}</b><p>{event.message}</p><time>{new Date(event.timestamp).toLocaleTimeString()}</time></div>) : <p className="waiting-copy">Workflow events will appear here with their source and timestamp.</p>}</div>
      </section>

      <footer><div><b>Edgecase Labs</b><span>ExceptionOS</span></div><p>Self-learning operations for autonomous AI companies.</p><small>support@example.com · Refund or cancellation available before service delivery.</small></footer>
    </main>
  );
}

function StatusChip({ label, live }: { label: string; live: boolean }) { return <span className={`status-chip ${live ? "is-live" : ""}`}><i></i>{label}</span>; }
function AgentCard({ role, purpose, event, state, accent, verdict, bandStatus }: { role: string; purpose: string; event?: string; state: string; accent: string; verdict?: boolean; bandStatus: string }) { return <article className={`agent-card ${accent}`}><div className="agent-head"><div className="agent-avatar">{role[0]}</div><div><p className="kicker">{role}</p><span>BAND {bandStatus}</span></div></div><p className="agent-purpose">{purpose}</p>{verdict && (state === "BLOCKED" || state === "APPROVED") ? <div className={`verdict ${state.toLowerCase()}`}>{state}</div> : <div className="agent-state">{state}</div>}<p className="agent-output">{event || "Awaiting active case context."}</p></article>; }
function formatFamily(value?: string) { return (value || "").split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" "); }
function maskPhone(value: string) { const digits = value.replace(/\D/g, ""); return digits.length >= 4 ? `Customer · •••• ${digits.slice(-4)}` : value; }
