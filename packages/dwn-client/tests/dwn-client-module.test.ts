/* eslint-disable @typescript-eslint/unbound-method */
import type { DependencyManager } from '@aries-framework/core'

import { DwnClientApi } from '../src/DwnClientApi'
import { DwnClientModule } from '../src/DwnClientModule'
import { DwnClientService } from '../src/DwnClientService'

const dependencyManager = {
  registerInstance: jest.fn(),
  registerSingleton: jest.fn(),
  registerContextScoped: jest.fn(),
  resolve: jest.fn().mockReturnValue({ logger: { warn: jest.fn() } }),
} as unknown as DependencyManager

describe('DwnClientModule', () => {
  test('registers dependencies on the dependency manager', () => {
    const dwnClientModule = new DwnClientModule()
    dwnClientModule.register(dependencyManager)

    expect(dependencyManager.registerContextScoped).toHaveBeenCalledTimes(1)
    expect(dependencyManager.registerContextScoped).toHaveBeenCalledWith(DwnClientApi)

    expect(dependencyManager.registerSingleton).toHaveBeenCalledTimes(1)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(DwnClientService)
  })
})
