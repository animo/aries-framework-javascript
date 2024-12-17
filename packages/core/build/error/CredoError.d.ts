import { BaseError } from './BaseError';
export declare class CredoError extends BaseError {
    /**
     * Create base CredoError.
     * @param message the error message
     * @param cause the error that caused this error to be created
     */
    constructor(message: string, { cause }?: {
        cause?: Error;
    });
}
