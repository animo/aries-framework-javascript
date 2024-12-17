"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsValidDrpcResponse = IsValidDrpcResponse;
exports.isValidDrpcResponse = isValidDrpcResponse;
const class_validator_1 = require("class-validator");
function IsValidDrpcResponse(validationOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target, propertyKey) => {
        (0, class_validator_1.ValidateBy)({
            name: 'isValidDrpcResponse',
            validator: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                validate: (value) => {
                    // Check if value is a valid DrpcResponseObject, an array of DrpcResponseObject (possibly mixed with empty objects), or an empty object
                    let isValid = false;
                    if (Array.isArray(value)) {
                        if (value.length > 0) {
                            isValid = value.every(isValidDrpcResponse);
                        }
                    }
                    else {
                        isValid = isValidDrpcResponse(value);
                    }
                    if (!isValid) {
                        throw new class_validator_1.ValidationError();
                    }
                    return isValid;
                },
                defaultMessage: (0, class_validator_1.buildMessage)((eachPrefix) => eachPrefix + '$property is not a valid DrpcResponse', validationOptions),
            },
        }, validationOptions)(target, propertyKey);
    };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidDrpcResponse(value) {
    // Check if value is an object
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    // Check if it's an empty object
    if (Object.keys(value).length === 0) {
        return true;
    }
    // Check if it's a valid DrpcResponseObject
    if ('jsonrpc' in value && 'id' in value) {
        // Check if 'result' and 'error' are valid
        if ('result' in value && typeof value.result === 'undefined') {
            return false;
        }
        if ('error' in value && !isValidDrpcResponseError(value.error)) {
            return false;
        }
        return true;
    }
    return false;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidDrpcResponseError(error) {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}
//# sourceMappingURL=ValidResponse.js.map