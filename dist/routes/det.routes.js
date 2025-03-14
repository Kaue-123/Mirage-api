"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRoutes = loginRoutes;
const loginDetController_1 = require("../controller/loginDetController");
async function loginRoutes(fastify) {
    // Rota para realizar login no DET
    fastify.get('/login-det', async (request, reply) => {
        await loginDetController_1.LoginController.loginDET(request, reply);
    });
}
//# sourceMappingURL=det.routes.js.map