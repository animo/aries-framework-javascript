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
exports.CredentialsApi = void 0;
const agent_1 = require("../../agent");
const MessageSender_1 = require("../../agent/MessageSender");
const getOutboundMessageContext_1 = require("../../agent/getOutboundMessageContext");
const constants_1 = require("../../constants");
const error_1 = require("../../error");
const plugins_1 = require("../../plugins");
const DidCommMessageRepository_1 = require("../../storage/didcomm/DidCommMessageRepository");
const services_1 = require("../connections/services");
const RoutingService_1 = require("../routing/services/RoutingService");
const CredentialsModuleConfig_1 = require("./CredentialsModuleConfig");
const CredentialState_1 = require("./models/CredentialState");
const services_2 = require("./protocol/revocation-notification/services");
const CredentialRepository_1 = require("./repository/CredentialRepository");
let CredentialsApi = class CredentialsApi {
    constructor(messageSender, connectionService, agentContext, logger, credentialRepository, mediationRecipientService, didCommMessageRepository, revocationNotificationService, config) {
        this.messageSender = messageSender;
        this.connectionService = connectionService;
        this.credentialRepository = credentialRepository;
        this.routingService = mediationRecipientService;
        this.agentContext = agentContext;
        this.didCommMessageRepository = didCommMessageRepository;
        this.revocationNotificationService = revocationNotificationService;
        this.logger = logger;
        this.config = config;
    }
    getProtocol(protocolVersion) {
        const credentialProtocol = this.config.credentialProtocols.find((protocol) => protocol.version === protocolVersion);
        if (!credentialProtocol) {
            throw new error_1.CredoError(`No credential protocol registered for protocol version ${protocolVersion}`);
        }
        return credentialProtocol;
    }
    /**
     * Initiate a new credential exchange as holder by sending a credential proposal message
     * to the connection with the specified connection id.
     *
     * @param options configuration to use for the proposal
     * @returns Credential exchange record associated with the sent proposal message
     */
    async proposeCredential(options) {
        const protocol = this.getProtocol(options.protocolVersion);
        const connectionRecord = await this.connectionService.getById(this.agentContext, options.connectionId);
        // Assert
        connectionRecord.assertReady();
        // will get back a credential record -> map to Credential Exchange Record
        const { credentialRecord, message } = await protocol.createProposal(this.agentContext, {
            connectionRecord,
            credentialFormats: options.credentialFormats,
            comment: options.comment,
            autoAcceptCredential: options.autoAcceptCredential,
            goalCode: options.goalCode,
            goal: options.goal,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: credentialRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    /**
     * Accept a credential proposal as issuer (by sending a credential offer message) to the connection
     * associated with the credential record.
     *
     * @param options config object for accepting the proposal
     * @returns Credential exchange record associated with the credential offer
     *
     */
    async acceptProposal(options) {
        const credentialRecord = await this.getById(options.credentialRecordId);
        if (!credentialRecord.connectionId) {
            throw new error_1.CredoError(`No connectionId found for credential record '${credentialRecord.id}'. Connection-less issuance does not support credential proposal or negotiation.`);
        }
        // with version we can get the protocol
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        const connectionRecord = await this.connectionService.getById(this.agentContext, credentialRecord.connectionId);
        // Assert
        connectionRecord.assertReady();
        // will get back a credential record -> map to Credential Exchange Record
        const { message } = await protocol.acceptProposal(this.agentContext, {
            credentialRecord,
            credentialFormats: options.credentialFormats,
            comment: options.comment,
            autoAcceptCredential: options.autoAcceptCredential,
            goalCode: options.goalCode,
            goal: options.goal,
        });
        // send the message
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: credentialRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    /**
     * Negotiate a credential proposal as issuer (by sending a credential offer message) to the connection
     * associated with the credential record.
     *
     * @param options configuration for the offer see {@link NegotiateCredentialProposalOptions}
     * @returns Credential exchange record associated with the credential offer
     *
     */
    async negotiateProposal(options) {
        const credentialRecord = await this.getById(options.credentialRecordId);
        if (!credentialRecord.connectionId) {
            throw new error_1.CredoError(`No connection id for credential record ${credentialRecord.id} not found. Connection-less issuance does not support negotiation`);
        }
        // with version we can get the Service
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        const { message } = await protocol.negotiateProposal(this.agentContext, {
            credentialRecord,
            credentialFormats: options.credentialFormats,
            comment: options.comment,
            autoAcceptCredential: options.autoAcceptCredential,
            goalCode: options.goalCode,
            goal: options.goal,
        });
        const connectionRecord = await this.connectionService.getById(this.agentContext, credentialRecord.connectionId);
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: credentialRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    /**
     * Initiate a new credential exchange as issuer by sending a credential offer message
     * to the connection with the specified connection id.
     *
     * @param options config options for the credential offer
     * @returns Credential exchange record associated with the sent credential offer message
     */
    async offerCredential(options) {
        const connectionRecord = await this.connectionService.getById(this.agentContext, options.connectionId);
        const protocol = this.getProtocol(options.protocolVersion);
        this.logger.debug(`Got a credentialProtocol object for version ${options.protocolVersion}`);
        const { message, credentialRecord } = await protocol.createOffer(this.agentContext, {
            credentialFormats: options.credentialFormats,
            autoAcceptCredential: options.autoAcceptCredential,
            comment: options.comment,
            connectionRecord,
            goalCode: options.goalCode,
            goal: options.goal,
        });
        this.logger.debug('Offer Message successfully created; message= ', message);
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: credentialRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    /**
     * Accept a credential offer as holder (by sending a credential request message) to the connection
     * associated with the credential record.
     *
     * @param options The object containing config options of the offer to be accepted
     * @returns Object containing offer associated credential record
     */
    async acceptOffer(options) {
        const credentialRecord = await this.getById(options.credentialRecordId);
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        this.logger.debug(`Got a credentialProtocol object for this version; version = ${protocol.version}`);
        const offerMessage = await protocol.findOfferMessage(this.agentContext, credentialRecord.id);
        if (!offerMessage) {
            throw new error_1.CredoError(`No offer message found for credential record with id '${credentialRecord.id}'`);
        }
        // Use connection if present
        const connectionRecord = credentialRecord.connectionId
            ? await this.connectionService.getById(this.agentContext, credentialRecord.connectionId)
            : undefined;
        connectionRecord === null || connectionRecord === void 0 ? void 0 : connectionRecord.assertReady();
        const { message } = await protocol.acceptOffer(this.agentContext, {
            credentialRecord,
            credentialFormats: options.credentialFormats,
            comment: options.comment,
            autoAcceptCredential: options.autoAcceptCredential,
            goalCode: options.goalCode,
            goal: options.goal,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            connectionRecord,
            associatedRecord: credentialRecord,
            lastReceivedMessage: offerMessage,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    async declineOffer(credentialRecordId, options) {
        var _a;
        const credentialRecord = await this.getById(credentialRecordId);
        credentialRecord.assertState(CredentialState_1.CredentialState.OfferReceived);
        // with version we can get the Service
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        if (options === null || options === void 0 ? void 0 : options.sendProblemReport) {
            await this.sendProblemReport({
                credentialRecordId,
                description: (_a = options.problemReportDescription) !== null && _a !== void 0 ? _a : 'Offer declined',
            });
        }
        await protocol.updateState(this.agentContext, credentialRecord, CredentialState_1.CredentialState.Declined);
        return credentialRecord;
    }
    async negotiateOffer(options) {
        const credentialRecord = await this.getById(options.credentialRecordId);
        if (!credentialRecord.connectionId) {
            throw new error_1.CredoError(`No connection id for credential record ${credentialRecord.id} not found. Connection-less issuance does not support negotiation`);
        }
        const connectionRecord = await this.connectionService.getById(this.agentContext, credentialRecord.connectionId);
        // Assert
        connectionRecord.assertReady();
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        const { message } = await protocol.negotiateOffer(this.agentContext, {
            credentialFormats: options.credentialFormats,
            credentialRecord,
            comment: options.comment,
            autoAcceptCredential: options.autoAcceptCredential,
            goalCode: options.goalCode,
            goal: options.goal,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: credentialRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    /**
     * Initiate a new credential exchange as issuer by creating a credential offer
     * not bound to any connection. The offer must be delivered out-of-band to the holder
     * @param options The credential options to use for the offer
     * @returns The credential record and credential offer message
     */
    async createOffer(options) {
        const protocol = this.getProtocol(options.protocolVersion);
        this.logger.debug(`Got a credentialProtocol object for version ${options.protocolVersion}`);
        const { message, credentialRecord } = await protocol.createOffer(this.agentContext, {
            credentialFormats: options.credentialFormats,
            comment: options.comment,
            autoAcceptCredential: options.autoAcceptCredential,
            goalCode: options.goalCode,
            goal: options.goal,
        });
        this.logger.debug('Offer Message successfully created', { message });
        return { message, credentialRecord };
    }
    /**
     * Accept a credential request as holder (by sending a credential request message) to the connection
     * associated with the credential record.
     *
     * @param options The object containing config options of the request
     * @returns CredentialExchangeRecord updated with information pertaining to this request
     */
    async acceptRequest(options) {
        const credentialRecord = await this.getById(options.credentialRecordId);
        // with version we can get the Service
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        this.logger.debug(`Got a credentialProtocol object for version ${credentialRecord.protocolVersion}`);
        // Use connection if present
        const connectionRecord = credentialRecord.connectionId
            ? await this.connectionService.getById(this.agentContext, credentialRecord.connectionId)
            : undefined;
        connectionRecord === null || connectionRecord === void 0 ? void 0 : connectionRecord.assertReady();
        const requestMessage = await protocol.findRequestMessage(this.agentContext, credentialRecord.id);
        if (!requestMessage) {
            throw new error_1.CredoError(`No request message found for credential record with id '${credentialRecord.id}'`);
        }
        const offerMessage = await protocol.findOfferMessage(this.agentContext, credentialRecord.id);
        if (!offerMessage) {
            throw new error_1.CredoError(`No offer message found for credential record with id '${credentialRecord.id}'`);
        }
        const { message } = await protocol.acceptRequest(this.agentContext, {
            credentialRecord,
            credentialFormats: options.credentialFormats,
            comment: options.comment,
            autoAcceptCredential: options.autoAcceptCredential,
        });
        this.logger.debug('We have a credential message (sending outbound): ', message);
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            connectionRecord,
            associatedRecord: credentialRecord,
            lastReceivedMessage: requestMessage,
            lastSentMessage: offerMessage,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    /**
     * Accept a credential as holder (by sending a credential acknowledgement message) to the connection
     * associated with the credential record.
     *
     * @param credentialRecordId The id of the credential record for which to accept the credential
     * @returns credential exchange record associated with the sent credential acknowledgement message
     *
     */
    async acceptCredential(options) {
        const credentialRecord = await this.getById(options.credentialRecordId);
        // with version we can get the Service
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        this.logger.debug(`Got a credentialProtocol object for version ${credentialRecord.protocolVersion}`);
        // Use connection if present
        const connectionRecord = credentialRecord.connectionId
            ? await this.connectionService.getById(this.agentContext, credentialRecord.connectionId)
            : undefined;
        connectionRecord === null || connectionRecord === void 0 ? void 0 : connectionRecord.assertReady();
        const requestMessage = await protocol.findRequestMessage(this.agentContext, credentialRecord.id);
        if (!requestMessage) {
            throw new error_1.CredoError(`No request message found for credential record with id '${credentialRecord.id}'`);
        }
        const credentialMessage = await protocol.findCredentialMessage(this.agentContext, credentialRecord.id);
        if (!credentialMessage) {
            throw new error_1.CredoError(`No credential message found for credential record with id '${credentialRecord.id}'`);
        }
        const { message } = await protocol.acceptCredential(this.agentContext, {
            credentialRecord,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            connectionRecord,
            associatedRecord: credentialRecord,
            lastReceivedMessage: credentialMessage,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    /**
     * Send a revocation notification for a credential exchange record. Currently Revocation Notification V2 protocol is supported
     *
     * @param credentialRecordId The id of the credential record for which to send revocation notification
     */
    async sendRevocationNotification(options) {
        const { credentialRecordId, revocationId, revocationFormat, comment, requestAck } = options;
        const credentialRecord = await this.getById(credentialRecordId);
        const { message } = await this.revocationNotificationService.v2CreateRevocationNotification({
            credentialId: revocationId,
            revocationFormat,
            comment,
            requestAck,
        });
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        const requestMessage = await protocol.findRequestMessage(this.agentContext, credentialRecord.id);
        if (!requestMessage) {
            throw new error_1.CredoError(`No request message found for credential record with id '${credentialRecord.id}'`);
        }
        const offerMessage = await protocol.findOfferMessage(this.agentContext, credentialRecord.id);
        if (!offerMessage) {
            throw new error_1.CredoError(`No offer message found for credential record with id '${credentialRecord.id}'`);
        }
        // Use connection if present
        const connectionRecord = credentialRecord.connectionId
            ? await this.connectionService.getById(this.agentContext, credentialRecord.connectionId)
            : undefined;
        connectionRecord === null || connectionRecord === void 0 ? void 0 : connectionRecord.assertReady();
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            connectionRecord,
            associatedRecord: credentialRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
    }
    /**
     * Send problem report message for a credential record
     * @param credentialRecordId The id of the credential record for which to send problem report
     * @returns credential record associated with the credential problem report message
     */
    async sendProblemReport(options) {
        const credentialRecord = await this.getById(options.credentialRecordId);
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        const offerMessage = await protocol.findOfferMessage(this.agentContext, credentialRecord.id);
        const { message: problemReport } = await protocol.createProblemReport(this.agentContext, {
            description: options.description,
            credentialRecord,
        });
        // Use connection if present
        const connectionRecord = credentialRecord.connectionId
            ? await this.connectionService.getById(this.agentContext, credentialRecord.connectionId)
            : undefined;
        connectionRecord === null || connectionRecord === void 0 ? void 0 : connectionRecord.assertReady();
        // If there's no connection (so connection-less, we require the state to be offer received)
        if (!connectionRecord) {
            credentialRecord.assertState(CredentialState_1.CredentialState.OfferReceived);
            if (!offerMessage) {
                throw new error_1.CredoError(`No offer message found for credential record with id '${credentialRecord.id}'`);
            }
        }
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message: problemReport,
            connectionRecord,
            associatedRecord: credentialRecord,
            lastReceivedMessage: offerMessage !== null && offerMessage !== void 0 ? offerMessage : undefined,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return credentialRecord;
    }
    async getFormatData(credentialRecordId) {
        const credentialRecord = await this.getById(credentialRecordId);
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        return protocol.getFormatData(this.agentContext, credentialRecordId);
    }
    /**
     * Retrieve a credential record by id
     *
     * @param credentialRecordId The credential record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The credential record
     *
     */
    getById(credentialRecordId) {
        return this.credentialRepository.getById(this.agentContext, credentialRecordId);
    }
    /**
     * Retrieve all credential records
     *
     * @returns List containing all credential records
     */
    getAll() {
        return this.credentialRepository.getAll(this.agentContext);
    }
    /**
     * Retrieve all credential records by specified query params
     *
     * @returns List containing all credential records matching specified query paramaters
     */
    findAllByQuery(query, queryOptions) {
        return this.credentialRepository.findByQuery(this.agentContext, query, queryOptions);
    }
    /**
     * Find a credential record by id
     *
     * @param credentialRecordId the credential record id
     * @returns The credential record or null if not found
     */
    findById(credentialRecordId) {
        return this.credentialRepository.findById(this.agentContext, credentialRecordId);
    }
    /**
     * Delete a credential record by id, also calls service to delete from wallet
     *
     * @param credentialId the credential record id
     * @param options the delete credential options for the delete operation
     */
    async deleteById(credentialId, options) {
        const credentialRecord = await this.getById(credentialId);
        const protocol = this.getProtocol(credentialRecord.protocolVersion);
        return protocol.delete(this.agentContext, credentialRecord, options);
    }
    /**
     * Update a credential exchange record
     *
     * @param credentialRecord the credential exchange record
     */
    async update(credentialRecord) {
        await this.credentialRepository.update(this.agentContext, credentialRecord);
    }
    async findProposalMessage(credentialExchangeId) {
        const protocol = await this.getServiceForCredentialExchangeId(credentialExchangeId);
        return protocol.findProposalMessage(this.agentContext, credentialExchangeId);
    }
    async findOfferMessage(credentialExchangeId) {
        const protocol = await this.getServiceForCredentialExchangeId(credentialExchangeId);
        return protocol.findOfferMessage(this.agentContext, credentialExchangeId);
    }
    async findRequestMessage(credentialExchangeId) {
        const protocol = await this.getServiceForCredentialExchangeId(credentialExchangeId);
        return protocol.findRequestMessage(this.agentContext, credentialExchangeId);
    }
    async findCredentialMessage(credentialExchangeId) {
        const protocol = await this.getServiceForCredentialExchangeId(credentialExchangeId);
        return protocol.findCredentialMessage(this.agentContext, credentialExchangeId);
    }
    async getServiceForCredentialExchangeId(credentialExchangeId) {
        const credentialExchangeRecord = await this.getById(credentialExchangeId);
        return this.getProtocol(credentialExchangeRecord.protocolVersion);
    }
};
exports.CredentialsApi = CredentialsApi;
exports.CredentialsApi = CredentialsApi = __decorate([
    (0, plugins_1.injectable)(),
    __param(3, (0, plugins_1.inject)(constants_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [MessageSender_1.MessageSender,
        services_1.ConnectionService,
        agent_1.AgentContext, Object, CredentialRepository_1.CredentialRepository,
        RoutingService_1.RoutingService,
        DidCommMessageRepository_1.DidCommMessageRepository,
        services_2.RevocationNotificationService,
        CredentialsModuleConfig_1.CredentialsModuleConfig])
], CredentialsApi);
//# sourceMappingURL=CredentialsApi.js.map