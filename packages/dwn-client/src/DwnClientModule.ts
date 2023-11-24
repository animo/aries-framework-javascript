import type { DependencyManager, Module } from '@aries-framework/core'

import { AgentConfig } from '@aries-framework/core'

import { DwnClientApi } from './DwnClientApi'
import { DwnClientService } from './DwnClientService'

/**
 * @public
 */
export class DwnClientModule implements Module {
  public readonly api = DwnClientApi

  /**
   * Registers the dependencies of the sd-jwt-vc module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager) {
    // Warn about experimental module
    dependencyManager
      .resolve(AgentConfig)
      .logger.warn(
        "The '@aries-framework/dwn-client' module is experimental and could have unexpected breaking changes. When using this module, make sure to use strict versions for all @aries-framework packages."
      )

    // Api
    dependencyManager.registerContextScoped(this.api)

    // Services
    dependencyManager.registerSingleton(DwnClientService)
  }
}
