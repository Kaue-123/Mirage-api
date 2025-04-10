import { FastifyInstance } from 'fastify';
import { LoginController } from '../controllers/loginDet/loginDetController';


export async function loginRoutes(fastify: FastifyInstance) {
    // Rota para realizar login no DET
    fastify.get('/login-det', async (request, reply) => {
        await LoginController.loginDET(request, reply);
    });
}