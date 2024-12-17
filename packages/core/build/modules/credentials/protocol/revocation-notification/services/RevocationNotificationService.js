"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevocationNotificationService = void 0;
const EventEmitter_1 = require("../../../../../agent/EventEmitter");
const MessageHandlerRegistry_1 = require("../../../../../agent/MessageHandlerRegistry");
const constants_1 = require("../../../../../constants");
const CredoError_1 = require("../../../../../error/CredoError");
const plugins_1 = require("../../../../../plugins");
const CredentialEvents_1 = require("../../../CredentialEvents");
const RevocationNotification_1 = require("../../../models/RevocationNotification");
const repository_1 = require("../../../repository");
const handlers_1 = require("../handlers");
const V2RevocationNotificationMessage_1 = require("../messages/V2RevocationNotificationMessage");
const revocationIdentifier_1 = require("../util/revocationIdentifier");
let RevocationNotificationService = class RevocationNotificationService {
    constructor(credentialRepository, eventEmitter, messageHandlerRegistry, logger) {
        this.credentialRepository = credentialRepository;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.registerMessageHandlers(messageHandlerRegistry);
    }
    async processRevocationNotification(agentContext, anonCredsRevocationRegistryId, anonCredsCredentialRevocationId, connection, comment) {
        // TODO: can we extract support for this revocation notification handler to the anoncreds module?
        // Search for the revocation registry in both qualified and unqualified forms
        const query = {
            $or: [
                {
                    anonCredsRevocationRegistryId,
                    anonCredsCredentialRevocationId,
                    connectionId: connection.id,
                },
                {
                    anonCredsUnqualifiedRevocationRegistryId: anonCredsRevocationRegistryId,
                    anonCredsCredentialRevocationId,
                    connectionId: connection.id,
                },
            ],
        };
        this.logger.trace(`Getting record by query for revocation notification:`, query);
        const credentialRecord = await this.credentialRepository.getSingleByQuery(agentContext, query);
        credentialRecord.revocationNotification = new RevocationNotification_1.RevocationNotification(comment);
        await this.credentialRepository.update(agentContext, credentialRecord);
        this.logger.trace('Emitting RevocationNotificationReceivedEvent');
        this.eventEmitter.emit(agentContext, {
            type: CredentialEvents_1.CredentialEventTypes.RevocationNotificationReceived,
            payload: {
                // Clone record to prevent mutations after emitting event.
                credentialRecord: credentialRecord.clone(),
            },
        });
    }
    /**
     * Process a received {@link V1RevocationNotificationMessage}. This will create a
     * {@link RevocationNotification} and store it in the corresponding {@link CredentialRecord}
     *
     * @param messageContext message context of RevocationNotificationMessageV1
     */
    async v1ProcessRevocationNotification(messageContext) {
        this.logger.info('Processing revocation notification v1', { message: messageContext.message });
        // ThreadID = indy::<revocation_registry_id>::<credential_revocation_id>
        const threadId = messageContext.message.issueThread;
        try {
            const threadIdGroups = threadId.match(revocationIdentifier_1.v1ThreadRegex);
            if (!threadIdGroups) {
                throw new CredoError_1.CredoError(`Incorrect revocation notification threadId format: \n${threadId}\ndoes not match\n"indy::<revocation_registry_id>::<credential_revocation_id>"`);
            }
            const [, , anonCredsRevocationRegistryId, anonCredsCredentialRevocationId] = threadIdGroups;
            const comment = messageContext.message.comment;
            const connection = messageContext.assertReadyConnection();
            await this.processRevocationNotification(messageContext.agentContext, anonCredsRevocationRegistryId, anonCredsCredentialRevocationId, connection, comment);
        }
        catch (error) {
            this.logger.warn('Failed to process revocation notification message', { error, threadId });
        }
    }
    /**
     * Create a V2 Revocation Notification message
     */
    async v2CreateRevocationNotification(options) {
        const { credentialId, revocationFormat, comment, requestAck } = options;
        const message = new V2RevocationNotificationMessage_1.V2RevocationNotificationMessage({
            credentialId,
            revocationFormat,
            comment,
        });
        if (requestAck) {
            message.setPleaseAck();
        }
        return { message };
    }
    /**
     * Process a received {@link V2RevocationNotificationMessage}. This will create a
     * {@link RevocationNotification} and store it in the corresponding {@link CredentialRecord}
     *
     * @param messageContext message context of RevocationNotificationMessageV2
     */
    async v2ProcessRevocationNotification(messageContext) {
        var _a;
        this.logger.info('Processing revocation notification v2', { message: messageContext.message });
        const credentialId = messageContext.message.credentialId;
        if (![revocationIdentifier_1.v2IndyRevocationFormat, revocationIdentifier_1.v2AnonCredsRevocationFormat].includes(messageContext.message.revocationFormat)) {
            throw new CredoError_1.CredoError(`Unknown revocation format: ${messageContext.message.revocationFormat}. Supported formats are indy-anoncreds and anoncreds`);
        }
        try {
            const credentialIdGroups = (_a = credentialId.match(revocationIdentifier_1.v2IndyRevocationIdentifierRegex)) !== null && _a !== void 0 ? _a : credentialId.match(revocationIdentifier_1.v2AnonCredsRevocationIdentifierRegex);
            if (!credentialIdGroups) {
                throw new CredoError_1.CredoError(`Incorrect revocation notification credentialId format: \n${credentialId}\ndoes not match\n"<revocation_registry_id>::<credential_revocation_id>"`);
            }
            const [, anonCredsRevocationRegistryId, anonCredsCredentialRevocationId] = credentialIdGroups;
            const comment = messageContext.message.comment;
            const connection = messageContext.assertReadyConnection();
            await this.processRevocationNotification(messageContext.agentContext, anonCredsRevocationRegistryId, anonCredsCredentialRevocationId, connection, comment);
        }
        catch (error) {
            this.logger.warn('Failed to process revocation notification message', { error, credentialId });
        }
    }
    registerMessageHandlers(messageHandlerRegistry) {
        messageHandlerRegistry.registerMessageHandler(new handlers_1.V1RevocationNotificationHandler(this));
        messageHandlerRegistry.registerMessageHandler(new handlers_1.V2RevocationNotificationHandler(this));
    }
};
exports.RevocationNotificationService = RevocationNotificationService;
exports.RevocationNotificationService = RevocationNotificationService = __decorate([
    (0, plugins_1.injectable)(),
    __param(3, (0, plugins_1.inject)(constants_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [repository_1.CredentialRepository,
        EventEmitter_1.EventEmitter,
        MessageHandlerRegistry_1.MessageHandlerRegistry, Object])
], RevocationNotificationService);
//# sourceMappingURL=RevocationNotificationService.js.map