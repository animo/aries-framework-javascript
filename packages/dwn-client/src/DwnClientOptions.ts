import type { DwnApi } from '@web5/api'

export type BackupWalletOptions = {
  dwnApi: DwnApi
  secretKey: string
  fromDid: string
}

export type ImportWalletOptions = {
  dwnApi: DwnApi
  secretKey: string
  fromDid: string
  recordId: string
}

export type WalletRecord = {
  wallet: { type: 'Buffer'; data: number[] }
  walletShm: { type: 'Buffer'; data: number[] }
  walletWal: { type: 'Buffer'; data: number[] }
}
