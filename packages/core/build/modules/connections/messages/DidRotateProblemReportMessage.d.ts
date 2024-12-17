import type { ProblemReportMessageOptions } from '../../problem-reports/messages/ProblemReportMessage';
import { ProblemReportMessage } from '../../problem-reports/messages/ProblemReportMessage';
export type DidRotateProblemReportMessageOptions = ProblemReportMessageOptions;
/**
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0035-report-problem/README.md
 */
export declare class DidRotateProblemReportMessage extends ProblemReportMessage {
    constructor(options: DidRotateProblemReportMessageOptions);
    readonly type: string;
    static readonly type: import("../../../utils/messageType").ParsedMessageType;
}
