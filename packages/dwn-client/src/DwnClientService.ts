import { InjectionSymbols, Logger, inject, injectable } from '@aries-framework/core'

/**
 * @internal
 */
@injectable()
export class DwnClientService {
  private logger: Logger

  public constructor(@inject(InjectionSymbols.Logger) logger: Logger) {
    this.logger = logger
  }
}
