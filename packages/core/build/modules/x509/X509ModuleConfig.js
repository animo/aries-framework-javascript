"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.X509ModuleConfig = void 0;
class X509ModuleConfig {
    constructor(options) {
        this.options = {
            getTrustedCertificatesForVerification: options === null || options === void 0 ? void 0 : options.getTrustedCertificatesForVerification,
            trustedCertificates: (options === null || options === void 0 ? void 0 : options.trustedCertificates) ? [...options.trustedCertificates] : undefined,
        };
    }
    get trustedCertificates() {
        return this.options.trustedCertificates;
    }
    get getTrustedCertificatesForVerification() {
        return this.options.getTrustedCertificatesForVerification;
    }
    setTrustedCertificatesForVerification(fn) {
        this.options.getTrustedCertificatesForVerification = fn;
    }
    setTrustedCertificates(trustedCertificates) {
        this.options.trustedCertificates = trustedCertificates ? [...trustedCertificates] : undefined;
    }
    addTrustedCertificate(trustedCertificate) {
        if (!this.options.trustedCertificates) {
            this.options.trustedCertificates = [trustedCertificate];
            return;
        }
        this.options.trustedCertificates.push(trustedCertificate);
    }
}
exports.X509ModuleConfig = X509ModuleConfig;
//# sourceMappingURL=X509ModuleConfig.js.map