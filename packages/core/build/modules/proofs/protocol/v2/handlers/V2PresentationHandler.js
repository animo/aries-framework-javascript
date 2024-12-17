"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2PresentationHandler = void 0;
const getOutboundMessageContext_1 = require("../../../../../agent/getOutboundMessageContext");
const didcomm_1 = require("../../../../../storage/didcomm");
const messages_1 = require("../messages");
class V2PresentationHandler {
    constructor(proofProtocol) {
        this.supportedMessages = [messages_1.V2PresentationMessage];
        this.proofProtocol = proofProtocol;
    }
    async handle(messageContext) {
        const proofRecord = await this.proofProtocol.processPresentation(messageContext);
        const shouldAutoRespond = await this.proofProtocol.shouldAutoRespondToPresentation(messageContext.agentContext, {
            proofRecord,
            presentationMessage: messageContext.message,
        });
        if (shouldAutoRespond) {
            return await this.acceptPresentation(proofRecord, messageContext);
        }
    }
    async acceptPresentation(proofRecord, messageContext) {
        messageContext.agentContext.config.logger.info(`Automatically sending acknowledgement with autoAccept`);
        const { message } = await this.proofProtocol.acceptPresentation(messageContext.agentContext, {
            proofRecord,
        });
        const didCommMessageRepository = messageContext.agentContext.dependencyManager.resolve(didcomm_1.DidCommMessageRepository);
        const requestMessage = await didCommMessageRepository.getAgentMessage(messageContext.agentContext, {
            associatedRecordId: proofRecord.id,
            messageClass: messages_1.V2RequestPresentationMessage,
            role: didcomm_1.DidCommMessageRole.Sender,
        });
        return (0, getOutboundMessageContext_1.getOutboundMessageContext)(messageContext.agentContext, {
            connectionRecord: messageContext.connection,
            message,
            associatedRecord: proofRecord,
            lastReceivedMessage: messageContext.message,
            lastSentMessage: requestMessage,
        });
    }
}
exports.V2PresentationHandler = V2PresentationHandler;
//# sourceMappingURL=V2PresentationHandler.js.map