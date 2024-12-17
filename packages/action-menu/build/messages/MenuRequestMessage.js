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
exports.MenuRequestMessage = void 0;
const core_1 = require("@credo-ts/core");
/**
 * @internal
 */
class MenuRequestMessage extends core_1.AgentMessage {
    constructor(options) {
        var _a;
        super();
        this.type = MenuRequestMessage.type.messageTypeUri;
        if (options) {
            this.id = (_a = options.id) !== null && _a !== void 0 ? _a : this.generateId();
        }
    }
}
exports.MenuRequestMessage = MenuRequestMessage;
MenuRequestMessage.type = (0, core_1.parseMessageType)('https://didcomm.org/action-menu/1.0/menu-request');
__decorate([
    (0, core_1.IsValidMessageType)(MenuRequestMessage.type),
    __metadata("design:type", Object)
], MenuRequestMessage.prototype, "type", void 0);
//# sourceMappingURL=MenuRequestMessage.js.map