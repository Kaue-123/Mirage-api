import { FastifyInstance } from "fastify";
import { DetController } from "../controller/verificacaoController";

export async function detRoutes(fastify: FastifyInstance) {
    fastify.get('/verificar-procuracao', async (request, reply) => {
        await DetController.verificarProcuracao(request, reply);

    })
}
