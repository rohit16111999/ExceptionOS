import { NextResponse } from "next/server";
import { answer, process } from "../../../../lib/workflow";
import { familyFromMessage } from "../../../../lib/integrations";
import { store } from "../../../../lib/memory";

type LinqBody = Record<string, any>;

function messageText(body: LinqBody) {
  const parts = body.data?.parts;
  if (Array.isArray(parts)) {
    const joined = parts.map((part) => part?.text || part?.value || "").filter(Boolean).join(" ");
    if (joined) return joined;
  }
  return String(body.text || body.message || body.data?.text || body.data?.message?.text || "");
}

export async function POST(request: Request) {
  try {
    const body: LinqBody = await request.json();
    const eventId = String(body.event_id || body.id || "");
    const caseId = `linq-${eventId || crypto.randomUUID()}`;
    if (eventId && store.cases.some((item) => item.id === caseId)) return NextResponse.json({ ok: true, deduplicated: true });

    const text = messageText(body);
    const pending = store.cases.find((item) => item.status === "HUMAN_REQUIRED");
    if (pending && text) {
      await answer(pending);
      return NextResponse.json({ ok: true, caseId: pending.id, resumed: true });
    }

    const family = familyFromMessage(text);
    if (!family) return NextResponse.json({ ok: false, error: "Unsupported exception family" }, { status: 422 });
    const sender = String(body.from || body.data?.sender_handle?.handle || body.data?.sender || "Linq customer");
    const exceptionCase = { id: caseId, family, customer: sender, detail: text, status: "NEW" as const, attempts: 0, humanUsed: false };
    await process(exceptionCase);
    return NextResponse.json({ ok: true, caseId: exceptionCase.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 });
  }
}
