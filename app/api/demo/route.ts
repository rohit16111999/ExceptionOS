import { NextResponse } from "next/server";
import { answer, process } from "../../../lib/workflow";
import { metrics, seed, store } from "../../../lib/memory";
import { getIntegrationStatus } from "../../../lib/integrations";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({cases:store.cases,activeCaseId:store.activeCaseId,skills:store.skills,events:store.events,metrics:metrics(),integrations:getIntegrationStatus()});}
export async function POST(req:Request){const {action}=await req.json(); if(action==="reset"){seed();return GET();} if(!store.cases.length&&action!=="answer")seed();const active=store.cases.find(item=>item.id===store.activeCaseId)||store.cases[0];if(action==="run")await process(active);if(action==="answer"&&active)await answer(active);if(action==="analogous"){let analogous=store.cases.find(item=>item.id==="case-002");if(!analogous){analogous={id:"case-002",family:"partial_shipment_cancellation",customer:"Jordan Lee",detail:"One item shipped, one awaiting fulfillment. Customer wants to cancel the order.",status:"NEW",attempts:0,humanUsed:false};}await process(analogous);}return GET();}
