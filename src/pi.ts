import type {
  ExtensionAPI,
  ExtensionCommandContext
} from '@earendil-works/pi-coding-agent'
import { Array, Effect, pipe, Record } from 'effect'
import { fetchModelsDevProviders } from './models.loader.js'
import { loadActiveProviders } from './config.js'
import {
  loadModelsDevProvidersCache,
  removeModelsDevProvidersCache,
  saveModelsDevProvidersCache
} from './cache'

export const piModelsDevProvidersMain = (pi: ExtensionAPI) =>
  Effect.gen(function* () {
    yield* pipe(
      registerModelDevProviders(pi),
      Effect.catchAllDefect(() =>
        Effect.gen(function* () {
          yield* removeModelsDevProvidersCache()

          yield* registerModelDevProviders(pi)
        })
      )
    )

    pi.registerCommand('modelsdev-refresh', {
      description: 'Refresh Model.dev providers',
      handler: (_args, ctx) => pipe(refresh(pi, ctx), Effect.runPromise)
    })
  })

const registerModelDevProviders = (pi: ExtensionAPI) =>
  Effect.gen(function* () {
    const modelsToLoad = yield* loadModels()

    pipe(
      modelsToLoad.providers,
      Record.toEntries,
      Array.forEach(([providerName, config]) => {
        pi.registerProvider(providerName, config)
      })
    )
  })

const loadModels = () => {
  return pipe(
    loadModelsDevProvidersCache(),
    Effect.orElse(() =>
      Effect.gen(function* () {
        const activeProviders = yield* loadActiveProviders()

        const importedProviders =
          yield* fetchModelsDevProviders(activeProviders)

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

    pipe(
      modelsToLoad.providers,
      Record.keys,
      Array.forEach((providerName) => pi.unregisterProvider(providerName))
    )
  })
