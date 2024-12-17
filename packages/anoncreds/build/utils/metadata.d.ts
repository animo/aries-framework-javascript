import type { AnonCredsLinkSecretBlindingData } from '../models';
export interface AnonCredsCredentialMetadata {
    schemaId?: string;
    credentialDefinitionId?: string;
    revocationRegistryId?: string;
    credentialRevocationId?: string;
}
export interface AnonCredsCredentialRequestMetadata {
    link_secret_blinding_data: AnonCredsLinkSecretBlindingData;
    link_secret_name: string;
    nonce: string;
}
export interface W3cAnonCredsCredentialMetadata {
    methodName: string;
    credentialRevocationId?: string;
    linkSecretId: string;
}
/**
 * Metadata key for strong metadata on an AnonCreds credential.
 *
 * MUST be used with {@link AnonCredsCredentialMetadata}
 */
export declare const AnonCredsCredentialMetadataKey = "_anoncreds/credential";
/**
 * Metadata key for storing metadata on an AnonCreds credential request.
 *
 * MUST be used with {@link AnonCredsCredentialRequestMetadata}
 */
export declare const AnonCredsCredentialRequestMetadataKey = "_anoncreds/credentialRequest";
/**
 * Metadata key for storing the W3C AnonCreds credential metadata.
 *
 * MUST be used with {@link W3cAnonCredsCredentialMetadata}
 */
export declare const W3cAnonCredsCredentialMetadataKey = "_w3c/anonCredsMetadata";
