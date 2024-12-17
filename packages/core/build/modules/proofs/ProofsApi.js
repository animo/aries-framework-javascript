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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofsApi = void 0;
const tsyringe_1 = require("tsyringe");
const MessageSender_1 = require("../../agent/MessageSender");
const AgentContext_1 = require("../../agent/context/AgentContext");
const getOutboundMessageContext_1 = require("../../agent/getOutboundMessageContext");
const error_1 = require("../../error");
const ConnectionService_1 = require("../connections/services/ConnectionService");
const ProofsModuleConfig_1 = require("./ProofsModuleConfig");
const ProofState_1 = require("./models/ProofState");
const ProofRepository_1 = require("./repository/ProofRepository");
let ProofsApi = class ProofsApi {
    constructor(messageSender, connectionService, agentContext, proofRepository, config) {
        this.messageSender = messageSender;
        this.connectionService = connectionService;
        this.proofRepository = proofRepository;
        this.agentContext = agentContext;
        this.config = config;
    }
    getProtocol(protocolVersion) {
        const proofProtocol = this.config.proofProtocols.find((protocol) => protocol.version === protocolVersion);
        if (!proofProtocol) {
            throw new error_1.CredoError(`No proof protocol registered for protocol version ${protocolVersion}`);
        }
        return proofProtocol;
    }
    /**
     * Initiate a new presentation exchange as prover by sending a presentation proposal message
     * to the connection with the specified connection id.
     *
     * @param options configuration to use for the proposal
     * @returns Proof exchange record associated with the sent proposal message
     */
    async proposeProof(options) {
        const protocol = this.getProtocol(options.protocolVersion);
        const connectionRecord = await this.connectionService.getById(this.agentContext, options.connectionId);
        // Assert
        connectionRecord.assertReady();
        const { message, proofRecord } = await protocol.createProposal(this.agentContext, {
            connectionRecord,
            proofFormats: options.proofFormats,
            autoAcceptProof: options.autoAcceptProof,
            goalCode: options.goalCode,
            goal: options.goal,
            comment: options.comment,
            parentThreadId: options.parentThreadId,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: proofRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return proofRecord;
    }
    /**
     * Accept a presentation proposal as verifier (by sending a presentation request message) to the connection
     * associated with the proof record.
     *
     * @param options config object for accepting the proposal
     * @returns Proof exchange record associated with the presentation request
     */
    async acceptProposal(options) {
        const proofRecord = await this.getById(options.proofRecordId);
        if (!proofRecord.connectionId) {
            throw new error_1.CredoError(`No connectionId found for proof record '${proofRecord.id}'. Connection-less verification does not support presentation proposal or negotiation.`);
        }
        // with version we can get the protocol
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        const connectionRecord = await this.connectionService.getById(this.agentContext, proofRecord.connectionId);
        // Assert
        connectionRecord.assertReady();
        const { message } = await protocol.acceptProposal(this.agentContext, {
            proofRecord,
            proofFormats: options.proofFormats,
            goalCode: options.goalCode,
            goal: options.goal,
            willConfirm: options.willConfirm,
            comment: options.comment,
            autoAcceptProof: options.autoAcceptProof,
        });
        // send the message
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: proofRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return proofRecord;
    }
    /**
     * Answer with a new presentation request in response to received presentation proposal message
     * to the connection associated with the proof record.
     *
     * @param options multiple properties like proof record id, proof formats to accept requested credentials object
     * specifying which credentials to use for the proof
     * @returns Proof record associated with the sent request message
     */
    async negotiateProposal(options) {
        const proofRecord = await this.getById(options.proofRecordId);
        if (!proofRecord.connectionId) {
            throw new error_1.CredoError(`No connectionId found for proof record '${proofRecord.id}'. Connection-less verification does not support negotiation.`);
        }
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        const connectionRecord = await this.connectionService.getById(this.agentContext, proofRecord.connectionId);
        // Assert
        connectionRecord.assertReady();
        const { message } = await protocol.negotiateProposal(this.agentContext, {
            proofRecord,
            proofFormats: options.proofFormats,
            autoAcceptProof: options.autoAcceptProof,
            comment: options.comment,
            goalCode: options.goalCode,
            goal: options.goal,
            willConfirm: options.willConfirm,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: proofRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return proofRecord;
    }
    /**
     * Initiate a new presentation exchange as verifier by sending a presentation request message
     * to the connection with the specified connection id
     *
     * @param options multiple properties like connection id, protocol version, proof Formats to build the proof request
     * @returns Proof record associated with the sent request message
     */
    async requestProof(options) {
        const connectionRecord = await this.connectionService.getById(this.agentContext, options.connectionId);
        const protocol = this.getProtocol(options.protocolVersion);
        // Assert
        connectionRecord.assertReady();
        const { message, proofRecord } = await protocol.createRequest(this.agentContext, {
            connectionRecord,
            proofFormats: options.proofFormats,
            autoAcceptProof: options.autoAcceptProof,
            parentThreadId: options.parentThreadId,
            comment: options.comment,
            goalCode: options.goalCode,
            goal: options.goal,
            willConfirm: options.willConfirm,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            associatedRecord: proofRecord,
            connectionRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return proofRecord;
    }
    /**
     * Accept a presentation request as prover (by sending a presentation message) to the connection
     * associated with the proof record.
     *
     * @param options multiple properties like proof record id, proof formats to accept requested credentials object
     * specifying which credentials to use for the proof
     * @returns Proof record associated with the sent presentation message
     */
    async acceptRequest(options) {
        const proofRecord = await this.getById(options.proofRecordId);
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        const requestMessage = await protocol.findRequestMessage(this.agentContext, proofRecord.id);
        if (!requestMessage) {
            throw new error_1.CredoError(`No request message found for proof record with id '${proofRecord.id}'`);
        }
        // Use connection if present
        const connectionRecord = proofRecord.connectionId
            ? await this.connectionService.getById(this.agentContext, proofRecord.connectionId)
            : undefined;
        connectionRecord === null || connectionRecord === void 0 ? void 0 : connectionRecord.assertReady();
        const { message } = await protocol.acceptRequest(this.agentContext, {
            proofFormats: options.proofFormats,
            proofRecord,
            comment: options.comment,
            autoAcceptProof: options.autoAcceptProof,
            goalCode: options.goalCode,
            goal: options.goal,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            connectionRecord,
            associatedRecord: proofRecord,
            lastReceivedMessage: requestMessage,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return proofRecord;
    }
    async declineRequest(options) {
        var _a;
        const proofRecord = await this.getById(options.proofRecordId);
        proofRecord.assertState(ProofState_1.ProofState.RequestReceived);
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        if (options.sendProblemReport) {
            await this.sendProblemReport({
                proofRecordId: options.proofRecordId,
                description: (_a = options.problemReportDescription) !== null && _a !== void 0 ? _a : 'Request declined',
            });
        }
        await protocol.updateState(this.agentContext, proofRecord, ProofState_1.ProofState.Declined);
        return proofRecord;
    }
    /**
     * Answer with a new presentation proposal in response to received presentation request message
     * to the connection associated with the proof record.
     *
     * @param options multiple properties like proof record id, proof format (indy/ presentation exchange)
     * to include in the message
     * @returns Proof record associated with the sent proposal message
     */
    async negotiateRequest(options) {
        const proofRecord = await this.getById(options.proofRecordId);
        if (!proofRecord.connectionId) {
            throw new error_1.CredoError(`No connectionId found for proof record '${proofRecord.id}'. Connection-less verification does not support presentation proposal or negotiation.`);
        }
        const connectionRecord = await this.connectionService.getById(this.agentContext, proofRecord.connectionId);
        // Assert
        connectionRecord.assertReady();
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        const { message } = await protocol.negotiateRequest(this.agentContext, {
            proofRecord,
            proofFormats: options.proofFormats,
            autoAcceptProof: options.autoAcceptProof,
            goalCode: options.goalCode,
            goal: options.goal,
            comment: options.comment,
        });
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            connectionRecord,
            associatedRecord: proofRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return proofRecord;
    }
    /**
     * Initiate a new presentation exchange as verifier by sending an out of band presentation
     * request message
     *
     * @param options multiple properties like protocol version, proof Formats to build the proof request
     * @returns the message itself and the proof record associated with the sent request message
     */
    async createRequest(options) {
        const protocol = this.getProtocol(options.protocolVersion);
        return await protocol.createRequest(this.agentContext, {
            proofFormats: options.proofFormats,
            autoAcceptProof: options.autoAcceptProof,
            comment: options.comment,
            parentThreadId: options.parentThreadId,
            goalCode: options.goalCode,
            goal: options.goal,
            willConfirm: options.willConfirm,
        });
    }
    /**
     * Accept a presentation as prover (by sending a presentation acknowledgement message) to the connection
     * associated with the proof record.
     *
     * @param proofRecordId The id of the proof exchange record for which to accept the presentation
     * @returns Proof record associated with the sent presentation acknowledgement message
     *
     */
    async acceptPresentation(options) {
        const proofRecord = await this.getById(options.proofRecordId);
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        const requestMessage = await protocol.findRequestMessage(this.agentContext, proofRecord.id);
        if (!requestMessage) {
            throw new error_1.CredoError(`No request message found for proof record with id '${proofRecord.id}'`);
        }
        const presentationMessage = await protocol.findPresentationMessage(this.agentContext, proofRecord.id);
        if (!presentationMessage) {
            throw new error_1.CredoError(`No presentation message found for proof record with id '${proofRecord.id}'`);
        }
        // Use connection if present
        const connectionRecord = proofRecord.connectionId
            ? await this.connectionService.getById(this.agentContext, proofRecord.connectionId)
            : undefined;
        connectionRecord === null || connectionRecord === void 0 ? void 0 : connectionRecord.assertReady();
        const { message } = await protocol.acceptPresentation(this.agentContext, {
            proofRecord,
        });
        // FIXME: returnRoute: false
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message,
            connectionRecord,
            associatedRecord: proofRecord,
            lastSentMessage: requestMessage,
            lastReceivedMessage: presentationMessage,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return proofRecord;
    }
    /**
     * Create a {@link RetrievedCredentials} object. Given input proof request and presentation proposal,
     * use credentials in the wallet to build indy requested credentials object for input to proof creation.
     * If restrictions allow, self attested attributes will be used.
     *
     * @param options multiple properties like proof record id and optional configuration
     * @returns RequestedCredentials
     */
    async selectCredentialsForRequest(options) {
        const proofRecord = await this.getById(options.proofRecordId);
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        return protocol.selectCredentialsForRequest(this.agentContext, {
            proofFormats: options.proofFormats,
            proofRecord,
        });
    }
    /**
     * Get credentials in the wallet for a received proof request.
     *
     * @param options multiple properties like proof record id and optional configuration
     */
    async getCredentialsForRequest(options) {
        const proofRecord = await this.getById(options.proofRecordId);
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        return protocol.getCredentialsForRequest(this.agentContext, {
            proofRecord,
            proofFormats: options.proofFormats,
        });
    }
    /**
     * Send problem report message for a proof record
     *
     * @param proofRecordId  The id of the proof record for which to send problem report
     * @param message message to send
     * @returns proof record associated with the proof problem report message
     */
    async sendProblemReport(options) {
        const proofRecord = await this.getById(options.proofRecordId);
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        const requestMessage = await protocol.findRequestMessage(this.agentContext, proofRecord.id);
        const { message: problemReport } = await protocol.createProblemReport(this.agentContext, {
            proofRecord,
            description: options.description,
        });
        // Use connection if present
        const connectionRecord = proofRecord.connectionId
            ? await this.connectionService.getById(this.agentContext, proofRecord.connectionId)
            : undefined;
        connectionRecord === null || connectionRecord === void 0 ? void 0 : connectionRecord.assertReady();
        // If there's no connection (so connection-less, we require the state to be request received)
        if (!connectionRecord) {
            proofRecord.assertState(ProofState_1.ProofState.RequestReceived);
            if (!requestMessage) {
                throw new error_1.CredoError(`No request message found for proof record with id '${proofRecord.id}'`);
            }
        }
        const outboundMessageContext = await (0, getOutboundMessageContext_1.getOutboundMessageContext)(this.agentContext, {
            message: problemReport,
            connectionRecord,
            associatedRecord: proofRecord,
            lastReceivedMessage: requestMessage !== null && requestMessage !== void 0 ? requestMessage : undefined,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return proofRecord;
    }
    async getFormatData(proofRecordId) {
        const proofRecord = await this.getById(proofRecordId);
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        return protocol.getFormatData(this.agentContext, proofRecordId);
    }
    /**
     * Retrieve all proof records
     *
     * @returns List containing all proof records
     */
    async getAll() {
        return this.proofRepository.getAll(this.agentContext);
    }
    /**
     * Retrieve all proof records by specified query params
     *
     * @returns List containing all proof records matching specified params
     */
    findAllByQuery(query, queryOptions) {
        return this.proofRepository.findByQuery(this.agentContext, query, queryOptions);
    }
    /**
     * Retrieve a proof record by id
     *
     * @param proofRecordId The proof record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The proof record
     *
     */
    async getById(proofRecordId) {
        return await this.proofRepository.getById(this.agentContext, proofRecordId);
    }
    /**
     * Retrieve a proof record by id
     *
     * @param proofRecordId The proof record id
     * @return The proof record or null if not found
     *
     */
    async findById(proofRecordId) {
        return await this.proofRepository.findById(this.agentContext, proofRecordId);
    }
    /**
     * Delete a proof record by id
     *
     * @param proofId the proof record id
     */
    async deleteById(proofId, options) {
        const proofRecord = await this.getById(proofId);
        const protocol = this.getProtocol(proofRecord.protocolVersion);
        return protocol.delete(this.agentContext, proofRecord, options);
    }
    /**
     * Retrieve a proof record by connection id and thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @throws {RecordNotFoundError} If no record is found
     * @throws {RecordDuplicateError} If multiple records are found
     * @returns The proof record
     */
    async getByThreadAndConnectionId(threadId, connectionId) {
        return this.proofRepository.getByThreadAndConnectionId(this.agentContext, threadId, connectionId);
    }
    /**
     * Retrieve proof records by connection id and parent thread id
     *
     * @param connectionId The connection id
     * @param parentThreadId The parent thread id
     * @returns List containing all proof records matching the given query
     */
    async getByParentThreadAndConnectionId(parentThreadId, connectionId) {
        return this.proofRepository.getByParentThreadAndConnectionId(this.agentContext, parentThreadId, connectionId);
    }
    /**
     * Update a proof record by
     *
     * @param proofRecord the proof record
     */
    async update(proofRecord) {
        await this.proofRepository.update(this.agentContext, proofRecord);
    }
    async findProposalMessage(proofRecordId) {
        const record = await this.getById(proofRecordId);
        const protocol = this.getProtocol(record.protocolVersion);
        return protocol.findProposalMessage(this.agentContext, proofRecordId);
    }
    async findRequestMessage(proofRecordId) {
        const record = await this.getById(proofRecordId);
        const protocol = this.getProtocol(record.protocolVersion);
        return protocol.findRequestMessage(this.agentContext, proofRecordId);
    }
    async findPresentationMessage(proofRecordId) {
        const record = await this.getById(proofRecordId);
        const protocol = this.getProtocol(record.protocolVersion);
        return protocol.findPresentationMessage(this.agentContext, proofRecordId);
    }
};
exports.ProofsApi = ProofsApi;
exports.ProofsApi = ProofsApi = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [MessageSender_1.MessageSender,
        ConnectionService_1.ConnectionService,
        AgentContext_1.AgentContext,
        ProofRepository_1.ProofRepository,
        ProofsModuleConfig_1.ProofsModuleConfig])
], ProofsApi);
//# sourceMappingURL=ProofsApi.js.map