import type { BackupWalletOptions, ImportWalletOptions } from './DwnClientOptions'

import { AgentContext, injectable } from '@aries-framework/core'

import { DwnClientService } from './DwnClientService'

/**
 * @public
 */
@injectable()
export class DwnClientApi {
  private agentContext: AgentContext
  private dwnClientService: DwnClientService

  public constructor(agentContext: AgentContext, dwnClientService: DwnClientService) {
    this.agentContext = agentContext
    this.dwnClientService = dwnClientService
  }

  public async connect(dwnEndpoints: string[]) {
    return await this.dwnClientService.connect(dwnEndpoints)
  }

  public async backupWallet(options: BackupWalletOptions) {
    return await this.dwnClientService.backupWallet(this.agentContext, options)
  }

  public async importWallet(options: ImportWalletOptions) {
    return await this.dwnClientService.importWallet(this.agentContext, options)
  }
}
