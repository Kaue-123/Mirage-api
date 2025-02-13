import { FastifyInstance } from "fastify";
import { enterpriseRoutes } from "./matriz.routes";


export const routes = async (fastify: FastifyInstance) => {
    // Registrando as rotas de Enterprise
    fastify.register(enterpriseRoutes);
};