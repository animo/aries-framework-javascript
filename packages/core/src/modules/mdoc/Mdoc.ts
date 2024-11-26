import type { MdocSignOptions, MdocNameSpaces, MdocVerifyOptions } from './MdocOptions'
import type { AgentContext } from '../../agent'
import type { JwkJson, Key } from '../../crypto'
import type { IssuerSignedDocument } from '@animo-id/mdoc'

import {
  COSEKey,
  DeviceSignedDocument,
  Document,
  Verifier,
  cborEncode,
  parseDeviceSigned,
  parseIssuerSigned,
} from '@animo-id/mdoc'

import { getJwkFromJson, getJwkFromKey, JwaSignatureAlgorithm } from '../../crypto'
import { ClaimFormat } from '../vc'
import { X509Certificate, X509ModuleConfig } from '../x509'

import { TypedArrayEncoder } from './../../utils'
import { getMdocContext } from './MdocContext'
import { MdocError } from './MdocError'

/**
 * This class represents a IssuerSigned Mdoc Document,
 * which are the actual credentials being issued to holders.
 */
export class Mdoc {
  public base64Url: string
  private constructor(private issuerSignedDocument: IssuerSignedDocument) {
    const issuerSigned = issuerSignedDocument.prepare().get('issuerSigned')
    this.base64Url = TypedArrayEncoder.toBase64URL(cborEncode(issuerSigned))
  }

  /**
   * claim format is convenience method added to all credential instances
   */
  public get claimFormat() {
    return ClaimFormat.MsoMdoc as const
  }

  /**
   * Encoded is convenience method added to all credential instances
   */
  public get encoded() {
    return this.base64Url
  }

  public static fromBase64Url(mdocBase64Url: string, expectedDocType?: string): Mdoc {
    const issuerSignedDocument = parseIssuerSigned(TypedArrayEncoder.fromBase64(mdocBase64Url), expectedDocType)
    return new Mdoc(issuerSignedDocument)
  }

  public static fromIssuerSignedDocument(issuerSignedBase64Url: string, expectedDocType?: string): Mdoc {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    return new Mdoc(parseIssuerSigned(TypedArrayEncoder.fromBase64(issuerSignedBase64Url), expectedDocType))
  }

  public static fromDeviceSignedDocument(
    issuerSignedBase64Url: string,
    deviceSignedBase64Url: string,
    expectedDocType?: string
  ): Mdoc {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    return new Mdoc(
      parseDeviceSigned(
        TypedArrayEncoder.fromBase64(deviceSignedBase64Url),
        TypedArrayEncoder.fromBase64(issuerSignedBase64Url),
        expectedDocType
      )
    )
  }

  public get docType(): string {
    return this.issuerSignedDocument.docType
  }

  /**
   * Get the device key to which the mdoc is bound
   */
  public get deviceKey(): Key | null {
    const deviceKeyRaw = this.issuerSignedDocument.issuerSigned.issuerAuth.decodedPayload.deviceKeyInfo?.deviceKey
    if (!deviceKeyRaw) return null

    return getJwkFromJson(COSEKey.import(deviceKeyRaw).toJWK() as JwkJson).key
  }

  public get alg(): JwaSignatureAlgorithm {
    const algName = this.issuerSignedDocument.issuerSigned.issuerAuth.algName
    if (!algName) {
      throw new MdocError('Cannot extract the signature algorithm from the mdoc.')
    }
    if (Object.values(JwaSignatureAlgorithm).includes(algName as JwaSignatureAlgorithm)) {
      return algName as JwaSignatureAlgorithm
    }
    throw new MdocError(`Cannot parse mdoc. The signature algorithm '${algName}' is not supported.`)
  }

  public get validityInfo() {
    return this.issuerSignedDocument.issuerSigned.issuerAuth.decodedPayload.validityInfo
  }

  public get deviceSignedNamespaces(): MdocNameSpaces {
    if (this.issuerSignedDocument instanceof DeviceSignedDocument === false) {
      throw new MdocError(`Cannot get 'device-namespaces from a IssuerSignedDocument. Must be a DeviceSignedDocument.`)
    }

    return Object.fromEntries(
      Array.from(this.issuerSignedDocument.allDeviceSignedNamespaces.entries()).map(([namespace, value]) => [
        namespace,
        Object.fromEntries(Array.from(value.entries())),
      ])
    )
  }

