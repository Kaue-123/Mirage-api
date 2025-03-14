"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterpriseRoutes = enterpriseRoutes;
const importEnterpriseController_1 = require("../controller/importEnterpriseController");
const EnterpriseRepository_1 = require("../repository/EnterpriseRepository");
async function enterpriseRoutes(fastify) {
    fastify.post('/enterprise/import', async (request, reply) => {
        const importController = new importEnterpriseController_1.EnterpriseImportController();
        await importController.importPlanilha(request, reply);
    });
    fastify.put('/enterprise/associar', async (request, reply) => {
        const enterpriseRepository = new EnterpriseRepository_1.EnterpriseRepository();
        try {
            await enterpriseRepository.associarFiliaisAMatrizes();
            reply.send({ message: "Filiais associadas às matrizes com sucesso" });
        }
        catch (error) {
            reply.status(500).send({ message: "Erro ao associar filiais às matrizes", error: error.message });
        }
    });
}
//# sourceMappingURL=matriz.routes.js.map