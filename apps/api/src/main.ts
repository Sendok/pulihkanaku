import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import type { NextFunction, Request, Response } from "express";
import { loadServiceEnvironment } from "@pulihkanaku/config";
import { AppModule } from "./app.module.js";
import { ApiExceptionFilter } from "./request-boundary.js";
async function bootstrap(){const environment=loadServiceEnvironment();const app=await NestFactory.create(AppModule,{bufferLogs:true});app.setGlobalPrefix("api/v1");app.use(helmet());app.use((req:Request,res:Response,next:NextFunction)=>{const id=String(req.get("x-request-id")??crypto.randomUUID()).slice(0,100);req.headers["x-request-id"]=id;res.setHeader("x-request-id",id);next()});app.useGlobalFilters(new ApiExceptionFilter());app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));app.enableCors({origin:environment.CORS_ORIGINS.split(",").map(value=>value.trim()),credentials:true});const openapi=new DocumentBuilder().setTitle("PulihkanAku API").setVersion("1.0").addBearerAuth().build();SwaggerModule.setup("api/docs",app,SwaggerModule.createDocument(app,openapi));app.enableShutdownHooks();await app.listen(Number(process.env.PORT??4000),"0.0.0.0")}
void bootstrap();
