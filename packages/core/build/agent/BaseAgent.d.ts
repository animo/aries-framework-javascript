import type { AgentConfig } from './AgentConfig';
import type { AgentApi, CustomOrDefaultApi, EmptyModuleMap, ModulesMap, WithoutDefaultModules } from './AgentModules';
import type { TransportSession } from './TransportService';
import type { Logger } from '../logger';
import type { CredentialsModule } from '../modules/credentials';
import type { MessagePickupModule } from '../modules/message-pickup';
import type { ProofsModule } from '../modules/proofs';
import type { DependencyManager } from '../plugins';
import { BasicMessagesApi } from '../modules/basic-messages';
import { ConnectionsApi } from '../modules/connections';
import { DidsApi } from '../modules/dids';
import { DiscoverFeaturesApi } from '../modules/discover-features';
import { GenericRecordsApi } from '../modules/generic-records';
import { MdocApi } from '../modules/mdoc';
import { OutOfBandApi } from '../modules/oob';
import { MediatorApi, MediationRecipientApi } from '../modules/routing';
import { SdJwtVcApi } from '../modules/sd-jwt-vc';
import { W3cCredentialsApi } from '../modules/vc/W3cCredentialsApi';
import { X509Api } from '../modules/x509';
import { WalletApi } from '../wallet';
import { EventEmitter } from './EventEmitter';
import { FeatureRegistry } from './FeatureRegistry';
import { MessageReceiver } from './MessageReceiver';
import { MessageSender } from './MessageSender';
import { TransportService } from './TransportService';
import { AgentContext } from './context';
export declare abstract class BaseAgent<AgentModules extends ModulesMap = EmptyModuleMap> {
    protected agentConfig: AgentConfig;
    protected logger: Logger;
    readonly dependencyManager: DependencyManager;
    protected eventEmitter: EventEmitter;
    protected featureRegistry: FeatureRegistry;
    protected messageReceiver: MessageReceiver;
    protected transportService: TransportService;
    protected messageSender: MessageSender;
    protected _isInitialized: boolean;
    protected agentContext: AgentContext;
    readonly connections: ConnectionsApi;
    readonly credentials: CustomOrDefaultApi<AgentModules['credentials'], CredentialsModule>;
    readonly proofs: CustomOrDefaultApi<AgentModules['proofs'], ProofsModule>;
    readonly mediator: MediatorApi;
    readonly mediationRecipient: MediationRecipientApi;
    readonly messagePickup: CustomOrDefaultApi<AgentModules['messagePickup'], MessagePickupModule>;
    readonly basicMessages: BasicMessagesApi;
    readonly mdoc: MdocApi;
    readonly genericRecords: GenericRecordsApi;
    readonly discovery: DiscoverFeaturesApi;
    readonly dids: DidsApi;
    readonly wallet: WalletApi;
    readonly oob: OutOfBandApi;
    readonly w3cCredentials: W3cCredentialsApi;
    readonly sdJwtVc: SdJwtVcApi;
    readonly x509: X509Api;
    readonly modules: AgentApi<WithoutDefaultModules<AgentModules>>;
    constructor(agentConfig: AgentConfig, dependencyManager: DependencyManager);
    get isInitialized(): boolean;
    initialize(): Promise<void>;
    /**
     * Receive a message.
     *
     * @deprecated Use {@link OutOfBandApi.receiveInvitationFromUrl} instead for receiving legacy connection-less messages.
     * For receiving messages that originated from a transport, use the {@link MessageReceiver}
     * for this. The `receiveMessage` method on the `Agent` class will associate the current context to the message, which
     * may not be what should happen (e.g. in case of multi tenancy).
     */
    receiveMessage(inboundMessage: unknown, session?: TransportSession): Promise<void>;
    get config(): AgentConfig;
    get context(): AgentContext;
}
