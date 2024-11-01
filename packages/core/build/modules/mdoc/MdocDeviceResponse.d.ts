import type { MdocDeviceResponseOpenId4VpOptions, MdocDeviceResponseVerifyOptions } from './MdocOptions';
import type { AgentContext } from '../../agent';
import type { DifPresentationExchangeDefinition } from '../dif-presentation-exchange';
import type { InputDescriptorV2 } from '@sphereon/pex-models';
import { Mdoc } from './Mdoc';
export declare class MdocDeviceResponse {
    base64Url: string;
    documents: Mdoc[];
    private constructor();
    static fromBase64Url(base64Url: string): MdocDeviceResponse;
    private static assertMdocInputDescriptor;
    static partitionPresentationDefinition: (pd: DifPresentationExchangeDefinition) => {
        mdocPresentationDefinition: {
            format: {
                mso_mdoc: import("@sphereon/pex-models").MsoMdocObject | undefined;
            };
            input_descriptors: {
                format: {
                    mso_mdoc: import("@sphereon/pex-models").MsoMdocObject;
                };
                constraints: {
                    limit_disclosure: string;
                    fields: {
                        intent_to_retain: boolean;
                        id?: string;
                        path: Array<string>;
                        purpose?: string;
                        filter?: import("@sphereon/pex-models").FilterV2;
                        predicate?: import("@sphereon/pex-models").Optionality;
                        name?: string;
                        optional?: boolean;
                    }[];
                    statuses?: import("@sphereon/pex-models").Statuses;
                    subject_is_issuer?: import("@sphereon/pex-models").Optionality;
                    is_holder?: Array<import("@sphereon/pex-models").HolderSubject>;
                    same_subject?: Array<import("@sphereon/pex-models").HolderSubject>;
                };
                id: string;
                name?: string;
                purpose?: string;
                group?: Array<string>;
                issuance?: Array<import("@sphereon/pex-models").Issuance>;
            }[];
            id: string;
            name?: string;
            purpose?: string;
            submission_requirements?: Array<import("@sphereon/pex-models").SubmissionRequirement>;
        } | {
            format: {
                mso_mdoc: import("@sphereon/pex-models").MsoMdocObject | undefined;
            };
            input_descriptors: {
                format: {
                    mso_mdoc: import("@sphereon/pex-models").MsoMdocObject;
                };
                constraints: {
                    limit_disclosure: string;
                    fields: {
                        intent_to_retain: boolean;
                        id?: string;
                        path: Array<string>;
                        purpose?: string;
                        filter?: import("@sphereon/pex-models").FilterV2;
                        predicate?: import("@sphereon/pex-models").Optionality;
                        name?: string;
                        optional?: boolean;
                    }[];
                    statuses?: import("@sphereon/pex-models").Statuses;
                    subject_is_issuer?: import("@sphereon/pex-models").Optionality;
                    is_holder?: Array<import("@sphereon/pex-models").HolderSubject>;
                    same_subject?: Array<import("@sphereon/pex-models").HolderSubject>;
                };
                id: string;
                name?: string;
                purpose?: string;
                group?: Array<string>;
                issuance?: Array<import("@sphereon/pex-models").Issuance>;
            }[];
            id: string;
            name?: string;
            purpose?: string;
            submission_requirements?: Array<import("@sphereon/pex-models").SubmissionRequirement>;
            frame?: object;
        };
        nonMdocPresentationDefinition: DifPresentationExchangeDefinition;
    };
    private static createPresentationSubmission;
    static limitDisclosureToInputDescriptor(options: {
        inputDescriptor: InputDescriptorV2;
        mdoc: Mdoc;
    }): {
        [k: string]: {
            [k: string]: unknown;
        };
    };
    static createOpenId4VpDeviceResponse(agentContext: AgentContext, options: MdocDeviceResponseOpenId4VpOptions): Promise<{
        deviceResponseBase64Url: string;
        presentationSubmission: {
            id: string;
            definition_id: string;
            descriptor_map: {
                id: string;
                format: string;
                path: string;
            }[];
        };
    }>;
    verify(agentContext: AgentContext, options: Omit<MdocDeviceResponseVerifyOptions, 'deviceResponse'>): Promise<Mdoc[]>;
}
