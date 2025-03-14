"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detRoutes = exports.detRoutesLogin = exports.routes = void 0;
const matriz_routes_1 = require("./matriz.routes");
const det_routes_1 = require("./det.routes");
const routes = async (fastify) => {
    // Registrando as rotas de Enterprise
    fastify.register(matriz_routes_1.enterpriseRoutes);
};
exports.routes = routes;
const detRoutesLogin = async (fastify) => {
    fastify.register(det_routes_1.loginRoutes);
};
exports.detRoutesLogin = detRoutesLogin;
const detRoutes = async (fastify) => {
    fastify.register(exports.detRoutes);
};
exports.detRoutes = detRoutes;
//# sourceMappingURL=routes.js.map