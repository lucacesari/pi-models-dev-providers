import {
  DynamicBorder,
  type ExtensionAPI,
  type ExtensionCommandContext,
  getSettingsListTheme
} from '@earendil-works/pi-coding-agent'
import {
  Container,
  type SettingItem,
  SettingsList,
  Text
} from '@earendil-works/pi-tui'
import { Array, Data, Effect, HashMap, HashSet, Option, pipe } from 'effect'
import { constant } from 'effect/Function'
import { loadActiveProvidersOrEmpty, saveActiveProviders } from '../config'
import { fetchAvailableProviders, type ProviderItem } from '../models.loader'
import { refresh } from './refresh'

class ModelsDevPickerError extends Data.TaggedError('ModelsDevPicker')<{
  message: string
  level: 'error' | 'warning'
}> {}

export const selectModelsDevProviders = (
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext
) =>
  pipe(
    Effect.gen(function* () {
      if (!ctx.hasUI) {
        yield* new ModelsDevPickerError({
          message: '/modelsdev-select requires interactive mode',
          level: 'error'
        })
      }

      const currentSelections = yield* pipe(
        loadActiveProvidersOrEmpty(),
        Effect.map(HashSet.fromIterable)
      )

      const providers: ReadonlyArray<ProviderItem> = yield* pipe(
        fetchAvailableProviders(),
        Effect.catchAll((_) =>
          Effect.fail(
            new ModelsDevPickerError({
              message: 'Failed to fetch providers from models.dev',
              level: 'error'
            })
          )
        ),
        Effect.filterOrFail(
          (a) => a.length > 0,
          () =>
            new ModelsDevPickerError({
              message: 'No eligible providers found on models.dev',
              level: 'warning'
            })
        )
      )

      const enabledProviders = pipe(
        providers,
        Array.map(
          ({ id }) => [id, HashSet.has(currentSelections, id)] as const
        ),
        HashMap.fromIterable
      )

      const newProviders = yield* pickUserSelections(
        ctx,
        providers,
        enabledProviders
      )

      const confirmed = yield* pipe(
        () =>
          ctx.ui.confirm(
            `Save ${newProviders.length} provider${newProviders.length === 1 ? '' : 's'}?`,
            'The provider list will be saved and Models.dev providers reloaded.'
          ),
        Effect.promise
      )

      if (!confirmed) {
        ctx.ui.notify('Cancelled', 'info')
      } else {
        yield* saveActiveProviders(newProviders)

        const newlyAdded = pipe(
          newProviders,
          Array.filter((id) => !HashSet.has(currentSelections, id))
        )
        if (newlyAdded.length > 0) {
          ctx.ui.notify(
            `Add API keys for: ${newlyAdded.join(', ')} (auth.json or *_API_KEY env var)`,
            'warning'
          )
        }

        yield* refresh(pi, ctx)
      }
    }),
    Effect.catchTags({
      ModelsDevPicker: (error) => {
        ctx.ui.notify(error.message, error.level)
        return Effect.void
      }
    })
  )

const pickUserSelections = (
  ctx: ExtensionCommandContext,
  providers: ReadonlyArray<ProviderItem>,
  enabled: HashMap.HashMap<string, boolean>
) => {
  const maxVisible = Math.min(Math.max(providers.length, 1), 12)
  const items: SettingItem[] = pipe(
    providers,
    Array.map(({ id, name }) => ({
      id,
      label: name ?? id,
      currentValue: pipe(
        HashMap.get(enabled, id),
        Option.map((b) => (b ? 'on' : 'off')),
        Option.getOrElse(constant('off'))
      ),
      values: ['on', 'off']
    }))
  )
  let userSelection = enabled
  return pipe(
    () =>
      ctx.ui.custom<undefined>((tui, theme, _kb, done) => {
        const container = new Container()
        container.addChild(
          new DynamicBorder((s: string) => theme.fg('accent', s))
        )
        container.addChild(
          new Text(
            theme.fg('accent', theme.bold('Select Models.dev providers')),
            1,
            0
          )
        )

        const settingsList = new SettingsList(
          items,
          maxVisible,
          getSettingsListTheme(),
          (id, newValue) => {
            userSelection = HashMap.set(userSelection, id, newValue === 'on')
          },
          () => done(undefined),
          { enableSearch: true }
        )
        container.addChild(settingsList)

        container.addChild(
          new Text(
            theme.fg('dim', 'enter/space toggle • / search • esc continue'),
            1,
            0
          )
        )
        container.addChild(
          new DynamicBorder((s: string) => theme.fg('accent', s))
        )

        return {
          render: (w) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data) => {
            settingsList.handleInput(data)
            tui.requestRender()
          }
        }
      }),
    Effect.promise,
    Effect.map(() =>
      pipe(
        userSelection,
        HashMap.toEntries,
        Array.filter(([, on]) => on),
        Array.map(([id]) => id)
      )
    )
  )
}
