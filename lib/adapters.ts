export type IntegrationMode="DEMO"|"LIVE";
export interface BandAdapter { publish(roomId:string,message:string):Promise<void> }
export interface TeracAdapter { execute(action:string,payload:unknown):Promise<{auditId:string}> }
export interface LinqAdapter { lookup(query:string):Promise<unknown[]> }
export interface PaymentsAdapter { markRefund(paymentId:string,amount:number):Promise<{simulated:boolean}> }
export interface RenderWorkflowAdapter { trigger(name:string,payload:unknown):Promise<void> }
export const integrationMode:IntegrationMode=(process.env.EXCEPTIONOS_INTEGRATION_MODE==="LIVE"?"LIVE":"DEMO");
