// ============================================================================
// Import
// ============================================================================

import { promises as fs } from "fs";
import path from "path";
import postcss, { AcceptedPlugin } from "postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import { Action, ActionOptionsType } from "../../types/Action.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for {@link PostCssAction}. `inputPath` and
 * `outputPath` are required; every other field is optional and falls back
 * to the default noted on the field, matching the defaults applied inside
 * {@link PostCssAction.execute}.
 *
 * @example
 * ```yaml
 * # kist.yaml
 * steps:
 *   - action: PostCssAction
 *     options:
 *       inputPath: src/styles/main.css
 *       outputPath: dist/styles/main.css
 *       autoprefixer: true
 *       browsers: ["> 1%", "last 2 versions", "not dead"]
 *       minify: true
 *       cssnanoPreset: default
 *       sourcemap: true
 *       inlineSourcemap: false
 * ```
 */
export interface PostCssActionOptions extends ActionOptionsType {
    /** Path to the input CSS file, resolved relative to the process's current working directory. */
    inputPath: string;
    /** Path where the processed CSS will be written; parent directories are created automatically if missing. */
    outputPath: string;
    /** Enable autoprefixer, adding vendor prefixes per `browsers` (default: true) */
    autoprefixer?: boolean;
    /** Browserslist queries used by autoprefixer to determine which vendor prefixes are needed (default: `["> 1%", "last 2 versions", "not dead"]`) */
    browsers?: string[];
    /** Enable minification with cssnano; increases processing time but reduces output size (default: false) */
    minify?: boolean;
    /** cssnano optimization preset controlling how aggressive minification is: `"default"`, `"lite"` (faster, fewer transforms), or `"advanced"` (more aggressive, may alter behavior in edge cases) (default: "default") */
    cssnanoPreset?: "default" | "lite" | "advanced";
    /** Generate a sourcemap for the output CSS (default: false) */
    sourcemap?: boolean;
    /** When `sourcemap` is enabled, embed the map inline in the output CSS instead of writing a separate `.map` file (default: false) */
    inlineSourcemap?: boolean;
    /** Additional PostCSS plugins to run after autoprefixer/cssnano, in array order */
    plugins?: AcceptedPlugin[];
}

// ============================================================================
// Classes
// ============================================================================

/**
 * Kist action that runs a CSS file through the PostCSS processing pipeline:
 * optional autoprefixer (vendor prefixing), optional cssnano minification,
 * any user-supplied PostCSS plugins, then writes the result (and, if
 * requested, a sourcemap) to `outputPath`. Register this action under the
 * name `"PostCssAction"` in a kist.yaml pipeline step; see
 * {@link PostCssActionOptions} for the full set of configurable options.
 */
