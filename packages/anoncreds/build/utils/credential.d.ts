import type { AnonCredsSchema, AnonCredsCredentialValues } from '../models';
import type { CredentialPreviewAttributeOptions, LinkedAttachment } from '@credo-ts/core';
export type AnonCredsClaimRecord = Record<string, string | number>;
export interface AnonCredsCredentialValue {
    raw: string;
    encoded: string;
}
/**
 * Encode value according to the encoding format described in Aries RFC 0036/0037
 *
 * @param value
 * @returns Encoded version of value
 *
 * @see https://github.com/hyperledger/aries-cloudagent-python/blob/0000f924a50b6ac5e6342bff90e64864672ee935/aries_cloudagent/messaging/util.py#L106-L136
 * @see https://github.com/hyperledger/aries-rfcs/blob/be4ad0a6fb2823bb1fc109364c96f077d5d8dffa/features/0037-present-proof/README.md#verifying-claims-of-indy-based-verifiable-credentials
 * @see https://github.com/hyperledger/aries-rfcs/blob/be4ad0a6fb2823bb1fc109364c96f077d5d8dffa/features/0036-issue-credential/README.md#encoding-claims-for-indy-based-verifiable-credentials
 */
export declare function encodeCredentialValue(value: unknown): string;
export declare const mapAttributeRawValuesToAnonCredsCredentialValues: (record: AnonCredsClaimRecord) => Record<string, AnonCredsCredentialValue>;
/**
 * Converts int value to string
 * Converts string value:
 * - hash with sha256,
 * - convert to byte array and reverse it
 * - convert it to BigInteger and return as a string
 * @param attributes
 *
 * @returns CredValues
 */
export declare function convertAttributesToCredentialValues(attributes: CredentialPreviewAttributeOptions[]): AnonCredsCredentialValues;
/**
 * Check whether the values of two credentials match (using {@link assertCredentialValuesMatch})
 *
 * @returns a boolean whether the values are equal
 *
 */
export declare function checkCredentialValuesMatch(firstValues: AnonCredsCredentialValues, secondValues: AnonCredsCredentialValues): boolean;
/**
 * Assert two credential values objects match.
 *
 * @param firstValues The first values object
 * @param secondValues The second values object
 *
 * @throws If not all values match
 */
export declare function assertCredentialValuesMatch(firstValues: AnonCredsCredentialValues, secondValues: AnonCredsCredentialValues): void;
/**
 * Check whether the raw value matches the encoded version according to the encoding format described in Aries RFC 0037
 * Use this method to ensure the received proof (over the encoded) value is the same as the raw value of the data.
 *
 * @param raw
 * @param encoded
 * @returns Whether raw and encoded value match
 *
 * @see https://github.com/hyperledger/aries-framework-dotnet/blob/a18bef91e5b9e4a1892818df7408e2383c642dfa/src/Hyperledger.Aries/Utils/CredentialUtils.cs#L78-L89
 * @see https://github.com/hyperledger/aries-rfcs/blob/be4ad0a6fb2823bb1fc109364c96f077d5d8dffa/features/0037-present-proof/README.md#verifying-claims-of-indy-based-verifiable-credentials
 */
export declare function checkValidCredentialValueEncoding(raw: unknown, encoded: string): boolean;
export declare function assertAttributesMatch(schema: AnonCredsSchema, attributes: CredentialPreviewAttributeOptions[]): void;
/**
 * Adds attribute(s) to the credential preview that is linked to the given attachment(s)
 *
 * @param attachments a list of the attachments that need to be linked to a credential
 * @param preview the credential previews where the new linked credential has to be appended to
 *
 * @returns a modified version of the credential preview with the linked credentials
 * */
export declare function createAndLinkAttachmentsToPreview(attachments: LinkedAttachment[], previewAttributes: CredentialPreviewAttributeOptions[]): CredentialPreviewAttributeOptions[];
