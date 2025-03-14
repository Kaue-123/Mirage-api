"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginController = void 0;
const loginService_1 = require("../service/loginService");
const detService_1 = require("../service/detService");
class LoginController {
    static async loginDET(request, reply) {
        try {
            const loginService = new loginService_1.LoginService();
            const { page, bearerToken } = await loginService.loginWithCertificate();
            if (!bearerToken) {
                return reply.status(401).send({ message: "Token de autenticação não encontrado" });
            }
            const detService = new detService_1.DetService(bearerToken);
            const resultado = await detService.start();
            return reply.send({
                message: "Login efetuado com sucesso e CNPJs processados.",
                resultado,
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