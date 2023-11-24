import { AskarModule } from '@aries-framework/askar'
import { Agent } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'

const modules = {
  askar: new AskarModule({ ariesAskar }),
}

describe('DwnClient', () => {
  let agent: Agent<typeof modules>
  beforeEach(async () => {
    // issuerApp = express()

    const name = 'DwnClient'

    agent = new Agent({
      config: {
        label: name,
        walletConfig: { id: name, key: name },
      },
      dependencies: agentDependencies,
      modules,
    })

    await agent.initialize()
  })

  afterEach(async () => {
    // issuerServer?.close()

    await agent.shutdown()
    await agent.wallet.delete()
  })

  it('expect true to be true', async () => {
    expect(true).toBe(true)
  })
})
