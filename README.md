# pi-models-dev-providers

A [pi-coding-agent](https://github.com/mariozechner/pi-coding-agent) extension to use [model.dev](https://models.dev) providers.

## Installation

From [npm](https://www.npmjs.com/package/pi-models-dev-providers)
```bash
pi install npm:pi-models-dev-providers
```

From [git repository](https://codeberg.org/lucacesari/pi-models-dev-providers.git)
```bash
pi install git:codeberg.org/lucacesari/pi-models-dev-providers.git
```

From a local checkout
```bash
pi install /path/to/pi-models-dev-providers
```

## Configuration

1. Create a configuration file at `~/pi/agent/modelsdev-config.json`:
   ```json
   {
     "providers": [
       "cortecs",
       "scaleway"
     ]
   }
   ```

2. Add your API keys for each provider in `~/.pi/agent/auth.json`:
   ```json
   {
     "cortecs": {
       "type": "api_key",
       "key": "your-api-key-here"
     }
   }
   ```

## Usage

Open `pi` and type `/models` to select a model from your configured providers.

Use `/modelsdev-refresh` to manually refresh the models list when:
   - you change the configuration;
   - new models become available on models.dev.

## Tested Providers

This extension has been tested with the following providers:

- **cortecs**
- **scaleway**

If you have access to other models.dev providers, feel free to test and submit pull requests.

**Note:** Only OpenAI-compatible providers are supported at the moment.

## Credits

Inspired by the [generate-model.ts](https://github.com/agentic-dev-io/pi-agent/blob/main/packages/ai/scripts/generate-models.ts) script in [pi-coding-agent](https://github.com/mariozechner/pi-coding-agent).
