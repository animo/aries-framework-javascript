import type { CredDef } from 'indy-sdk'

export interface LocalResourceRegistry {
  schemas: { [resourceId: string]: CheqdSchemaResourceData }
  credentialDefinitions: { [resourceId: string]: CheqdCredDefResourceData }
}

// Cache
export const resourceRegistry: LocalResourceRegistry = {
  schemas: {},
  credentialDefinitions: {},
}

export type CheqdSchemaResourceData = {
  AnonCredsSchema: {
    attr_names: string[]
    name: string
    version: string
  }
  AnonCredsObjectMetadata: {
    objectFamily: 'anoncreds'
    objectFamilyVersion: 'v2'
    objectType: '2'
    publisherDid: string
    objectURI: string
  }
}

export type CheqdCredDefResourceData = {
  AnonCredsCredDef: Omit<CredDef, 'id'> & { id?: undefined }
  AnonCredsObjectMetadata: {
    objectFamily: 'anoncreds'
    objectFamilyVersion: 'v2'
    objectType: '3'
    publisherDid: string
    objectURI: string
  }
}
