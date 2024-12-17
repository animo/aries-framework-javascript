"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECP256K1_V1 = void 0;
exports.SECP256K1_V1 = {
    '@context': {
        id: '@id',
        type: '@type',
        '@protected': true,
        proof: {
            '@id': 'https://w3id.org/security#proof',
            '@type': '@id',
            '@container': '@graph',
        },
        EcdsaSecp256k1VerificationKey2019: {
            '@id': 'https://w3id.org/security#EcdsaSecp256k1VerificationKey2019',
            '@context': {
                '@protected': true,
                id: '@id',
                type: '@type',
                controller: {
                    '@id': 'https://w3id.org/security#controller',
                    '@type': '@id',
                },
                revoked: {
                    '@id': 'https://w3id.org/security#revoked',
                    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
                },
                blockchainAccountId: {
                    '@id': 'https://w3id.org/security#blockchainAccountId',
                },
                publicKeyJwk: {
                    '@id': 'https://w3id.org/security#publicKeyJwk',
                    '@type': '@json',
                },
                publicKeyBase58: {
                    '@id': 'https://w3id.org/security#publicKeyBase58',
                },
                publicKeyMultibase: {
                    '@id': 'https://w3id.org/security#publicKeyMultibase',
                    '@type': 'https://w3id.org/security#multibase',
                },
            },
        },
        EcdsaSecp256k1Signature2019: {
            '@id': 'https://w3id.org/security#EcdsaSecp256k1Signature2019',
            '@context': {
                '@protected': true,
                id: '@id',
                type: '@type',
                challenge: 'https://w3id.org/security#challenge',
                created: {
                    '@id': 'http://purl.org/dc/terms/created',
                    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
                },
                domain: 'https://w3id.org/security#domain',
                expires: {
                    '@id': 'https://w3id.org/security#expiration',
                    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
                },
                nonce: 'https://w3id.org/security#nonce',
                proofPurpose: {
                    '@id': 'https://w3id.org/security#proofPurpose',
                    '@type': '@vocab',
                    '@context': {
                        '@protected': true,
                        id: '@id',
                        type: '@type',
                        assertionMethod: {
                            '@id': 'https://w3id.org/security#assertionMethod',
                            '@type': '@id',
                            '@container': '@set',
                        },
                        authentication: {
                            '@id': 'https://w3id.org/security#authenticationMethod',
                            '@type': '@id',
                            '@container': '@set',
                        },
                        capabilityInvocation: {
                            '@id': 'https://w3id.org/security#capabilityInvocationMethod',
                            '@type': '@id',
                            '@container': '@set',
                        },
                        capabilityDelegation: {
                            '@id': 'https://w3id.org/security#capabilityDelegationMethod',
                            '@type': '@id',
                            '@container': '@set',
                        },
                        keyAgreement: {
                            '@id': 'https://w3id.org/security#keyAgreementMethod',
                            '@type': '@id',
                            '@container': '@set',
                        },
                    },
                },
                jws: {
                    '@id': 'https://w3id.org/security#jws',
                },
                verificationMethod: {
                    '@id': 'https://w3id.org/security#verificationMethod',
                    '@type': '@id',
                },
            },
        },
    },
};
//# sourceMappingURL=secp256k1_v1.js.map