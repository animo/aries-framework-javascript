import type { CredentialPreviewOptions } from '@credo-ts/core';
import { CredentialPreviewAttribute } from '@credo-ts/core';
/**
 * Credential preview inner message class.
 *
 * This is not a message but an inner object for other messages in this protocol. It is used construct a preview of the data for the credential.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/master/features/0036-issue-credential/README.md#preview-credential
 */
export declare class V1CredentialPreview {
    constructor(options: CredentialPreviewOptions);
    readonly type: string;
    static readonly type: import("@credo-ts/core").ParsedMessageType;
    attributes: CredentialPreviewAttribute[];
    toJSON(): Record<string, unknown>;
    /**
     * Create a credential preview from a record with name and value entries.
     *
     * @example
     * const preview = CredentialPreview.fromRecord({
     *   name: "Bob",
     *   age: "20"
     * })
     */
    static fromRecord(record: Record<string, string>): V1CredentialPreview;
}