  public get issuerSignedCertificateChain() {
    return this.issuerSignedDocument.issuerSigned.issuerAuth.certificateChain
  }

  public get issuerSignedNamespaces(): MdocNameSpaces {
    return Object.fromEntries(
      Array.from(this.issuerSignedDocument.allIssuerSignedNamespaces.entries()).map(([namespace, value]) => [
        namespace,
        Object.fromEntries(Array.from(value.entries())),
      ])
    )
  }

  public static async sign(agentContext: AgentContext, options: MdocSignOptions) {
    const { docType, validityInfo, namespaces, holderKey, issuerCertificate } = options
    const mdocContext = getMdocContext(agentContext)

    const holderPublicJwk = getJwkFromKey(holderKey)
    const document = new Document(docType, mdocContext)
      .useDigestAlgorithm('SHA-256')
      .addValidityInfo(validityInfo)
      .addDeviceKeyInfo({ deviceKey: holderPublicJwk.toJson() })

    for (const [namespace, namespaceRecord] of Object.entries(namespaces)) {
      document.addIssuerNameSpace(namespace, namespaceRecord)
    }

    const cert = X509Certificate.fromEncodedCertificate(issuerCertificate)
    const issuerKey = getJwkFromKey(cert.publicKey)

    const alg = issuerKey.supportedSignatureAlgorithms.find(
      (
        alg
      ): alg is
        | JwaSignatureAlgorithm.ES256
        | JwaSignatureAlgorithm.ES384
        | JwaSignatureAlgorithm.ES512
        | JwaSignatureAlgorithm.EdDSA => {
        return (
          alg === JwaSignatureAlgorithm.ES256 ||
          alg === JwaSignatureAlgorithm.ES384 ||
          alg === JwaSignatureAlgorithm.ES512 ||
          alg === JwaSignatureAlgorithm.EdDSA
        )
      }
    )

    if (!alg) {
      throw new MdocError(
        `Cannot find a suitable JwaSignatureAlgorithm for signing the mdoc. Supported algorithms are 'ES256', 'ES384', 'ES512'. The issuer key supports: ${issuerKey.supportedSignatureAlgorithms.join(
          ', '
        )}`
      )
    }

    const issuerSignedDocument = await document.sign(
      {
        issuerPrivateKey: issuerKey.toJson(),
        alg,
        issuerCertificate,
        kid: cert.publicKey.fingerprint,
      },
      mdocContext
    )

    return new Mdoc(issuerSignedDocument)
  }

  public async verify(
    agentContext: AgentContext,
    options?: MdocVerifyOptions
  ): Promise<{ isValid: true } | { isValid: false; error: string }> {
    const x509ModuleConfig = agentContext.dependencyManager.resolve(X509ModuleConfig)
    const certificateChain = this.issuerSignedDocument.issuerSigned.issuerAuth.certificateChain.map((cert) =>
      X509Certificate.fromRawCertificate(cert)
    )

    let trustedCerts = options?.trustedCertificates
    if (!trustedCerts) {
      // TODO: how to prevent call to trusted certificates for verification twice?
      trustedCerts =
        (await x509ModuleConfig.getTrustedCertificatesForVerification?.(agentContext, {
          verification: {
            type: 'credential',
            credential: this,
          },
          certificateChain,
        })) ?? x509ModuleConfig.trustedCertificates
    }

    if (!trustedCerts) {
      throw new MdocError('No trusted certificates found. Cannot verify mdoc.')
    }

    const mdocContext = getMdocContext(agentContext)
    try {
      const verifier = new Verifier()
      await verifier.verifyIssuerSignature(
        {
          trustedCertificates: trustedCerts.map((cert) => X509Certificate.fromEncodedCertificate(cert).rawCertificate),
          issuerAuth: this.issuerSignedDocument.issuerSigned.issuerAuth,
          disableCertificateChainValidation: false,
          now: options?.now,
        },
        mdocContext
      )

      await verifier.verifyData({ mdoc: this.issuerSignedDocument }, mdocContext)
      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: error.message }
    }
  }
}
