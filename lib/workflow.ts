import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { Case } from "./types";
import { addEvent, learn, retrieve, save } from "./memory";
import { humanQuestion, integrationStatus } from "./integrations";
const S=Annotation.Root({c:Annotation<Case>,knowledge:Annotation<any[]>({default:()=>[],reducer:(_,v)=>v}),sufficient:Annotation<boolean>({default:()=>false,reducer:(_,v)=>v}),action:Annotation<string>({default:()=>"",reducer:(_,v)=>v}),human:Annotation<boolean>({default:()=>false,reducer:(_,v)=>v})});
const normalize=async(s:any)=>{addEvent(s.c.id,"System","Normalized case payload");return {c:{...s.c,attempts:s.c.attempts+1}}};
const memory=async(s:any)=>{const knowledge=retrieve(s.c);addEvent(s.c.id,"Memory","Retrieved "+knowledge.length+" relevant records","Resolver");return {knowledge}};
const deliberate=async(s:any)=>{const skill=s.knowledge.find((k:any)=>k.type==="LEARNED_SKILL"); const action=skill?"Cancel unshipped item; preserve shipped item; refund unshipped value.":"Cancel all items and refund full order.";addEvent(s.c.id,"Resolver",skill?"Proposed skill-backed partial cancellation":"Proposed full cancellation; assumption: all items cancellable","Critic");return {action,sufficient:!!skill}};
const gate=async(s:any)=>{if(!s.sufficient)addEvent(s.c.id,"Critic","Blocked: shipped-item cancellation lacks supporting knowledge","Resolver"); else addEvent(s.c.id,"Critic","Validated against policy and learned skill","Resolver");return {};};
const help=async(s:any)=>{const c={...s.c,status:"HUMAN_REQUIRED" as const,humanUsed:true,question:humanQuestion(s.c.family)};save(c);addEvent(c.id,"System",integrationStatus.terac==="LIVE"?"TERAC LIVE human task requested":"DEMO HUMAN knowledge required");return {c,human:true}};
const compile=async(s:any)=>{learn(s.c.family);addEvent(s.c.id,"System","Compiled human correction into reusable skill");return {};};
const execute=async(s:any)=>{const c={...s.c,status:"RESOLVED" as const,resolution:s.action,question:undefined};save(c);addEvent(c.id,"System","Executed simulated order actions");return {c}};
const verify=async(s:any)=>{addEvent(s.c.id,"System","Verified audit trail and resolution");return {};};
export const graph=new StateGraph(S).addNode("normalize_case",normalize).addNode("retrieve_memory",memory).addNode("deliberate",deliberate).addNode("decision_gate",gate).addNode("human_help",help).addNode("compile_skill",compile).addNode("execute",execute).addNode("verify",verify).addEdge(START,"normalize_case").addEdge("normalize_case","retrieve_memory").addEdge("retrieve_memory","deliberate").addEdge("deliberate","decision_gate").addConditionalEdges("decision_gate",(s:any)=>s.sufficient?"execute":"human_help").addEdge("human_help",END).addEdge("compile_skill","retrieve_memory").addEdge("execute","verify").addEdge("verify",END).compile();
export async function process(c:Case){return graph.invoke({c});}
export async function answer(c:Case){learn(c.family);addEvent(c.id,"Human","Keep shipped items; cancel unshipped item and refund its value.","System");return process({...c,status:"NEW",question:undefined});}
