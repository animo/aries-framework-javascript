import type { TagsBase } from '../../../storage/BaseRecord';
import { type JwaSignatureAlgorithm } from '../../../crypto';
import { BaseRecord } from '../../../storage/BaseRecord';
import { Mdoc } from '../Mdoc';
export type DefaultMdocRecordTags = {
    docType: string;
    /**
     *
     * The Jwa Signature Algorithm used to sign the Mdoc.
     */
    alg: JwaSignatureAlgorithm;
};
export type MdocRecordStorageProps = {
    id?: string;
    createdAt?: Date;
    tags?: TagsBase;
    mdoc: Mdoc;
};
export declare class MdocRecord extends BaseRecord<DefaultMdocRecordTags> {
    static readonly type = "MdocRecord";
    readonly type = "MdocRecord";
    base64Url: string;
    constructor(props: MdocRecordStorageProps);
    getTags(): {
        docType: string;
        alg: JwaSignatureAlgorithm;
    };
    clone(): this;
}
