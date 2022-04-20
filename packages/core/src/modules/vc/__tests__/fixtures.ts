export const BbsBlsSignature2020Fixtures = {
  TEST_LD_DOCUMENT: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/citizenship/v1',
      'https://w3id.org/security/bbs/v1',
    ],
    id: 'https://issuer.oidp.uscis.gov/credentials/83627465',
    type: ['VerifiableCredential', 'PermanentResidentCard'],
    issuer: '',
    identifier: '83627465',
    name: 'Permanent Resident Card',
    description: 'Government of Example Permanent Resident Card.',
    issuanceDate: '2019-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    credentialSubject: {
      id: 'did:example:b34ca6cd37bbf23',
      type: ['PermanentResident', 'Person'],
      givenName: 'JOHN',
      familyName: 'SMITH',
      gender: 'Male',
      image: 'data:image/png;base64,iVBORw0KGgokJggg==',
      residentSince: '2015-01-01',
      lprCategory: 'C09',
      lprNumber: '999-999-999',
      commuterClassification: 'C1',
      birthCountry: 'Bahamas',
      birthDate: '1958-07-17',
    },
  },

  TEST_LD_DOCUMENT_SIGNED: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/citizenship/v1',
      'https://w3id.org/security/bbs/v1',
    ],
    id: 'https://issuer.oidp.uscis.gov/credentials/83627465',
    type: ['VerifiableCredential', 'PermanentResidentCard'],
    issuer:
      'did:key:zUC74VEqqhEHQcgv4zagSPkqFJxuNWuoBPKjJuHETEUeHLoSqWt92viSsmaWjy82y2cgguc8e9hsGBifnVK67pQ4gve3m6iSboDkmJjxVEb1d6mRAx5fpMAejooNzNqqbTMVeUN',
    identifier: '83627465',
    name: 'Permanent Resident Card',
    description: 'Government of Example Permanent Resident Card.',
    issuanceDate: '2019-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    credentialSubject: {
      id: 'did:example:b34ca6cd37bbf23',
      type: ['PermanentResident', 'Person'],
      givenName: 'JOHN',
      familyName: 'SMITH',
      gender: 'Male',
      image: 'data:image/png;base64,iVBORw0KGgokJggg==',
      residentSince: '2015-01-01',
      lprCategory: 'C09',
      lprNumber: '999-999-999',
      commuterClassification: 'C1',
      birthCountry: 'Bahamas',
      birthDate: '1958-07-17',
    },
    proof: {
      type: 'BbsBlsSignature2020',
      created: '2022-04-13T13:47:47Z',
      verificationMethod:
        'did:key:zUC74VEqqhEHQcgv4zagSPkqFJxuNWuoBPKjJuHETEUeHLoSqWt92viSsmaWjy82y2cgguc8e9hsGBifnVK67pQ4gve3m6iSboDkmJjxVEb1d6mRAx5fpMAejooNzNqqbTMVeUN#zUC74VEqqhEHQcgv4zagSPkqFJxuNWuoBPKjJuHETEUeHLoSqWt92viSsmaWjy82y2cgguc8e9hsGBifnVK67pQ4gve3m6iSboDkmJjxVEb1d6mRAx5fpMAejooNzNqqbTMVeUN',
      proofPurpose: 'assertionMethod',
      proofValue:
        'hoNNnnRIoEoaY9Fvg3pGVG2eWTAHnR1kIM01nObEL2FdI2IkkpM3246jn3VBD8KBYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i+CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx/IAvLVniyeMQ==',
    },
  },
  TEST_LD_DOCUMENT_BAD_SIGNED: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/citizenship/v1',
      'https://w3id.org/security/bbs/v1',
    ],
    id: 'https://issuer.oidp.uscis.gov/credentials/83627465',
    type: ['VerifiableCredential', 'PermanentResidentCard'],
    issuer:
      'did:key:zUC74VEqqhEHQcgv4zagSPkqFJxuNWuoBPKjJuHETEUeHLoSqWt92viSsmaWjy82y2cgguc8e9hsGBifnVK67pQ4gve3m6iSboDkmJjxVEb1d6mRAx5fpMAejooNzNqqbTMVeUN',
    identifier: '83627465',
    name: 'Permanent Resident Card',
    description: 'Government of Example Permanent Resident Card.',
    issuanceDate: '2019-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    credentialSubject: {
      id: 'did:example:b34ca6cd37bbf23',
      type: ['PermanentResident', 'Person'],
      givenName: 'JOHN',
      familyName: 'SMITH',
      gender: 'Male',
      image: 'data:image/png;base64,iVBORw0KGgokJggg==',
      residentSince: '2015-01-01',
      lprCategory: 'C09',
      lprNumber: '999-999-999',
      commuterClassification: 'C1',
      birthCountry: 'Bahamas',
      birthDate: '1958-07-17',
    },
    proof: {
      type: 'BbsBlsSignature2020',
      created: '2022-04-13T13:47:47Z',
      verificationMethod:
        'did:key:zUC74VEqqhEHQcgv4zagSPkqFJxuNWuoBPKjJuHETEUeHLoSqWt92viSsmaWjy82y2cgguc8e9hsGBifnVK67pQ4gve3m6iSboDkmJjxVEb1d6mRAx5fpMAejooNzNqqbTMVeUN#zUC74VEqqhEHQcgv4zagSPkqFJxuNWuoBPKjJuHETEUeHLoSqWt92viSsmaWjy82y2cgguc8e9hsGBifnVK67pQ4gve3m6iSboDkmJjxVEb1d6mRAx5fpMAejooNzNqqbTMVeUN',
      proofPurpose: 'assertionMethod',
      proofValue:
        'gU44r/fmvGpkOyMRZX4nwRB6IsbrL7zbVTs+yu6bZGeCNJuiJqS5U6fCPuvGQ+iNYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i+CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx/IAvLVniyeMQ==',
    },
  },

  TEST_VALID_DERIVED_BBS_VC: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/citizenship/v1',
      'https://w3id.org/security/bbs/v1',
    ],
    id: 'https://issuer.oidp.uscis.gov/credentials/83627465',
    type: ['PermanentResidentCard', 'VerifiableCredential'],
    description: 'Government of Example Permanent Resident Card.',
    identifier: '83627465',
    name: 'Permanent Resident Card',
    credentialSubject: {
      id: 'did:example:b34ca6cd37bbf23',
      type: ['Person', 'PermanentResident'],
      familyName: 'SMITH',
      gender: 'Male',
      givenName: 'JOHN',
    },
    expirationDate: '2029-12-03T12:19:52Z',
    issuanceDate: '2019-12-03T12:19:52Z',
    issuer:
      'did:key:zUC7D3fEZKbfDsgNyxmzUkghZ5PVJGfPydE2RVezGjWJFyXfFgtvA9EZJpXeYbvgArZ8RPPT67xoVJrXg4Sv3c6myhrzdRegF8MAw1J77iXPxUtZoqrHwv7FBDnH8CKayW1odPa',
    proof: {
      type: 'BbsBlsSignatureProof2020',
      created: '2022-04-20T11:27:45Z',
      nonce: 'Qoo7AMaylRMOIoVScnXYag1drPA9/AtFStK09zCAC4BaQ20ORjrt7WECtqw6Uq+YzGg=',
      proofPurpose: 'assertionMethod',
      proofValue:
        'ABkB/wbvo8Ivm16xqEPBzGE3+nmXh3XfQ4qkc75jwB1HZiP0XKGZOWJnNWGy68JZUmO2/sLStB/B0l4fFzjFfQ8+9yWa9yshTHBJjWY1o6N/e3JBJMx/NznKjb+aD+NaOvdwBpi7udTF6JwKos0ATLa4mRvTCfGWfLVf9DzJD1yRfPEvl8l4sktp+mNiXpGhe8PrOzwVAAAAdIHY/fiLhNwJV5s0BTZdRNADu+8QtDTmJG3ZNQX6nnUzugcMCuENcMWbImuQ5hyGOwAAAAI8e31BCwWCLFMo0nPX+2jDfmqB6JeqQWQlvebj0bkOpAYqHvvwHtxhMq84PM/dR8fyavr86aJeJ7gOpbvV4XyLr1bIe+oSWdr2zdJNb9OQU91+4fT3wDLOpM8jNdKDE2kQ96PnJ1IrRz5mvzSz0VrlAAAACWjDGG1OCwcxCZ2y4PgI6ZqllLMw7yAuFLHvhx0tEzGwTrNGhE/hqjyd9v/jajVAOcDLh56XUJI98I41RDXN1OQQfzuz76JOqJ4Q7KjCRGUbLWWc6BztQxo1iT1R8/+LcVjlvRwjz0ZcXEtp6Wx+00+DqiCk3xucjp1vmY9mEYKjb6Z070rGVnyv0VoFdIqksiRnQ9Iw3zwKA33+/CdhAYYDfrH9nAhvG/0kY81ZRSDp65qX0Y1IVALl6gQ6NSKjLCro4Whi8q9kAljJuh4VuuTkX7zkggmPMN16V/kijWqXV9kE1Gw5zJCyBVLJqdjXhHK0fMI9aICppbc1289hw28Rma7Z9eZfpqFo6MGhOXtSztOp0VTfl5pw7HO8srs4UQ==',
      verificationMethod:
        'did:key:zUC7D3fEZKbfDsgNyxmzUkghZ5PVJGfPydE2RVezGjWJFyXfFgtvA9EZJpXeYbvgArZ8RPPT67xoVJrXg4Sv3c6myhrzdRegF8MAw1J77iXPxUtZoqrHwv7FBDnH8CKayW1odPa#zUC7D3fEZKbfDsgNyxmzUkghZ5PVJGfPydE2RVezGjWJFyXfFgtvA9EZJpXeYbvgArZ8RPPT67xoVJrXg4Sv3c6myhrzdRegF8MAw1J77iXPxUtZoqrHwv7FBDnH8CKayW1odPa',
    },
  },
}

