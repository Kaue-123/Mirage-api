import fetch from "node-fetch";

export class ExistResponse {
    private readonly apiUrl: string = 'https://det.sit.trabalho.gov.br/services/v1/procuracoes/existe'

    async checkoutExist(cnpj: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiUrl}?/${cnpj}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                console.warn(`API retornou status ${response.status}`)
                return false
            }

            const responseJson = await response.json() as { existe: boolean }; 
            return responseJson?.existe === true;
        } catch (error) {
            console.error("Erro ao verificar procuração: ", error)
            return false
        }
    }
}