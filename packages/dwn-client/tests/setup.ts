/*
Needs globalThis.crypto polyfill.
This is *not* the crypto you're thinking of.
It's the original crypto...CRYPTOGRAPHY.
*/
import { webcrypto } from 'node:crypto'

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto

jest.setTimeout(120000)
