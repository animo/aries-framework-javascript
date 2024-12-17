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
exports.MessagePickupApi = void 0;
const rxjs_1 = require("rxjs");
const agent_1 = require("../../agent");
const EventEmitter_1 = require("../../agent/EventEmitter");
const MessageSender_1 = require("../../agent/MessageSender");
const models_1 = require("../../agent/models");
const constants_1 = require("../../constants");
const error_1 = require("../../error");
const plugins_1 = require("../../plugins");
const services_1 = require("../connections/services");
const MessagePickupEvents_1 = require("./MessagePickupEvents");
const MessagePickupModuleConfig_1 = require("./MessagePickupModuleConfig");
const MessagePickupSessionService_1 = require("./services/MessagePickupSessionService");
let MessagePickupApi = class MessagePickupApi {
    constructor(messageSender, agentContext, connectionService, eventEmitter, messagePickupSessionService, config, stop$, logger) {
        this.messageSender = messageSender;
        this.connectionService = connectionService;
        this.agentContext = agentContext;
        this.eventEmitter = eventEmitter;
        this.config = config;
        this.messagePickupSessionService = messagePickupSessionService;
        this.stop$ = stop$;
        this.logger = logger;
    }
    async initialize() {
        this.messagePickupSessionService.start(this.agentContext);
    }
    getProtocol(protocolVersion) {
        const protocol = this.config.protocols.find((protocol) => protocol.version === protocolVersion);
        if (!protocol) {
            throw new error_1.CredoError(`No message pickup protocol registered for protocol version ${protocolVersion}`);
        }
        return protocol;
    }
    /**
     * Add an encrypted message to the message pickup queue
     *
     * @param options: connectionId associated to the message and the encrypted message itself
     */
    async queueMessage(options) {
        this.logger.debug('Queuing message...');
        const { connectionId, message, recipientDids } = options;
        const connectionRecord = await this.connectionService.getById(this.agentContext, connectionId);
        const messagePickupRepository = this.agentContext.dependencyManager.resolve(constants_1.InjectionSymbols.MessagePickupRepository);
        await messagePickupRepository.addMessage({ connectionId: connectionRecord.id, recipientDids, payload: message });
    }
    /**
     * Get current active live mode message pickup session for a given connection. Undefined if no active session found
     *
     * @param options connection id and optional role
     * @returns live mode session
     */
    async getLiveModeSession(options) {
        const { connectionId, role } = options;
        return this.messagePickupSessionService.getLiveSessionByConnectionId(this.agentContext, { connectionId, role });
    }
    /**
     * Deliver specific messages to an active live mode pickup session through message pickup protocol.
     *
     * This will deliver the messages regardless of the state of the message pickup queue, meaning that
     * any message stuck there should be sent separately (e.g. using deliverQU).
     *
     * @param options: pickup session id and the messages to deliver
     */
    async deliverMessages(options) {
        const { pickupSessionId, messages } = options;
        const session = this.messagePickupSessionService.getLiveSession(this.agentContext, pickupSessionId);
        if (!session) {
            throw new error_1.CredoError(`No active live mode session found with id ${pickupSessionId}`);
        }
        const connectionRecord = await this.connectionService.getById(this.agentContext, session.connectionId);
        const protocol = this.getProtocol(session.protocolVersion);
        const createDeliveryReturn = await protocol.createDeliveryMessage(this.agentContext, {
            connectionRecord,
            messages,
        });
        if (createDeliveryReturn) {
            await this.messageSender.sendMessage(new models_1.OutboundMessageContext(createDeliveryReturn.message, {
                agentContext: this.agentContext,
                connection: connectionRecord,
            }));
        }
    }
    /**
     * Deliver messages in the Message Pickup Queue for a given live mode session and key (if specified).
     *
     * This will retrieve messages up to 'batchSize' messages from the queue and deliver it through the
     * corresponding Message Pickup protocol. If there are more than 'batchSize' messages in the queue,
     * the recipient may request remaining messages after receiving the first batch of messages.
     *
     */
    async deliverMessagesFromQueue(options) {
        this.logger.debug('Delivering queued messages');
        const { pickupSessionId, recipientDid: recipientKey, batchSize } = options;
        const session = this.messagePickupSessionService.getLiveSession(this.agentContext, pickupSessionId);
        if (!session) {
            throw new error_1.CredoError(`No active live mode session found with id ${pickupSessionId}`);
        }
        const connectionRecord = await this.connectionService.getById(this.agentContext, session.connectionId);
        const protocol = this.getProtocol(session.protocolVersion);
        const deliverMessagesReturn = await protocol.createDeliveryMessage(this.agentContext, {
            connectionRecord,
            recipientKey,
            batchSize,
        });
        if (deliverMessagesReturn) {
            await this.messageSender.sendMessage(new models_1.OutboundMessageContext(deliverMessagesReturn.message, {
                agentContext: this.agentContext,
                connection: connectionRecord,
            }));
        }
    }
    /**
     * Pickup queued messages from a message holder. It attempts to retrieve all current messages from the
     * queue, receiving up to `batchSize` messages per batch retrieval.
     *
     * By default, this method only waits until the initial pick-up request is sent. Use `options.awaitCompletion`
     * if you want to wait until all messages are effectively retrieved.
     *
     * @param options connectionId, protocol version to use and batch size, awaitCompletion,
     * awaitCompletionTimeoutMs
     */
    async pickupMessages(options) {
        var _a;
        const connectionRecord = await this.connectionService.getById(this.agentContext, options.connectionId);
        const protocol = this.getProtocol(options.protocolVersion);
        const { message } = await protocol.createPickupMessage(this.agentContext, {
            connectionRecord,
            batchSize: options.batchSize,
            recipientDid: options.recipientDid,
        });
        const outboundMessageContext = new models_1.OutboundMessageContext(message, {
            agentContext: this.agentContext,
            connection: connectionRecord,
        });
        const replaySubject = new rxjs_1.ReplaySubject(1);
        if (options.awaitCompletion) {
            this.eventEmitter
                .observable(MessagePickupEvents_1.MessagePickupEventTypes.MessagePickupCompleted)
                .pipe(
            // Stop when the agent shuts down
            (0, rxjs_1.takeUntil)(this.stop$), 
            // filter by connection id
            (0, rxjs_1.filter)((e) => e.payload.connection.id === connectionRecord.id), 
            // Only wait for first event that matches the criteria
            (0, rxjs_1.first)(), 
            // If we don't receive all messages within timeoutMs miliseconds (no response, not supported, etc...) error
            (0, rxjs_1.timeout)({
                first: (_a = options.awaitCompletionTimeoutMs) !== null && _a !== void 0 ? _a : 10000,
                meta: 'MessagePickupApi.pickupMessages',
            }))
                .subscribe(replaySubject);
        }
        // For picking up messages we prefer a long-lived transport session, so we will set a higher priority to
        // WebSocket endpoints. However, it is not extrictly required.
        await this.messageSender.sendMessage(outboundMessageContext, { transportPriority: { schemes: ['wss', 'ws'] } });
        if (options.awaitCompletion) {
            await (0, rxjs_1.firstValueFrom)(replaySubject);
        }
    }
    /**
     * Enable or disable Live Delivery mode as a recipient. Depending on the message pickup protocol used,
     * after receiving a response from the mediator the agent might retrieve any pending message.
     *
     * @param options connectionId, protocol version to use and boolean to enable/disable Live Mode
     */
    async setLiveDeliveryMode(options) {
        const connectionRecord = await this.connectionService.getById(this.agentContext, options.connectionId);
        const protocol = this.getProtocol(options.protocolVersion);
        const { message } = await protocol.setLiveDeliveryMode(this.agentContext, {
            connectionRecord,
            liveDelivery: options.liveDelivery,
        });
        // Live mode requires a long-lived transport session, so we'll require WebSockets to send this message
        await this.messageSender.sendMessage(new models_1.OutboundMessageContext(message, {
            agentContext: this.agentContext,
            connection: connectionRecord,
        }), { transportPriority: { schemes: ['wss', 'ws'], restrictive: options.liveDelivery } });
    }
};
exports.MessagePickupApi = MessagePickupApi;
exports.MessagePickupApi = MessagePickupApi = __decorate([
    (0, plugins_1.injectable)(),
    __param(6, (0, plugins_1.inject)(constants_1.InjectionSymbols.Stop$)),
    __param(7, (0, plugins_1.inject)(constants_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [MessageSender_1.MessageSender,
        agent_1.AgentContext,
        services_1.ConnectionService,
        EventEmitter_1.EventEmitter,
        MessagePickupSessionService_1.MessagePickupSessionService,
        MessagePickupModuleConfig_1.MessagePickupModuleConfig,
        rxjs_1.Subject, Object])
], MessagePickupApi);
//# sourceMappingURL=MessagePickupApi.js.map