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
exports.DidRotateMessage = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AgentMessage_1 = require("../../../agent/AgentMessage");
const messageType_1 = require("../../../utils/messageType");
/**
 * Message to communicate the DID a party wish to rotate to.
 *
 * @see https://github.com/hyperledger/aries-rfcs/tree/main/features/0794-did-rotate#rotate
 */
class DidRotateMessage extends AgentMessage_1.AgentMessage {
    /**
     * Create new RotateMessage instance.
     * @param options
     */
    constructor(options) {
        super();
        this.type = DidRotateMessage.type.messageTypeUri;
        if (options) {
            this.id = options.id || this.generateId();
            this.toDid = options.toDid;
        }
    }
}
exports.DidRotateMessage = DidRotateMessage;
DidRotateMessage.type = (0, messageType_1.parseMessageType)('https://didcomm.org/did-rotate/1.0/rotate');
__decorate([
    (0, messageType_1.IsValidMessageType)(DidRotateMessage.type),
    __metadata("design:type", Object)
], DidRotateMessage.prototype, "type", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'to_did' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DidRotateMessage.prototype, "toDid", void 0);
//# sourceMappingURL=DidRotateMessage.js.map