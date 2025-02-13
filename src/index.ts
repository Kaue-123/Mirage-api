import fastify from 'fastify';
import { routes } from './routes/routes';
import { AppdataSource } from './db/data-source';

const main = async () => {
    
    const server = fastify({ logger: true });

    AppdataSource.initialize()
    .then(async () => {
        server.register(routes);
        const port = 5000;
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