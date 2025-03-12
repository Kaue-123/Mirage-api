export function formatarCnpj(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function limparCNPJ(cnpj: string): string {
    return cnpj.replace(/[^\d]/g, ''); // Remove tudo que não é número
}