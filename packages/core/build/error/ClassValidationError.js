"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassValidationError = void 0;
const CredoError_1 = require("./CredoError");
class ClassValidationError extends CredoError_1.CredoError {
    validationErrorsToString() {
        var _a, _b;
        return (_b = (_a = this.validationErrors) === null || _a === void 0 ? void 0 : _a.map((error) => error.toString(true)).join('\n')) !== null && _b !== void 0 ? _b : '';
    }
    constructor(message, { classType, cause, validationErrors }) {
        const validationErrorsStringified = validationErrors === null || validationErrors === void 0 ? void 0 : validationErrors.map((error) => error.toString(undefined, undefined, undefined, true)).join('\n');
        super(`${classType}: ${message}
${validationErrorsStringified}`, { cause });
        this.validationErrors = validationErrors !== null && validationErrors !== void 0 ? validationErrors : [];
    }
}
exports.ClassValidationError = ClassValidationError;
//# sourceMappingURL=ClassValidationError.js.map