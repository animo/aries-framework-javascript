import type { MdocSignOptions, MdocNameSpaces, MdocVerifyOptions } from './MdocOptions';
import type { AgentContext } from '../../agent';
import { JwaSignatureAlgorithm } from '../../crypto';
/**
 * This class represents a IssuerSigned Mdoc Document,
 * which are the actual credentials being issued to holders.
 */
export declare class Mdoc {
    private issuerSignedDocument;
    base64Url: string;
    private constructor();
    static fromBase64Url(mdocBase64Url: string, expectedDocType?: string): Mdoc;
    static fromIssuerSignedDocument(issuerSignedBase64Url: string, expectedDocType?: string): Mdoc;
    static fromDeviceSignedDocument(issuerSignedBase64Url: string, deviceSignedBase64Url: string, expectedDocType?: string): Mdoc;
    get docType(): string;
    get alg(): JwaSignatureAlgorithm;
    get validityInfo(): import("@protokoll/mdoc-client").ValidityInfo;
    get deviceSignedNamespaces(): MdocNameSpaces;
    get issuerSignedNamespaces(): MdocNameSpaces;
    static sign(agentContext: AgentContext, options: MdocSignOptions): Promise<Mdoc>;
    verify(agentContext: AgentContext, options?: MdocVerifyOptions): Promise<{
        isValid: true;
    } | {
        isValid: false;
        error: string;
    }>;
}
