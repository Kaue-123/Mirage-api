"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detVerificarProcuracao = exports.detRoutesLogin = exports.routes = void 0;
const matriz_routes_1 = require("./matriz.routes");
const det_routes_1 = require("./det.routes");
const procuracao_routes_1 = require("./procuracao.routes");
const routes = async (fastify) => {
    // Registrando as rotas de Enterprise
    fastify.register(matriz_routes_1.enterpriseRoutes);
};
exports.routes = routes;
const detRoutesLogin = async (fastify) => {
    fastify.register(det_routes_1.loginRoutes);
};
exports.detRoutesLogin = detRoutesLogin;
const detVerificarProcuracao = async (fastify) => {
    fastify.register(procuracao_routes_1.detRoutes);
};
exports.detVerificarProcuracao = detVerificarProcuracao;
//# sourceMappingURL=routes.js.map