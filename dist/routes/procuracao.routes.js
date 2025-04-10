"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detRoutes = detRoutes;
const consultEmployers_1 = require("../controller/consultEmployers");
async function detRoutes(fastify) {
    fastify.get('/verificar-procuracao', async (request, reply) => {
        try {
            await consultEmployers_1.DetController.verificarProcuracao(request, reply);
        }
        catch (error) {
            console.error("Erro ao processar a rota /verificar-procuracao:", error);
            reply.status(500).send({ message: "Erro interno do servidor", error: error.message });
        }
    });
}
//# sourceMappingURL=procuracao.routes.js.map