
import { AppdataSource } from "../db/data-source";
import { Enterprise } from "../entities/CnpjMatriz";


export class EnterpriseRepository {
  private repository;

  constructor() {
    this.repository = AppdataSource.getRepository(Enterprise);
  }

  async save(empresa: Enterprise): Promise<Enterprise> {
    if (!this.repository) {
      throw new Error("Repositório não inicializado");
    }
    return this.repository.save(empresa);
  }

  async findByCnpj(cnpj: string): Promise<Enterprise | undefined> {
    return this.repository.findOne({ where: { Cnpj: cnpj } });
  }

  async findMatrizByCnpjBase(cnpjBase: string): Promise<Enterprise | undefined> {
    const matrizes = await this.repository.find({
      where: { Tipo: "Matriz" }
    });

    return matrizes.find((matriz) =>
      matriz.Cnpj.startsWith(cnpjBase) && matriz.Cnpj.includes("/0001-")
    );
  }

  async findAll(): Promise<Enterprise[]> {
    return this.repository.find();
  }

  // Associa todas as filiais às suas matrizes
  async associarFiliaisAMatrizes(): Promise<void> {
    const empresas = await this.findAll();

    // Separar matrizes e filiais
    const matrizes = empresas.filter((e) => e.Tipo.toLowerCase() === "matriz" && !!e.Cnpj);
    const filiais = empresas.filter((e) => e.Tipo.toLowerCase() === "filial" && !!e.Cnpj);

    const updates = filiais.map(filial => {
      const cnpjBase = filial.Cnpj.substring(0, 10);


      const matriz = matrizes.find(m =>
        m.Cnpj.startsWith(cnpjBase) && m.Cnpj.includes("/0001-")
      );

      if (matriz) {

        filial.id_matriz = matriz.id;
        filial.matriz = matriz; // Relaciona o objeto completo da matriz, se necessário
        return this.repository.save(filial);
      }

    });
    await Promise.all(updates);
    console.log("Todas as filiais foram associadas às suas matrizes com sucesso");
  }
}