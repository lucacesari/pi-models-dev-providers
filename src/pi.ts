import type {
  ExtensionAPI,
  ExtensionCommandContext
} from '@mariozechner/pi-coding-agent'
import * as path from 'node:path'
import * as os from 'node:os'
import { Array, Chunk, Effect, pipe, Stream } from 'effect'
import {
  fetchOpenAiCompatibleModels,
  OpenAiCompatibleModel
} from './models.loader.js'
import { promises as fs } from 'node:fs'
import { getProviders } from '@mariozechner/pi-ai'
import { not } from 'effect/Boolean'

const MODELS_CACHE = path.join(os.homedir(), '.pi', 'models.dev.cache')

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

const loadModels = () =>
  pipe(
    Effect.tryPromise(() => fs.access(MODELS_CACHE)),
    Effect.flatMap(() =>
      Effect.tryPromise(() => fs.readFile(MODELS_CACHE, 'utf-8'))
    ),
    Effect.map((string) => JSON.parse(string) as Array<OpenAiCompatibleModel>),
    Effect.orElse(() => {
      const providers = getProviders()
      return pipe(
        fetchOpenAiCompatibleModels(),
        Stream.filter(([provider, _]) =>
          not(Array.some(providers, (p) => p === provider))
        ),
        Stream.runCollect,
        Effect.map(Chunk.toArray),
        Effect.tap((models) =>
          Effect.tryPromise(() =>
            fs.writeFile(MODELS_CACHE, JSON.stringify(models, null, 2))
          )
        )
      )
    })
  )

const refresh = (pi: ExtensionAPI, ctx: ExtensionCommandContext) =>
  Effect.gen(function* () {
    ctx.ui.notify(`Refreshing Models.dev providers...`, 'info')
    yield* unregisterModelDevProviders(pi)

    yield* Effect.tryPromise(() => fs.rm(MODELS_CACHE))

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
