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
 * Options for the PostCssAction
 */
export interface PostCssActionOptions extends ActionOptionsType {
    /** Path to the input CSS file */
    inputPath: string;
    /** Path where the processed CSS will be saved */
    outputPath: string;
    /** Enable autoprefixer (default: true) */
    autoprefixer?: boolean;
    /** Autoprefixer browser targets */
    browsers?: string[];
    /** Enable minification with cssnano (default: false) */
    minify?: boolean;
    /** cssnano preset (default: default) */
    cssnanoPreset?: "default" | "lite" | "advanced";
    /** Generate sourcemap (default: false) */
    sourcemap?: boolean;
    /** Inline sourcemap instead of external file (default: false) */
    inlineSourcemap?: boolean;
    /** Additional PostCSS plugins */
    plugins?: AcceptedPlugin[];
}

// ============================================================================
// Classes
// ============================================================================

/**
 * PostCssAction handles CSS processing using PostCSS.
 * Supports autoprefixer, cssnano minification, and custom plugins.
 */
export class PostCssAction extends Action<PostCssActionOptions> {
    /**
     * Validates the action options.
     *
     * @param options - The options to validate.
     * @returns True if options are valid.
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
     * Executes the PostCSS processing action.
     *
     * @param options - The options for CSS processing.
     * @returns A Promise that resolves when processing completes.
     * @throws {Error} If processing encounters an error.
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
     * Provides a description of the action.
     *
     * @returns A string description of the action.
     */
    describe(): string {
        return "Processes CSS files using PostCSS with autoprefixer and cssnano support.";
    }
}
