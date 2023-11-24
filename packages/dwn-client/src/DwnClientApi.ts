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
}
