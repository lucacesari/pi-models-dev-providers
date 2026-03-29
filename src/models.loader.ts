import { Model } from '@mariozechner/pi-ai'
import { Schema } from '@effect/schema'
import { Effect, pipe, Record, Stream, Array } from 'effect'
import { ProviderConfig } from '@mariozechner/pi-coding-agent'
import { UnknownException } from 'effect/Cause'
import { ParseError } from '@effect/schema/ParseResult'

const MODELS_DEV_API_JSON = 'https://models.dev/api.json'

const ModelsDevModel = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  tool_call: Schema.UndefinedOr(Schema.Boolean),
  reasoning: Schema.UndefinedOr(Schema.Boolean),
  limit: Schema.Struct({
    context: Schema.UndefinedOr(Schema.Number),
    output: Schema.UndefinedOr(Schema.Number)
  }),
  cost: Schema.UndefinedOr(
    Schema.Struct({
      input: Schema.UndefinedOr(Schema.Number),
      output: Schema.UndefinedOr(Schema.Number),
      cache_read: Schema.UndefinedOr(Schema.Number),
      cache_write: Schema.UndefinedOr(Schema.Number)
    })
  ),
  modalities: Schema.UndefinedOr(
    Schema.Struct({
      input: Schema.UndefinedOr(Schema.Array(Schema.String)),
      output: Schema.UndefinedOr(Schema.Array(Schema.String)),
      open_weight: Schema.UndefinedOr(Schema.String)
    })
  )
})
type ModelsDevModel = Schema.Schema.Type<typeof ModelsDevModel>

const ModelsDevModelRecord = Schema.Record({
  key: Schema.String,
  value: ModelsDevModel
})
type ModelsDevModelRecord = Schema.Schema.Type<typeof ModelsDevModelRecord>

const ModelsDevModelProvider = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  family: Schema.UndefinedOr(Schema.String),
  npm: Schema.String,
  api: Schema.UndefinedOr(Schema.String),
  doc: Schema.String,
  models: ModelsDevModelRecord
})
type ModelsDevModelProvider = Schema.Schema.Type<typeof ModelsDevModelProvider>

const ModelsDevProviderRecord = Schema.Record({
  key: Schema.String,
  value: ModelsDevModelProvider
})
type ModelsDevProviderRecord = Schema.Schema.Type<
  typeof ModelsDevProviderRecord
>

const mapToProvider = (
  selectedProvider: ModelsDevModelProvider
): ProviderConfig => {
  return {
    baseUrl: selectedProvider.api ?? '',
    apiKey: selectedProvider.id,
    api: 'openai-completions',
    models: pipe(
      selectedProvider.models,
      Record.toEntries,
      Array.filter(([_, { tool_call }]) => tool_call ?? false),
      Array.map(
        ([modelId, m]): Model<any> => ({
          baseUrl: selectedProvider.api ?? '',
          id: modelId,
          name: m.name ?? modelId,
          api: 'openai-completions',
          provider: selectedProvider.id,
          reasoning: m.reasoning === true,
          input: m.modalities?.input?.includes('image')
            ? ['text', 'image']
            : ['text'],
          cost: {
            input: m.cost?.input || 0,
            output: m.cost?.output || 0,
            cacheRead: m.cost?.cache_read || 0,
            cacheWrite: m.cost?.cache_write || 0
          },
          contextWindow: m.limit?.context || 4096,
          maxTokens: m.limit?.output || 4096
        })
      )
    )
  }
}

export type OpenAiCompatibleModel = [string, ProviderConfig]

export const fetchOpenAiCompatibleModels = (): Stream.Stream<
  OpenAiCompatibleModel,
  UnknownException | ParseError
> =>
  pipe(
    Effect.tryPromise(() => fetch(MODELS_DEV_API_JSON)),
    Effect.flatMap((response) => Effect.tryPromise(() => response.json())),
    Effect.flatMap(Schema.decodeUnknown(ModelsDevProviderRecord)),
    Effect.map(Record.values),
    Stream.fromIterableEffect,
    Stream.filter(({ npm }) => npm === '@ai-sdk/openai-compatible'),
    Stream.filter(({ models }) => !Record.isEmptyRecord(models)),
    Stream.map(
      (selectedProvider) =>
        [selectedProvider.id, mapToProvider(selectedProvider)] as const
    )
  )
