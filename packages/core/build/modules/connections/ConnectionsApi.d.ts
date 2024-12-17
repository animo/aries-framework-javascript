import type { ConnectionType } from './models';
import type { ConnectionRecord } from './repository/ConnectionRecord';
import type { Routing } from './services';
import type { Query, QueryOptions } from '../../storage/StorageService';
import type { OutOfBandRecord } from '../oob/repository';
import { AgentContext } from '../../agent';
import { MessageHandlerRegistry } from '../../agent/MessageHandlerRegistry';
import { MessageSender } from '../../agent/MessageSender';
import { DidResolverService } from '../dids';
import { DidRepository } from '../dids/repository';
import { OutOfBandService } from '../oob/OutOfBandService';
import { RoutingService } from '../routing/services/RoutingService';
import { ConnectionsModuleConfig } from './ConnectionsModuleConfig';
import { DidExchangeProtocol } from './DidExchangeProtocol';
import { HandshakeProtocol } from './models';
import { DidRotateService } from './services';
import { ConnectionService } from './services/ConnectionService';
import { TrustPingService } from './services/TrustPingService';
export interface SendPingOptions {
    responseRequested?: boolean;
    withReturnRouting?: boolean;
}
export declare class ConnectionsApi {
    /**
     * Configuration for the connections module
     */
    readonly config: ConnectionsModuleConfig;
    private didExchangeProtocol;
    private connectionService;
    private didRotateService;
    private outOfBandService;
    private messageSender;
    private trustPingService;
    private routingService;
    private didRepository;
    private didResolverService;
    private agentContext;
    constructor(messageHandlerRegistry: MessageHandlerRegistry, didExchangeProtocol: DidExchangeProtocol, connectionService: ConnectionService, didRotateService: DidRotateService, outOfBandService: OutOfBandService, trustPingService: TrustPingService, routingService: RoutingService, didRepository: DidRepository, didResolverService: DidResolverService, messageSender: MessageSender, agentContext: AgentContext, connectionsModuleConfig: ConnectionsModuleConfig);
    acceptOutOfBandInvitation(outOfBandRecord: OutOfBandRecord, config: {
        autoAcceptConnection?: boolean;
        label?: string;
        alias?: string;
        imageUrl?: string;
        protocol: HandshakeProtocol;
        routing?: Routing;
        ourDid?: string;
    }): Promise<ConnectionRecord>;
    /**
     * Accept a connection request as inviter (by sending a connection response message) for the connection with the specified connection id.
     * This is not needed when auto accepting of connection is enabled.
     *
     * @param connectionId the id of the connection for which to accept the request
     * @returns connection record
     */
    acceptRequest(connectionId: string): Promise<ConnectionRecord>;
    /**
     * Accept a connection response as invitee (by sending a trust ping message) for the connection with the specified connection id.
     * This is not needed when auto accepting of connection is enabled.
     *
     * @param connectionId the id of the connection for which to accept the response
     * @returns connection record
     */
    acceptResponse(connectionId: string): Promise<ConnectionRecord>;
    /**
     * Send a trust ping to an established connection
     *
     * @param connectionId the id of the connection for which to accept the response
     * @param responseRequested do we want a response to our ping
     * @param withReturnRouting do we want a response at the time of posting
     * @returns TrustPingMessage
     */
    sendPing(connectionId: string, { responseRequested, withReturnRouting }?: SendPingOptions): Promise<import("./messages").TrustPingMessage>;
    /**
     * Rotate the DID used for a given connection, notifying the other party immediately.
     *
     *  If `toDid` is not specified, a new peer did will be created. Optionally, routing
     * configuration can be set.
     *
     * Note: any did created or imported in agent wallet can be used as `toDid`, as long as
     * there are valid DIDComm services in its DID Document.
     *
     * @param options connectionId and optional target did and routing configuration
     * @returns object containing the new did
     */
    rotate(options: {
        connectionId: string;
        toDid?: string;
        routing?: Routing;
    }): Promise<{
        newDid: string;
    }>;
    /**
     * Terminate a connection by sending a hang-up message to the other party. The connection record itself and any
     * keys used for mediation will only be deleted if `deleteAfterHangup` flag is set.
     *
     * @param options connectionId
     */
    hangup(options: {
        connectionId: string;
        deleteAfterHangup?: boolean;
    }): Promise<void>;
    returnWhenIsConnected(connectionId: string, options?: {
        timeoutMs: number;
    }): Promise<ConnectionRecord>;
    /**
     * Retrieve all connections records
     *
     * @returns List containing all connection records
     */
    getAll(): Promise<ConnectionRecord[]>;
    /**
     * Retrieve all connections records by specified query params
     *
     * @returns List containing all connection records matching specified query paramaters
     */
    findAllByQuery(query: Query<ConnectionRecord>, queryOptions?: QueryOptions): Promise<ConnectionRecord[]>;
    /**
     * Allows for the addition of connectionType to the record.
     *  Either updates or creates an array of string connection types
     * @param connectionId
     * @param type
     * @throws {RecordNotFoundError} If no record is found
     */
    addConnectionType(connectionId: string, type: ConnectionType | string): Promise<ConnectionRecord>;
    /**
     * Removes the given tag from the given record found by connectionId, if the tag exists otherwise does nothing
     * @param connectionId
     * @param type
     * @throws {RecordNotFoundError} If no record is found
     */
    removeConnectionType(connectionId: string, type: ConnectionType | string): Promise<ConnectionRecord>;
    /**
     * Gets the known connection types for the record matching the given connectionId
     * @param connectionId
     * @returns An array of known connection types or null if none exist
     * @throws {RecordNotFoundError} If no record is found
     */
    getConnectionTypes(connectionId: string): Promise<string[]>;
    /**
     *
     * @param connectionTypes An array of connection types to query for a match for
     * @returns a promise of ab array of connection records
     */
    findAllByConnectionTypes(connectionTypes: Array<ConnectionType | string>): Promise<ConnectionRecord[]>;
    /**
     * Retrieve a connection record by id
     *
     * @param connectionId The connection record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The connection record
     *
     */
    getById(connectionId: string): Promise<ConnectionRecord>;
    /**
     * Find a connection record by id
     *
     * @param connectionId the connection record id
     * @returns The connection record or null if not found
     */
    findById(connectionId: string): Promise<ConnectionRecord | null>;
    /**
     * Delete a connection record by id
     *
     * @param connectionId the connection record id
     */
    deleteById(connectionId: string): Promise<void>;
    private removeRouting;
    /**
     * Remove relationship of a connection with any previous did (either ours or theirs), preventing it from accepting
     * messages from them. This is usually called when a DID Rotation flow has been succesful and we are sure that no
     * more messages with older keys will arrive.
     *
     * It will remove routing keys from mediator if applicable.
     *
     * Note: this will not actually delete any DID from the wallet.
     *
     * @param connectionId
     */
    removePreviousDids(options: {
        connectionId: string;
    }): Promise<void>;
    findAllByOutOfBandId(outOfBandId: string): Promise<ConnectionRecord[]>;
    /**
     * Retrieve a connection record by thread id
     *
     * @param threadId The thread id
     * @throws {RecordNotFoundError} If no record is found
     * @throws {RecordDuplicateError} If multiple records are found
     * @returns The connection record
     */
    getByThreadId(threadId: string): Promise<ConnectionRecord>;
    findByDid(did: string): Promise<ConnectionRecord | null>;
    findByInvitationDid(invitationDid: string): Promise<ConnectionRecord[]>;
    private registerMessageHandlers;
}
