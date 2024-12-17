import type { AgentDependencies } from '../agent/AgentDependencies';
import { OutOfBandInvitation } from '../modules/oob/messages';
/**
 * Parses a JSON containing an invitation message and returns an OutOfBandInvitation instance
 *
 * @param invitationJson JSON object containing message
 * @returns OutOfBandInvitation
 */
export declare const parseInvitationJson: (invitationJson: Record<string, unknown>) => OutOfBandInvitation;
/**
 * Parses URL containing encoded invitation and returns invitation message.
 *
 * @param invitationUrl URL containing encoded invitation
 *
 * @returns OutOfBandInvitation
 */
export declare const parseInvitationUrl: (invitationUrl: string) => OutOfBandInvitation;
export declare const oobInvitationFromShortUrl: (response: Response) => Promise<OutOfBandInvitation>;
export declare function transformLegacyConnectionlessInvitationToOutOfBandInvitation(messageJson: Record<string, unknown>): OutOfBandInvitation;
/**
 * Parses URL containing encoded invitation and returns invitation message. Compatible with
 * parsing short Urls
 *
 * @param invitationUrl URL containing encoded invitation
 *
 * @param dependencies Agent dependencies containing fetch
 *
 * @returns OutOfBandInvitation
 */
export declare const parseInvitationShortUrl: (invitationUrl: string, dependencies: AgentDependencies) => Promise<OutOfBandInvitation>;