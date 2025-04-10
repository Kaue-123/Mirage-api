import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
} from 'typeorm'
import { Enterprise } from './Enterprises'

@Entity()

export class Notifications {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    codigo: string

    @Column()
    ri: string

    @Column()
    cpfAuditor: string

    @Column()
    tipoGeracao: number

    @Column()
    tipoAbrangencia: number

    @Column()
    titulo: string

    @Column()
    status: number

    @Column({ default: 0 })
    tipoNi: number

    @Column()
    ni: string

    @Column({ type: "timestamp", nullable: true })
    dataEnvio: Date

    @Column({ nullable: true })
    estabelecimentos: string

    @Column({ nullable: true })
    enderecos: string

    @Column({ nullable: true })
    contatos: string

    @Column({ nullable: true })
    auditores: string

    @Column({ nullable: true })
    observacoes: string

    @Column({ nullable: true })
    entregas: string

    @Column({ nullable: true })
    itens: string

    @Column({ nullable: true })
    rascunho: string

    @Column()
    uid: string

    @Column({ nullable: true })
    rascunhoArquivoUri: string

    @Column({ type: "timestamp", nullable: true })
    dataPrazoEntregaPadrao: Date

    @Column({ type: "timestamp", nullable: true })
    dataPeriodoInicioPadrao: Date

    @Column({ type: "timestamp", nullable: true })
    dataPeriodoFimPadrao: Date

    @Column({ nullable: true })
    textosInformativosPadraoAtivos: string

    @Column({ type: "timestamp", nullable: true })
    itemDataProximaEntrega: Date

    @Column()
    itemAlertaEmpregador: boolean

    @Column({ nullable: true })
    updatedAt: string

    @Column({ nullable: true })
    clientId: string

    @Column({ type: "timestamp", nullable: true })
    horaPrazoEntregaPadrao: Date

    // @ManyToOne(() => Enterprise, (enterprise) => enterprise.contentMessages, { nullable: false })
    // @JoinColumn({ name: "enterprise_id" })
    // enterprise: Enterprise
}