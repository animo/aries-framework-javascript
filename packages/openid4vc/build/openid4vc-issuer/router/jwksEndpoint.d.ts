import type { OpenId4VcIssuerModuleConfig } from '../OpenId4VcIssuerModuleConfig';
import type { Router } from 'express';
export declare function configureJwksEndpoint(router: Router, config: OpenId4VcIssuerModuleConfig): void;