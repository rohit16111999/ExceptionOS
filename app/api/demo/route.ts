import { NextResponse } from "next/server";
import { answer, process } from "../../../lib/workflow";
import { metrics, seed, store } from "../../../lib/memory";
import { getIntegrationStatus } from "../../../lib/integrations";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({cases:store.cases,skills:store.skills,events:store.events,metrics:metrics(),integrations:getIntegrationStatus()});}
export async function POST(req:Request){const {action}=await req.json(); if(action==="reset"){seed();return GET();} if(!store.cases.length)seed();const c=store.cases[action==="analogous"?1:0]; if(action==="run")await process(c); if(action==="answer")await answer(c); if(action==="analogous")await process(c);return GET();}
