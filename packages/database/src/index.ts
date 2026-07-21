import{drizzle}from"drizzle-orm/node-postgres";import{Pool}from"pg";
export function createPostgresDatabase(databaseUrl:string,poolMax=10){const pool=new Pool({connectionString:databaseUrl,max:poolMax,statement_timeout:15_000,application_name:"pulihkanaku"});return{db:drizzle(pool),pool}}
