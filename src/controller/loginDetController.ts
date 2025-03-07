import { FastifyRequest, FastifyReply } from "fastify";
import { LoginService } from "../service/loginService";
import { DetService } from "../service/detService";

export class LoginController { 
    static async loginDET(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const loginservice = new LoginService();
            const {page, bearerToken} = await loginservice.loginWithCertificate();

            if (!bearerToken) {
                return reply.status(401).send({ message: "Token de autenticação não encontrado" });
            }

            const detService = new DetService(bearerToken);
            await detService.start(page);


            return reply.send({ message: "Login efetuado com sucesso", page});
        } catch (error) {
            return reply.status(500).send({ message: "Erro ao efetuar login no DET", error: error.message})
        }

     }
}