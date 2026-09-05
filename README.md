# @getkist/action-postcss

<div align="center">

[![npm version](https://img.shields.io/npm/v/@getkist/action-postcss?style=flat-square&logo=npm&logoColor=FFFFFF&labelColor=5e4d34&color=5e4d34)](https://www.npmjs.com/package/@getkist/action-postcss)
[![CI](https://img.shields.io/github/actions/workflow/status/getkist/kist-action-postcss/ci.yml?style=flat-square&logo=githubactions&logoColor=FFFFFF&label=CI&labelColor=5e4d34&color=5e4d34)](https://github.com/getkist/kist-action-postcss/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/getkist/kist-action-postcss?style=flat-square&logo=codecov&logoColor=FFFFFF&label=Coverage&labelColor=5e4d34&color=5e4d34)](https://codecov.io/gh/getkist/kist-action-postcss)
[![License: MIT](https://img.shields.io/badge/License-MIT-5e4d34?style=flat-square)](https://opensource.org/licenses/MIT)
[![kist plugin](https://img.shields.io/badge/kist-plugin-5e4d34?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN3Y2YzAgNS41NSAzLjg0IDEwLjc0IDEwIDEyIDYuMTYtMS4yNiAxMC02LjQ1IDEwLTEyVjdMMTIgMnoiLz48L3N2Zz4=)](https://github.com/getkist/kist)

</div>

PostCSS processing actions for [kist](https://github.com/getkist/kist) build tool with autoprefixer and cssnano support.

## Installation

```bash
npm install @getkist/action-postcss
```

## Usage

### As a kist plugin

```yaml
# kist.yml
plugins:
  - "@getkist/action-postcss"

pipeline:
  - action: PostCssAction
    options:
      inputPath: "dist/css/styles.css"
      outputPath: "dist/css/styles.min.css"
      autoprefixer: true
      minify: true
```

### Standalone usage

```typescript
import { PostCssAction } from "@getkist/action-postcss";

const action = new PostCssAction();
await action.execute({
  inputPath: "dist/css/styles.css",
  outputPath: "dist/css/styles.min.css",
  autoprefixer: true,
  browsers: ["> 1%", "last 2 versions", "not dead"],
  minify: true,
  sourcemap: true
});
```

## Actions

### PostCssAction

Processes CSS files using PostCSS with autoprefixer and cssnano support.

#### Options

| Option | Type | Default | Description |
| -------- | ------ | --------- | ------------- |
| `inputPath` | `string` | *required* | Path to the input CSS file |
| `outputPath` | `string` | *required* | Path where the processed CSS will be saved |
| `autoprefixer` | `boolean` | `true` | Enable autoprefixer |
| `browsers` | `string[]` | `["> 1%", "last 2 versions", "not dead"]` | Autoprefixer browser targets |
| `minify` | `boolean` | `false` | Enable minification with cssnano |
| `cssnanoPreset` | `"default" \| "lite" \| "advanced"` | `"default"` | cssnano preset |
| `sourcemap` | `boolean` | `false` | Generate sourcemap |
| `inlineSourcemap` | `boolean` | `false` | Inline sourcemap instead of external file |
| `plugins` | `AcceptedPlugin[]` | `[]` | Additional PostCSS plugins |

## Configuration Examples

### Add vendor prefixes only

```yaml
- action: PostCssAction
  options:
    inputPath: "src/css/main.css"
    outputPath: "dist/css/main.css"
    autoprefixer: true
    minify: false
```

### Minify CSS for production

```yaml
- action: PostCssAction
  options:
    inputPath: "dist/css/styles.css"
    outputPath: "dist/css/styles.min.css"
    autoprefixer: true
    minify: true
    cssnanoPreset: "advanced"
```

### Generate external sourcemap

```yaml
- action: PostCssAction
  options:
    inputPath: "src/css/app.css"
    outputPath: "dist/css/app.css"
    autoprefixer: true
    minify: true
    sourcemap: true
    inlineSourcemap: false
```

### Custom browser targets

```yaml
- action: PostCssAction
  options:
    inputPath: "src/css/modern.css"
    outputPath: "dist/css/modern.css"
    autoprefixer: true
    browsers:
      - "last 1 Chrome version"
      - "last 1 Firefox version"
      - "last 1 Safari version"
```

### Use with custom PostCSS plugins

```typescript
import { PostCssAction } from "@getkist/action-postcss";
import postcssNested from "postcss-nested";
import postcssCustomProperties from "postcss-custom-properties";

const action = new PostCssAction();
await action.execute({
  inputPath: "src/css/app.css",
  outputPath: "dist/css/app.css",
  plugins: [
    postcssNested(),
    postcssCustomProperties({ preserve: false })
  ]
});
```

## License

MIT
