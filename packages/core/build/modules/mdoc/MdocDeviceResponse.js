"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MdocDeviceResponse = void 0;
const mdoc_1 = require("@animo-id/mdoc");
const error_1 = require("../../error");
const uuid_1 = require("../../utils/uuid");
const vc_1 = require("../vc");
const X509Certificate_1 = require("../x509/X509Certificate");
const X509ModuleConfig_1 = require("../x509/X509ModuleConfig");
const utils_1 = require("./../../utils");
const Mdoc_1 = require("./Mdoc");
const MdocContext_1 = require("./MdocContext");
const MdocError_1 = require("./MdocError");
const mdocUtil_1 = require("./mdocUtil");
class MdocDeviceResponse {
    constructor(base64Url, documents) {
        this.base64Url = base64Url;
        this.documents = documents;
    }
    /**
     * claim format is convenience method added to all credential instances
     */
    get claimFormat() {
        return vc_1.ClaimFormat.MsoMdoc;
    }
    /**
     * Encoded is convenience method added to all credential instances
     */
    get encoded() {
        return this.base64Url;
    }
    static fromBase64Url(base64Url) {
        const parsed = (0, mdoc_1.parseDeviceResponse)(utils_1.TypedArrayEncoder.fromBase64(base64Url));
        if (parsed.status !== mdoc_1.MDocStatus.OK) {
            throw new MdocError_1.MdocError(`Parsing Mdoc Device Response failed.`);
        }
        const documents = parsed.documents.map((doc) => {
            const prepared = doc.prepare();
            const docType = prepared.get('docType');
            const issuerSigned = (0, mdoc_1.cborEncode)(prepared.get('issuerSigned'));
            const deviceSigned = (0, mdoc_1.cborEncode)(prepared.get('deviceSigned'));
            return Mdoc_1.Mdoc.fromDeviceSignedDocument(utils_1.TypedArrayEncoder.toBase64URL(issuerSigned), utils_1.TypedArrayEncoder.toBase64URL(deviceSigned), docType);
        });
        documents[0].deviceSignedNamespaces;
        return new _a(base64Url, documents);
    }
    static assertMdocInputDescriptor(inputDescriptor) {
        var _b, _c, _d, _e;
        if (!inputDescriptor.format || !inputDescriptor.format.mso_mdoc) {
            throw new MdocError_1.MdocError(`Input descriptor must contain 'mso_mdoc' format property`);
        }
        if (!inputDescriptor.format.mso_mdoc.alg) {
            throw new MdocError_1.MdocError(`Input descriptor mso_mdoc must contain 'alg' property`);
        }
        if (!((_b = inputDescriptor.constraints) === null || _b === void 0 ? void 0 : _b.limit_disclosure) || inputDescriptor.constraints.limit_disclosure !== 'required') {
            throw new MdocError_1.MdocError(`Input descriptor must contain 'limit_disclosure' constraints property which is set to required`);
        }
        if (!((_d = (_c = inputDescriptor.constraints) === null || _c === void 0 ? void 0 : _c.fields) === null || _d === void 0 ? void 0 : _d.every((field) => field.intent_to_retain !== undefined))) {
            throw new MdocError_1.MdocError(`Input descriptor must contain 'intent_to_retain' constraints property`);
        }
        return Object.assign(Object.assign({}, inputDescriptor), { format: {
                mso_mdoc: inputDescriptor.format.mso_mdoc,
            }, constraints: Object.assign(Object.assign({}, inputDescriptor.constraints), { limit_disclosure: 'required', fields: ((_e = inputDescriptor.constraints.fields) !== null && _e !== void 0 ? _e : []).map((field) => {
                    var _b;
                    return Object.assign(Object.assign({}, field), { intent_to_retain: (_b = field.intent_to_retain) !== null && _b !== void 0 ? _b : false });
                }) }) });
    }
    static createPresentationSubmission(input) {
        const { id, presentationDefinition } = input;
        if (presentationDefinition.input_descriptors.length !== 1) {
            throw new MdocError_1.MdocError('Currently Mdoc Presentation Submissions can only be created for a sigle input descriptor');
        }
        return {
            id,
            definition_id: presentationDefinition.id,
            descriptor_map: [
                {
                    id: presentationDefinition.input_descriptors[0].id,
                    format: 'mso_mdoc',
                    path: '$',
                },
            ],
        };
    }
    static limitDisclosureToInputDescriptor(options) {
        const { mdoc } = options;
        const inputDescriptor = this.assertMdocInputDescriptor(options.inputDescriptor);
        const _mdoc = (0, mdoc_1.parseIssuerSigned)(utils_1.TypedArrayEncoder.fromBase64(mdoc.base64Url), mdoc.docType);
        const disclosure = (0, mdoc_1.limitDisclosureToInputDescriptor)(_mdoc, inputDescriptor);
        const disclosedPayloadAsRecord = Object.fromEntries(Array.from(disclosure.entries()).map(([namespace, issuerSignedItem]) => {
            return [
                namespace,
                Object.fromEntries(issuerSignedItem.map((item) => [item.elementIdentifier, item.elementValue])),
            ];
        }));
        return disclosedPayloadAsRecord;
    }
    static async createDeviceResponse(agentContext, options) {
        var _b;
        const { sessionTranscriptOptions } = options;
        const issuerSignedDocuments = options.mdocs.map((mdoc) => (0, mdoc_1.parseIssuerSigned)(utils_1.TypedArrayEncoder.fromBase64(mdoc.base64Url), mdoc.docType));
        const mdoc = new mdoc_1.MDoc(issuerSignedDocuments);
        // TODO: we need to implement this differently.
        // TODO: Multiple Mdocs can have different device keys.
        const mso = mdoc.documents[0].issuerSigned.issuerAuth.decodedPayload;
        const deviceKeyInfo = mso.deviceKeyInfo;
        if (!(deviceKeyInfo === null || deviceKeyInfo === void 0 ? void 0 : deviceKeyInfo.deviceKey)) {
            throw new error_1.CredoError('Device key info is missing');
        }
        const publicDeviceJwk = mdoc_1.COSEKey.import(deviceKeyInfo.deviceKey).toJWK();
        const deviceResponseBuilder = mdoc_1.DeviceResponse.from(mdoc)
            .usingSessionTranscriptForOID4VP(sessionTranscriptOptions)
            .authenticateWithSignature(publicDeviceJwk, 'ES256');
        if (options.presentationDefinition) {
            deviceResponseBuilder.usingPresentationDefinition(options.presentationDefinition);
        }
        else if (options.docRequests) {
            const deviceRequest = mdoc_1.DeviceRequest.from('1.0', options.docRequests.map((r) => (Object.assign(Object.assign({}, r), { itemsRequestData: Object.assign(Object.assign({}, r.itemsRequestData), { nameSpaces: (0, mdocUtil_1.nameSpacesRecordToMap)(r.itemsRequestData.nameSpaces) }) }))));
            deviceResponseBuilder.usingDeviceRequest(deviceRequest);
        }
        for (const [nameSpace, nameSpaceValue] of Object.entries((_b = options.deviceNameSpaces) !== null && _b !== void 0 ? _b : {})) {
            deviceResponseBuilder.addDeviceNameSpace(nameSpace, nameSpaceValue);
        }
        const deviceResponseMdoc = await deviceResponseBuilder.sign((0, MdocContext_1.getMdocContext)(agentContext));
        return { deviceResponseBase64Url: utils_1.TypedArrayEncoder.toBase64URL(deviceResponseMdoc.encode()) };
    }
    static async createOpenId4VpDcqlDeviceResponse(agentContext, options) {
        return this.createDeviceResponse(agentContext, Object.assign(Object.assign({}, options), { docRequests: [options.docRequest], mdocs: [options.mdoc] }));
    }
    static async createOpenId4VpDeviceResponse(agentContext, options) {
        const presentationDefinition = this.partitionPresentationDefinition(options.presentationDefinition).mdocPresentationDefinition;
        const { deviceResponseBase64Url } = await this.createDeviceResponse(agentContext, Object.assign(Object.assign({}, options), { presentationDefinition }));
        return {
            deviceResponseBase64Url,
            presentationSubmission: _a.createPresentationSubmission({
                id: 'MdocPresentationSubmission ' + (0, uuid_1.uuid)(),
                presentationDefinition,
            }),
        };
    }
    async verify(agentContext, options) {
        const verifier = new mdoc_1.Verifier();
        const mdocContext = (0, MdocContext_1.getMdocContext)(agentContext);
        const x509Config = agentContext.dependencyManager.resolve(X509ModuleConfig_1.X509ModuleConfig);
        // TODO: no way to currently have a per document x509 certificates in a presentation
        // but this also the case for other
        // FIXME: we can't pass multiple certificate chains. We should just verify each document separately
        let trustedCertificates = options.trustedCertificates;
        if (!trustedCertificates) {
            trustedCertificates = (await Promise.all(this.documents.map((mdoc) => {
                var _b;
                const certificateChain = mdoc.issuerSignedCertificateChain.map((cert) => X509Certificate_1.X509Certificate.fromRawCertificate(cert));
                return (_b = x509Config.getTrustedCertificatesForVerification) === null || _b === void 0 ? void 0 : _b.call(x509Config, agentContext, {
                    certificateChain,
                    verification: {
                        type: 'credential',
                        credential: mdoc,
                    },
                });
            })))
                .filter((c) => c !== undefined)
                .flatMap((c) => c);
        }
        if (!trustedCertificates) {
            throw new MdocError_1.MdocError('No trusted certificates found. Cannot verify mdoc.');
        }
        const result = await verifier.verifyDeviceResponse({
            encodedDeviceResponse: utils_1.TypedArrayEncoder.fromBase64(this.base64Url),
            //ephemeralReaderKey: options.verifierKey ? getJwkFromKey(options.verifierKey).toJson() : undefined,
            encodedSessionTranscript: mdoc_1.DeviceResponse.calculateSessionTranscriptForOID4VP(options.sessionTranscriptOptions),
            trustedCertificates: trustedCertificates.map((cert) => X509Certificate_1.X509Certificate.fromEncodedCertificate(cert).rawCertificate),
            now: options.now,
        }, mdocContext);
        if (result.documentErrors.length > 1) {
            throw new MdocError_1.MdocError('Device response verification failed.');
        }
        if (result.status !== mdoc_1.MDocStatus.OK) {
            throw new MdocError_1.MdocError('Device response verification failed. An unknown error occurred.');
        }
        return this.documents;
    }
}
exports.MdocDeviceResponse = MdocDeviceResponse;
_a = MdocDeviceResponse;
MdocDeviceResponse.partitionPresentationDefinition = (pd) => {
    var _b;
    const nonMdocPresentationDefinition = Object.assign(Object.assign({}, pd), { input_descriptors: pd.input_descriptors.filter((id) => { var _b; return !Object.keys((_b = id.format) !== null && _b !== void 0 ? _b : {}).includes('mso_mdoc'); }) });
    const mdocPresentationDefinition = Object.assign(Object.assign({}, pd), { format: { mso_mdoc: (_b = pd.format) === null || _b === void 0 ? void 0 : _b.mso_mdoc }, input_descriptors: pd.input_descriptors
            .filter((id) => { var _b; return Object.keys((_b = id.format) !== null && _b !== void 0 ? _b : {}).includes('mso_mdoc'); })
            .map(_a.assertMdocInputDescriptor) });
    return { mdocPresentationDefinition, nonMdocPresentationDefinition };
};
//# sourceMappingURL=MdocDeviceResponse.js.map