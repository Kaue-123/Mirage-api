import fastify from 'fastify';
import { detVerificarProcuracao, detRoutesLogin, routes } from './infrastructure/http/routes/routes';
import { AppdataSource } from './database/data-source';


const main = async () => {
    
    const server = fastify({ logger: true });

    AppdataSource.initialize()
    .then(async () => {
        
        server.register(routes);
        server.register(detRoutesLogin);
        server.register(detVerificarProcuracao);
        
    
        
        const port = 5023;
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