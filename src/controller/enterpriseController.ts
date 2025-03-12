import { FastifyRequest, FastifyReply } from "fastify";
import { EnterpriseRepository } from "../repository/EnterpriseRepository";

export class EnterpriseListController {
    private enterpriseRepository = new EnterpriseRepository();

    async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const enterprises = await this.enterpriseRepository.findAll();
            reply.send(enterprises);
        } catch (error) {
            reply.code(500).send({ message: "Erro ao listar empresas", error: error.message });
        }
    }
}

