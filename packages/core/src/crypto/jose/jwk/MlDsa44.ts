import { TypedArrayEncoder } from "../../../utils";
import { KeyType } from "../../KeyType";
import { JwaSignatureAlgorithm, JwaEncryptionAlgorithm, JwaKeyType } from "../jwa";
import { Jwk, JwkJson } from "./Jwk";
import { CredoError } from "../../../error";

export class MlDsa44Jwk extends Jwk {
    public static readonly supportedSignatureAlgorithms: JwaSignatureAlgorithm[] = [JwaSignatureAlgorithm.ML_DSA_44];
    public static readonly supportedEncryptionAlgorithms: JwaEncryptionAlgorithm[] = [];
    public static readonly keyType: KeyType = KeyType.MlDsa44;
    public kty: JwaKeyType = JwaKeyType.ML_DSA;

    public constructor(public publicKey: Uint8Array) {
      super()
    }

  public toJson() {
    return {
      ...super.toJson(),
      pub: TypedArrayEncoder.toBase64URL(this.publicKey),
    }
  }

  public static fromJson(jwkJson: JwkJson) {
    if(!jwkJson.pub) {
      throw new CredoError(`Invalid jwk. no pub: ${jwkJson}`)
    }
    return new MlDsa44Jwk(TypedArrayEncoder.fromBase64(jwkJson.pub as string))
  }

  public get keyType() {
    return MlDsa44Jwk.keyType
  }

  public get supportedEncryptionAlgorithms() {
    return MlDsa44Jwk.supportedEncryptionAlgorithms
  }

  public get supportedSignatureAlgorithms() {
    return MlDsa44Jwk.supportedSignatureAlgorithms
  }

}
