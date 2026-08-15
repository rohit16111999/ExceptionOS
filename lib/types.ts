export type Family = "partial_shipment_cancellation" | "replacement_refund" | "discounted_partial_refund";
export type Knowledge = { id:string; type:"POLICY"|"LEARNED_SKILL"; title:string; content:string; family:Family; source:string; confidence:number };
export type Case = { id:string; family:Family; customer:string; detail:string; status:"NEW"|"HUMAN_REQUIRED"|"RESOLVED"; attempts:number; humanUsed:boolean; resolution?:string; question?:string };
export type Event = { id:string; caseId:string; sender:string; recipient?:string; message:string; timestamp:string };
export type Metrics = { total:number; autonomousRate:number; escalationRate:number; correctRate:number; unsupportedRate:number; avgHuman:number };
