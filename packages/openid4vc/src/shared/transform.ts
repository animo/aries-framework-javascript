import type { SdJwtVc, VerifiableCredential, VerifiablePresentation } from '@credo-ts/core'
import type {
  W3CVerifiableCredential as SphereonW3cVerifiableCredential,
  W3CVerifiablePresentation as SphereonW3cVerifiablePresentation,
  WrappedVerifiablePresentation,
} from '@sphereon/ssi-types'

import {
  ClaimFormat,
  CredoError,
  JsonEncoder,
  JsonTransformer,
  MdocDeviceResponse,
  TypedArrayEncoder,
  W3cJsonLdVerifiablePresentation,
  W3cJwtVerifiablePresentation,
} from '@credo-ts/core'

export function getSphereonVerifiableCredential(
  verifiableCredential: VerifiableCredential
): SphereonW3cVerifiableCredential {
  return verifiableCredential.encoded as SphereonW3cVerifiableCredential
}

export function getSphereonVerifiablePresentation(
  verifiablePresentation: VerifiablePresentation
): SphereonW3cVerifiablePresentation {
  return verifiablePresentation.encoded as SphereonW3cVerifiablePresentation
}

export function getVerifiablePresentationFromSphereonWrapped(
  wrappedVerifiablePresentation: WrappedVerifiablePresentation
): VerifiablePresentation {
  if (wrappedVerifiablePresentation.format === 'jwt_vp') {
    if (typeof wrappedVerifiablePresentation.original !== 'string') {
      throw new CredoError('Unable to transform JWT VP to W3C VP')
    }

    return W3cJwtVerifiablePresentation.fromSerializedJwt(wrappedVerifiablePresentation.original)
  }
  if (wrappedVerifiablePresentation.format === 'ldp_vp') {
    return JsonTransformer.fromJSON(wrappedVerifiablePresentation.original, W3cJsonLdVerifiablePresentation)
  }
  if (wrappedVerifiablePresentation.format === 'vc+sd-jwt') {
    // We use some custom logic here so we don't have to re-process the encoded SD-JWT
    const [encodedHeader] = wrappedVerifiablePresentation.presentation.compactSdJwtVc.split('.')
    const header = JsonEncoder.fromBase64(encodedHeader)
    return {
      compact: wrappedVerifiablePresentation.presentation.compactSdJwtVc,
      encoded: wrappedVerifiablePresentation.presentation.compactSdJwtVc,
      header,
      payload: wrappedVerifiablePresentation.presentation.signedPayload,
      prettyClaims: wrappedVerifiablePresentation.presentation.decodedPayload,
      claimFormat: ClaimFormat.SdJwtVc,
    } satisfies SdJwtVc
  }
  if (wrappedVerifiablePresentation.format === 'mso_mdoc') {
    if (typeof wrappedVerifiablePresentation.original !== 'string') {
      const base64Url = TypedArrayEncoder.toBase64URL(
        new Uint8Array(wrappedVerifiablePresentation.original.cborEncode())
      )
      return MdocDeviceResponse.fromBase64Url(base64Url)
    }
    return MdocDeviceResponse.fromBase64Url(wrappedVerifiablePresentation.original)
  }

  throw new CredoError(`Unsupported presentation format: ${wrappedVerifiablePresentation.format}`)
}
