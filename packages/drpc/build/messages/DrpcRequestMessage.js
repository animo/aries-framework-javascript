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
exports.DrpcRequestMessage = void 0;
const core_1 = require("@credo-ts/core");
const class_transformer_1 = require("class-transformer");
const models_1 = require("../models");
class DrpcRequestMessage extends core_1.AgentMessage {
    constructor(options) {
        super();
        this.type = DrpcRequestMessage.type.messageTypeUri;
        if (options) {
            this.id = this.generateId();
            this.request = options.request;
        }
    }
}
exports.DrpcRequestMessage = DrpcRequestMessage;
DrpcRequestMessage.type = (0, core_1.parseMessageType)('https://didcomm.org/drpc/1.0/request');
__decorate([
    (0, core_1.IsValidMessageType)(DrpcRequestMessage.type),
    __metadata("design:type", Object)
], DrpcRequestMessage.prototype, "type", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'request' }),
    (0, models_1.IsValidDrpcRequest)(),
    __metadata("design:type", Object)
], DrpcRequestMessage.prototype, "request", void 0);
//# sourceMappingURL=DrpcRequestMessage.js.map