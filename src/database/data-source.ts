import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";
import { ContentMessages } from "../domain/entities/ContentMessages";
import { Enterprise } from "../domain/entities/Enterprises";
import { Notifications } from "../domain/entities/Notifications";

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
    entities: [Enterprise, ContentMessages, Notifications],
    migrations: [],
    subscribers: [],
    
})
