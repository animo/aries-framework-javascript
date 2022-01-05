import { IsString, IsOptional } from 'class-validator'

export interface VerificationMethodOptions {
  id: string
  type: string
  controller: string
  publicKeyBase58?: string
  publicKeyBase64?: string
  publicKeyJwk?: Record<string, unknown>
  publicKeyHex?: string
  publicKeyMultibase?: string
  publicKeyPem?: string
  blockchainAccountId?: string
  ethereumAddress?: string
}

export class VerificationMethod {
  public constructor(options: VerificationMethodOptions) {
    if (options) {
      this.id = options.id
      this.type = options.type
      this.controller = options.controller
      this.publicKeyBase58 = options.publicKeyBase58
      this.publicKeyBase64 = options.publicKeyBase64
      this.publicKeyJwk = options.publicKeyJwk
      this.publicKeyHex = options.publicKeyHex
      this.publicKeyMultibase = options.publicKeyMultibase
      this.publicKeyPem = options.publicKeyPem
      this.blockchainAccountId = options.blockchainAccountId
      this.ethereumAddress = options.ethereumAddress
    }
  }

  @IsString()
  public id!: string

  @IsString()
  public type!: string

  @IsString()
  public controller!: string

  @IsOptional()
  @IsString()
  public publicKeyBase58?: string

  @IsOptional()
  @IsString()
  public publicKeyBase64?: string

  // TODO: define JWK structure, we don't support JWK yet
  public publicKeyJwk?: Record<string, unknown>

  @IsOptional()
  @IsString()
  public publicKeyHex?: string

  @IsOptional()
  @IsString()
  public publicKeyMultibase?: string

  @IsOptional()
  @IsString()
  public publicKeyPem?: string

  @IsOptional()
  @IsString()
  public blockchainAccountId?: string

  @IsOptional()
  @IsString()
  public ethereumAddress?: string
}
