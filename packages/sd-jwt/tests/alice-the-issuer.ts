import { AskarModule } from '@aries-framework/askar'
import { Agent, ConsoleLogger, KeyType, LogLevel } from '@aries-framework/core'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import fs from 'fs'
import path from 'path'

import { getAgentOptions } from '../../core/tests/helpers'
import { SdJwtModule } from '../src/SdJwtModule'

const run = async () => {
  const modules = {
    askar: new AskarModule({ ariesAskar }),
    sdJwtModule: new SdJwtModule(),
  }

  const agentOptions = getAgentOptions(
    'Alice SD-JWT Issuer Agent',
    {
      logger: new ConsoleLogger(LogLevel.off),
    },
    modules
  )

  const agent = new Agent(agentOptions)
  await agent.initialize()

  const signerKey = await agent.wallet.createKey({
    keyType: KeyType.P256,
  })

  console.log('=== 🚀 Alice the Issuer ===')

  const jwt = {
    iss: 'https://example.com/issuer',
    iat: 1516239022,
    exp: 1735689661,
  }

  console.log('Using base JWT:', jwt)
  console.log()
  const claims = {
    name: 'John Doe',
    age: 21,
  }

  console.log('Using claims:', claims)
  console.log()

  console.log('Signing JWT with key:', signerKey)
  console.log()

  const sdJwt = await agent.modules.sdJwtModule.createSdJwt({
    signerKey,
    selectivelyDisclosableClaims: claims,
    nonSelectivelyDisclosableClaims: jwt,
  })

  console.log('Writing SD-JWT:', sdJwt)
}

void run()
