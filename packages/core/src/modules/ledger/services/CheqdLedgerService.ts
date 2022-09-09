/* eslint-disable no-console */
import type { Logger } from '../../../logger'
import type {
  CheqdCredDefResourceData,
  CheqdSchemaResourceData,
  CredentialDefinitionResource,
  SchemaResource,
} from '../cheqd/cheqdIndyUtils'
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
  createKeyPairBase64,
  createVerificationKeys,
  createSignInputsFromImportableEd25519Key,
} from '@cheqd/sdk/build/utils'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { generateKeyPairFromSeed } from '@stablelib/ed25519'
import { fromString, toString } from 'uint8arrays'

import { AgentConfig } from '../../../agent/AgentConfig'
import { KeyType } from '../../../crypto'
import { AriesFrameworkError } from '../../../error'
import { injectable } from '../../../plugins'
import { indyDidFromPublicKeyBase58, JsonEncoder, MultiBaseEncoder, TypedArrayEncoder } from '../../../utils'
import { uuid } from '../../../utils/uuid'
import { IndyWallet } from '../../../wallet/IndyWallet'
import { IndyCredentialUtils } from '../../credentials/formats/indy/IndyCredentialUtils'
import { Key } from '../../dids/domain/Key'
import {
  indySchemaIdFromSchemaResource,
  indyCredentialDefinitionFromCredentialDefinitionResource,
  indySchemaFromSchemaResource,
  resourceRegistry,
} from '../cheqd/cheqdIndyUtils'

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

    // Set cheqd key pair and public cheqd did
    if (this.config.publicDidSeed) {
      const seed = this.config.publicDidSeed
      const keyPair = generateKeyPairFromSeed(TypedArrayEncoder.fromString(seed))

      this.cheqdKeyPair = {
        publicKey: toString(keyPair.publicKey, 'base64'),
        privateKey: toString(keyPair.secretKey, 'base64'),
      }

      void this.indy.createKey(this.wallet.handle, { seed }).then((indyVerkey) => {
        const indyKeyPair: IKeyPair = {
          publicKey: TypedArrayEncoder.toBase64(TypedArrayEncoder.fromBase58(indyVerkey)),
          privateKey: ':)',
        }

        const indyVerificationKey = createVerificationKeys(indyKeyPair, MethodSpecificIdAlgo.Base58, 'indykey-1')
        this.cheqdDid = indyVerificationKey.didUrl
      })
    }
  }

  private async getCheqdSDK(fee?: DidStdFee): Promise<CheqdSDK> {
    const RPC_URL = 'https://rpc.cheqd.network'
    const COSMOS_PAYER_WALLET = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix })

    if (this.sdk) return this.sdk

    const sdkOptions: ICheqdSDKOptions = {
      modules: [DIDModule as unknown as AbstractCheqdSDKModule],
      rpcUrl: RPC_URL,
      wallet: COSMOS_PAYER_WALLET,
    }

    this.sdk = await createCheqdSDK(sdkOptions)
    this.fee = fee || {
      amount: [
        {
          denom: faucet.minimalDenom,
          amount: '5000000',
        },
      ],
      gas: '200000',
      payer: (await sdkOptions.wallet.getAccounts())[0].address,
    }
    return this.sdk
  }

  // TODO-CHEQD: integrate with cheqd-sdk
  public async getSchemaResource(schemaId: string): Promise<SchemaResource> {
    const resource = resourceRegistry.schemas[schemaId]

    if (!resource) {
      throw new AriesFrameworkError(`Schema with id ${schemaId} not found`)
    }

    return resource
  }

  // TODO-CHEQD: integrate with cheqd sdk
  public async getCredentialDefinitionResource(credentialDefinitionId: string): Promise<CredentialDefinitionResource> {
    const sdk = await this.getCheqdSDK()

    const resourceModule = new ResourceModule(sdk.signer)
    resourceModule.createResourceTx

    const resource = resourceRegistry.credentialDefinitions[credentialDefinitionId]

    if (!resource) {
      throw new AriesFrameworkError(`Credential definition with id ${credentialDefinitionId} not found`)
    }

    return resource
  }

  public async indyCredentialDefinitionIdFromCheqdCredentialDefinitionId(cheqdCredDefId: string) {
    const credDefResource = await this.getCredentialDefinitionResource(cheqdCredDefId)
    const schemaResource = await this.getSchemaResource(credDefResource.data.AnonCredsCredDef.schemaId)

    const schemaId = indySchemaIdFromSchemaResource(schemaResource)
    const txnId = IndyCredentialUtils.encode(schemaId).substring(0, 6)

    const credentialDefinitionId = `${credDefResource._indyData.did}:3:CL:${txnId}:${credDefResource.data.AnonCredsCredDef.tag}`
    return credentialDefinitionId
  }

  public async indySchemaIdFromCheqdSchemaId(cheqdSchemaId: string) {
    const schemaResource = await this.getSchemaResource(cheqdSchemaId)
    const schemaId = indySchemaIdFromSchemaResource(schemaResource)
    return schemaId
  }

  public async registerPublicDid(
    submitterDid: string,
    targetDid: string,
    verkey: string,
    alias: string,
    role?: Indy.NymRole,
    fee?: DidStdFee
  ): Promise<string> {
    const seed = this.config.publicDidSeed
    assert(seed ? seed.length > 0 : false, 'NO SEED PROVIDED IN THE AGENT CONFIG')
    // TODO-CHEQD: create/get a keypair from wallet
    // TODO-CHEQD: create keypair from seed to have consistent did (should be in constructor)
    const cheqdKeyPair = createKeyPairBase64()
    this.cheqdKeyPair = cheqdKeyPair

    const indyKeyPair: IKeyPair = {
      publicKey: TypedArrayEncoder.toBase64(TypedArrayEncoder.fromBase58(verkey)),
      privateKey: ':)',
    }

    const indyVerificationKey = createVerificationKeys(indyKeyPair, MethodSpecificIdAlgo.Base58, 'indykey-1')
    const cheqdVerificationKey = createVerificationKeys(cheqdKeyPair, MethodSpecificIdAlgo.Base58, 'key-2')
    const verificationKeys = [indyVerificationKey]

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
      await (await this.config.agentDependencies.fetch(`https://dev.uniresolver.io/1.0/identifiers/${did}`)).json()
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

  public async registerSchema(indyDid: string, schemaTemplate: SchemaTemplate): Promise<Indy.Schema> {
    // This part transform the indy did into the cheqd did in a hacky way. In the future we should pass the cheqd did directly,
    // But that requires better integration with the did module
    // Get the verkey for the provided indy did
    const verkey = await this.indy.keyForLocalDid(this.wallet.handle, indyDid)
    const cheqdDidIdentifier = Key.fromPublicKeyBase58(verkey, KeyType.Ed25519).fingerprint.substring(0, 32)

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
        objectURI: `did:cheqd:testnet:${cheqdDidIdentifier}/resources/${resourceId}`,
        publisherDid: `did:cheqd:testnet:${cheqdDidIdentifier}`,
      },
    }

    const cheqdDid = `did:cheqd:testnet:the-did-identifier` // TODO: should be registered did cheqd (probably from config)

    const indySchemaId = `${indyDid}:2:${schemaTemplate.name}:${schemaTemplate.version}`
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
    const { schema, tag, signatureType, supportRevocation } = credentialDefinitionTemplate

    const indySchemaId = await this.indySchemaIdFromCheqdSchemaId(schema.id)
    const cheqdDid = `did:cheqd:testnet:the-did-identifier` // TODO: should be registered did cheqd (probably from config)

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

    return indySchemaFromSchemaResource(resource)
  }

  public async getCredentialDefinition(credentialDefinitionId: string): Promise<Indy.CredDef> {
    const resource = await this.getCredentialDefinitionResource(credentialDefinitionId)

    return indyCredentialDefinitionFromCredentialDefinitionResource(resource)
  }

  private async writeTxResource(resourcePayload: MsgCreateResourcePayload) {
    if (!this.verificationMethods) throw new AriesFrameworkError('Missing verification methods')
    if (!this.verificationKeys) throw new AriesFrameworkError('Missing verification keys')
    if (!this.cheqdKeyPair) throw new AriesFrameworkError('Missing verification keys')

    const didPayload = createDidPayload(this.verificationMethods, [this.verificationKeys])

    this.logger.warn(`Using payload: ${JSON.stringify(resourcePayload)}`)

    const sdk = await this.getCheqdSDK()
    const resourceSignInputs: ISignInputs[] = [
      {
        verificationMethodId: didPayload.verificationMethod[0].id,
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
            amount: '5000000',
          },
        ],
        gas: '200000',
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
