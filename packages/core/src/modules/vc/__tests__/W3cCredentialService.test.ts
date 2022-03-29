import type { AgentConfig } from '../../../agent/AgentConfig'
import type { W3cCredentialRecord } from '../models/credential/W3cCredentialRecord'

import { getAgentConfig } from '../../../../tests/helpers'
import { TestLogger } from '../../../../tests/logger'
import { LogLevel } from '../../../logger'
import { IndyStorageService } from '../../../storage/IndyStorageService'
import { JsonTransformer } from '../../../utils'
import { IndyWallet } from '../../../wallet/IndyWallet'
import { DidResolverService } from '../../dids'
import { DidRepository } from '../../dids/repository'
import { IndyLedgerService } from '../../ledger/services/IndyLedgerService'
import { W3cCredentialService } from '../W3cCredentialService'
import { W3cCredential, W3cVerifiableCredential } from '../models'
import { W3cCredentialRepository } from '../models/credential/W3cCredentialRepository'

const MOCK_DID_KEY = 'did:key:z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL'

const mockCredential = {
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
}

jest.mock('../../ledger/services/IndyLedgerService')
const IndyLedgerServiceMock = IndyLedgerService as jest.Mock<IndyLedgerService>

const DidRepositoryMock = DidRepository as unknown as jest.Mock<DidRepository>

describe('W3cCredentialService', () => {
  let wallet: IndyWallet
  let agentConfig: AgentConfig
  let didResolverService: DidResolverService
  let logger: TestLogger
  let w3cCredentialService: W3cCredentialService
  let w3cCredentialRepository: W3cCredentialRepository

  beforeEach(async () => {
    agentConfig = getAgentConfig('W3cCredentialServiceTest')
    wallet = new IndyWallet(agentConfig)
    logger = new TestLogger(LogLevel.error)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await wallet.createAndOpen(agentConfig.walletConfig!)
    await wallet.initPublicDid({})
    const storageService = new IndyStorageService<W3cCredentialRecord>(wallet, agentConfig)
    didResolverService = new DidResolverService(agentConfig, new IndyLedgerServiceMock(), new DidRepositoryMock())
    w3cCredentialRepository = new W3cCredentialRepository(storageService)
    w3cCredentialService = new W3cCredentialService(
      wallet,
      w3cCredentialRepository,
      didResolverService,
      agentConfig,
      logger
    )
  })

  afterEach(async () => {
    await wallet.delete()
  })

  describe('Repository interaction', () => {
    test('Store a W3cCredentialRecord', async () => {
      const credential = JsonTransformer.fromJSON(mockCredential, W3cVerifiableCredential)

      const w3cCredentialRecord = await w3cCredentialService.storeCredential(credential)

      expect(w3cCredentialRecord).toMatchObject({
        type: 'W3cCredentialRecord',
        id: expect.any(String),
        createdAt: expect.any(Date),
        credential: expect.any(W3cVerifiableCredential),
      })

      expect(w3cCredentialRecord.getTags()).toMatchObject({
        expandedTypes: [
          'https://www.w3.org/2018/credentials#VerifiableCredential',
          'https://example.org/examples#UniversityDegreeCredential',
        ],
      })
    })

    test('Retrieve a W3cCredentialRecord by id', async () => {
      const credential = JsonTransformer.fromJSON(mockCredential, W3cVerifiableCredential)
      const w3cCredentialRecord = await w3cCredentialService.storeCredential(credential)
      const retrievedW3cCredentialRecord = await w3cCredentialService.retrieveW3cCredentialRecordById(
        w3cCredentialRecord.id
      )
      expect(retrievedW3cCredentialRecord).toMatchObject({ id: expect.any(String) })
    })

    test('Retrieve all W3cCredentialRecords', async () => {
      const credential = JsonTransformer.fromJSON(mockCredential, W3cVerifiableCredential)
      await w3cCredentialService.storeCredential(credential)
      const retrievedW3cCredentialRecords = await w3cCredentialService.retrieveAllW3cCredentialRecord()
      expect(retrievedW3cCredentialRecords.length).toBeGreaterThan(0)
    })

    test('Retrieve W3cCredentialRecord by expanded type', async () => {
      const credential = JsonTransformer.fromJSON(mockCredential, W3cVerifiableCredential)
      await w3cCredentialService.storeCredential(credential)
      const retrievedW3cCredentialRecords = await w3cCredentialService.retrieveW3cCredentialRecordsByExpandedType([
        'https://example.org/examples#UniversityDegreeCredential',
      ])
      expect(retrievedW3cCredentialRecords.length).toBeGreaterThan(0)
    })
  })

  xdescribe('sign', () => {
    it('returns a signed credential', async () => {
      const credential = JsonTransformer.fromJSON(
        {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
          // id: 'http://example.edu/credentials/temporary/28934792387492384',
          type: ['VerifiableCredential', 'UniversityDegreeCredential'],
          issuer: MOCK_DID_KEY,
          issuanceDate: '2017-10-22T12:23:48Z',
          credentialSubject: {
            degree: {
              type: 'BachelorDegree',
              name: 'Bachelor of Science and Arts',
            },
          },
        },
        W3cCredential
      )

      const vc = await w3cCredentialService.signCredential({
        options: {
          proofType: 'Ed25519Signature2018',
          verificationMethod:
            'did:key:z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL#z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL',
        },
        credential,
      })
      console.log(vc)
    })
  })
})
