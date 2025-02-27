import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
@Entity()
export class Enterprise {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ nullable: true })
    id_matriz: number;
    
    @Column({ nullable: true })
    Nome: string;
    
    @Column({ nullable: true })
    Cnpj: string;

    @Column({ nullable: true})
    Tipo: string;

    @Column({ nullable: true })
    Sociedade: string;

    @Column({ nullable: true })
    Status: string;

    @Column({ nullable: true })
    Procuracao: string;
    
    @Column({ nullable: true })
    Gestao: string;

    @Column({ nullable: true })
    Data_Outorga: Date; 

    @Column({ nullable: true })
    Caixa_Postal: string;

    @Column({ nullable: true })
    Notificacao: string;

    @Column({ nullable: true })
    FraseDeSeguranca: string

    // Relacionamento: uma empresa pode ter uma matriz (no caso de ser filial)
    @ManyToOne(() => Enterprise, (matriz) => matriz.filiais, { nullable: true })
    matriz: Enterprise;


    @OneToMany(() => Enterprise, (filial) => filial.matriz)
    filiais: Enterprise[];
}