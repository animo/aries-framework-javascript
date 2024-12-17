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
exports.AnonCredsRestrictionWrapper = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AnonCredsRestriction_1 = require("./AnonCredsRestriction");
class AnonCredsRestrictionWrapper {
}
exports.AnonCredsRestrictionWrapper = AnonCredsRestrictionWrapper;
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AnonCredsRestriction_1.AnonCredsRestriction),
    (0, AnonCredsRestriction_1.AnonCredsRestrictionTransformer)(),
    __metadata("design:type", Array)
], AnonCredsRestrictionWrapper.prototype, "restrictions", void 0);
//# sourceMappingURL=AnonCredsRestrictionWrapper.js.map