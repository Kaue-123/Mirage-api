import "reflect-metadata";
import { DataSource } from "typeorm";
import { Enterprise } from "../entities/CnpjMatriz";
import { config } from "dotenv";

config()


export const AppdataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [Enterprise],
    migrations: [],
    subscribers: [],
    
})
