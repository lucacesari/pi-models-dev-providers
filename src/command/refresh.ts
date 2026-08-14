import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Array, Effect, pipe, Record } from "effect";
import { loadModelsDevProvidersCache, removeModelsDevProvidersCache, saveModelsDevProvidersCache } from "../cache";
import { loadActiveProvidersOrEmpty } from "../config";
import { fetchModelsDevProviders } from "../models.loader";

export const refresh = (pi: ExtensionAPI, ctx: ExtensionCommandContext) =>
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

export const registerModelDevProviders = (pi: ExtensionAPI) =>
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
                const activeProviders = yield* loadActiveProvidersOrEmpty()

                const importedProviders =
                    yield* fetchModelsDevProviders(activeProviders)

                yield* saveModelsDevProvidersCache(importedProviders)

                return importedProviders
            })
        )
    )
}
