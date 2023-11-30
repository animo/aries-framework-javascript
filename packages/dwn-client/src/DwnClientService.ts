import type { BackupWalletOptions, ImportWalletOptions, WalletRecord } from './DwnClientOptions'
import type { AgentContext } from '@aries-framework/core'
import type { DwnApi } from '@web5/api'

import { InjectionSymbols, Logger, WalletApi, inject, injectable } from '@aries-framework/core'
import { Web5 } from '@web5/api'
import fs from 'fs'
import path from 'node:path'

import { DwnError } from './DwnClientError'

@injectable()
export class DwnClientService {
  private logger: Logger

  public constructor(@inject(InjectionSymbols.Logger) logger: Logger) {
    this.logger = logger
  }

  public async connect(dwnEndpoints: string[]) {
    const { web5, did } = await Web5.connect({
      sync: '20s',

      techPreview: { dwnEndpoints },
    })

    return { dwnApi: web5.dwn, did }
  }

  private async exportWallet(agentContext: AgentContext, walletPath: string, secretKey: string) {
    const walletApi = agentContext.dependencyManager.resolve(WalletApi)
    await walletApi.export({ path: walletPath, key: secretKey })
  }

  private getWalletPaths(baseDir: string) {
    return {
      walletPath: path.join(baseDir, 'wallet'),
      walletShmPath: path.join(baseDir, 'wallet-shm'),
      walletWalPath: path.join(baseDir, 'wallet-wal'),
    }
  }

  private readWalletFiles(baseDir: string) {
    const { walletPath, walletShmPath, walletWalPath } = this.getWalletPaths(baseDir)

    const wallet = fs.readFileSync(walletPath)
    const walletShm = fs.readFileSync(walletShmPath)
    const walletWal = fs.readFileSync(walletWalPath)

    return { wallet, walletShm, walletWal }
  }

  private writeWalletFiles(baseDir: string, walletRecord: WalletRecord) {
    const { walletPath, walletShmPath, walletWalPath } = this.getWalletPaths(baseDir)

    fs.writeFileSync(walletPath, Buffer.from(walletRecord.wallet.data), { encoding: null })
    fs.writeFileSync(walletShmPath, Buffer.from(walletRecord.walletShm.data), { encoding: null })
    fs.writeFileSync(walletWalPath, Buffer.from(walletRecord.walletWal.data), { encoding: null })
  }

  public async backupWallet(agentContext: AgentContext, options: BackupWalletOptions) {
    const { dwnApi, secretKey, fromDid } = options

    const exportDir = path.join(__dirname, 'export-wallet')
    fs.mkdirSync(exportDir, { recursive: true })

    const { walletPath } = this.getWalletPaths(exportDir)
    await this.exportWallet(agentContext, walletPath, secretKey)
    const { wallet, walletShm, walletWal } = this.readWalletFiles(exportDir)

    fs.rmSync(exportDir, { recursive: true, force: true })

    const walletRecord: WalletRecord = {
      wallet: wallet.toJSON(),
      walletShm: walletShm.toJSON(),
      walletWal: walletWal.toJSON(),
    }

    const { record } = await dwnApi.records.create({
      data: { walletRecord },
      store: true,
      message: { dataFormat: 'application/json' },
    })

    if (!record) throw new DwnError('Error creating record for wallet backup.')
    const result = await record.send(fromDid)

    if (result.status.code < 200 || result.status.code >= 300) {
      throw new DwnError(
        `Error sending wallet backup to DWN. Status code '${result.status.code}'. Details '${result.status.detail}'.`
      )
    }

    return { record }
  }

  private async fetchWalletRecordFromDwn(fromDid: string, dwnApi: DwnApi, recordId: string) {
    const result = await dwnApi.records.read({
      from: fromDid,
      message: { filter: { recordId } },
    })

    if (result.status.code < 100 || result.status.code >= 300) {
      throw new Error(
        `Error fetching wallet. Error code: ${result.status.code}. Error details '${result.status.detail}'.`
      )
    }

    const record = await result.record.data.json()
    return record.walletRecord as WalletRecord
  }

  public async importWallet(agentContext: AgentContext, options: ImportWalletOptions) {
    const { dwnApi, fromDid, recordId, secretKey } = options
    const walletRecord = await this.fetchWalletRecordFromDwn(fromDid, dwnApi, recordId)

    const importDir = path.join(__dirname, 'import-wallet')
    fs.mkdirSync(importDir, { recursive: true })

    const { walletPath } = this.getWalletPaths(importDir)
    this.writeWalletFiles(importDir, walletRecord)

    try {
      const walletApi = agentContext.dependencyManager.resolve(WalletApi)
      if (!agentContext.config.walletConfig) throw new DwnError('wallet config not found')

      const config = agentContext.config.walletConfig
      await walletApi.import(config, { path: walletPath, key: secretKey })
    } finally {
      // remove the wallet export directory
      fs.rmSync(importDir, { recursive: true, force: true })
    }
  }
}
