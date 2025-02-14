import { FastifyInstance } from 'fastify';
import { EnterpriseImportController } from '../controller/importEnterpriseController';
import { EnterpriseListController } from '../controller/enterpriseController';
import { EnterpriseRepository } from '../repository/EnterpriseRepository';
import { LoginController } from '../controller/loginDetController';

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

    

    // Rota para listar empresas (GET)
    // fastify.get('/enterprise/enterprises', async (request, reply) => {
    //     const listController = new EnterpriseListController();
    //     await listController.listEnterprises(request, reply);   
    // });
}
