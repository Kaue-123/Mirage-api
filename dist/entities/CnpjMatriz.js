"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enterprise = void 0;
const typeorm_1 = require("typeorm");
let Enterprise = class Enterprise {
    id;
    id_matriz;
    Nome;
    Cnpj;
    Tipo;
    Sociedade;
    Status;
    Procuracao;
    Gestao;
    Data_Outorga;
    Caixa_Postal;
    Notificacao;
    FraseDeSeguranca;
    // Relacionamento: uma empresa pode ter uma matriz (no caso de ser filial)
    matriz;
    filiais;
};
exports.Enterprise = Enterprise;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Enterprise.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Enterprise.prototype, "id_matriz", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Cnpj", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Sociedade", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Procuracao", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Gestao", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Enterprise.prototype, "Data_Outorga", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Caixa_Postal", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "Notificacao", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Enterprise.prototype, "FraseDeSeguranca", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Enterprise, (matriz) => matriz.filiais, { nullable: true }),
    __metadata("design:type", Enterprise)
], Enterprise.prototype, "matriz", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Enterprise, (filial) => filial.matriz),
    __metadata("design:type", Array)
], Enterprise.prototype, "filiais", void 0);
exports.Enterprise = Enterprise = __decorate([
    (0, typeorm_1.Entity)()
], Enterprise);
//# sourceMappingURL=CnpjMatriz.js.map