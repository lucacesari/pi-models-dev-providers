import * as path from 'node:path'
import * as os from 'node:os'
import { Effect, pipe } from 'effect'
import { Schema } from 'effect'
import { promises as fs } from 'node:fs'

export const PROVIDERS_CONFIG_PATH = path.join(
  os.homedir(),
  '.pi',
  'agent',
  'modelsdev-config.json'
)

const ConfigSchema = Schema.Struct({
  providers: Schema.Array(Schema.String)
})

export const loadActiveProviders = () =>
  pipe(
    Effect.tryPromise(() => fs.readFile(PROVIDERS_CONFIG_PATH, 'utf-8')),
    Effect.flatMap((content) => Effect.try(() => JSON.parse(content))),
    Effect.flatMap(Schema.decodeUnknown(ConfigSchema)),
    Effect.map((config) => config.providers),
    Effect.orElse(() => Effect.fail(new Error('Invalid configuration schema')))
  )
