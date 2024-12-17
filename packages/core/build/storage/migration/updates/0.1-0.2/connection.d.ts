import type { BaseAgent } from '../../../../agent/BaseAgent';
import type { ConnectionRecord } from '../../../../modules/connections';
import { DidExchangeState, ConnectionState, ConnectionRole, DidExchangeRole } from '../../../../modules/connections';
import { OutOfBandState } from '../../../../modules/oob/domain/OutOfBandState';
/**
 * Migrates the {@link ConnectionRecord} to 0.2 compatible format. It fetches all records from storage
 * and applies the needed updates to the records. After a record has been transformed, it is updated
 * in storage and the next record will be transformed.
 *
 * The following transformations are applied:
 *  - {@link updateConnectionRoleAndState}
 *  - {@link extractDidDocument}
 *  - {@link migrateToOobRecord}
 */
export declare function migrateConnectionRecordToV0_2<Agent extends BaseAgent>(agent: Agent): Promise<void>;
/**
 * With the addition of the did exchange protocol there are now two states and roles related to the connection record; for the did exchange protocol and for the connection protocol.
 * To keep it easy to work with the connection record, all state and role values are updated to those of the {@link DidExchangeRole} and {@link DidExchangeState}.
 *
 * This migration method transforms all connection record state and role values to their respective values of the {@link DidExchangeRole} and {@link DidExchangeState}. For convenience a getter
 * property `rfc0160ConnectionState` is added to the connection record which returns the {@link ConnectionState} value.
 *
 * The following 0.1.0 connection record structure (unrelated keys omitted):
 *
 * ```json
 * {
 *   "state": "invited",
 *   "role": "inviter"
 * }
 * ```
 *
 * Will be transformed into the following 0.2.0 structure (unrelated keys omitted):
 *
 * ```json
 * {
 *   "state": "invitation-sent",
 *   "role": "responder",
 * }
 * ```
 */
export declare function updateConnectionRoleAndState<Agent extends BaseAgent>(agent: Agent, connectionRecord: ConnectionRecord): Promise<void>;
/**
 * The connection record previously stored both did documents from a connection in the connection record itself. Version 0.2.0 added a generic did storage that can be used for numerous usages, one of which
 * is the storage of did documents for connection records.
 *
 * This migration method extracts the did documents from the `didDoc` and `theirDidDoc` properties from the connection record, updates them to did documents compliant with the DID Core spec, and stores them
 * in the did repository. By doing so it also updates the unqualified dids in the `did` and `theirDid` fields generated by the indy-sdk to fully qualified `did:peer` dids compliant with
 * the [Peer DID Method Specification](https://identity.foundation/peer-did-method-spec/).
 *
 * To account for the fact that the mechanism to migrate legacy did document to peer did documents is not defined yet, the legacy did and did document are stored in the did record metadata.
 * This will be deleted later if we can be certain the did doc conversion to a did:peer did document is correct.
 *
 * The following 0.1.0 connection record structure (unrelated keys omitted):
 *
 * ```json
 * {
 *   "did": "BBPoJqRKatdcfLEAFL7exC",
 *   "theirDid": "N8NQHLtCKfPmWMgCSdfa7h",
 *   "didDoc": <legacyDidDoc>,
 *   "theirDidDoc": <legacyTheirDidDoc>,
 *   "verkey": "GjZWsBLgZCR18aL468JAT7w9CZRiBnpxUPPgyQxh4voa"
 * }
 * ```
 *
 * Will be transformed into the following 0.2.0 structure (unrelated keys omitted):
 *
 * ```json
 * {
 *   "did": "did:peer:1zQmXUaPPhPCbUVZ3hGYmQmGxWTwyDfhqESXCpMFhKaF9Y2A",
 *   "theirDid": "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa"
 * }
 * ```
 */
export declare function extractDidDocument<Agent extends BaseAgent>(agent: Agent, connectionRecord: ConnectionRecord): Promise<void>;
/**
 * With the addition of the out of band protocol, invitations are now stored in the {@link OutOfBandRecord}. In addition a new field `invitationDid` is added to the connection record that
 * is generated based on the invitation service or did. This allows to reuse existing connections.
 *
 * This migration method extracts the invitation and other relevant data into a separate {@link OutOfBandRecord}. By doing so it converts the old connection protocol invitation into the new
 * Out of band invitation message. Based on the service or did of the invitation, the `invitationDid` is populated.
 *
 * Previously when creating a multi use invitation, a connection record would be created with the `multiUseInvitation` set to true. The connection record would always be in state `invited`.
 * If a request for the multi use invitation came in, a new connection record would be created. With the addition of the out of band module, no connection records are created until a request
 * is received. So for multi use invitation this means that the connection record with multiUseInvitation=true will be deleted, and instead all connections created using that out of band invitation
 * will contain the `outOfBandId` of the multi use invitation.
 *
 * The following 0.1.0 connection record structure (unrelated keys omitted):
 *
 * ```json
 * {
 *   "invitation": {
 *     "@type": "https://didcomm.org/connections/1.0/invitation",
 *     "@id": "04a2c382-999e-4de9-a1d2-9dec0b2fa5e4",
 *     "recipientKeys": ["E6D1m3eERqCueX4ZgMCY14B4NceAr6XP2HyVqt55gDhu"],
 *     "serviceEndpoint": "https://example.com",
 *     "label": "test",
 *   },
 *   "multiUseInvitation": false
 * }
 * ```
 *
 * Will be transformed into the following 0.2.0 structure (unrelated keys omitted):
 *
 * ```json
 * {
 *   "invitationDid": "did:peer:2.Ez6MksYU4MHtfmNhNm1uGMvANr9j4CBv2FymjiJtRgA36bSVH.SeyJzIjoiaHR0cHM6Ly9leGFtcGxlLmNvbSJ9",
 *   "outOfBandId": "04a2c382-999e-4de9-a1d2-9dec0b2fa5e4"
 * }
 * ```
 */
export declare function migrateToOobRecord<Agent extends BaseAgent>(agent: Agent, connectionRecord: ConnectionRecord): Promise<ConnectionRecord | undefined>;
/**
 * Determine the out of band state based on the did exchange role and state.
 */
export declare function oobStateFromDidExchangeRoleAndState(role: DidExchangeRole, state: DidExchangeState): OutOfBandState;
/**
 * Determine the did exchange state based on the connection/did-exchange role and state.
 */
export declare function didExchangeStateAndRoleFromRoleAndState(role: ConnectionRole | DidExchangeRole, state: ConnectionState | DidExchangeState): [DidExchangeRole, DidExchangeState];
