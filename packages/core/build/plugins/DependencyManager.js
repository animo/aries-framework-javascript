"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyManager = void 0;
const tsyringe_1 = require("tsyringe");
const FeatureRegistry_1 = require("../agent/FeatureRegistry");
const MessageHandlerRegistry_1 = require("../agent/MessageHandlerRegistry");
const error_1 = require("../error");
class DependencyManager {
    constructor(container = tsyringe_1.container.createChildContainer(), registeredModules = {}) {
        this.container = container;
        this.registeredModules = registeredModules;
    }
    registerModules(modules) {
        const featureRegistry = this.resolve(FeatureRegistry_1.FeatureRegistry);
        for (const [moduleKey, module] of Object.entries(modules)) {
            if (this.registeredModules[moduleKey]) {
                throw new error_1.CredoError(`Module with key ${moduleKey} has already been registered. Only a single module can be registered with the same key.`);
            }
            this.registeredModules[moduleKey] = module;
            if (module.api) {
                this.registerContextScoped(module.api);
            }
            module.register(this, featureRegistry);
        }
    }
    registerMessageHandlers(messageHandlers) {
        const messageHandlerRegistry = this.resolve(MessageHandlerRegistry_1.MessageHandlerRegistry);
        for (const messageHandler of messageHandlers) {
            messageHandlerRegistry.registerMessageHandler(messageHandler);
        }
    }
    registerMessageHandlerMiddleware(messageHandlerMiddleware) {
        const messageHandlerRegistry = this.resolve(MessageHandlerRegistry_1.MessageHandlerRegistry);
        messageHandlerRegistry.registerMessageHandlerMiddleware(messageHandlerMiddleware);
    }
    get fallbackMessageHandler() {
        const messageHandlerRegistry = this.resolve(MessageHandlerRegistry_1.MessageHandlerRegistry);
        return messageHandlerRegistry.fallbackMessageHandler;
    }
    get messageHandlerMiddlewares() {
        const messageHandlerRegistry = this.resolve(MessageHandlerRegistry_1.MessageHandlerRegistry);
        return messageHandlerRegistry.messageHandlerMiddlewares;
    }
    /**
     * Sets the fallback message handler, the message handler that will be called if no handler
     * is registered for an incoming message type.
     */
    setFallbackMessageHandler(fallbackMessageHandler) {
        const messageHandlerRegistry = this.resolve(MessageHandlerRegistry_1.MessageHandlerRegistry);
        messageHandlerRegistry.setFallbackMessageHandler(fallbackMessageHandler);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSingleton(fromOrToken, to) {
        this.container.registerSingleton(fromOrToken, to);
    }
    resolve(token) {
        return this.container.resolve(token);
    }
    registerInstance(token, instance) {
        this.container.registerInstance(token, instance);
    }
    isRegistered(token) {
        return this.container.isRegistered(token);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerContextScoped(token, provider) {
        if (provider)
            this.container.register(token, provider, { lifecycle: tsyringe_1.Lifecycle.ContainerScoped });
        else
            this.container.register(token, token, { lifecycle: tsyringe_1.Lifecycle.ContainerScoped });
    }
    /**
     * Dispose the dependency manager. Calls `.dispose()` on all instances that implement the `Disposable` interface and have
     * been constructed by the `DependencyManager`. This means all instances registered using `registerInstance` won't have the
     * dispose method called.
     */
    async dispose() {
        await this.container.dispose();
    }
    createChild() {
        return new DependencyManager(this.container.createChildContainer(), this.registeredModules);
    }
}
exports.DependencyManager = DependencyManager;
//# sourceMappingURL=DependencyManager.js.map