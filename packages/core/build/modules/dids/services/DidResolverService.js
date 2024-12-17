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
exports.DidResolverService = void 0;
const constants_1 = require("../../../constants");
const error_1 = require("../../../error");
const plugins_1 = require("../../../plugins");
const utils_1 = require("../../../utils");
const cache_1 = require("../../cache");
const DidsModuleConfig_1 = require("../DidsModuleConfig");
const domain_1 = require("../domain");
const parse_1 = require("../domain/parse");
const repository_1 = require("../repository");
let DidResolverService = class DidResolverService {
    constructor(logger, didsModuleConfig, didRepository) {
        this.logger = logger;
        this.didsModuleConfig = didsModuleConfig;
        this.didRepository = didRepository;
    }
    async resolve(agentContext, didUrl, options = {}) {
        var _a;
        this.logger.debug(`resolving didUrl ${didUrl}`);
        const result = {
            didResolutionMetadata: {},
            didDocument: null,
            didDocumentMetadata: {},
        };
        let parsed;
        try {
            parsed = (0, parse_1.parseDid)(didUrl);
        }
        catch (error) {
            return Object.assign(Object.assign({}, result), { didResolutionMetadata: { error: 'invalidDid' } });
        }
        const resolver = this.findResolver(parsed);
        if (!resolver) {
            return Object.assign(Object.assign({}, result), { didResolutionMetadata: {
                    error: 'unsupportedDidMethod',
                    message: `No did resolver registered for did method ${parsed.method}`,
                } });
        }
        // extract caching options and set defaults
        const { useCache = true, cacheDurationInSeconds = 300, persistInCache = true, useLocalCreatedDidRecord = true, } = options;
        const cacheKey = this.getCacheKey(parsed.did);
        if (resolver.allowsCaching && useCache) {
            const cache = agentContext.dependencyManager.resolve(cache_1.CacheModuleConfig).cache;
            // FIXME: in multi-tenancy it can be that the same cache is used for different agent contexts
            // This may become a problem when resolving dids, as you can get back a cache hit for a different
            // tenant. did:peer has disabled caching, and I think we should just recommend disabling caching
            // for these private dids
            // We could allow providing a custom cache prefix in the resolver options, so that the cache key
            // can be recognized in the cache implementation
            const cachedDidDocument = await cache.get(agentContext, cacheKey);
            if (cachedDidDocument) {
                return Object.assign(Object.assign({}, cachedDidDocument), { didDocument: utils_1.JsonTransformer.fromJSON(cachedDidDocument.didDocument, domain_1.DidDocument), didResolutionMetadata: Object.assign(Object.assign({}, cachedDidDocument.didResolutionMetadata), { servedFromCache: true }) });
            }
        }
        if (resolver.allowsLocalDidRecord && useLocalCreatedDidRecord) {
            // TODO: did should have tag whether a did document is present in the did record
            const [didRecord] = await this.didRepository.getCreatedDids(agentContext, {
                did: parsed.did,
            });
            if (didRecord && didRecord.didDocument) {
                return {
                    didDocument: didRecord.didDocument,
                    didDocumentMetadata: {},
                    didResolutionMetadata: {
                        servedFromCache: false,
                        servedFromDidRecord: true,
                    },
                };
            }
        }
        let resolutionResult = await resolver.resolve(agentContext, parsed.did, parsed, options);
        // Avoid overwriting existing document
        resolutionResult = Object.assign(Object.assign({}, resolutionResult), { didResolutionMetadata: Object.assign(Object.assign({}, resolutionResult.didResolutionMetadata), { resolutionTime: Date.now(), 
                // Did resolver implementation might use did method specific caching strategy
                // We only set to false if not defined by the resolver
                servedFromCache: (_a = resolutionResult.didResolutionMetadata.servedFromCache) !== null && _a !== void 0 ? _a : false }) });
        if (resolutionResult.didDocument && resolver.allowsCaching && persistInCache) {
            const cache = agentContext.dependencyManager.resolve(cache_1.CacheModuleConfig).cache;
            await cache.set(agentContext, cacheKey, Object.assign(Object.assign({}, resolutionResult), { didDocument: resolutionResult.didDocument.toJSON() }), 
            // Set cache duration
            cacheDurationInSeconds);
        }
        return resolutionResult;
    }
    /**
     * Resolve a did document. This uses the default resolution options, and thus
     * will use caching if available.
     */
    async resolveDidDocument(agentContext, did) {
        const { didDocument, didResolutionMetadata: { error, message }, } = await this.resolve(agentContext, did);
        if (!didDocument) {
            throw new error_1.CredoError(`Unable to resolve did document for did '${did}': ${error} ${message}`);
        }
        return didDocument;
    }
    async invalidateCacheForDid(agentContext, did) {
        const cache = agentContext.dependencyManager.resolve(cache_1.CacheModuleConfig).cache;
        await cache.remove(agentContext, this.getCacheKey(did));
    }
    getCacheKey(did) {
        return `did:resolver:${did}`;
    }
    findResolver(parsed) {
        var _a;
        return (_a = this.didsModuleConfig.resolvers.find((r) => r.supportedMethods.includes(parsed.method))) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Get all supported did methods for the did resolver.
     */
    get supportedMethods() {
        return Array.from(new Set(this.didsModuleConfig.resolvers.flatMap((r) => r.supportedMethods)));
    }
};
exports.DidResolverService = DidResolverService;
exports.DidResolverService = DidResolverService = __decorate([
    (0, plugins_1.injectable)(),
    __param(0, (0, plugins_1.inject)(constants_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [Object, DidsModuleConfig_1.DidsModuleConfig,
        repository_1.DidRepository])
], DidResolverService);
//# sourceMappingURL=DidResolverService.js.map