import{Worker}from"bullmq";import{Redis}from"ioredis";
const connection=new Redis(process.env.REDIS_URL??"redis://localhost:6379",{maxRetriesPerRequest:null});
const worker=new Worker("pulihkanaku",async job=>({jobId:job.id,name:job.name,processedAt:new Date().toISOString()}),{connection});
const shutdown=async()=>{await worker.close();await connection.quit();process.exit(0)};process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
