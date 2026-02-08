# @getkist/action-postcss

PostCSS processing actions for kist with autoprefixer and cssnano support.

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
|--------|------|---------|-------------|
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