"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ed25519Signature2020 = void 0;
const crypto_1 = require("../../../../../crypto");
const utils_1 = require("../../../../../utils");
const constants_1 = require("../../../constants");
const jsonldUtil_1 = require("../../jsonldUtil");
const jsonld_1 = __importDefault(require("../../libraries/jsonld"));
const JwsLinkedDataSignature_1 = require("../JwsLinkedDataSignature");
const constants_2 = require("./constants");
const context2020_1 = require("./context2020");
class Ed25519Signature2020 extends JwsLinkedDataSignature_1.JwsLinkedDataSignature {
    /**
     * @param {object} options - Options hashmap.
     *
     * Either a `key` OR at least one of `signer`/`verifier` is required.
     *
     * @param {object} [options.key] - An optional key object (containing an
     *   `id` property, and either `signer` or `verifier`, depending on the
     *   intended operation. Useful for when the application is managing keys
     *   itself (when using a KMS, you never have access to the private key,
     *   and so should use the `signer` param instead).
     * @param {Function} [options.signer] - Signer function that returns an
     *   object with an async sign() method. This is useful when interfacing
     *   with a KMS (since you don't get access to the private key and its
     *   `signer()`, the KMS client gives you only the signer function to use).
     * @param {Function} [options.verifier] - Verifier function that returns
     *   an object with an async `verify()` method. Useful when working with a
     *   KMS-provided verifier function.
     *
     * Advanced optional parameters and overrides.
     *
     * @param {object} [options.proof] - A JSON-LD document with options to use
     *   for the `proof` node. Any other custom fields can be provided here
     *   using a context different from security-v2).
     * @param {string|Date} [options.date] - Signing date to use if not passed.
     * @param {boolean} [options.useNativeCanonize] - Whether to use a native
     *   canonize algorithm.
     */
    constructor(options) {
        super({
            type: 'Ed25519Signature2020',
            algorithm: 'EdDSA',
            LDKeyClass: options.LDKeyClass,
            contextUrl: constants_2.ED25519_SUITE_CONTEXT_URL_2020,
            key: options.key,
            proof: options.proof,
            date: options.date,
            useNativeCanonize: options.useNativeCanonize,
        });
        this.requiredKeyType = 'Ed25519VerificationKey2020';
    }
    async assertVerificationMethod(document) {
        if (!_includesCompatibleContext({ document: document })) {
            // For DID Documents, since keys do not have their own contexts,
            // the suite context is usually provided by the documentLoader logic
            throw new TypeError(`The '@context' of the verification method (key) MUST contain the context url "${this.contextUrl}".`);
        }
        if (!_isEd2020Key(document)) {
            const verificationMethodType = jsonld_1.default.getValues(document, 'type')[0];
            throw new Error(`Unsupported verification method type '${verificationMethodType}'. Verification method type MUST be 'Ed25519VerificationKey2020'.`);
        }
        else if (_isEd2020Key(document) && !_includesEd2020Context(document)) {
            throw new Error(`For verification method type 'Ed25519VerificationKey2020' the '@context' MUST contain the context url "${constants_2.ED25519_SUITE_CONTEXT_URL_2020}".`);
        }
        // ensure verification method has not been revoked
        if (document.revoked !== undefined) {
            throw new Error('The verification method has been revoked.');
        }
    }
    async getVerificationMethod(options) {
        let verificationMethod = await super.getVerificationMethod({
            proof: options.proof,
            documentLoader: options.documentLoader,
        });
        // convert Ed25519VerificationKey2020 to Ed25519VerificationKey2018
        if (_isEd2020Key(verificationMethod) && _includesEd2020Context(verificationMethod)) {
            // -- convert multibase to base58 --
            const publicKeyBase58 = crypto_1.Key.fromFingerprint(verificationMethod.publicKeyMultibase).publicKeyBase58;
            // -- update type
            verificationMethod.type = 'Ed25519VerificationKey2018';
            verificationMethod = Object.assign(Object.assign({}, verificationMethod), { publicKeyMultibase: undefined, publicKeyBase58 });
        }
        return verificationMethod;
    }
    /**
     * Ensures the document to be signed contains the required signature suite
     * specific `@context`, by either adding it (if `addSuiteContext` is true),
     * or throwing an error if it's missing.
     *
     * @override
     *
     * @param {object} options - Options hashmap.
     * @param {object} options.document - JSON-LD document to be signed.
     * @param {boolean} options.addSuiteContext - Add suite context?
     */
    ensureSuiteContext(options) {
        if (_includesCompatibleContext({ document: options.document })) {
            return;
        }
        super.ensureSuiteContext({ document: options.document, addSuiteContext: options.addSuiteContext });
    }
    /**
     * Checks whether a given proof exists in the document.
     *
     * @override
     *
     * @param {object} options - Options hashmap.
     * @param {object} options.proof - A proof.
     * @param {object} options.document - A JSON-LD document.
     * @param {object} options.purpose - A jsonld-signatures ProofPurpose
     *  instance (e.g. AssertionProofPurpose, AuthenticationProofPurpose, etc).
     * @param {Function} options.documentLoader  - A secure document loader (it is
     *   recommended to use one that provides static known documents, instead of
     *   fetching from the web) for returning contexts, controller documents,
     *   keys, and other relevant URLs needed for the proof.
     *
     * @returns {Promise<boolean>} Whether a match for the proof was found.
     */
    async matchProof(options) {
        if (!_includesCompatibleContext({ document: options.document })) {
            return false;
        }
        return super.matchProof({
            proof: options.proof,
            document: options.document,
            purpose: options.purpose,
            documentLoader: options.documentLoader,
        });
    }
    /**
     * @param options - Options hashmap.
     * @param options.verifyData - The data to sign.
     * @param options.proof - A JSON-LD document with options to use
     *   for the `proof` node. Any other custom fields can be provided here
     *   using a context different from `security-v2`.
     *
     * @returns The proof containing the signature value.
     */
    async sign(options) {
        if (!(this.signer && typeof this.signer.sign === 'function')) {
            throw new Error('A signer API has not been specified.');
        }
        const signature = await this.signer.sign({ data: options.verifyData });
        const encodedSignature = utils_1.MultiBaseEncoder.encode(signature, 'base58btc');
        // create detached content signature
        options.proof.proofValue = encodedSignature;
        return options.proof;
    }
    /**
     * @param options - Options hashmap.
     * @param options.verifyData - The data to verify.
     * @param options.verificationMethod - A verification method.
     * @param options.proof - The proof to be verified.
     *
     * @returns Resolves with the verification result.
     */
    async verifySignature(options) {
        if (!(options.proof.proofValue && typeof options.proof.proofValue === 'string')) {
            throw new TypeError('The proof does not include a valid "proofValue" property.');
        }
        const signature = utils_1.MultiBaseEncoder.decode(options.proof.proofValue).data;
        let { verifier } = this;
        if (!verifier) {
            const key = await this.LDKeyClass.from(options.verificationMethod);
            verifier = key.verifier();
        }
        return verifier.verify({ data: options.verifyData, signature });
    }
}
exports.Ed25519Signature2020 = Ed25519Signature2020;
Ed25519Signature2020.CONTEXT_URL = constants_2.ED25519_SUITE_CONTEXT_URL_2020;
Ed25519Signature2020.CONTEXT = context2020_1.ed25519Signature2020Context.get(constants_2.ED25519_SUITE_CONTEXT_URL_2020);
function _includesCompatibleContext(options) {
    // Handle the unfortunate Ed25519Signature2018 / credentials/v1 collision
    const hasEd2020 = (0, jsonldUtil_1._includesContext)({
        document: options.document,
        contextUrl: constants_2.ED25519_SUITE_CONTEXT_URL_2020,
    });
    const hasCred = (0, jsonldUtil_1._includesContext)({ document: options.document, contextUrl: constants_1.CREDENTIALS_CONTEXT_V1_URL });
    const hasSecV2 = (0, jsonldUtil_1._includesContext)({ document: options.document, contextUrl: constants_1.SECURITY_CONTEXT_URL });
    // Either one by itself is fine, for this suite
    return hasEd2020 || hasCred || hasSecV2;
}
function _isEd2020Key(verificationMethod) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - .hasValue is not part of the public API
    return jsonld_1.default.hasValue(verificationMethod, 'type', 'Ed25519VerificationKey2020');
}
function _includesEd2020Context(document) {
    return (0, jsonldUtil_1._includesContext)({ document, contextUrl: constants_2.ED25519_SUITE_CONTEXT_URL_2020 });
}
//# sourceMappingURL=Ed25519Signature2020.js.map