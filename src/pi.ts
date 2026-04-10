import type {
  ExtensionAPI,
  ExtensionCommandContext
} from '@mariozechner/pi-coding-agent'
import { Array, Chunk, Effect, pipe, Stream } from 'effect'
import { fetchOpenAiCompatibleModels } from './models.loader.js'
import { getProviders } from '@mariozechner/pi-ai'
import { not } from 'effect/Boolean'
import { loadActiveProviders } from './config.js'
import {
  loadModelsDevProvidersCache,
  removeModelsDevProvidersCache,
  saveModelsDevProvidersCache
} from './cache'

export const piModelsDevProvidersMain = (pi: ExtensionAPI) =>
  Effect.gen(function* () {
    yield* registerModelDevProviders(pi)

    pi.registerCommand('modeldev-refresh', {
      description: 'Refresh Model.dev providers',
      handler: (_args, ctx) => pipe(refresh(pi, ctx), Effect.runPromise)
    })
  })

const registerModelDevProviders = (pi: ExtensionAPI) =>
  Effect.gen(function* () {
    const modelsToLoad = yield* loadModels()

    Array.forEach(modelsToLoad, ([providerName, config]) => {
      pi.registerProvider(providerName, config)
    })
  })

const loadModels = () => {
  return pipe(
    loadModelsDevProvidersCache(),
    Effect.orElse(() =>
      Effect.gen(function* () {
        const activeProviders = yield* loadActiveProviders()
        const providers = getProviders()

        const importedProviders = yield* pipe(
          fetchOpenAiCompatibleModels(),
          Stream.filter(([provider, _]) =>
            Array.some(activeProviders, (p) => p === provider)
          ),
          Stream.filter(([provider, _]) =>
            not(Array.some(providers, (p) => p === provider))
          ),
          Stream.runCollect,
          Effect.map(Chunk.toArray)
        )

        yield* saveModelsDevProvidersCache(importedProviders)

        return importedProviders
      })
    )
  )
}

const refresh = (pi: ExtensionAPI, ctx: ExtensionCommandContext) =>
  Effect.gen(function* () {
    ctx.ui.notify(`Refreshing Models.dev providers...`, 'info')
    yield* unregisterModelDevProviders(pi)

    yield* removeModelsDevProvidersCache()

    yield* registerModelDevProviders(pi)
    ctx.ui.notify(`Models.dev providers reloaded`, 'info')
  })

const unregisterModelDevProviders = (pi: ExtensionAPI) =>
  Effect.gen(function* () {
    const modelsToLoad = yield* loadModels()

    Array.forEach(modelsToLoad, ([providerName]) => {
      pi.unregisterProvider(providerName)
    })
  })
