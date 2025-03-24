import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm'

import sanitizeHtml from 'sanitize-html';


@Entity()
export class ContentMessages {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    uid: string

    @Column({ name: "Cnpj" })
    ni: string

    @Column()
    titulo: string

    @Column({ nullable: true })
    texto: string

    @Column({ nullable: true })
    remetente: string

    @Column({ nullable: true })
    tipo: number

    @Column({ nullable: true })
    situacao: number

    @Column({ nullable: true })
    arquivada: boolean

    @Column({ type: "timestamp", nullable: true })
    dataHoraLeitura: Date | null

    @Column({ type: "timestamp", nullable: true })
    dataHoraCriacao: Date

    @Column({ nullable: true })
    dataHoraLeituraDeCursoPrazo: Date

    @Column({ nullable: true })
    codigoNotificacao: string

    @Column({ nullable: true })
    statusNotificacao: number

    @Column({ nullable: true })
    sistemaOrigem: string

    
    setTexto(texto: string) {

        if (texto) {
            this.texto = sanitizeHtml(texto); 
            
        }
    }
    
}

