import { FastifyInstance } from 'fastify';
import { EnterpriseImportController } from '../controllers/import-json-to-database/importJSON.controller';
import { EnterpriseRepository } from '../../../database/repositories/Enterprise.repository';

export async function enterpriseRoutes(fastify: FastifyInstance) {
    
    fastify.post('/enterprise/import', async (request, reply) => {
        const importController = new EnterpriseImportController();
        await importController.importPlanilha(request, reply);    
    });

    fastify.put('/enterprise/associar', async (request, reply) => {
        const enterpriseRepository = new EnterpriseRepository()
        try {
            await enterpriseRepository.associarFiliaisAMatrizes()
            reply.send({ message: "Filiais associadas às matrizes com sucesso"})
        } catch (error) {
            reply.status(500).send({ message: "Erro ao associar filiais às matrizes", error: error.message})
        }
    })

}
