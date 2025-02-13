import { AppdataSource } from '../db/data-source';
import { Enterprise } from '../entities/CnpjMatriz';


export class EnterpriseRepository {
  private repository; 
  
  constructor () {
    this.repository = AppdataSource.getRepository(Enterprise);
  }
  
    async save(empresa: Enterprise): Promise<Enterprise> {
      if (!this.repository) {
        throw new Error('Repositório não inicializado');
      }
      return this.repository.save(empresa);
    }
  
    async findByCnpj(cnpj: string): Promise<Enterprise | undefined> {
      return this.repository.findOne({ where: { cnpj } });
    }
  
    async findAll(): Promise<Enterprise[]> {
      return this.repository.find();
    }
  
    // Associar uma filial a uma matriz
    async associarFilial(matrizCnpj: string, filialCnpj: string): Promise<void> {
      const matriz = await this.findByCnpj(matrizCnpj);
      const filial = await this.findByCnpj(filialCnpj);
  
  
    }
  }