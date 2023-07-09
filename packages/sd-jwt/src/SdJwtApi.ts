import type { Key } from '@aries-framework/core'

import { AgentContext, injectable } from '@aries-framework/core'

import { SdJwtService } from './services'

export type CreateSdJwtOptions = {
  headerClaims?: Record<string, unknown>
  nonSelectivelyDisclosableClaims?: Record<string, unknown>
  selectivelyDisclosableClaims?: Record<string, unknown>
  defaultDecoyCount?: number
  // TODO: this could also be a did
  signerKey: Key
}

@injectable()
export class SdJwtApi {
  private sdJwtService: SdJwtService
  private agentContext: AgentContext

  public constructor(agentContext: AgentContext, sdJwtService: SdJwtService) {
    this.agentContext = agentContext
    this.sdJwtService = sdJwtService
  }

  public async createSdJwt(options: CreateSdJwtOptions) {
    return this.sdJwtService.createSdJwt(this.agentContext, options)
  }
}
