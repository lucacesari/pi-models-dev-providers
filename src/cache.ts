import { promises as fs } from 'node:fs'
import { Effect, pipe } from 'effect'
import type { ModelsConfig } from './models.loader'
import { MODELS_CACHE } from "./constants";

export const loadModelsDevProvidersCache = () =>
  pipe(
    Effect.tryPromise(() => fs.access(MODELS_CACHE)),
    Effect.flatMap(() =>
      Effect.tryPromise(() => fs.readFile(MODELS_CACHE, 'utf-8'))
    ),
    Effect.map((string) => JSON.parse(string) as ModelsConfig)
  )

export const saveModelsDevProvidersCache = (models: ModelsConfig) => {
  return Effect.tryPromise(() =>
    fs.writeFile(MODELS_CACHE, JSON.stringify(models, null, 2))
  )
}

export const removeModelsDevProvidersCache = () =>
  Effect.tryPromise(() => fs.rm(MODELS_CACHE))
