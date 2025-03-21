"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = require("fastify");
const routes_1 = require("./routes/routes");
const data_source_1 = require("./db/data-source");
const procuracao_routes_1 = require("./routes/procuracao.routes");
const main = async () => {
    const server = (0, fastify_1.default)({ logger: true });
    data_source_1.AppdataSource.initialize()
        .then(async () => {
        server.register(routes_1.routes);
        server.register(routes_1.detRoutesLogin);
        server.register(procuracao_routes_1.detRoutes);
        const port = 5016;
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