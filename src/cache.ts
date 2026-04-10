import { Effect, pipe } from 'effect'
import * as path from 'node:path'
import * as os from 'node:os'
import { promises as fs } from 'node:fs'
import { ModelsConfig } from './models.loader'

const MODELS_CACHE = path.join(os.homedir(), '.pi', 'agent', 'modelsdev.cache')

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
