import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Enterprise {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    nome: string;

    @Column({ nullable: true })
    cnpj: string;

    @Column({ nullable: true })
    sociedade: string;

    @Column({ nullable: true })
    ativaOuInativa: string;

    @Column({ nullable: true })
    Gestao: string;

    @Column({ nullable: true })
    Procuracao: string;

    @Column({ nullable: true })
    DataOutorga: Date; 

    @Column({ nullable: true })
    CaixaPostal: string;

    @Column({ nullable: true })
    Notificacao: string;

    @Column({ nullable: true })
    FraseDeSeguranca: string

    // Relacionamento: uma empresa pode ter uma matriz (no caso de ser filial)


}
