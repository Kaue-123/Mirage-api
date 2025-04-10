import { Repository } from "typeorm";
import { AppdataSource } from "../../db/data-source";
import { Notifications } from "../../entities/Notifications";
import { Enterprise } from "../../entities/Enterprises";


export class SaveNotificationsService {
    private notificationRepository: Repository<Notifications>;

    constructor() {
        this.notificationRepository = AppdataSource.getRepository(Notifications);
    }

    async saveToDataBase(cnpj: string, data: any[]): Promise<Notifications[]> {
        const saveData: Notifications[] = [];

        const enterpriseRepository = AppdataSource.getRepository(Enterprise)

        const enterprise = await enterpriseRepository.findOne({
            where: {
                Cnpj: cnpj
            }
        })
        if (!enterprise) {
            console.error("CNPJ não encontrado no banco de dados.")
        }
        for (const msg of data) {
            const existingNotification = await this.notificationRepository.findOne({
                where: {
                    uid: msg.uid
                }
            })

            if (existingNotification) {
                console.log(`Notificação com ID ${msg.uid} já existe, pulando...`)
                continue
            }

            if (!existingNotification) {
                const newNotification = this.notificationRepository.create({
                    codigo: msg.codigo,
                    ri: msg.ri,
                    cpfAuditor: msg.cpfAuditor,
                    tipoGeracao: msg.tipoGeracao,
                    tipoAbrangencia: msg.tipoAbrangencia,
                    titulo: msg.titulo,
                    status: msg.status,
                    tipoNi: msg.tipoNI ?? 0,
                    ni: msg.ni,
                    dataEnvio: msg.dataEnvio ? new Date(msg.dataEnvio) : null,
                    estabelecimentos: msg.estabelecimentos || null,
                    enderecos: msg.enderecos || null,
                    contatos: msg.contatos || null,
                    auditores: msg.auditores || null,
                    observacoes: msg.observacoes || null,
                    entregas: msg.entregas || null,
                    itens: msg.itens || null,
                    rascunho: msg.rascunho || null,
                    uid: msg.uid,
                    rascunhoArquivoUri: msg.rascunhoArquivoUri || null,
                    dataPrazoEntregaPadrao: msg.dataPrazoEntregaPadrao ? new Date(msg.dataPrazoEntregaPadrao) : null,
                    dataPeriodoInicioPadrao: msg.dataPeriodoInicioPadrao ? new Date(msg.dataPeriodoInicioPadrao) : null,
                    dataPeriodoFimPadrao: msg.dataPeriodoFimPadrao ? new Date(msg.dataPeriodoFimPadrao) : null,
                    textosInformativosPadraoAtivos: msg.textosInformativosPadraoAtivos || null,
                    itemDataProximaEntrega: msg.itemDataProximaEntrega || null,
                    itemAlertaEmpregador: msg.itemAlertaEmpregador,
                    updatedAt: msg.updatedAt || null,
                    clientId: msg.clientId || null,
                    horaPrazoEntregaPadrao: msg.horaPrazoEntregaPadrao || null,
                    // enterprise: enterprise
                })

                const savedContent = await this.notificationRepository.save(newNotification)
                saveData.push(savedContent)
            }

        }

        return saveData;
    }

}