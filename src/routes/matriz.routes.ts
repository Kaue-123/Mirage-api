import { FastifyInstance } from 'fastify';
import { EnterpriseImportController } from '../controller/importEnterpriseController';
import { EnterpriseListController } from '../controller/enterpriseController';

// Função para registrar as rotas de Enterprise
export async function enterpriseRoutes(fastify: FastifyInstance) {
    // Rota para importar empresas (POST)
    fastify.post('/enterprise/import', async (request, reply) => {
        const importController = new EnterpriseImportController();
        await importController.importPlanilha(request, reply);    
    });

    // Rota para listar empresas (GET)
    // fastify.get('/enterprise/enterprises', async (request, reply) => {
    //     const listController = new EnterpriseListController();
    //     await listController.listEnterprises(request, reply);   
    // });
}
