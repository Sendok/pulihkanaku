export const PAYOUT_STATUSES = ["PENDING", "SCHEDULED", "PROCESSING", "PAID", "FAILED", "ON_HOLD", "REVERSED"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];
export const DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW", "WAITING_WORKER", "WAITING_BUSINESS", "RESOLVED_WORKER", "RESOLVED_BUSINESS", "PARTIAL_RESOLUTION", "CLOSED", "APPEALED"] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

const payoutTransitions: Record<PayoutStatus, readonly PayoutStatus[]> = {
  PENDING:["SCHEDULED","ON_HOLD","FAILED"],SCHEDULED:["PROCESSING","ON_HOLD","FAILED"],PROCESSING:["PAID","FAILED","ON_HOLD"],FAILED:["PROCESSING","ON_HOLD"],ON_HOLD:["SCHEDULED","REVERSED"],PAID:["REVERSED"],REVERSED:[],
};
const disputeTransitions: Record<DisputeStatus, readonly DisputeStatus[]> = {
  OPEN:["UNDER_REVIEW","WAITING_WORKER","WAITING_BUSINESS","RESOLVED_WORKER","RESOLVED_BUSINESS","PARTIAL_RESOLUTION","CLOSED"],UNDER_REVIEW:["WAITING_WORKER","WAITING_BUSINESS","RESOLVED_WORKER","RESOLVED_BUSINESS","PARTIAL_RESOLUTION","CLOSED"],WAITING_WORKER:["UNDER_REVIEW","RESOLVED_WORKER","RESOLVED_BUSINESS","PARTIAL_RESOLUTION"],WAITING_BUSINESS:["UNDER_REVIEW","RESOLVED_WORKER","RESOLVED_BUSINESS","PARTIAL_RESOLUTION"],RESOLVED_WORKER:["CLOSED","APPEALED"],RESOLVED_BUSINESS:["CLOSED","APPEALED"],PARTIAL_RESOLUTION:["CLOSED","APPEALED"],APPEALED:["UNDER_REVIEW","RESOLVED_WORKER","RESOLVED_BUSINESS","PARTIAL_RESOLUTION"],CLOSED:[],
};
export function isPayoutStatus(value:string):value is PayoutStatus{return(PAYOUT_STATUSES as readonly string[]).includes(value)}
export function isDisputeStatus(value:string):value is DisputeStatus{return(DISPUTE_STATUSES as readonly string[]).includes(value)}
export function assertPayoutTransition(from:PayoutStatus,to:PayoutStatus):void{if(!payoutTransitions[from].includes(to))throw new Error("PAYOUT_INVALID_TRANSITION")}
export function assertDisputeTransition(from:DisputeStatus,to:DisputeStatus):void{if(!disputeTransitions[from].includes(to))throw new Error("DISPUTE_INVALID_TRANSITION")}
