"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const routes_1 = require("./routes/routes");
const data_source_1 = require("./db/data-source");
const main = async () => {
    const server = (0, fastify_1.default)({ logger: true });
    data_source_1.AppdataSource.initialize()
        .then(async () => {
        server.register(routes_1.routes);
        server.register(routes_1.detRoutesLogin);
        server.register(routes_1.detVerificarProcuracao);
        const port = 5022;
        server.listen({ port }, (err) => {
            if (err) {
                server.log.error(err);
                process.exit(1);
            }
            server.log.info(`Servidor rodando na porta ${port}`);
        });
    });
};
main();
//# sourceMappingURL=index.js.map