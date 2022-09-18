/* eslint-disable no-console */
import type { Logger } from '../../../logger'
import type { CheqdCredDefResourceData, CheqdSchemaResourceData } from '../cheqd/cheqdIndyUtils'
import type {
  GenericIndyLedgerService,
  IndyEndpointAttrib,
  SchemaTemplate,
  CredentialDefinitionTemplate,
  ParseRevocationRegistryDefinitionTemplate,
  ParseRevocationRegistryDeltaTemplate,
  ParseRevocationRegistryTemplate,
} from '../models/IndyLedgerService'
import type { CheqdSDK, ICheqdSDKOptions } from '@cheqd/sdk'
import type { AbstractCheqdSDKModule } from '@cheqd/sdk/build/modules/_'
import type { DidStdFee, IKeyPair } from '@cheqd/sdk/build/types'
import type { TImportableEd25519Key } from '@cheqd/sdk/build/utils'
import type { MsgUpdateDidPayload, MsgCreateDidPayload } from '@cheqd/ts-proto/cheqd/v1/tx'
import type { MsgCreateResourcePayload } from '@cheqd/ts-proto/resource/v1/tx'
import type { DIDDocument } from 'did-resolver'
import type Indy from 'indy-sdk'

import { DIDModule, createCheqdSDK, ResourceModule } from '@cheqd/sdk'
import { MethodSpecificIdAlgo, VerificationMethods } from '@cheqd/sdk/build/types'
import {
  createDidPayload,
  createDidVerificationMethod,
  createVerificationKeys,
  createSignInputsFromImportableEd25519Key,
} from '@cheqd/sdk/build/utils'
import { DirectSecp256k1HdWallet, EncodeObject } from '@cosmjs/proto-signing'
import { generateKeyPairFromSeed } from '@stablelib/ed25519'
import { fromString, toString } from 'uint8arrays'

import { AgentConfig } from '../../../agent/AgentConfig'
import { AriesFrameworkError } from '../../../error'
import { injectable } from '../../../plugins'
import { indyDidFromPublicKeyBase58, JsonEncoder, MultiBaseEncoder, TypedArrayEncoder } from '../../../utils'
import { uuid } from '../../../utils/uuid'
import { IndyWallet } from '../../../wallet/IndyWallet'
import { IndyCredentialUtils } from '../../credentials/formats/indy/IndyCredentialUtils'
import { resourceRegistry } from '../cheqd/cheqdIndyUtils'

// --------------

const assert = (b: boolean, msg: string) => {
  if (b) return

  throw new AriesFrameworkError(msg)
}

export type IdentifierPayload = Partial<MsgCreateDidPayload> | Partial<MsgUpdateDidPayload>

const clog = (...args: any[]) => {
  console.log('---------------------- LOG ------------------------')
  console.log(args)
  console.log('---------------------- LOG ------------------------')
}

// --------------

export interface ISignInputs {
  verificationMethodId: string
  keyType?: 'Ed25519' | 'Secp256k1' | 'P256'
  privateKeyHex: string
}
export const faucet = {
  prefix: 'cheqd',
  minimalDenom: 'ncheq',
  mnemonic:
    'sketch mountain erode window enact net enrich smoke claim kangaroo another visual write meat latin bacon pulp similar forum guilt father state erase bright',
  address: 'cheqd1rnr5jrt4exl0samwj0yegv99jeskl0hsxmcz96',
}

@injectable()
export class CheqdLedgerService implements GenericIndyLedgerService {
  private wallet: IndyWallet
  private indy: typeof Indy
  private logger: Logger
  private config: AgentConfig

  private sdk?: CheqdSDK
  private fee?: DidStdFee

  private cheqdKeyPair?: IKeyPair
  private cheqdDid?: string

  public constructor(wallet: IndyWallet, agentConfig: AgentConfig) {
    this.wallet = wallet
    this.indy = agentConfig.agentDependencies.indy
    this.logger = agentConfig.logger
    this.config = agentConfig
  }

