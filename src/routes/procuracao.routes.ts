import { FastifyInstance } from "fastify";
import { DetController } from "../controller/verificacaoController";

export async function detRoutes(fastify: FastifyInstance) {
    fastify.get('/verificar-procuracao', async (request, reply) => {
        try {
            await DetController.verificarProcuracao(request, reply);
        } catch (error) {
            console.error("Erro ao processar a rota /verificar-procuracao:", error);
            reply.status(500).send({ message: "Erro interno do servidor", error: error.message });
        }
    })
}
