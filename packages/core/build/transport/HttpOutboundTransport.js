"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpOutboundTransport = void 0;
const rxjs_1 = require("rxjs");
const Events_1 = require("../agent/Events");
const CredoError_1 = require("../error/CredoError");
const utils_1 = require("../utils");
class HttpOutboundTransport {
    constructor() {
        this.isActive = false;
        this.outboundSessionCount = 0;
        this.outboundSessionsObservable = new rxjs_1.Subject();
        this.supportedSchemes = ['http', 'https'];
    }
    async start(agent) {
        this.agent = agent;
        this.logger = this.agent.config.logger;
        this.fetch = this.agent.config.agentDependencies.fetch;
        this.isActive = true;
        this.outboundSessionCount = 0;
        this.logger.debug('Starting HTTP outbound transport');
    }
    async stop() {
        this.logger.debug('Stopping HTTP outbound transport');
        this.isActive = false;
        if (this.outboundSessionCount === 0) {
            this.agent.config.logger.debug('No open outbound HTTP sessions. Immediately stopping HttpOutboundTransport');
            return;
        }
        this.agent.config.logger.debug(`Still ${this.outboundSessionCount} open outbound HTTP sessions. Waiting for sessions to close before stopping HttpOutboundTransport`);
        // Track all 'closed' sessions
        // TODO: add timeout? -> we have a timeout on the request
        return new Promise((resolve) => this.outboundSessionsObservable.subscribe(() => {
            this.agent.config.logger.debug(`${this.outboundSessionCount} HttpOutboundTransport sessions still active`);
            if (this.outboundSessionCount === 0)
                resolve();
        }));
    }
    async sendMessage(outboundPackage) {
        const { payload, endpoint } = outboundPackage;
        if (!this.isActive) {
            throw new CredoError_1.CredoError('Outbound transport is not active. Not sending message.');
        }
        if (!endpoint) {
            throw new CredoError_1.CredoError(`Missing endpoint. I don't know how and where to send the message.`);
        }
        this.logger.debug(`Sending outbound message to endpoint '${outboundPackage.endpoint}'`, {
            payload: outboundPackage.payload,
        });
        try {
            const abortController = new AbortController();
            const id = setTimeout(() => abortController.abort(), 15000);
            this.outboundSessionCount++;
            let response;
            let responseMessage;
            try {
                response = await this.fetch(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': this.agent.config.didCommMimeType },
                    signal: abortController.signal,
                });
                clearTimeout(id);
                responseMessage = await response.text();
            }
            catch (error) {
                // Request is aborted after 15 seconds, but that doesn't necessarily mean the request
                // went wrong. ACA-Py keeps the socket alive until it has a response message. So we assume
                // that if the error was aborted and we had return routing enabled, we should ignore the error.
                if (error.name == 'AbortError' && outboundPackage.responseRequested) {
                    this.logger.debug('Request was aborted due to timeout. Not throwing error due to return routing on sent message');
                }
                else {
                    throw error;
                }
            }
            // TODO: do we just want to ignore messages that were returned if we didn't request it?
            // TODO: check response header type (and also update inbound transports to use the correct headers types)
            if (response && responseMessage) {
                this.logger.debug(`Response received`, { responseMessage, status: response.status });
                // This should not happen
                if (!this.isActive) {
                    this.logger.error('Received response message over HttpOutboundTransport while transport was not active.');
                }
                try {
                    const encryptedMessage = utils_1.JsonEncoder.fromString(responseMessage);
                    if (!(0, utils_1.isValidJweStructure)(encryptedMessage)) {
                        this.logger.error(`Received a response from the other agent but the structure of the incoming message is not a DIDComm message: ${responseMessage}`);
                        return;
                    }
                    // Emit event with the received agent message.
                    this.agent.events.emit(this.agent.context, {
                        type: Events_1.AgentEventTypes.AgentMessageReceived,
                        payload: {
                            message: encryptedMessage,
                        },
                    });
                }
                catch (error) {
                    this.logger.debug('Unable to parse response message');
                }
            }
            else {
                this.logger.debug(`No response received.`);
            }
        }
        catch (error) {
            this.logger.error(`Error sending message to ${endpoint}: ${error.message}`, {
                error,
                message: error.message,
                body: payload,
                didCommMimeType: this.agent.config.didCommMimeType,
            });
            throw new CredoError_1.CredoError(`Error sending message to ${endpoint}: ${error.message}`, { cause: error });
        }
        finally {
            this.outboundSessionCount--;
            this.outboundSessionsObservable.next(undefined);
        }
    }
}
exports.HttpOutboundTransport = HttpOutboundTransport;
//# sourceMappingURL=HttpOutboundTransport.js.map