#!/usr/bin/env sh

(cd packages/core  && pnpm build && pnpm pack)
(cd packages/askar && pnpm build && pnpm pack)

# rm -rf ../paradym-wallet/credo/ ../paradym-wallet/apps/easypid/credo/ ../paradym-wallet/apps/paradym/credo/ ../paradym-wallet/packages/agent/credo ../paradym-wallet/node_modules/
# 
# mkdir ../paradym-wallet/credo/
# 
# cp ./packages/core/credo-ts-core-0.5.13.tgz ../paradym-wallet/credo/credo-core.tgz
# cp ./packages/askar/credo-ts-askar-0.5.13.tgz ../paradym-wallet/credo/credo-askar.tgz
# 
# cp -r ../paradym-wallet/credo/ ../paradym-wallet/apps/paradym/credo
# cp -r ../paradym-wallet/credo/ ../paradym-wallet/apps/easypid/credo
# cp -r ../paradym-wallet/credo/ ../paradym-wallet/packages/agent/credo

# cd ../paradym-wallet/ && pnpm i

rm -rf ../openid4vc-playground-funke/credo ../openid4vc-playground-funke/node_modules/ ../openid4vc-playground-funke/agent/node_modules/ 

mkdir ../openid4vc-playground-funke/credo

cp ./packages/core/credo-ts-core-0.5.13.tgz ../openid4vc-playground-funke/credo/credo-core.tgz
cp ./packages/askar/credo-ts-askar-0.5.13.tgz ../openid4vc-playground-funke/credo/credo-askar.tgz

cd ../openid4vc-playground-funke/ && pnpm i
