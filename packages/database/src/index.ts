import{drizzle}from"drizzle-orm/node-postgres";import{Pool}from"pg";import*as schema from"./schema.js";
export function createPostgresDatabase(databaseUrl:string,poolMax=10){const pool=new Pool({connectionString:databaseUrl,max:poolMax,statement_timeout:15_000,application_name:"pulihkanaku"});return{db:drizzle(pool,{schema}),pool}}
export*from"./schema.js";