export const Ed25519Signature2018Fixtures = {
  TEST_LD_DOCUMENT: {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
    // id: 'http://example.edu/credentials/temporary/28934792387492384',
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    issuer: 'did:key:z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL',
    issuanceDate: '2017-10-22T12:23:48Z',
    credentialSubject: {
      degree: {
        type: 'BachelorDegree',
        name: 'Bachelor of Science and Arts',
      },
    },
  },
  TEST_LD_DOCUMENT_SIGNED: {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    issuer: 'did:key:z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL',
    issuanceDate: '2017-10-22T12:23:48Z',
    credentialSubject: {
      degree: {
        type: 'BachelorDegree',
        name: 'Bachelor of Science and Arts',
      },
    },
    proof: {
      verificationMethod:
        'did:key:z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL#z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL',
      type: 'Ed25519Signature2018',
      created: '2022-04-18T23:13:10Z',
      proofPurpose: 'assertionMethod',
      jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..ECQsj_lABelr1jkehSkqaYpc5CBvbSjbi3ZvgiVVKxZFDYfj5xZmeXb_awa4aw_cGEVaoypeN2uCFmeG6WKkBw',
    },
  },
  TEST_LD_DOCUMENT_BAD_SIGNED: {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    issuer: 'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
    issuanceDate: '2017-10-22T12:23:48Z',
    credentialSubject: {
      degree: {
        type: 'BachelorDegree',
        name: 'Bachelor of Science and Arts',
      },
    },
    proof: {
      verificationMethod:
        'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV#z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
      type: 'Ed25519Signature2018',
      created: '2022-03-28T15:54:59Z',
      proofPurpose: 'assertionMethod',
      jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..Ej5aEUBTgeNm3_a4uO_AuNnisldnYTMMGMom4xLb-_TmoYe7467Yo046Bw2QqdfdBja6y-HBbBj4SonOlwswAg',
    },
  },
  TEST_VC_DOCUMENT: {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: [
      {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
        issuer: 'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
        issuanceDate: '2017-10-22T12:23:48Z',
        credentialSubject: {
          degree: {
            type: 'BachelorDegree',
            name: 'Bachelor of Science and Arts',
          },
        },
        proof: {
          verificationMethod:
            'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV#z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
          type: 'Ed25519Signature2018',
          created: '2022-03-28T15:54:59Z',
          proofPurpose: 'assertionMethod',
          jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..b0MD_c-8EyGATDuCda1A72qbjD3o8MfiipicmhnYmcdqoIyZzE9MlZ9FZn5sxsIJ3LPqPQj7y1jLlINwCwNSDg',
        },
      },
    ],
  },
  TEST_VC_DOCUMENT_SIGNED: {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: [
      {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
        issuer: 'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
        issuanceDate: '2017-10-22T12:23:48Z',
        credentialSubject: {
          degree: {
            type: 'BachelorDegree',
            name: 'Bachelor of Science and Arts',
          },
        },
        proof: {
          verificationMethod:
            'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV#z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
          type: 'Ed25519Signature2018',
          created: '2022-03-28T15:54:59Z',
          proofPurpose: 'assertionMethod',
          jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..b0MD_c-8EyGATDuCda1A72qbjD3o8MfiipicmhnYmcdqoIyZzE9MlZ9FZn5sxsIJ3LPqPQj7y1jLlINwCwNSDg',
        },
      },
    ],
    proof: {
      verificationMethod:
        'did:key:z6MktpMAZxz5MrBeXHwN15fyfYbSz5dZ7B1FNqv7UrZqDxYa#z6MktpMAZxz5MrBeXHwN15fyfYbSz5dZ7B1FNqv7UrZqDxYa',
      type: 'Ed25519Signature2018',
      created: '2022-04-05T12:53:48Z',
      proofPurpose: 'assertionMethod',
      jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..AH0V9x5AIoeskvfbxoei-UKKPMtbgeoNJf_sAq_F2lxzsZg_es8xkaJ9hBv45itYN2pMgVuOZ618r8gjlc7NDA',
    },
  },
}

