"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppdataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Enterprises_1 = require("../entities/Enterprises");
const dotenv_1 = require("dotenv");
const ContentMessages_1 = require("../entities/ContentMessages");
(0, dotenv_1.config)();
exports.AppdataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [Enterprises_1.Enterprise, ContentMessages_1.ContentMessages],
    migrations: [],
    subscribers: [],
});
//# sourceMappingURL=data-source.js.map