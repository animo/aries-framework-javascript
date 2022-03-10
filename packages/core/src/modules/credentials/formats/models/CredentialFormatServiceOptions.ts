import type { Attachment } from '../../../../decorators/attachment/Attachment'
import type { AutoAcceptCredential } from '../../CredentialAutoAcceptType'
import type { CredentialPreviewAttribute } from '../../models/CredentialPreviewAttributes'
import type { Payload } from '../../protocol/v1/models/CredentialFormatOptions'
import type { V2CredentialPreview } from '../../protocol/v2/V2CredentialPreview'
import type { CredentialExchangeRecord } from '../../repository/CredentialRecord'
import type { CredDef } from 'indy-sdk'

import { CredentialFormatType } from '../../interfaces'

export interface CredentialDefinitionFormat {
  indy?: {
    credDef: CredDef
  }
  w3c?: {
    // todo
  }
}

export type CredentialFormatSpec = {
  attachId: string
  format: string
}

export type FormatKeys = {
  [id: string]: CredentialFormatType
}

export interface CredProposeOfferRequestFormat {
  indy?: {
    payload: Payload
  }
  jsonld?: undefined
}

export interface CredentialAttachmentFormats {
  format: CredentialFormatSpec
  attachment?: Attachment
  credOfferRequest?: CredProposeOfferRequestFormat
}

export interface ProposeAttachmentFormats extends CredentialAttachmentFormats {
  preview?: V2CredentialPreview
}

export interface OfferAttachmentFormats extends CredentialAttachmentFormats {
  preview?: V2CredentialPreview
}
export const FORMAT_KEYS: FormatKeys = {
  indy: CredentialFormatType.Indy,
  jsonld: CredentialFormatType.JsonLd,
}

export interface HandlerAutoAcceptOptions {
  credentialRecord: CredentialExchangeRecord
  autoAcceptType: AutoAcceptCredential
  messageAttributes?: CredentialPreviewAttribute[]
  proposalAttachment?: Attachment
  offerAttachment?: Attachment
  requestAttachment?: Attachment
  credentialAttachment?: Attachment
}