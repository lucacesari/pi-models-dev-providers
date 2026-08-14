import os from 'node:os'
import path from 'node:path'

export const MODELS_CACHE = path.join(
  os.homedir(),
  '.pi',
  'agent',
  'modelsdev.cache'
)

export const PROVIDERS_CONFIG_PATH = path.join(
  os.homedir(),
  '.pi',
  'agent',
  'modelsdev-config.json'
)
export const MODELS_DEV_API_JSON = 'https://models.dev/api.json'
