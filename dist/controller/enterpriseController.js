"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseListController = void 0;
const EnterpriseRepository_1 = require("../repository/EnterpriseRepository");
class EnterpriseListController {
    enterpriseRepository = new EnterpriseRepository_1.EnterpriseRepository();
    async list(request, reply) {
        try {
            const enterprises = await this.enterpriseRepository.findAll();
            reply.send(enterprises);
        }
        catch (error) {
            reply.code(500).send({ message: "Erro ao listar empresas", error: error.message });
        }
    }
}
exports.EnterpriseListController = EnterpriseListController;
//# sourceMappingURL=enterpriseController.js.map