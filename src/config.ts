import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { Effect, pipe, Schema } from 'effect'
import { PROVIDERS_CONFIG_PATH } from './constants'

const ConfigSchema = Schema.Struct({
  providers: Schema.Array(Schema.String)
})

export const loadActiveProvidersOrEmpty = () =>
  pipe(
    loadActiveProviders(),
    Effect.orElse(() => Effect.succeed([] as string[]))
  )

const loadActiveProviders = () =>
  pipe(
    Effect.tryPromise(() => fs.readFile(PROVIDERS_CONFIG_PATH, 'utf-8')),
    Effect.flatMap((content) => Effect.try(() => JSON.parse(content))),
    Effect.flatMap(Schema.decodeUnknown(ConfigSchema)),
    Effect.map((config) => config.providers),
    Effect.orElse(() => Effect.fail(new Error('Invalid configuration schema')))
  )

export const saveActiveProviders = (providers: string[]) =>
  Effect.tryPromise(async () => {
    await fs.mkdir(path.dirname(PROVIDERS_CONFIG_PATH), { recursive: true })
    await fs.writeFile(
      PROVIDERS_CONFIG_PATH,
      JSON.stringify({ providers }, null, 2)
    )
  })
