import fastify from 'fastify';
import { detRoutesLogin, routes } from './routes/routes';
import { AppdataSource } from './db/data-source';
import { detRoutes } from './routes/procuracao.routes';

const main = async () => {
    
    const server = fastify({ logger: true });

    AppdataSource.initialize()
    .then(async () => {
        
        server.register(routes);
        server.register(detRoutesLogin);
        server.register(detRoutes);
        
        const port = 5016;
        server.listen({ port }, (err)  => {
            if (err) {
                server.log.error(err);
                process.exit(1);
            }
            server.log.info(`Servidor rodando na porta ${port}`);
        })
    }) 

}

main()