// export const validEd25519Signature2018VerifiableCredentialJson = {
//   '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
//   type: ['VerifiableCredential', 'UniversityDegreeCredential'],
//   issuer: 'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
//   issuanceDate: '2017-10-22T12:23:48Z',
//   credentialSubject: {
//     degree: {
//       type: 'BachelorDegree',
//       name: 'Bachelor of Science and Arts',
//     },
//   },
//   proof: {
//     verificationMethod:
//       'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV#z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
//     type: 'Ed25519Signature2018',
//     created: '2022-03-28T15:54:59Z',
//     proofPurpose: 'assertionMethod',
//     jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..b0MD_c-8EyGATDuCda1A72qbjD3o8MfiipicmhnYmcdqoIyZzE9MlZ9FZn5sxsIJ3LPqPQj7y1jLlINwCwNSDg',
//   },
// }

// export const validEd25519Signature2018VerifiablePresentationJson = {
//   '@context': ['https://www.w3.org/2018/credentials/v1'],
//   type: ['VerifiablePresentation'],
//   verifiableCredential: [
//     {
//       '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
//       type: ['VerifiableCredential', 'UniversityDegreeCredential'],
//       issuer: 'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
//       issuanceDate: '2017-10-22T12:23:48Z',
//       credentialSubject: {
//         degree: {
//           type: 'BachelorDegree',
//           name: 'Bachelor of Science and Arts',
//         },
//       },
//       proof: {
//         verificationMethod:
//           'did:key:z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV#z6MkvePyWAApUVeDboZhNbckaWHnqtD6pCETd6xoqGbcpEBV',
//         type: 'Ed25519Signature2018',
//         created: '2022-03-28T15:54:59Z',
//         proofPurpose: 'assertionMethod',
//         jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..b0MD_c-8EyGATDuCda1A72qbjD3o8MfiipicmhnYmcdqoIyZzE9MlZ9FZn5sxsIJ3LPqPQj7y1jLlINwCwNSDg',
//       },
//     },
//   ],
//   proof: {
//     verificationMethod:
//       'did:key:z6Mkrm5US7qdz5uL9FXhtpv2zSHPbH9HQSF9qbnbE46JSan8#z6Mkrm5US7qdz5uL9FXhtpv2zSHPbH9HQSF9qbnbE46JSan8',
//     type: 'Ed25519Signature2018',
//     created: '2022-04-01T21:08:14Z',
//     proofPurpose: 'assertionMethod',
//     jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..hgeWAFdwrFx7zgbhVP8GXhcct2kVRWYyPFCmXCWyiX4ChywSI4Zx85JLqfNMgAdkXbukI3788KIcRO_fayInAg',
//   },
// }
