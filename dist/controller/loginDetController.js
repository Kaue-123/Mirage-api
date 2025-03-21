"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginController = void 0;
const loginService_1 = require("../service/loginService");
const verificacaoController_1 = require("./verificacaoController");
class LoginController {
    static async loginDET(request, reply) {
        try {
            const loginService = new loginService_1.LoginService();
            const { page } = await loginService.loginWithCertificate();
            const bearerToken = loginService.getBearerToken();
            if (!bearerToken) {
                return reply.status(401).send({ message: "Token de autenticação não encontrado" });
            }
            request.headers['authorization'] = `Bearer ${bearerToken}`;
            await verificacaoController_1.DetController.verificarProcuracao(request, reply); // Passa o request e reply para o DetController
            return reply.send({
                message: "Login efetuado com sucesso e CNPJs processados.",
                page
            });
        }
        catch (error) {
            console.error("Erro no LoginController:", error);
            return reply.status(500).send({ message: "Erro ao efetuar login no DET", error: error.message });
        }
    }
}
exports.LoginController = LoginController;
//# sourceMappingURL=loginDetController.js.map