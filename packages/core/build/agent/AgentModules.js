"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendModulesWithDefaultModules = extendModulesWithDefaultModules;
exports.getAgentApi = getAgentApi;
const basic_messages_1 = require("../modules/basic-messages");
const cache_1 = require("../modules/cache");
const connections_1 = require("../modules/connections");
const credentials_1 = require("../modules/credentials");
const dcql_1 = require("../modules/dcql");
const dids_1 = require("../modules/dids");
const dif_presentation_exchange_1 = require("../modules/dif-presentation-exchange");
const discover_features_1 = require("../modules/discover-features");
const generic_records_1 = require("../modules/generic-records");
const MdocModule_1 = require("../modules/mdoc/MdocModule");
const message_pickup_1 = require("../modules/message-pickup");
const oob_1 = require("../modules/oob");
const proofs_1 = require("../modules/proofs");
const routing_1 = require("../modules/routing");
const sd_jwt_vc_1 = require("../modules/sd-jwt-vc");
const vc_1 = require("../modules/vc");
const x509_1 = require("../modules/x509");
const wallet_1 = require("../wallet");
/**
 * Method to get the default agent modules to be registered on any agent instance. It doens't configure the modules in any way,
 * and if that's needed the user needs to provide the module in the agent constructor
 */
function getDefaultAgentModules() {
    return {
        connections: () => new connections_1.ConnectionsModule(),
        credentials: () => new credentials_1.CredentialsModule(),
        proofs: () => new proofs_1.ProofsModule(),
        mediator: () => new routing_1.MediatorModule(),
        mediationRecipient: () => new routing_1.MediationRecipientModule(),
        messagePickup: () => new message_pickup_1.MessagePickupModule(),
        basicMessages: () => new basic_messages_1.BasicMessagesModule(),
        genericRecords: () => new generic_records_1.GenericRecordsModule(),
        discovery: () => new discover_features_1.DiscoverFeaturesModule(),
        dids: () => new dids_1.DidsModule(),
        wallet: () => new wallet_1.WalletModule(),
        oob: () => new oob_1.OutOfBandModule(),
        w3cCredentials: () => new vc_1.W3cCredentialsModule(),
        cache: () => new cache_1.CacheModule(),
        pex: () => new dif_presentation_exchange_1.DifPresentationExchangeModule(),
        dcql: () => new dcql_1.DcqlModule(),
        sdJwtVc: () => new sd_jwt_vc_1.SdJwtVcModule(),
        x509: () => new x509_1.X509Module(),
        mdoc: () => new MdocModule_1.MdocModule(),
    };
}
/**
 * Extend the provided modules object with the default agent modules. If the modules property already contains a module with the same
 * name as a default module, the module won't be added to the extended module object. This allows users of the framework to override
 * the modules with custom configuration. The agent constructor type ensures you can't provide a different module for a key that registered
 * on the default agent.
 */
function extendModulesWithDefaultModules(modules) {
    const extendedModules = Object.assign({}, modules);
    const defaultAgentModules = getDefaultAgentModules();
    // Register all default modules, if not registered yet
    for (const [moduleKey, getConfiguredModule] of Object.entries(defaultAgentModules)) {
        // Do not register if the module is already registered.
        if (modules && modules[moduleKey])
            continue;
        extendedModules[moduleKey] = getConfiguredModule();
    }
    return extendedModules;
}
/**
 * Get the agent api object based on the modules registered in the dependency manager. For each registered module on the
 * dependency manager, the method will extract the api class from the module, resolve it and assign it to the module key
 * as provided in the agent constructor (or the {@link getDefaultAgentModules} method).
 *
 * Modules that don't have an api class defined ({@link Module.api} is undefined) will be ignored and won't be added to the
 * api object.
 *
 * If the api of a module is passed in the `excluded` array, the api will not be added to the resulting api object.
 *
 * @example
 * If the dependency manager has the following modules configured:
 * ```ts
 * {
 *   connections: ConnectionsModule
 *   indy: IndyModule
 * }
 * ```
 *
 * And we call the `getAgentApi` method like this:
 * ```ts
 * const api = getAgentApi(dependencyManager)
 * ```
 *
 * the resulting agent api will look like:
 *
 * ```ts
 * {
 *   connections: ConnectionsApi
 * }
 * ```
 *
 * The `indy` module has been ignored because it doesn't define an api class.
 */
function getAgentApi(dependencyManager, excludedApis = []) {
    // Create the api object based on the `api` properties on the modules. If no `api` exists
    // on the module it will be ignored.
    const api = Object.entries(dependencyManager.registeredModules).reduce((api, [moduleKey, module]) => {
        // Module has no api
        if (!module.api)
            return api;
        const apiInstance = dependencyManager.resolve(module.api);
        // Api is excluded
        if (excludedApis.includes(apiInstance))
            return api;
        return Object.assign(Object.assign({}, api), { [moduleKey]: apiInstance });
    }, {});
    return api;
}
//# sourceMappingURL=AgentModules.js.map