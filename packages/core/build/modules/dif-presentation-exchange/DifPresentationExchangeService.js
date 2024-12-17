"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifPresentationExchangeService = void 0;
const pex_1 = require("@animo-id/pex");
const tsyringe_1 = require("tsyringe");
const crypto_1 = require("../../crypto");
const error_1 = require("../../error");
const utils_1 = require("../../utils");
const dids_1 = require("../dids");
const mdoc_1 = require("../mdoc");
const MdocDeviceResponse_1 = require("../mdoc/MdocDeviceResponse");
const sd_jwt_vc_1 = require("../sd-jwt-vc");
const vc_1 = require("../vc");
const IAnonCredsDataIntegrityService_1 = require("../vc/data-integrity/models/IAnonCredsDataIntegrityService");
const DifPresentationExchangeError_1 = require("./DifPresentationExchangeError");
const models_1 = require("./models");
const utils_2 = require("./utils");
/**
 * @todo create a public api for using dif presentation exchange
 */
let DifPresentationExchangeService = class DifPresentationExchangeService {
    constructor(w3cCredentialService) {
        this.w3cCredentialService = w3cCredentialService;
        this.pex = new pex_1.PEX({ hasher: crypto_1.Hasher.hash });
    }
    async getCredentialsForRequest(agentContext, presentationDefinition) {
        const credentialRecords = await this.queryCredentialForPresentationDefinition(agentContext, presentationDefinition);
        return (0, utils_2.getCredentialsForRequest)(this.pex, presentationDefinition, credentialRecords);
    }
    /**
     * Selects the credentials to use based on the output from `getCredentialsForRequest`
     * Use this method if you don't want to manually select the credentials yourself.
     */
    selectCredentialsForRequest(credentialsForRequest) {
        if (!credentialsForRequest.areRequirementsSatisfied) {
            throw new error_1.CredoError('Could not find the required credentials for the presentation submission');
        }
        const credentials = {};
        for (const requirement of credentialsForRequest.requirements) {
            for (const submission of requirement.submissionEntry) {
                if (!credentials[submission.inputDescriptorId]) {
                    credentials[submission.inputDescriptorId] = [];
                }
                // We pick the first matching VC if we are auto-selecting
                credentials[submission.inputDescriptorId].push(submission.verifiableCredentials[0].credentialRecord);
            }
        }
        return credentials;
    }
    validatePresentationDefinition(presentationDefinition) {
        const validation = pex_1.PEX.validateDefinition(presentationDefinition);
        const errorMessages = this.formatValidated(validation);
        if (errorMessages.length > 0) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Invalid presentation definition`, { additionalMessages: errorMessages });
        }
    }
    validatePresentationSubmission(presentationSubmission) {
        const validation = pex_1.PEX.validateSubmission(presentationSubmission);
        const errorMessages = this.formatValidated(validation);
        if (errorMessages.length > 0) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Invalid presentation submission`, { additionalMessages: errorMessages });
        }
    }
    validatePresentation(presentationDefinition, presentation) {
        const { errors } = this.pex.evaluatePresentation(presentationDefinition, (0, utils_2.getSphereonOriginalVerifiablePresentation)(presentation), {
            limitDisclosureSignatureSuites: ['BbsBlsSignatureProof2020', 'DataIntegrityProof.anoncreds-2023'],
        });
        if (errors) {
            const errorMessages = this.formatValidated(errors);
            if (errorMessages.length > 0) {
                throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Invalid presentation`, { additionalMessages: errorMessages });
            }
        }
    }
    formatValidated(v) {
        const validated = Array.isArray(v) ? v : [v];
        return validated
            .filter((r) => r.tag === pex_1.Status.ERROR)
            .map((r) => r.message)
            .filter((r) => Boolean(r));
    }
    async createPresentation(agentContext, options) {
        var _a;
        const { presentationDefinition, domain, challenge, openid4vp } = options;
        const presentationSubmissionLocation = (_a = options.presentationSubmissionLocation) !== null && _a !== void 0 ? _a : models_1.DifPresentationExchangeSubmissionLocation.PRESENTATION;
        const verifiablePresentationResultsWithFormat = [];
        const presentationsToCreate = (0, utils_2.getPresentationsToCreate)(options.credentialsForInputDescriptor);
        for (const presentationToCreate of presentationsToCreate) {
            // We create a presentation for each subject
            // Thus for each subject we need to filter all the related input descriptors and credentials
            // FIXME: cast to V1, as tsc errors for strange reasons if not
            const inputDescriptorIds = presentationToCreate.verifiableCredentials.map((c) => c.inputDescriptorId);
            const inputDescriptorsForPresentation = presentationDefinition.input_descriptors.filter((inputDescriptor) => inputDescriptorIds.includes(inputDescriptor.id));
            const presentationDefinitionForSubject = Object.assign(Object.assign({}, presentationDefinition), { input_descriptors: inputDescriptorsForPresentation, 
                // We remove the submission requirements, as it will otherwise fail to create the VP
                submission_requirements: undefined });
            if (presentationToCreate.claimFormat === vc_1.ClaimFormat.MsoMdoc) {
                if (presentationToCreate.verifiableCredentials.length !== 1) {
                    throw new DifPresentationExchangeError_1.DifPresentationExchangeError('Currently a Mdoc presentation can only be created from a single credential');
                }
                const mdocRecord = presentationToCreate.verifiableCredentials[0].credential;
                if (!openid4vp) {
                    throw new DifPresentationExchangeError_1.DifPresentationExchangeError('Missing openid4vp options for creating MDOC presentation.');
                }
                if (!domain) {
                    throw new DifPresentationExchangeError_1.DifPresentationExchangeError('Missing domain property for creating MDOC presentation.');
                }
                const { deviceResponseBase64Url, presentationSubmission } = await MdocDeviceResponse_1.MdocDeviceResponse.createOpenId4VpDeviceResponse(agentContext, {
                    mdocs: [mdoc_1.Mdoc.fromBase64Url(mdocRecord.base64Url)],
                    presentationDefinition: presentationDefinition,
                    sessionTranscriptOptions: Object.assign(Object.assign({}, openid4vp), { clientId: domain, verifierGeneratedNonce: challenge }),
                });
                verifiablePresentationResultsWithFormat.push({
                    verifiablePresentationResult: {
                        presentationSubmission: presentationSubmission,
                        verifiablePresentations: [deviceResponseBase64Url],
                        presentationSubmissionLocation: pex_1.PresentationSubmissionLocation.EXTERNAL,
                    },
                    claimFormat: presentationToCreate.claimFormat,
                });
            }
            else {
                // Get all the credentials for the presentation
                const credentialsForPresentation = presentationToCreate.verifiableCredentials.map((c) => (0, utils_2.getSphereonOriginalVerifiableCredential)(c.credential));
                const verifiablePresentationResult = await this.pex.verifiablePresentationFrom(presentationDefinitionForSubject, credentialsForPresentation, this.getPresentationSignCallback(agentContext, presentationToCreate), {
                    proofOptions: {
                        challenge,
                        domain,
                    },
                    signatureOptions: {},
                    presentationSubmissionLocation: presentationSubmissionLocation !== null && presentationSubmissionLocation !== void 0 ? presentationSubmissionLocation : models_1.DifPresentationExchangeSubmissionLocation.PRESENTATION,
                });
                verifiablePresentationResultsWithFormat.push({
                    verifiablePresentationResult,
                    claimFormat: presentationToCreate.claimFormat,
                });
            }
        }
        if (verifiablePresentationResultsWithFormat.length === 0) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError('No verifiable presentations created');
        }
        if (presentationsToCreate.length !== verifiablePresentationResultsWithFormat.length) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError('Invalid amount of verifiable presentations created');
        }
        const presentationSubmission = {
            id: verifiablePresentationResultsWithFormat[0].verifiablePresentationResult.presentationSubmission.id,
            definition_id: verifiablePresentationResultsWithFormat[0].verifiablePresentationResult.presentationSubmission.definition_id,
            descriptor_map: [],
        };
        verifiablePresentationResultsWithFormat.forEach(({ verifiablePresentationResult }, index) => {
            const descriptorMap = verifiablePresentationResult.presentationSubmission.descriptor_map.map((d) => {
                const descriptor = Object.assign({}, d);
                // when multiple presentations are submitted, path should be $[0], $[1]
                // FIXME: this should be addressed in the PEX/OID4VP lib.
                // See https://github.com/Sphereon-Opensource/SIOP-OID4VP/issues/62
                if (presentationSubmissionLocation === models_1.DifPresentationExchangeSubmissionLocation.EXTERNAL &&
                    verifiablePresentationResultsWithFormat.length > 1) {
                    descriptor.path = `$[${index}]`;
                }
                return descriptor;
            });
            presentationSubmission.descriptor_map.push(...descriptorMap);
        });
        return {
            verifiablePresentations: verifiablePresentationResultsWithFormat.flatMap((resultWithFormat) => resultWithFormat.verifiablePresentationResult.verifiablePresentations.map((vp) => (0, utils_2.getVerifiablePresentationFromEncoded)(agentContext, vp))),
            presentationSubmission,
            presentationSubmissionLocation: verifiablePresentationResultsWithFormat[0].verifiablePresentationResult.presentationSubmissionLocation,
        };
    }
    getSigningAlgorithmFromVerificationMethod(verificationMethod, suitableAlgorithms) {
        const key = (0, dids_1.getKeyFromVerificationMethod)(verificationMethod);
        const jwk = (0, crypto_1.getJwkFromKey)(key);
        if (suitableAlgorithms) {
            const possibleAlgorithms = jwk.supportedSignatureAlgorithms.filter((alg) => suitableAlgorithms === null || suitableAlgorithms === void 0 ? void 0 : suitableAlgorithms.includes(alg));
            if (!possibleAlgorithms || possibleAlgorithms.length === 0) {
                throw new DifPresentationExchangeError_1.DifPresentationExchangeError([
                    `Found no suitable signing algorithm.`,
                    `Algorithms supported by Verification method: ${jwk.supportedSignatureAlgorithms.join(', ')}`,
                    `Suitable algorithms: ${suitableAlgorithms.join(', ')}`,
                ].join('\n'));
            }
        }
        const alg = jwk.supportedSignatureAlgorithms[0];
        if (!alg)
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`No supported algs for key type: ${key.keyType}`);
        return alg;
    }
    getSigningAlgorithmsForPresentationDefinitionAndInputDescriptors(algorithmsSatisfyingDefinition, inputDescriptorAlgorithms) {
        const allDescriptorAlgorithms = inputDescriptorAlgorithms.flat();
        const algorithmsSatisfyingDescriptors = allDescriptorAlgorithms.filter((alg) => inputDescriptorAlgorithms.every((descriptorAlgorithmSet) => descriptorAlgorithmSet.includes(alg)));
        const algorithmsSatisfyingPdAndDescriptorRestrictions = algorithmsSatisfyingDefinition.filter((alg) => algorithmsSatisfyingDescriptors.includes(alg));
        if (algorithmsSatisfyingDefinition.length > 0 &&
            algorithmsSatisfyingDescriptors.length > 0 &&
            algorithmsSatisfyingPdAndDescriptorRestrictions.length === 0) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`No signature algorithm found for satisfying restrictions of the presentation definition and input descriptors`);
        }
        if (allDescriptorAlgorithms.length > 0 && algorithmsSatisfyingDescriptors.length === 0) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`No signature algorithm found for satisfying restrictions of the input descriptors`);
        }
        let suitableAlgorithms;
        if (algorithmsSatisfyingPdAndDescriptorRestrictions.length > 0) {
            suitableAlgorithms = algorithmsSatisfyingPdAndDescriptorRestrictions;
        }
        else if (algorithmsSatisfyingDescriptors.length > 0) {
            suitableAlgorithms = algorithmsSatisfyingDescriptors;
        }
        else if (algorithmsSatisfyingDefinition.length > 0) {
            suitableAlgorithms = algorithmsSatisfyingDefinition;
        }
        return suitableAlgorithms;
    }
    getSigningAlgorithmForJwtVc(presentationDefinition, verificationMethod) {
        var _a, _b, _c;
        const algorithmsSatisfyingDefinition = (_c = (_b = (_a = presentationDefinition.format) === null || _a === void 0 ? void 0 : _a.jwt_vc) === null || _b === void 0 ? void 0 : _b.alg) !== null && _c !== void 0 ? _c : [];
        const inputDescriptorAlgorithms = presentationDefinition.input_descriptors
            .map((descriptor) => { var _a, _b, _c; return (_c = (_b = (_a = descriptor.format) === null || _a === void 0 ? void 0 : _a.jwt_vc) === null || _b === void 0 ? void 0 : _b.alg) !== null && _c !== void 0 ? _c : []; })
            .filter((alg) => alg.length > 0);
        const suitableAlgorithms = this.getSigningAlgorithmsForPresentationDefinitionAndInputDescriptors(algorithmsSatisfyingDefinition, inputDescriptorAlgorithms);
        return this.getSigningAlgorithmFromVerificationMethod(verificationMethod, suitableAlgorithms);
    }
    getProofTypeForLdpVc(agentContext, presentationDefinition, verificationMethod) {
        var _a, _b, _c;
        const algorithmsSatisfyingDefinition = (_c = (_b = (_a = presentationDefinition.format) === null || _a === void 0 ? void 0 : _a.ldp_vc) === null || _b === void 0 ? void 0 : _b.proof_type) !== null && _c !== void 0 ? _c : [];
        const inputDescriptorAlgorithms = presentationDefinition.input_descriptors
            .map((descriptor) => { var _a, _b, _c; return (_c = (_b = (_a = descriptor.format) === null || _a === void 0 ? void 0 : _a.ldp_vc) === null || _b === void 0 ? void 0 : _b.proof_type) !== null && _c !== void 0 ? _c : []; })
            .filter((alg) => alg.length > 0);
        const suitableSignatureSuites = this.getSigningAlgorithmsForPresentationDefinitionAndInputDescriptors(algorithmsSatisfyingDefinition, inputDescriptorAlgorithms);
        // For each of the supported algs, find the key types, then find the proof types
        const signatureSuiteRegistry = agentContext.dependencyManager.resolve(vc_1.SignatureSuiteRegistry);
        const key = (0, dids_1.getKeyFromVerificationMethod)(verificationMethod);
        const supportedSignatureSuites = signatureSuiteRegistry.getAllByKeyType(key.keyType);
        if (supportedSignatureSuites.length === 0) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Couldn't find a supported signature suite for the given key type '${key.keyType}'`);
        }
        if (suitableSignatureSuites) {
            const foundSignatureSuite = supportedSignatureSuites.find((suite) => suitableSignatureSuites.includes(suite.proofType));
            if (!foundSignatureSuite) {
                throw new DifPresentationExchangeError_1.DifPresentationExchangeError([
                    'No possible signature suite found for the given verification method.',
                    `Verification method type: ${verificationMethod.type}`,
                    `Key type: ${key.keyType}`,
                    `SupportedSignatureSuites: '${supportedSignatureSuites.map((s) => s.proofType).join(', ')}'`,
                    `SuitableSignatureSuites: ${suitableSignatureSuites.join(', ')}`,
                ].join('\n'));
            }
            return supportedSignatureSuites[0].proofType;
        }
        return supportedSignatureSuites[0].proofType;
    }
    /**
     * if all submission descriptors have a format of di | ldp,
     * and all credentials have an ANONCREDS_DATA_INTEGRITY proof we default to
     * signing the presentation using the ANONCREDS_DATA_INTEGRITY_CRYPTOSUITE
     */
    shouldSignUsingAnonCredsDataIntegrity(presentationToCreate, presentationSubmission) {
        if (presentationToCreate.claimFormat !== vc_1.ClaimFormat.LdpVp)
            return undefined;
        const validDescriptorFormat = presentationSubmission.descriptor_map.every((descriptor) => [vc_1.ClaimFormat.DiVc, vc_1.ClaimFormat.DiVp, vc_1.ClaimFormat.LdpVc, vc_1.ClaimFormat.LdpVp].includes(descriptor.format));
        const credentialAreSignedUsingAnonCredsDataIntegrity = presentationToCreate.verifiableCredentials.every(({ credential }) => {
            if (credential.credential.claimFormat !== vc_1.ClaimFormat.LdpVc)
                return false;
            return credential.credential.dataIntegrityCryptosuites.includes(IAnonCredsDataIntegrityService_1.ANONCREDS_DATA_INTEGRITY_CRYPTOSUITE);
        });
        return validDescriptorFormat && credentialAreSignedUsingAnonCredsDataIntegrity;
    }
    getPresentationSignCallback(agentContext, presentationToCreate) {
        return async (callBackParams) => {
            var _a;
            // The created partial proof and presentation, as well as original supplied options
            const { presentation: presentationInput, options, presentationDefinition, presentationSubmission, } = callBackParams;
            const { challenge, domain } = (_a = options.proofOptions) !== null && _a !== void 0 ? _a : {};
            if (!challenge) {
                throw new error_1.CredoError('challenge MUST be provided when signing a Verifiable Presentation');
            }
            if (presentationToCreate.claimFormat === vc_1.ClaimFormat.JwtVp) {
                if (!presentationToCreate.subjectIds) {
                    throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Cannot create presentation for credentials without subject id`);
                }
                // Determine a suitable verification method for the presentation
                const verificationMethod = await this.getVerificationMethodForSubjectId(agentContext, presentationToCreate.subjectIds[0]);
                const w3cPresentation = utils_1.JsonTransformer.fromJSON(presentationInput, vc_1.W3cPresentation);
                w3cPresentation.holder = verificationMethod.controller;
                const signedPresentation = await this.w3cCredentialService.signPresentation(agentContext, {
                    format: vc_1.ClaimFormat.JwtVp,
                    alg: this.getSigningAlgorithmForJwtVc(presentationDefinition, verificationMethod),
                    verificationMethod: verificationMethod.id,
                    presentation: w3cPresentation,
                    challenge,
                    domain,
                });
                return signedPresentation.encoded;
            }
            else if (presentationToCreate.claimFormat === vc_1.ClaimFormat.LdpVp) {
                if (this.shouldSignUsingAnonCredsDataIntegrity(presentationToCreate, presentationSubmission)) {
                    // make sure the descriptors format properties are set correctly
                    presentationSubmission.descriptor_map = presentationSubmission.descriptor_map.map((descriptor) => (Object.assign(Object.assign({}, descriptor), { format: 'di_vp' })));
                    const anoncredsDataIntegrityService = agentContext.dependencyManager.resolve(IAnonCredsDataIntegrityService_1.AnonCredsDataIntegrityServiceSymbol);
                    const presentation = await anoncredsDataIntegrityService.createPresentation(agentContext, {
                        presentationDefinition,
                        presentationSubmission,
                        selectedCredentialRecords: presentationToCreate.verifiableCredentials.map((vc) => vc.credential),
                        challenge,
                    });
                    return Object.assign(Object.assign({}, presentation.toJSON()), { presentation_submission: presentationSubmission });
                }
                if (!presentationToCreate.subjectIds) {
                    throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Cannot create presentation for credentials without subject id`);
                }
                // Determine a suitable verification method for the presentation
                const verificationMethod = await this.getVerificationMethodForSubjectId(agentContext, presentationToCreate.subjectIds[0]);
                const w3cPresentation = utils_1.JsonTransformer.fromJSON(presentationInput, vc_1.W3cPresentation);
                w3cPresentation.holder = verificationMethod.controller;
                const signedPresentation = await this.w3cCredentialService.signPresentation(agentContext, {
                    format: vc_1.ClaimFormat.LdpVp,
                    // TODO: we should move the check for which proof to use for a presentation to earlier
                    // as then we know when determining which VPs to submit already if the proof types are supported
                    // by the verifier, and we can then just add this to the vpToCreate interface
                    proofType: this.getProofTypeForLdpVc(agentContext, presentationDefinition, verificationMethod),
                    proofPurpose: 'authentication',
                    verificationMethod: verificationMethod.id,
                    presentation: w3cPresentation,
                    challenge,
                    domain,
                });
                return signedPresentation.encoded;
            }
            else if (presentationToCreate.claimFormat === vc_1.ClaimFormat.SdJwtVc) {
                const sdJwtInput = presentationInput;
                if (!domain) {
                    throw new error_1.CredoError("Missing 'domain' property, unable to set required 'aud' property in SD-JWT KB-JWT");
                }
                const sdJwtVcApi = this.getSdJwtVcApi(agentContext);
                const sdJwtVc = await sdJwtVcApi.present({
                    compactSdJwtVc: sdJwtInput.compactSdJwtVc,
                    // SD is already handled by PEX, so we presents all keys
                    presentationFrame: undefined,
                    verifierMetadata: {
                        audience: domain,
                        nonce: challenge,
                        // TODO: we should make this optional
                        issuedAt: Math.floor(Date.now() / 1000),
                    },
                });
                return sdJwtVc;
            }
            else {
                throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Only JWT, SD-JWT-VC, JSONLD credentials are supported for a single presentation`);
            }
        };
    }
    async getVerificationMethodForSubjectId(agentContext, subjectId) {
        const didsApi = agentContext.dependencyManager.resolve(dids_1.DidsApi);
        if (!subjectId.startsWith('did:')) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Only dids are supported as credentialSubject id. ${subjectId} is not a valid did`);
        }
        const didDocument = await didsApi.resolveDidDocument(subjectId);
        if (!didDocument.authentication || didDocument.authentication.length === 0) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`No authentication verificationMethods found for did ${subjectId} in did document`);
        }
        // the signature suite to use for the presentation is dependant on the credentials we share.
        // 1. Get the verification method for this given proof purpose in this DID document
        let [verificationMethod] = didDocument.authentication;
        if (typeof verificationMethod === 'string') {
            verificationMethod = didDocument.dereferenceKey(verificationMethod, ['authentication']);
        }
        return verificationMethod;
    }
    /**
     * Queries the wallet for credentials that match the given presentation definition. This only does an initial query based on the
     * schema of the input descriptors. It does not do any further filtering based on the constraints in the input descriptors.
     */
    async queryCredentialForPresentationDefinition(agentContext, presentationDefinition) {
        const w3cCredentialRepository = agentContext.dependencyManager.resolve(vc_1.W3cCredentialRepository);
        const w3cQuery = [];
        const sdJwtVcQuery = [];
        const mdocQuery = [];
        const presentationDefinitionVersion = pex_1.PEX.definitionVersionDiscovery(presentationDefinition);
        if (!presentationDefinitionVersion.version) {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Unable to determine the Presentation Exchange version from the presentation definition`, presentationDefinitionVersion.error ? { additionalMessages: [presentationDefinitionVersion.error] } : {});
        }
        // FIXME: in the query we should take into account the supported proof types of the verifier
        // this could help enormously in the amount of credentials we have to retrieve from storage.
        if (presentationDefinitionVersion.version === pex_1.PEVersion.v1) {
            const pd = presentationDefinition;
            // The schema.uri can contain either an expanded type, or a context uri
            for (const inputDescriptor of pd.input_descriptors) {
                for (const schema of inputDescriptor.schema) {
                    sdJwtVcQuery.push({
                        vct: schema.uri,
                    });
                    w3cQuery.push({
                        $or: [{ expandedTypes: [schema.uri] }, { contexts: [schema.uri] }, { types: [schema.uri] }],
                    });
                    mdocQuery.push({
                        docType: inputDescriptor.id,
                    });
                }
            }
        }
        else if (presentationDefinitionVersion.version === pex_1.PEVersion.v2) {
            // FIXME: As PE version 2 does not have the `schema` anymore, we can't query by schema anymore.
            // We probably need
            // to find some way to do initial filtering, hopefully if there's a filter on the `type` field or something.
        }
        else {
            throw new DifPresentationExchangeError_1.DifPresentationExchangeError(`Unsupported presentation definition version ${presentationDefinitionVersion.version}`);
        }
        const allRecords = [];
        // query the wallet ourselves first to avoid the need to query the pex library for all
        // credentials for every proof request
        const w3cCredentialRecords = w3cQuery.length > 0
            ? await w3cCredentialRepository.findByQuery(agentContext, { $or: w3cQuery })
            : await w3cCredentialRepository.getAll(agentContext);
        allRecords.push(...w3cCredentialRecords);
        const sdJwtVcApi = this.getSdJwtVcApi(agentContext);
        const sdJwtVcRecords = sdJwtVcQuery.length > 0 ? await sdJwtVcApi.findAllByQuery({ $or: sdJwtVcQuery }) : await sdJwtVcApi.getAll();
        allRecords.push(...sdJwtVcRecords);
        const mdocApi = this.getMdocApi(agentContext);
        const mdocRecords = mdocQuery.length > 0 ? await mdocApi.findAllByQuery({ $or: mdocQuery }) : await mdocApi.getAll();
        allRecords.push(...mdocRecords);
        return allRecords;
    }
    getSdJwtVcApi(agentContext) {
        return agentContext.dependencyManager.resolve(sd_jwt_vc_1.SdJwtVcApi);
    }
    getMdocApi(agentContext) {
        return agentContext.dependencyManager.resolve(mdoc_1.MdocApi);
    }
};
exports.DifPresentationExchangeService = DifPresentationExchangeService;
exports.DifPresentationExchangeService = DifPresentationExchangeService = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [vc_1.W3cCredentialService])
], DifPresentationExchangeService);
//# sourceMappingURL=DifPresentationExchangeService.js.map