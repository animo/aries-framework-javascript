import type { AgentConfig } from '../../../../agent/AgentConfig'
import type { Logger } from '../../../../logger'
import type { CheqdSDK, ICheqdSDKOptions } from '@cheqd/sdk'
import type { AbstractCheqdSDKModule } from '@cheqd/sdk/build/modules/_'
import type { DidStdFee } from '@cheqd/sdk/build/types'
import type { MsgCreateDidPayload } from '@cheqd/ts-proto/cheqd/v1/tx'
import type { MsgCreateResourcePayload } from '@cheqd/ts-proto/resource/v1/tx'
import type { CredDef } from 'indy-sdk'

import { createCheqdSDK, DIDModule, ResourceModule } from '@cheqd/sdk'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { generateKeyPairFromSeed } from '@stablelib/ed25519'
import { toString } from 'uint8arrays/to-string'

import { AriesFrameworkError } from '../../../../error'
import { TypedArrayEncoder } from '../../../../utils'
import { LedgerError } from '../../error/LedgerError'

export class CheqdPool {
  private poolConfig: CheqdPoolConfig
  private config: AgentConfig
  private logger: Logger
  private sdk?: CheqdSDK

  public constructor(agentConfig: AgentConfig) {
    if (agentConfig.ledgerType == 'cheqd' && agentConfig.cheqdConfig) {
      this.poolConfig = agentConfig.cheqdConfig
      this.config = agentConfig
    } else {
      throw new LedgerError('No cheqd ledgers configured')
    }
    this.logger = agentConfig.logger
  }

  public async connect() {
    const RPC_URL = this.poolConfig.rpcUrl
    const COSMOS_PAYER_WALLET = await DirectSecp256k1HdWallet.fromMnemonic(this.poolConfig.faucet.mnemonic, {
      prefix: this.poolConfig.faucet.prefix, 
    })

    if (this.sdk) return this.sdk

    const sdkOptions: ICheqdSDKOptions = {
      modules: [DIDModule as unknown as AbstractCheqdSDKModule, ResourceModule as unknown as AbstractCheqdSDKModule],
      rpcUrl: RPC_URL,
      wallet: COSMOS_PAYER_WALLET,
    }

    try {
      this.sdk = await createCheqdSDK(sdkOptions)
      this.poolConfig.fee = this.poolConfig.fee || {
      amount: [
          {
            denom: this.poolConfig.faucet.minimalDenom,
            amount: '25000000',
          },
        ],
        gas: '1000000',
        payer: (await sdkOptions.wallet.getAccounts())[0].address,
      }
    } catch (error) {
      this.logger.debug(`Fabric Error: ${JSON.stringify(error)}`)
      throw new LedgerError('Failed to connect to cheqd network')
    }
  }

  public generateKeyPair() {
    if (!this.config.publicDidSeed) {
      throw new AriesFrameworkError("Can't create DID without publicDidSeed")
    }

    // create cheqd keypair
    const seed = this.config.publicDidSeed
    const keyPair = generateKeyPairFromSeed(TypedArrayEncoder.fromString(seed))

    const cheqdKeyPair = {
      publicKey: toString(keyPair.publicKey, 'base64'),
      privateKey: toString(keyPair.secretKey, 'base64'),
    }

    return cheqdKeyPair
  }

  // TODO: add a common submit WriteTx
  public async createDidTx(signInputs: ISignInputs[], didPayload: MsgCreateDidPayload) {
    return await this.sdk!.createDidTx(
      signInputs,
      didPayload, 
      this.poolConfig.faucet.address, 
      this.poolConfig.fee || 'auto', 
      undefined
    )
  }

  public async submitWriteTxResource(resourceSignInputs: ISignInputs[], resourcePayload: MsgCreateResourcePayload) {
    this.logger.warn(`Using payload: ${JSON.stringify(resourcePayload)}`)
    const resourceModule = new ResourceModule(this.sdk!.signer)
    const [{ address }] = await this.sdk!.options.wallet.getAccounts()

    const response = await resourceModule.createResourceTx(
      resourceSignInputs,
      resourcePayload,
      address,
      this.poolConfig.fee || 'auto'
    )

    if (!response) {
      throw new LedgerError('Failed to write transaction on ledger')
    }

    this.logger.warn(`Resource Tx: ${JSON.stringify(response)}`)
    return response
  }

  public async submitReadRequest(id: string) {
    try {
      const response = await this.config.agentDependencies.fetch(`${this.poolConfig.resolverUrl}/1.0/identifiers/${id}`)
      if (!response) {
        throw new LedgerError(`No response received from the resolver`)
      }
      return response.json()
    } catch (error) {
      this.logger.debug(`Fabric Error: ${JSON.stringify(error)}`)
      throw new LedgerError(`Invalid request`)
    }
  }
}

export interface CheqdPoolConfig {
  rpcUrl: string
  resolverUrl: string
  faucet: {
    prefix: 'cheqd'
    minimalDenom: 'ncheq'
    mnemonic: string
    address: string
  }
  fee?: DidStdFee
}

export interface LocalResourceRegistry {
  schemas: { [resourceId: string]: CheqdSchemaResourceData }
  credentialDefinitions: { [resourceId: string]: CheqdCredDefResourceData }
}

// Cache
export const resourceRegistry: LocalResourceRegistry = {
  schemas: {},
  credentialDefinitions: {},
}

export type CheqdSchemaResourceData = {
  AnonCredsSchema: {
    attr_names: string[]
    name: string
    version: string
  }
  AnonCredsObjectMetadata: {
    objectFamily: 'anoncreds'
    objectFamilyVersion: 'v2'
    objectType: '2'
    publisherDid: string
    objectURI: string
  }
}

export type CheqdCredDefResourceData = {
  AnonCredsCredDef: Omit<CredDef, 'id'> & { id?: undefined }
  AnonCredsObjectMetadata: {
    objectFamily: 'anoncreds'
    objectFamilyVersion: 'v2'
    objectType: '3'
    publisherDid: string
    objectURI: string
  }
}

export interface ISignInputs {
  verificationMethodId: string
  keyType?: 'Ed25519' | 'Secp256k1' | 'P256'
  privateKeyHex: string
}
