import { AppdataSource } from "../../db/data-source";
import { ContentMessages } from "../../entities/ContentMessages";
import { Repository } from "typeorm";
import { SanitizeHTMLContent } from "../sanitizeHTML/sanitize";
import { Enterprise } from "../../entities/Enterprises";

export class SaveMessagesService {
    private messagesRepository: Repository<ContentMessages>;
    private sanitize: SanitizeHTMLContent;

    constructor() {
        this.messagesRepository = AppdataSource.getRepository(ContentMessages);
        this.sanitize = new SanitizeHTMLContent();
    }

    async saveMessagesToDatabase(cnpj: string, mensagens: any[]): Promise<ContentMessages[]> {
        const messagesToSave: ContentMessages[] = [];

        const enterpriseRepository = AppdataSource.getRepository(Enterprise)

        const enteprise = await enterpriseRepository.findOne({
            where: {
                Cnpj: cnpj
            }
        })

        for (const msg of mensagens) {
            // Verifica se a mensagem já existe pelo UID
            const existingMessage = await this.messagesRepository.findOne({
                where: { 
                    uid: msg.uid
                 }
            });

            if (existingMessage) {
                console.log(`Mensagem com UID ${msg.uid} já existe, pulando...`);
                continue;
            }

            // Sanitiza o texto antes de salvar
            const sanitizedText = await this.sanitize.cleanTextContent(msg.texto || "Sem conteúdo disponível");

            // Cria a nova mensagem
            const newMessage = this.messagesRepository.create({
                uid: msg.uid || null,
                ni: cnpj,
                titulo: msg.titulo || null,
                texto: sanitizedText,
                remetente: msg.remetente || "Desconhecido",
                tipo: msg.tipo || null,
                situacao: msg.situacao || null,
                arquivada: msg.arquivada || null,
                dataHoraLeitura: new Date(msg.dataEnvio || Date.now()),
                dataHoraCriacao: new Date(msg.dataEnvio || Date.now()),
                dataHoraLeituraDeCursoPrazo: new Date(msg.dataEnvio || Date.now()),
                codigoNotificacao: msg.codigoNotificacao || null,
                statusNotificacao: msg.statusNotificacao || null,
                sistemaOrigem: msg.sistemaOrigem || null,
                enterprise: enteprise
            });

            const savedMessage = await this.messagesRepository.save(newMessage);
            messagesToSave.push(savedMessage);
        }

        console.log(`Mensagens armazenadas no banco para o CNPJ: ${cnpj}`);
        return messagesToSave;
    }
}
