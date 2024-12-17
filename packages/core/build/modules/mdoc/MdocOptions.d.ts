import type { Mdoc } from './Mdoc';
import type { Key } from '../../crypto/Key';
import type { DifPresentationExchangeDefinition } from '../dif-presentation-exchange';
import type { EncodedX509Certificate } from '../x509';
import type { ValidityInfo } from '@animo-id/mdoc';
export type MdocNameSpaces = Record<string, Record<string, unknown>>;
export type MdocVerifyOptions = {
    trustedCertificates?: EncodedX509Certificate[];
    now?: Date;
};
export type MdocOpenId4VpSessionTranscriptOptions = {
    responseUri: string;
    clientId: string;
    verifierGeneratedNonce: string;
    mdocGeneratedNonce: string;
};
export type MdocDeviceResponseOpenId4VpOptions = {
    mdocs: [Mdoc, ...Mdoc[]];
    presentationDefinition: DifPresentationExchangeDefinition;
    deviceNameSpaces?: MdocNameSpaces;
    sessionTranscriptOptions: MdocOpenId4VpSessionTranscriptOptions;
};
export type MdocDocRequest = {
    itemsRequestData: {
        docType: string;
        nameSpaces: Record<string, Record<string, boolean>>;
    };
};
export type MdocDcqlDeviceResponseOpenId4VpOptions = {
    mdoc: Mdoc;
    docRequest: MdocDocRequest;
    deviceNameSpaces?: MdocNameSpaces;
    sessionTranscriptOptions: MdocOpenId4VpSessionTranscriptOptions;
};
export type MdocDeviceResponseVerifyOptions = {
    trustedCertificates?: EncodedX509Certificate[];
    sessionTranscriptOptions: MdocOpenId4VpSessionTranscriptOptions;
    /**
     * The base64Url-encoded device response string.
     */
    deviceResponse: string;
    now?: Date;
};
export type MdocSignOptions = {
    docType: 'org.iso.18013.5.1.mDL' | (string & {});
    validityInfo?: Partial<ValidityInfo>;
    namespaces: MdocNameSpaces;
    /**
     *
     * The trusted base64-encoded issuer certificate string in the DER-format.
     */
    issuerCertificate: string;
    holderKey: Key;
};