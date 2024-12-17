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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonCredsRevocationRegistryDefinitionPrivateRepository = void 0;
const core_1 = require("@credo-ts/core");
const AnonCredsRevocationRegistryDefinitionPrivateRecord_1 = require("./AnonCredsRevocationRegistryDefinitionPrivateRecord");
let AnonCredsRevocationRegistryDefinitionPrivateRepository = class AnonCredsRevocationRegistryDefinitionPrivateRepository extends core_1.Repository {
    constructor(storageService, eventEmitter) {
        super(AnonCredsRevocationRegistryDefinitionPrivateRecord_1.AnonCredsRevocationRegistryDefinitionPrivateRecord, storageService, eventEmitter);
    }
    async getByRevocationRegistryDefinitionId(agentContext, revocationRegistryDefinitionId) {
        return this.getSingleByQuery(agentContext, { revocationRegistryDefinitionId });
    }
    async findByRevocationRegistryDefinitionId(agentContext, revocationRegistryDefinitionId) {
        return this.findSingleByQuery(agentContext, { revocationRegistryDefinitionId });
    }
    async findAllByCredentialDefinitionIdAndState(agentContext, credentialDefinitionId, state) {
        return this.findByQuery(agentContext, { credentialDefinitionId, state });
    }
};
exports.AnonCredsRevocationRegistryDefinitionPrivateRepository = AnonCredsRevocationRegistryDefinitionPrivateRepository;
exports.AnonCredsRevocationRegistryDefinitionPrivateRepository = AnonCredsRevocationRegistryDefinitionPrivateRepository = __decorate([
    (0, core_1.injectable)(),
    __param(0, (0, core_1.inject)(core_1.InjectionSymbols.StorageService)),
    __metadata("design:paramtypes", [Object, core_1.EventEmitter])
], AnonCredsRevocationRegistryDefinitionPrivateRepository);
//# sourceMappingURL=AnonCredsRevocationRegistryDefinitionPrivateRepository.js.map