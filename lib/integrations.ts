import { Case, Family } from "./types";

type Status = "LIVE" | "DEMO" | "READY";
const configured = (...names: string[]) => names.every((name) => Boolean(process.env[name]));
export function getIntegrationStatus() {
  const render = (process.env.NEXT_PUBLIC_APP_URL || "").includes("onrender.com");
  const band = configured("BAND_MEMORY_AGENT_ID", "BAND_MEMORY_API_KEY", "BAND_RESOLVER_AGENT_ID", "BAND_RESOLVER_API_KEY", "BAND_CRITIC_AGENT_ID", "BAND_CRITIC_API_KEY");
  const terac = configured("TERAC_API_KEY", "TERAC_MCP_URL");
  const linq = configured("LINQ_API_KEY", "LINQ_PHONE_NUMBER", "LINQ_WEBHOOK_SECRET");
  return {
    environment: render ? "RENDER" : "LOCAL",
    band: { status: (band ? "LIVE" : "DEMO") as Status, reason: band ? "Band agent credentials configured" : "Band credentials unavailable" },
    terac: { status: (terac ? "LIVE" : "DEMO") as Status, reason: terac ? "Terac MCP credentials configured" : "Terac credentials unavailable" },
    linq: { status: (linq ? "LIVE" : "READY") as Status, reason: linq ? "Linq credentials and webhook secret configured" : "Linq webhook or credentials unavailable" },
  };
}
export const integrationStatus={band:getIntegrationStatus().band.status,terac:getIntegrationStatus().terac.status,linq:getIntegrationStatus().linq.status} as const;
export const humanQuestion=(family:Family)=>family==="partial_shipment_cancellation"?"Which unshipped item should be cancelled and refunded?":family==="replacement_refund"?"Should the dispatched replacement be returned before the refund is issued?":"How should the order-level discount be allocated to the refunded item?";
export function familyFromMessage(text:string):Family|undefined{const t=text.toLowerCase();if(t.includes("replacement"))return "replacement_refund";if(t.includes("discount")||t.includes("partial refund"))return "discounted_partial_refund";if(t.includes("cancel")||t.includes("shipment"))return "partial_shipment_cancellation";}
export async function requestHumanTask(c:Case){return {mode:integrationStatus.terac,taskId:integrationStatus.terac==="LIVE"?undefined:"demo-"+c.id,question:humanQuestion(c.family)};}
