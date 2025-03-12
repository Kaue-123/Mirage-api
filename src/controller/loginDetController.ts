import { FastifyRequest, FastifyReply } from "fastify";
import { LoginService } from "../service/loginService";
import { DetService } from "../service/detService";

export class LoginController {
    static async loginDET(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const loginService = new LoginService();
            const { page, bearerToken } = await loginService.loginWithCertificate();

            if (!bearerToken) {
                return reply.status(401).send({ message: "Token de autenticação não encontrado" });
            }

            const detService = new DetService(bearerToken);
            const resultado = await detService.start();

            return reply.send({ 
                message: "Login efetuado com sucesso e CNPJs processados.", 
                resultado, 
                page 
            });
        } catch (error) {
            console.error("Erro no LoginController:", error);
            return reply.status(500).send({ message: "Erro ao efetuar login no DET", error: error.message });
        }
    }
}