export class PostCssAction extends Action<PostCssActionOptions> {
    /**
     * Validates the action options before {@link execute} runs. Checks that
     * the required `inputPath`/`outputPath` strings are present and that
     * any optional fields that were supplied (`autoprefixer`, `minify`,
     * `cssnanoPreset`) have the correct type/value. Does not check that
     * `inputPath` actually exists on disk — that failure surfaces from
     * {@link execute} instead. On failure, logs the specific problem via
     * {@link Action.logError} rather than throwing, so callers can decide
     * how to react to an invalid config.
     *
     * @param options - The options to validate.
     * @returns `true` if options are valid, `false` otherwise.
     */
    validateOptions(options: PostCssActionOptions): boolean {
        if (!options.inputPath || typeof options.inputPath !== "string") {
            this.logError("Invalid options: 'inputPath' is required and must be a string.");
            return false;
        }
        if (!options.outputPath || typeof options.outputPath !== "string") {
            this.logError("Invalid options: 'outputPath' is required and must be a string.");
            return false;
        }
        if (options.autoprefixer !== undefined && typeof options.autoprefixer !== "boolean") {
            this.logError("Invalid options: 'autoprefixer' must be a boolean.");
            return false;
        }
        if (options.minify !== undefined && typeof options.minify !== "boolean") {
            this.logError("Invalid options: 'minify' must be a boolean.");
            return false;
        }
        if (options.cssnanoPreset !== undefined) {
            const validPresets = ["default", "lite", "advanced"];
            if (!validPresets.includes(options.cssnanoPreset)) {
                this.logError(`Invalid options: 'cssnanoPreset' must be one of: ${validPresets.join(", ")}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Reads `inputPath`, runs it through PostCSS with the configured plugin
     * set (autoprefixer, then cssnano, then any custom `plugins`, in that
     * order), and writes the resulting CSS to `outputPath`. If `sourcemap`
     * is enabled and not inlined, also writes a sibling `outputPath + ".map"`
     * file. Any warnings emitted by PostCSS plugins (e.g. from a
     * misconfigured custom plugin) are logged individually rather than
     * failing the action. Both paths are resolved relative to the current
     * working directory, and the output directory is created recursively
     * if it doesn't already exist.
     *
     * @param options - The options for CSS processing.
     * @returns A Promise that resolves once the CSS (and optional
     * sourcemap) have been written.
     * @throws {Error} If `options` fail {@link validateOptions}, if
     * `inputPath` cannot be read, or if PostCSS processing itself fails
     * (e.g. a CSS syntax error or a plugin throwing). The underlying error
     * is logged via {@link Action.logError} and then rethrown so the kist
     * pipeline halts.
     */
    async execute(options: PostCssActionOptions): Promise<void> {
        if (!this.validateOptions(options)) {
            throw new Error("Invalid options provided to PostCssAction.");
        }

        const {
            inputPath,
            outputPath,
            autoprefixer: useAutoprefixer = true,
            browsers = ["> 1%", "last 2 versions", "not dead"],
            minify = false,
            cssnanoPreset = "default",
            sourcemap = false,
            inlineSourcemap = false,
            plugins: customPlugins = [],
        } = options;

        this.logInfo(`Processing CSS: ${inputPath} → ${outputPath}`);

        try {
            const resolvedInputPath = path.resolve(inputPath);
            const resolvedOutputPath = path.resolve(outputPath);

            // Read input CSS
            const inputCss = await fs.readFile(resolvedInputPath, "utf8");

            // Build plugin list
            const plugins: AcceptedPlugin[] = [];

            if (useAutoprefixer) {
                plugins.push(autoprefixer({ overrideBrowserslist: browsers }));
            }

            if (minify) {
                plugins.push(cssnano({ preset: cssnanoPreset }));
            }

            // Add custom plugins
            plugins.push(...customPlugins);

            // Process with PostCSS
            const result = await postcss(plugins).process(inputCss, {
                from: resolvedInputPath,
                to: resolvedOutputPath,
                map: sourcemap ? { inline: inlineSourcemap } : false,
            });

            // Ensure output directory exists
            const outputDir = path.dirname(resolvedOutputPath);
            await fs.mkdir(outputDir, { recursive: true });

            // Write output CSS
            await fs.writeFile(resolvedOutputPath, result.css, "utf8");

            // Write sourcemap if external
            if (sourcemap && !inlineSourcemap && result.map) {
                await fs.writeFile(`${resolvedOutputPath}.map`, result.map.toString(), "utf8");
                this.logDebug(`Sourcemap written to ${resolvedOutputPath}.map`);
            }

            // Log warnings
            for (const warning of result.warnings()) {
                this.logWarning(`${warning.plugin}: ${warning.text}`);
            }

            const features = [];
            if (useAutoprefixer) features.push("autoprefixer");
            if (minify) features.push("minify");
            if (sourcemap) features.push("sourcemap");

            this.logInfo(`CSS processing completed: ${outputPath} (${features.join(", ") || "no transforms"})`);
        } catch (error) {
            this.logError("PostCSS processing failed.", error);
            throw error;
        }
    }

    /**
     * Provides a short, human-readable description of this action, used by
     * kist for help output and pipeline documentation. Overrides the
     * generic {@link Action.describe} default.
     *
     * @returns A one-sentence description of the action.
     */
    describe(): string {
        return "Processes CSS files using PostCSS with autoprefixer and cssnano support.";
    }
}
