import type { VerificationMethod } from '@web5/dids'

import { AskarModule } from '@aries-framework/askar'
import {
  Agent,
  ClaimFormat,
  DidKey,
  JwaSignatureAlgorithm,
  KeyType,
  TypedArrayEncoder,
  W3cCredential,
  W3cCredentialService,
  W3cCredentialSubject,
  W3cIssuer,
  utils,
  w3cDate,
} from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'

import { DwnClientModule } from '../src'

const name = 'DwnClientX'
const config = {
  label: utils.uuid(),
  walletConfig: { id: name, key: name },
}

const modules = {
  askar: new AskarModule({ ariesAskar }),
  dwnClient: new DwnClientModule(),
}

describe('DwnClient', () => {
  let agent: Agent<typeof modules>
  let agentDid: string
  let verificationMethod: VerificationMethod

  beforeEach(async () => {
    agent = new Agent({ config, dependencies: agentDependencies, modules })
    await agent.initialize()

    const holderKey = await agent.context.wallet.createKey({
      keyType: KeyType.Ed25519,
      seed: TypedArrayEncoder.fromString('00000000000000000000000000000001'),
    })

    const didKey = new DidKey(holderKey)
    const didDocument = didKey.didDocument
    agentDid = didDocument.id
    const kid = `${agentDid}#${didKey.key.fingerprint}`
    verificationMethod = didDocument?.dereferenceKey(kid, ['authentication']) as VerificationMethod

    await agent.dids.import({ didDocument: didDocument, did: didDocument.id })
  })

  afterEach(async () => {
    await agent.shutdown()
    await agent.wallet.delete()
  })

  it('test wallet backup and import', async () => {
    //const dwnEndpoints = ['http://localhost:3000']
    //const { dwnApi, did } = await agent.modules.dwnClient.connect(dwnEndpoints)
    //const secretKey = 'secretKey'
    //const credential = new W3cCredential({
    //  type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    //  issuer: new W3cIssuer({ id: agentDid }),
    //  credentialSubject: new W3cCredentialSubject({ id: agentDid }),
    //  issuanceDate: w3cDate(Date.now()),
    //})
    //const w3cCredentialService = agent.dependencyManager.resolve(W3cCredentialService)
    //const signed = await w3cCredentialService.signCredential(agent.context, {
    //  format: ClaimFormat.JwtVc,
    //  credential: credential,
    //  verificationMethod: verificationMethod.id,
    //  alg: JwaSignatureAlgorithm.EdDSA,
    //})
    //const storedCredentialRecord = await agent.w3cCredentials.storeCredential({ credential: signed })
    //const credentialRecordBeforeBackupAndImport = await agent.w3cCredentials.getCredentialRecordById(
    //  storedCredentialRecord.id
    //)
    //const { record } = await agent.modules.dwnClient.backupWallet({
    //  dwnApi,
    //  secretKey,
    //  fromDid: did,
    //})
    //await agent.wallet.delete()
    //await agent.modules.dwnClient.importWallet({
    //  dwnApi,
    //  fromDid: did,
    //  secretKey,
    //  recordId: record.id,
    //})
    //if (!agent.wallet.walletConfig) throw new Error('Wallet config is not set')
    //await agent.wallet.initialize(agent.wallet.walletConfig)
    //const credentialRecordAfterBackupAndImport = await agent.w3cCredentials.getCredentialRecordById(
    //  storedCredentialRecord.id
    //)
    //expect(credentialRecordAfterBackupAndImport).toMatchObject(credentialRecordBeforeBackupAndImport)
  })
})
