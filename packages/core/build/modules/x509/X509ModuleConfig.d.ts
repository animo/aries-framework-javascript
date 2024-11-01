import type { AgentContext } from '../../agent';
import type { VerificationContext } from '../vc';
export interface X509ModuleConfigOptions {
    /**
     *
     * Array of trusted base64-encoded certificate strings in the DER-format.
     */
    trustedCertificates?: [string, ...string[]];
    /**
     * Optional callback method that will be called to dynamically get trusted certificates for a verification.
     * It will always provide the `agentContext` allowing to dynamically set the trusted certificates for a tenant.
     * If available the associated record id is also provided allowing to filter down trusted certificates to a single
     * exchange.
     *
     * @returns An array of base64-encoded certificate strings or PEM certificate strings.
     */
    getTrustedCertificatesForVerification?(agentContext: AgentContext, verificationContext?: VerificationContext): Promise<[string, ...string[]] | undefined>;
}
export declare class X509ModuleConfig {
    private options;
    constructor(options?: X509ModuleConfigOptions);
    get trustedCertificates(): [string, ...string[]] | undefined;
    get getTrustedCertificatesForVerification(): ((agentContext: AgentContext, verificationContext?: VerificationContext) => Promise<[string, ...string[]] | undefined>) | undefined;
    setTrustedCertificatesForVerification(fn: X509ModuleConfigOptions['getTrustedCertificatesForVerification']): void;
    setTrustedCertificates(trustedCertificates?: [string, ...string[]]): void;
    addTrustedCertificate(trustedCertificate: string): void;
}
