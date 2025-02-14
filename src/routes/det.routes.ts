import { FastifyInstance } from 'fastify';
import { LoginController } from '../controller/loginDetController';


export async function detRoutes(fastify: FastifyInstance) {
    // Rota para realizar login no DET
    fastify.get('/login-det', async (request, reply) => {
        await LoginController.loginDET(request, reply);
    });
}