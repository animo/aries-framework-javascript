import type { OpenId4VcUpdateIssuerRecordOptions, OpenId4VciCreateCredentialOfferOptions, OpenId4VciCreateCredentialResponseOptions, OpenId4VciCreateIssuerOptions, OpenId4VciCreateStatelessCredentialOfferOptions } from './OpenId4VcIssuerServiceOptions';
import { AgentContext } from '@credo-ts/core';
import { OpenId4VcIssuerModuleConfig } from './OpenId4VcIssuerModuleConfig';
import { OpenId4VcIssuerService } from './OpenId4VcIssuerService';
/**
 * @public
 * This class represents the API for interacting with the OpenID4VC Issuer service.
 * It provides methods for creating a credential offer, creating a response to a credential issuance request,
 * and retrieving a credential offer from a URI.
 */
export declare class OpenId4VcIssuerApi {
    readonly config: OpenId4VcIssuerModuleConfig;
    private agentContext;
    private openId4VcIssuerService;
    constructor(config: OpenId4VcIssuerModuleConfig, agentContext: AgentContext, openId4VcIssuerService: OpenId4VcIssuerService);
    getAllIssuers(): Promise<import("./repository").OpenId4VcIssuerRecord[]>;
    getIssuerByIssuerId(issuerId: string): Promise<import("./repository").OpenId4VcIssuerRecord>;
    /**
     * Creates an issuer and stores the corresponding issuer metadata. Multiple issuers can be created, to allow different sets of
     * credentials to be issued with each issuer.
     */
    createIssuer(options: OpenId4VciCreateIssuerOptions): Promise<import("./repository").OpenId4VcIssuerRecord>;
    /**
     * Rotate the key used for signing access tokens for the issuer with the given issuerId.
     */
    rotateAccessTokenSigningKey(issuerId: string): Promise<void>;
    updateIssuerMetadata(options: OpenId4VcUpdateIssuerRecordOptions): Promise<void>;
    /**
     * Creates a stateless credential offer. This can only be used with an external authorization server, as credo only supports statefull
     * crednetial offers.
     */
    createStatelessCredentialOffer(options: OpenId4VciCreateStatelessCredentialOfferOptions & {
        issuerId: string;
    }): Promise<{
        credentialOffer: string;
        credentialOfferObject: {
            credential_issuer: string;
            credential_configuration_ids: string[];
            grants?: ({
                authorization_code?: ({
                    issuer_state?: string | undefined;
                    authorization_server?: string | undefined;
                } & {
                    [key: string]: unknown;
                }) | undefined;
                "urn:ietf:params:oauth:grant-type:pre-authorized_code"?: ({
                    'pre-authorized_code': string;
                    authorization_server?: string | undefined;
                    tx_code?: ({
                        length?: number | undefined;
                        description?: string | undefined;
                        input_mode?: "text" | "numeric" | undefined;
                    } & {
                        [key: string]: unknown;
                    }) | undefined;
                } & {
                    [key: string]: unknown;
                }) | undefined;
            } & {
                [key: string]: unknown;
            }) | undefined;
        } & {
            [key: string]: unknown;
        };
    }>;
    /**
     * Creates a credential offer. Either the preAuthorizedCodeFlowConfig or the authorizationCodeFlowConfig must be provided.
     *
     * @returns Object containing the payload of the credential offer and the credential offer request, which can be sent to the wallet.
     */
    createCredentialOffer(options: OpenId4VciCreateCredentialOfferOptions & {
        issuerId: string;
    }): Promise<{
        issuanceSession: import("./repository").OpenId4VcIssuanceSessionRecord;
        credentialOffer: string;
    }>;
    /**
     * This function creates a response which can be send to the holder after receiving a credential issuance request.
     */
    createCredentialResponse(options: OpenId4VciCreateCredentialResponseOptions & {
        issuanceSessionId: string;
    }): Promise<{
        credentialResponse: {
            c_nonce?: string | undefined;
            c_nonce_expires_in?: number | undefined;
            credentials?: (string | {
                [x: string]: any;
            })[] | undefined;
            credential?: string | {
                [x: string]: any;
            } | undefined;
            transaction_id?: string | undefined;
            notification_id?: string | undefined;
        } & {
            [key: string]: unknown;
        };
        issuanceSession: import("./repository").OpenId4VcIssuanceSessionRecord;
    }>;
    getIssuerMetadata(issuerId: string): Promise<import("@animo-id/oid4vci").IssuerMetadataResult>;
    getIssuanceSessionById(issuanceSessionId: string): Promise<import("./repository").OpenId4VcIssuanceSessionRecord>;
}
