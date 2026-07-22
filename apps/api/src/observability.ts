import { Controller, Get, Header, Headers, Injectable, MiddlewareConsumer, NestMiddleware, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

const jsonLog=(level:string,event:string,fields:Record<string,unknown>)=>console.log(JSON.stringify({timestamp:new Date().toISOString(),level,event,service:"pulihkanaku-api",...fields}));
const secure=(a:string,b:string)=>timingSafeEqual(createHash("sha256").update(a).digest(),createHash("sha256").update(b).digest());

@Injectable()
export class MetricsService {
  private requests=0;private errors=0;private durationMs=0;private readonly statuses=new Map<number,number>();
  observe(status:number,duration:number){this.requests++;this.durationMs+=duration;this.statuses.set(status,(this.statuses.get(status)??0)+1);if(status>=500)this.errors++}
  render(){const lines=["# HELP pulihkanaku_http_requests_total Total HTTP requests.","# TYPE pulihkanaku_http_requests_total counter",`pulihkanaku_http_requests_total ${this.requests}`,"# HELP pulihkanaku_http_errors_total Total HTTP 5xx responses.","# TYPE pulihkanaku_http_errors_total counter",`pulihkanaku_http_errors_total ${this.errors}`,"# HELP pulihkanaku_http_request_duration_milliseconds_sum Accumulated request duration.","# TYPE pulihkanaku_http_request_duration_milliseconds_sum counter",`pulihkanaku_http_request_duration_milliseconds_sum ${this.durationMs}`];for(const[status,count]of this.statuses)lines.push(`pulihkanaku_http_responses_total{status="${status}"} ${count}`);return`${lines.join("\n")}\n`}
}

@Injectable()
export class AlertService {
  private readonly sent=new Map<string,number>();
  async notify(type:string,detail:Record<string,unknown>){const url=process.env.ALERT_WEBHOOK_URL;if(!url)return;const fingerprint=createHash("sha256").update(`${type}:${detail.route??""}:${detail.status??""}`).digest("hex");const now=Date.now();if(now-(this.sent.get(fingerprint)??0)<60_000)return;this.sent.set(fingerprint,now);try{const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json",...(process.env.ALERT_WEBHOOK_TOKEN?{authorization:`Bearer ${process.env.ALERT_WEBHOOK_TOKEN}`}:{})},body:JSON.stringify({type,severity:"ERROR",service:"pulihkanaku-api",occurredAt:new Date().toISOString(),fingerprint,detail}),signal:AbortSignal.timeout(5000)});if(!response.ok)jsonLog("warn","alert.delivery_failed",{status:response.status,fingerprint})}catch(error){jsonLog("warn","alert.delivery_failed",{fingerprint,error:error instanceof Error?error.message:"unknown"})}}
}

@Injectable()
export class ObservabilityMiddleware implements NestMiddleware {
  constructor(private readonly metrics:MetricsService,private readonly alerts:AlertService){}
  use(request:Request,response:Response,next:NextFunction){const started=performance.now();const incoming=request.get("traceparent")?.match(/^00-([a-f0-9]{32})-/i)?.[1];const traceId=incoming??randomUUID().replaceAll("-","");response.setHeader("x-trace-id",traceId);response.on("finish",()=>{const durationMs=Math.round((performance.now()-started)*100)/100;this.metrics.observe(response.statusCode,durationMs);const fields={traceId,requestId:request.headers["x-request-id"],method:request.method,route:request.path,status:response.statusCode,durationMs};jsonLog(response.statusCode>=500?"error":response.statusCode>=400?"warn":"info","http.request",fields);if(response.statusCode>=500)void this.alerts.notify("HTTP_5XX",fields)});next()}
}

@Controller("observability")
export class ObservabilityController {
  constructor(private readonly metrics:MetricsService){}
  @Get("metrics") @Header("content-type","text/plain; version=0.0.4; charset=utf-8") @Header("cache-control","no-store") metricsEndpoint(@Headers("authorization") authorization?:string){const expected=process.env.METRICS_TOKEN;if(process.env.NODE_ENV==="production"&&!expected)throw new ServiceUnavailableException("Metrics token is not configured.");if(expected&&(!authorization||!secure(authorization,`Bearer ${expected}`)))throw new UnauthorizedException();return this.metrics.render()}
}

export function configureObservability(consumer:MiddlewareConsumer){consumer.apply(ObservabilityMiddleware).forRoutes("*")}
export function reportProcessError(event:string,error:unknown){const fields={message:error instanceof Error?error.message:String(error),stack:process.env.NODE_ENV==="production"?undefined:error instanceof Error?error.stack:undefined};jsonLog("error",event,fields)}