  private async getCheqdDid() {
    if (this.cheqdDid) return this.cheqdDid

    if (!this.config.publicDidSeed) {
      throw new AriesFrameworkError("Can't create DID without publicDidSeed")
    }

    // Set cheqd key pair and public cheqd did
    const seed = this.config.publicDidSeed
    const keyPair = generateKeyPairFromSeed(TypedArrayEncoder.fromString(seed))

    this.cheqdKeyPair = {
      publicKey: toString(keyPair.publicKey, 'base64'),
      privateKey: toString(keyPair.secretKey, 'base64'),
    }

    const indyKey = this.wallet.publicDid
    if (!indyKey) throw new AriesFrameworkError('No public did found')

    const indyKeyPair: IKeyPair = {
      publicKey: TypedArrayEncoder.toBase64(TypedArrayEncoder.fromBase58(indyKey.verkey)),
      privateKey: ':)',
    }

    const indyVerificationKey = createVerificationKeys(indyKeyPair, MethodSpecificIdAlgo.Base58, 'indykey-1')

    console.log('cheqd did is ', indyVerificationKey.didUrl)
    this.cheqdDid = indyVerificationKey.didUrl
    return this.cheqdDid
  }

  private async getCheqdSDK(fee?: DidStdFee): Promise<CheqdSDK> {
    const RPC_URL = 'https://rpc.cheqd.network'
    const COSMOS_PAYER_WALLET = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix })

    if (this.sdk) return this.sdk

    const sdkOptions: ICheqdSDKOptions = {
      modules: [DIDModule as unknown as AbstractCheqdSDKModule, ResourceModule as unknown as AbstractCheqdSDKModule],
      rpcUrl: RPC_URL,
      wallet: COSMOS_PAYER_WALLET,
    }

    this.sdk = await createCheqdSDK(sdkOptions)
    this.fee = fee || {
      amount: [
        {
          denom: faucet.minimalDenom,
          amount: '37500000',
        },
      ],
      gas: '1500000',
      payer: (await sdkOptions.wallet.getAccounts())[0].address,
    }
    return this.sdk
  }

  public async getSchemaResource(schemaId: string): Promise<CheqdSchemaResourceData> {
    if (resourceRegistry.schemas[schemaId]) {
      return resourceRegistry.schemas[schemaId]
    }

    // http://localhost:8080/1.0/identifiers/did:cheqd:testnet:zCptjtSLBcJyLuHN8SQYfCg9VnYRqVPn/resources/d716b340-eec0-4380-9448-d05b087cf851
    const schema: CheqdSchemaResourceData = await (
      await this.config.agentDependencies.fetch(`https://cheqd-resolver.dev.animo.id/1.0/identifiers/${schemaId}`)
    ).json()

    resourceRegistry.schemas[schemaId] = schema
    return schema
  }

  // TODO-CHEQD: integrate with cheqd sdk
  public async getCredentialDefinitionResource(credentialDefinitionId: string): Promise<CheqdCredDefResourceData> {
    if (resourceRegistry.credentialDefinitions[credentialDefinitionId]) {
      return resourceRegistry.credentialDefinitions[credentialDefinitionId]
    }

    // http://localhost:8080/1.0/identifiers/did:cheqd:testnet:zCptjtSLBcJyLuHN8SQYfCg9VnYRqVPn/resources/d716b340-eec0-4380-9448-d05b087cf851
    const credentialDefinition: CheqdCredDefResourceData = await (
      await this.config.agentDependencies.fetch(
        `https://cheqd-resolver.dev.animo.id/1.0/identifiers/${credentialDefinitionId}`
      )
    ).json()

    resourceRegistry.credentialDefinitions[credentialDefinitionId] = credentialDefinition
    return credentialDefinition
  }

  public async indyCredentialDefinitionIdFromCheqdCredentialDefinitionId(cheqdCredDefId: string) {
    const credDefResource = await this.getCredentialDefinitionResource(cheqdCredDefId)
    console.log('got cred def resource', credDefResource)
    const schemaResource = await this.getSchemaResource(credDefResource.AnonCredsCredDef.schemaId)
    console.log('got schema resource', schemaResource)
    const indyDid = await this.getPublicDid(cheqdCredDefId.split('/')[0])
    console.log('issuer indy did', schemaResource)

    const indySchemaDid = await this.getPublicDid(credDefResource.AnonCredsCredDef.schemaId.split('/')[0])
    const indySchemaId = `${indySchemaDid.did}:2:${schemaResource.AnonCredsSchema.name}:${schemaResource.AnonCredsSchema.version}`

    console.log('Creating txnId from ' + indySchemaId)
    const txnId = IndyCredentialUtils.encode(indySchemaId).substring(0, 6)

    const credentialDefinitionId = `${indyDid.did}:3:CL:${txnId}:${credDefResource.AnonCredsCredDef.tag}`
    return credentialDefinitionId
  }

  public async indySchemaIdFromCheqdSchemaId(cheqdSchemaId: string) {
    const schemaResource = await this.getSchemaResource(cheqdSchemaId)
    const indyDid = await this.getPublicDid(cheqdSchemaId.split('/')[0])
    const indySchemaId = `${indyDid.did}:2:${schemaResource.AnonCredsSchema.name}:${schemaResource.AnonCredsSchema.version}`
    return indySchemaId
  }

  public async registerPublicDid(
    submitterDid: string,
    targetDid: string,
    verkey: string,
    alias: string,
    role?: Indy.NymRole,
    fee?: DidStdFee
  ): Promise<string> {
    // TODO-CHEQD: create/get a keypair from wallet
    // TODO-CHEQD: create keypair from seed to have consistent did (should be in constructor)

    const cheqdDid = await this.getCheqdDid()
    const cheqdKeyPair = this.cheqdKeyPair!

    const indyDid = this.wallet.publicDid
    if (!indyDid) throw new AriesFrameworkError('No public did found')

    const indyKeyPair: IKeyPair = {
      publicKey: TypedArrayEncoder.toBase64(TypedArrayEncoder.fromBase58(indyDid.verkey)),
      privateKey: ':)',
    }

    const indyVerificationKey = createVerificationKeys(indyKeyPair, MethodSpecificIdAlgo.Base58, 'indykey-1')
    const cheqdVerificationKey = createVerificationKeys(cheqdKeyPair, MethodSpecificIdAlgo.Base58, 'key-2')
    const verificationKeys = [indyVerificationKey]

    console.log('did info', {
      indy: indyVerificationKey.didUrl,
      cheqd: cheqdVerificationKey.didUrl,
      cheqdDidPublic: cheqdDid,
    })

    const verificationMethods = createDidVerificationMethod(
      [VerificationMethods.Base58, VerificationMethods.Base58],
      [indyVerificationKey, cheqdVerificationKey]
    ).map((m) => {
      m.id = indyVerificationKey.didUrl + '#' + m.id.split('#')[1]
      m.controller = indyVerificationKey.didUrl
      return m
    })

    const didPayload = createDidPayload(verificationMethods, verificationKeys)
    console.log(JSON.stringify(didPayload))

    // Use the cheqd keypair for sining
    const privateKeyHex = toString(fromString(cheqdKeyPair.privateKey, 'base64'), 'hex')
    const publicKeyHex = toString(fromString(cheqdKeyPair.publicKey, 'base64'), 'hex')

    const key: TImportableEd25519Key = {
      type: 'Ed25519',
      privateKeyHex: privateKeyHex,
      kid: 'kid',
      publicKeyHex: publicKeyHex,
    }

    const signInputs = [key].map((k) => createSignInputsFromImportableEd25519Key(k, [verificationMethods[1]]))

    const sdk = await this.getCheqdSDK()

    const resp = await sdk.createDidTx(signInputs, didPayload, faucet.address, this.fee || 'auto', undefined, { sdk })
    assert(resp.code === 0, `Could not register did! Response ${JSON.stringify(resp)}`)

    return didPayload.id
  }

  public async getPublicDid(did: string): Promise<Indy.GetNymResponse> {
    const didDoc: DIDDocument = (
      await (
        await this.config.agentDependencies.fetch(`https://cheqd-resolver.dev.animo.id/1.0/identifiers/${did}`)
      ).json()
    ).didDocument
    const didDocData = (didDoc.verificationMethod ?? []).find((v) => v.id.endsWith('indykey-1'))
    if (!didDocData) throw new AriesFrameworkError('NO indykey-1 FOUND IN THE VERIFICATION METHODS')
    const verkey = didDocData.publicKeyMultibase
    if (!verkey) throw new AriesFrameworkError('NO publicKeyMultibase FOUND IN THE VERIFICATION METHODS')

    const { data } = MultiBaseEncoder.decode(verkey)
    return {
      did: indyDidFromPublicKeyBase58(TypedArrayEncoder.toBase58(data)),
      verkey,
      // MOCK ROLE
      role: 'TRUSTEE',
    }
  }

  public async registerSchema(_: string, schemaTemplate: SchemaTemplate): Promise<Indy.Schema> {
    const cheqdDid = await this.getCheqdDid()

    const resourceId = uuid()
    const resourceData: CheqdSchemaResourceData = {
      AnonCredsSchema: {
        attr_names: schemaTemplate.attributes,
        name: schemaTemplate.name,
        version: schemaTemplate.version,
      },
      AnonCredsObjectMetadata: {
        objectFamily: 'anoncreds',
        objectFamilyVersion: 'v2',
        objectType: '2',
        objectURI: `${cheqdDid}/resources/${resourceId}`,
        publisherDid: cheqdDid,
      },
    }

    const indyDid = await this.getPublicDid(cheqdDid)

    const indySchemaId = `${indyDid.did}:2:${schemaTemplate.name}:${schemaTemplate.version}`
    console.log('Creating txnId from ' + indySchemaId)
    const txnId = Number(IndyCredentialUtils.encode(indySchemaId).substring(0, 6))

    const resourcePayload: MsgCreateResourcePayload = {
      collectionId: cheqdDid.split(':').reverse()[0],
      id: resourceId,
      name: schemaTemplate.name,
      resourceType: 'CL-Schema',
      data: JsonEncoder.toBuffer(resourceData),
    }

    await this.writeTxResource(resourcePayload)

    return {
      id: resourceData.AnonCredsObjectMetadata.objectURI,
      attrNames: resourceData.AnonCredsSchema.attr_names,
      name: resourceData.AnonCredsSchema.name,
      seqNo: txnId,
      ver: resourceData.AnonCredsSchema.version,
      version: resourceData.AnonCredsSchema.version,
    }
  }

  public async registerCredentialDefinition(
    indyDid: string,
    credentialDefinitionTemplate: CredentialDefinitionTemplate
  ): Promise<Indy.CredDef> {
    const cheqdDid = await this.getCheqdDid()
    const { schema, tag, signatureType, supportRevocation } = credentialDefinitionTemplate

    const indySchemaId = await this.indySchemaIdFromCheqdSchemaId(schema.id)

    const indySchema: Indy.Schema = {
      ...schema,
      id: indySchemaId,
    }

    const [credDefId, credentialDefinition] = await this.indy.issuerCreateAndStoreCredentialDef(
      this.wallet.handle,
      indyDid,
      indySchema,
      tag,
      signatureType,
      {
        support_revocation: supportRevocation,
      }
    )

    this.logger.info(credDefId)

    const resourceId = uuid()
    const resourceData: CheqdCredDefResourceData = {
      AnonCredsCredDef: { ...credentialDefinition, id: undefined, schemaId: schema.id },
      AnonCredsObjectMetadata: {
        objectFamily: 'anoncreds',
        objectFamilyVersion: 'v2',
        objectType: '3',
        objectURI: `${cheqdDid}/resources/${resourceId}`,
        publisherDid: cheqdDid,
      },
    }

    const resourcePayload: MsgCreateResourcePayload = {
      collectionId: cheqdDid.split(':').reverse()[0],
      id: resourceId,
      name: credentialDefinitionTemplate.tag,
      resourceType: 'CL-CredDef',
      data: JsonEncoder.toBuffer(resourceData),
    }
    await this.writeTxResource(resourcePayload)

    return {
      ...resourceData.AnonCredsCredDef,
      id: resourceData.AnonCredsObjectMetadata.objectURI,
    }
  }

  public async getSchema(schemaId: string): Promise<Indy.Schema> {
    const resource = await this.getSchemaResource(schemaId)
    const indyDid = await this.getPublicDid(schemaId.split('/')[0])
    const indySchemaId = `${indyDid.did}:2:${resource.AnonCredsSchema.name}:${resource.AnonCredsSchema.version}`
    console.log('Creating txnId from ' + indySchemaId)
    const txnId = Number(IndyCredentialUtils.encode(indySchemaId).substring(0, 6))

    return {
      id: resource.AnonCredsObjectMetadata.objectURI,
      attrNames: resource.AnonCredsSchema.attr_names,
      name: resource.AnonCredsSchema.name,
      seqNo: txnId,
      ver: resource.AnonCredsSchema.version,
      version: resource.AnonCredsSchema.version,
    }
  }

  public async getCredentialDefinition(credentialDefinitionId: string): Promise<Indy.CredDef> {
    const resource = await this.getCredentialDefinitionResource(credentialDefinitionId)

    return {
      ...resource.AnonCredsCredDef,
      id: resource.AnonCredsObjectMetadata.objectURI,
    }
  }

  private async writeTxResource(resourcePayload: MsgCreateResourcePayload) {
    if (!this.cheqdKeyPair) throw new AriesFrameworkError('Missing verification keys')

    this.logger.warn(`Using payload: ${JSON.stringify(resourcePayload)}`)

    const cheqdDid = await this.getCheqdDid()

    const sdk = await this.getCheqdSDK()
    const resourceSignInputs: ISignInputs[] = [
      {
        verificationMethodId: cheqdDid + '#key-2',
        keyType: 'Ed25519',
        privateKeyHex: toString(fromString(this.cheqdKeyPair.privateKey, 'base64'), 'hex'),
      },
    ]

    const resourceModule = new ResourceModule(sdk.signer)
    const [{ address }] = await sdk.options.wallet.getAccounts()

    const resourceTx = await resourceModule.createResourceTx(
      resourceSignInputs,
      resourcePayload,
      address,
      this.fee ?? {
        amount: [
          {
            denom: 'ncheq',
            amount: '37500000',
          },
        ],
        // TODO: calculate gas or something?
        gas: '1500000',
        payer: address,
      }
    )

    this.logger.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`)
    assert(resourceTx.code === 0, `ResourceTx not written. Exit data ${JSON.stringify(resourceTx)}`)

    return resourceTx
  }

  public getRevocationRegistryDefinition(a: string): Promise<ParseRevocationRegistryDefinitionTemplate> {
    throw new Error('Method not implemented.')
  }

  public getEndpointsForDid(a: string): Promise<IndyEndpointAttrib> {
    throw new Error('Method not implemented.')
  }

  public getRevocationRegistryDelta(
    revocationRegistryDefinitionId: string,
    to: number,
    from: number
  ): Promise<ParseRevocationRegistryDeltaTemplate> {
    throw new Error('Method not implemented.')
  }

  public getRevocationRegistry(a: string, b: number): Promise<ParseRevocationRegistryTemplate> {
    throw new Error('Method not implemented.')
  }

  public connectToPools(): Promise<number[]> {
    throw new Error('Method not implemented.')
  }
}
