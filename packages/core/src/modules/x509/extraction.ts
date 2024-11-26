import type { Jwt } from '../../crypto'

import { X509Certificate } from './X509Certificate'

export function extractX509CertificatesFromJwt(jwt: Jwt) {
  return jwt.header.x5c?.map(X509Certificate.fromEncodedCertificate)
}