import { FastifyRequest, FastifyReply } from "fastify";
import { LoginService } from "../../service/loginService";
import { DetService } from "../../service/detService";
import { DetController } from "../consultEmployers";

export class LoginController {
    static async loginDET(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const loginService = new LoginService();
            const { page } = await loginService.loginWithCertificate()


            const bearerToken = loginService.getBearerToken();

            if (!bearerToken) {
                return reply.status(401).send({ message: "Token de autenticação não encontrado" });
            }

            request.headers['authorization'] = `Bearer ${bearerToken}`;

            await DetController.verificarProcuracao(request, reply); // Passa o request e reply para o DetController


            return reply.send({
                message: "Login efetuado com sucesso e CNPJs processados.",
                page
            });
        } catch (error) {
            console.error("Erro no LoginController:", error);
            return reply.status(500).send({ message: "Erro ao efetuar login no DET", error: error.message });
        }
    }
}
