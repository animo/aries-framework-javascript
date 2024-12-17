"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyDidResolver = void 0;
const DidKey_1 = require("./DidKey");
class KeyDidResolver {
    constructor() {
        this.supportedMethods = ['key'];
        /**
         * No remote resolving done, did document is dynamically constructed. To not pollute the cache we don't allow caching
         */
        this.allowsCaching = false;
        /**
         * Easier to calculate for resolving than serving the local did document. Record also doesn't
         * have a did document
         */
        this.allowsLocalDidRecord = false;
    }
    async resolve(agentContext, did) {
        const didDocumentMetadata = {};
        try {
            const didDocument = DidKey_1.DidKey.fromDid(did).didDocument;
            return {
                didDocument,
                didDocumentMetadata,
                didResolutionMetadata: { contentType: 'application/did+ld+json' },
            };
        }
        catch (error) {
            return {
                didDocument: null,
                didDocumentMetadata,
                didResolutionMetadata: {
                    error: 'notFound',
                    message: `resolver_error: Unable to resolve did '${did}': ${error}`,
                },
            };
        }
    }
}
exports.KeyDidResolver = KeyDidResolver;
//# sourceMappingURL=KeyDidResolver.js.map