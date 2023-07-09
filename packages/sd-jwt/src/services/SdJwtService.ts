import type { CreateSdJwtOptions } from '../SdJwtApi'
import type { AgentContext, Key } from '@aries-framework/core'
import type { DisclosureFrame, Hasher as SdJwtHasher, SaltGenerator, Signer } from 'jwt-sd'

import { injectable, getJwkFromKey, TypedArrayEncoder, Hasher } from '@aries-framework/core'
import { randomBytes } from '@stablelib/random'
import { SdJwt } from 'jwt-sd'

@injectable()
export class SdJwtService {
  // TODO: spec says we have to sign the string, not the bytes. Will this work?
  private hasher(): SdJwtHasher {
    return (input: string) =>
      TypedArrayEncoder.toBase64URL(Hasher.hash(TypedArrayEncoder.fromString(input), 'sha2-256'))
  }

  /**
   * Create a salt with a length of 128 bits
   */
  private saltGenerator(): SaltGenerator {
    return () => TypedArrayEncoder.toBase64URL(randomBytes(128 / 8))
  }

  // TODO: match the signerKey.keyType to the header.alg
  private signer(agentContext: AgentContext, signerKey: Key): Signer {
    return async (input: string, header: Record<string, unknown>) => {
      return await agentContext.wallet.sign({ key: signerKey, data: TypedArrayEncoder.fromString(input) })
    }
  }

  public async createSdJwt(
    agentContext: AgentContext,
    { headerClaims, signerKey, selectivelyDisclosableClaims, nonSelectivelyDisclosableClaims }: CreateSdJwtOptions
  ): Promise<string> {
    const jwk = getJwkFromKey(signerKey)
    const header = {
      jwk,
      alg: 'ES256',
      ...headerClaims,
    }
    const payload = {
      ...selectivelyDisclosableClaims,
      ...nonSelectivelyDisclosableClaims,
    }

    const disclosureFrame = this.makeDisclosureFrame(selectivelyDisclosableClaims ?? {})

    const sdJwt = await new SdJwt()
      .withHeader(header)
      .withPayload(payload)
      .withDisclosureFrame(disclosureFrame)
      .withHasher({ hasher: this.hasher(), algorithm: 'sha-256' })
      .withSigner(this.signer(agentContext, signerKey))
      .withSaltGenerator(this.saltGenerator())
      .toCompact()

    return sdJwt
  }

  private makeDisclosureFrame(selectivelyDisclosableItems: Record<string, unknown>) {
    const frame: DisclosureFrame<typeof selectivelyDisclosableItems> = {}

    const createFrame = (data: Record<string, unknown>) => {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          createFrame(value as Record<string, unknown>)
        } else {
          frame[key] = true
        }
      })
    }

    createFrame(selectivelyDisclosableItems)

    return frame
  }
}
