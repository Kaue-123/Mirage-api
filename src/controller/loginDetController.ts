import { FastifyRequest, FastifyReply } from "fastify";
import { LoginService } from "../service/loginService";
import { DetService } from "../service/detService";

export class LoginController { 
    static async loginDET(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const loginservice = new LoginService();
            const page = await loginservice.loginWithCertificate();


            const detService = new DetService();
            await detService.start(page);


            return reply.send({ message: "Login efetuado com sucesso", page});
        } catch (error) {
            return reply.status(500).send({ message: "Erro ao efetuar login no DET", error: error.message})
        }

     }
}