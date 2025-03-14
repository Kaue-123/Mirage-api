"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatarCnpj = formatarCnpj;
exports.limparCNPJ = limparCNPJ;
function formatarCnpj(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
function limparCNPJ(cnpj) {
    return cnpj.replace(/[^\d]/g, ''); // Remove tudo que não é número
}
//# sourceMappingURL=cnpjFormatado.js.map