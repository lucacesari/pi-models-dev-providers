import { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { Effect, pipe } from 'effect'
import { piModelsDevProvidersMain } from './src/pi'

export default async function (pi: ExtensionAPI) {
  await pipe(piModelsDevProvidersMain(pi), Effect.runPromise)
}
