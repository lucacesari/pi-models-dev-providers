# pi-models-dev-providers

A [pi-coding-agent](https://github.com/mariozechner/pi-coding-agent) extension that adds providers from [model.dev](https://models.dev) providers.

## Installation

```bash
# From git repository
pi install https://codeberg.org/lucacesari/pi-models-dev-providers.git

# From a local checkout
pi install /path/to/pi-models-dev-providers
```

## Usage

Add the Api Key for the selected provider in `~/.pi/agent/auth.json` (e.g. `cortecs`)
```json
{
  "cortecs": {
    "type": "api_key",
    "key": "ey...."
  }
}
```

Then open `pi` and select the model from the configured provider with `/models`.

The plugin permits the update of the cached models via the command `model-dev-refresh`.

## Credits

Inspired by the [generate-model.ts](https://github.com/agentic-dev-io/pi-agent/blob/main/packages/ai/scripts/generate-models.ts) script in [pi-coding-agent](https://github.com/mariozechner/pi-coding-agent).

## License

[MIT](LICENSE)
