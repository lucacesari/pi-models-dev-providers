import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { Effect, pipe } from 'effect'
import { removeModelsDevProvidersCache } from './cache'
import { selectModelsDevProviders } from "./command/select";
import { refresh, registerModelDevProviders } from "./command/refresh";

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

    pi.registerCommand('modelsdev-select', {
      description: 'Select Models.dev providers to enable',
      handler: (_args, ctx) => pipe(selectModelsDevProviders(pi, ctx), Effect.runPromise)
    })
  })
