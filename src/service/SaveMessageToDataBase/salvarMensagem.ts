import { AppdataSource } from "../../db/data-source";
import { ContentMessages } from "../../entities/ContentMessages";
import { Repository } from "typeorm";

export class SaveMessagesService {
    private messagesRepository: Repository<ContentMessages>;

    constructor() {
        this.messagesRepository = AppdataSource.getRepository(ContentMessages);
    }

    async saveMessages(messages: any[]): Promise<ContentMessages[]> {
        const savedMessages: ContentMessages[] = [];

        for (const msg of messages) {
            
            const existingMessage = await this.messagesRepository.findOne({ 
                where: { 
                    uid: msg.uid 
                } });

            if (!existingMessage) {
                const newMessage = this.messagesRepository.create({
                    uid: msg.uid,
                    ni: msg.ni,
                    titulo: msg.titulo,
                    texto: msg.texto,
                    remetente: msg.remetente,
                    tipo: msg.tipo,
                    situacao: msg.situacao,
                    dataHoraLeitura: msg.dataHoraLeitura ? new Date(msg.dataHoraLeitura) : null,
                    dataHoraCriacao: new Date(msg.dataHoraCriacao)
                });

                
                const savedMessage = await this.messagesRepository.save(newMessage);
                savedMessages.push(savedMessage);
            }
        }

        return savedMessages;
    }
}
