import { FastifyInstance } from "fastify";
import { enterpriseRoutes } from "./matriz.routes";
import { loginRoutes } from "./det.routes";
import { detRoutes } from "./procuracao.routes";


export const routes = async (fastify: FastifyInstance) => {
    // Registrando as rotas de Enterprise
    fastify.register(enterpriseRoutes);
};

export const detRoutesLogin = async (fastify: FastifyInstance) => {
    fastify.register(loginRoutes);
}

export const detVerificarProcuracao = async (fastify: FastifyInstance) => {
    fastify.register(detRoutes);
} 