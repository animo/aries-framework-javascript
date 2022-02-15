import type { AgentConfig } from '../../../../../agent/AgentConfig'
import type { Handler, HandlerInboundMessage } from '../../../../../agent/Handler'
import type { DidCommMessageRepository } from '../../../../../storage'
import type { ProofResponseCoordinator } from '../../../ProofResponseCoordinator'
import type { ProofService } from '../../../ProofService'
import type { ProofRecord } from '../../../repository'

import { createOutboundMessage, createOutboundServiceMessage } from '../../../../../agent/helpers'
import { V1PresentationMessage } from '../messages'

export class V1PresentationHandler implements Handler {
  private proofService: ProofService
  private agentConfig: AgentConfig
  private proofResponseCoordinator: ProofResponseCoordinator
  private didCommMessageRepository: DidCommMessageRepository
  public supportedMessages = [V1PresentationMessage]

  public constructor(
    proofService: ProofService,
    agentConfig: AgentConfig,
    proofResponseCoordinator: ProofResponseCoordinator,
    didCommMessageRepository: DidCommMessageRepository
  ) {
    this.proofService = proofService
    this.agentConfig = agentConfig
    this.proofResponseCoordinator = proofResponseCoordinator
    this.didCommMessageRepository = didCommMessageRepository
  }

  public async handle(messageContext: HandlerInboundMessage<V1PresentationHandler>) {
    const proofRecord = await this.proofService.processPresentation(messageContext)

    if (this.proofResponseCoordinator.shouldAutoRespondToPresentation(proofRecord)) {
      return await this.createAck(proofRecord, messageContext)
    }
  }

  private async createAck(record: ProofRecord, messageContext: HandlerInboundMessage<V1PresentationHandler>) {
    this.agentConfig.logger.info(
      `Automatically sending acknowledgement with autoAccept on ${this.agentConfig.autoAcceptProofs}`
    )

    const { message, proofRecord } = await this.proofService.createAck({
      proofRecord: record,
    })

    const requestMessage = await this.didCommMessageRepository.findAgentMessage({
      associatedRecordId: proofRecord.id,
      messageClass: V1PresentationMessage,
    })

    const presentationMessage = await this.didCommMessageRepository.findAgentMessage({
      associatedRecordId: proofRecord.id,
      messageClass: V1PresentationMessage,
    })

    if (messageContext.connection) {
      return createOutboundMessage(messageContext.connection, message)
    } else if (requestMessage?.service && presentationMessage?.service) {
      const recipientService = presentationMessage?.service
      const ourService = requestMessage?.service

      return createOutboundServiceMessage({
        payload: message,
        service: recipientService.toDidCommService(),
        senderKey: ourService.recipientKeys[0],
      })
    }

    this.agentConfig.logger.error(`Could not automatically create presentation ack`)
  }
}
