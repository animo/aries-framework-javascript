"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportedVerificationMethodTypesFromKeyType = exports.getKeyFromVerificationMethod = exports.getKeyDidMappingByKeyType = void 0;
var keyDidMapping_1 = require("./keyDidMapping");
Object.defineProperty(exports, "getKeyDidMappingByKeyType", { enumerable: true, get: function () { return keyDidMapping_1.getKeyDidMappingByKeyType; } });
Object.defineProperty(exports, "getKeyFromVerificationMethod", { enumerable: true, get: function () { return keyDidMapping_1.getKeyFromVerificationMethod; } });
Object.defineProperty(exports, "getSupportedVerificationMethodTypesFromKeyType", { enumerable: true, get: function () { return keyDidMapping_1.getSupportedVerificationMethodTypesFromKeyType; } });
__exportStar(require("./bls12381g2"), exports);
__exportStar(require("./bls12381g1"), exports);
__exportStar(require("./bls12381g1g2"), exports);
__exportStar(require("./ed25519"), exports);
__exportStar(require("./x25519"), exports);
//# sourceMappingURL=index.js.map