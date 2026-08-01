/**
 * Base Action types for kist action plugins.
 *
 * These types intentionally mirror the `Action` interface defined by the
 * kist core CLI. Action plugin packages (such as this one) do not import
 * kist itself, so this file re-declares the minimal shape kist expects at
 * runtime. Keeping this file in sync with kist's own `Action` contract is
 * what allows a plugin's actions to be loaded and executed by kist without
 * a direct dependency on the kist package.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Options bag accepted by an {@link Action}. Deliberately unconstrained
 * (`Record<string, unknown>`) because kist parses action options from YAML
 * pipeline steps before any action-specific typing is known; each action
 * subclass narrows this via its own options interface (e.g.
 * `PostCssActionOptions`) and is responsible for validating the shape at
 * runtime in {@link Action.validateOptions}.
 */
export type ActionOptionsType = Record<string, unknown>;

// ============================================================================
// Classes
// ============================================================================

/**
 * Abstract base class for all kist actions.
 *
 * Subclasses implement a single unit of pipeline work (e.g. compiling CSS,
 * bundling JS) and are instantiated by kist's action registry. This base
 * class supplies a consistent logging surface and execution contract so
 * that kist can treat every action uniformly regardless of what it does
 * internally. Concrete actions must at minimum implement {@link execute};
 * overriding {@link validateOptions} and {@link describe} is optional but
 * recommended.
 *
 * @typeParam T - The action-specific options type, narrowing
 * {@link ActionOptionsType} with the fields the action actually consumes.
 */
export abstract class Action<T extends ActionOptionsType = ActionOptionsType> {
    /**
     * The unique name of the action, used in logs and by kist's action
     * registry to key this action. Derived from the concrete subclass's
     * constructor name (e.g. `"PostCssAction"`) rather than being
     * separately declared, so it always tracks the actual class name.
     *
     * @returns The action's class name.
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * Validates options before {@link execute} runs. The base implementation
     * always returns `true` (no validation); subclasses should override this
     * to check required fields and value types, logging via
     * {@link logError} and returning `false` rather than throwing, so kist
     * can surface a clean validation failure instead of an uncaught
     * exception.
     *
     * @param _options - The options to validate. Unused in the base
     * implementation; the parameter exists to define the override contract.
     * @returns `true` if the options are valid and execution may proceed,
     * `false` otherwise.
     */
    validateOptions(_options: T): boolean {
        return true;
    }

    /**
     * Executes the action with the given options. This is the single
     * required override for every concrete action and contains the
     * action's actual work (reading/writing files, invoking a processor,
     * etc.). Implementations should call {@link validateOptions} first and
     * throw if it fails, so kist's pipeline runner halts on invalid
     * configuration rather than proceeding with partial/undefined options.
     *
     * @param options - The action-specific options, typically sourced from
     * a step in a kist.yaml pipeline.
     * @returns A Promise that resolves once the action's work is complete.
     * @throws Implementations should throw when options are invalid or the
     * underlying work fails, so kist can stop the pipeline and report the
     * error.
     */
    abstract execute(options: T): Promise<void>;

    /**
     * Provides a short, human-readable description of what the action does,
     * used by kist for help output and pipeline documentation. The base
     * implementation returns a generic placeholder derived from
     * {@link name}; subclasses should override this with a specific,
     * one-sentence description of their behavior.
     *
     * @returns A one-sentence description of the action.
     */
    describe(): string {
        return `${this.name} action`;
    }

    /**
     * Logs an informational message, prefixed with the action's
     * {@link name}. Intended for normal, always-visible progress output
     * (e.g. "Processing CSS: a.css → b.css").
     *
     * @param message - The message to log.
     */
    protected logInfo(message: string): void {
        console.log(`[${this.name}] ${message}`);
    }

    /**
     * Logs an error message, prefixed with the action's {@link name}.
     * Intended to be called immediately before rethrowing or throwing an
     * error from {@link execute}, so the console output captures both the
     * human-readable context and the underlying error/stack.
     *
     * @param message - A human-readable description of what failed.
     * @param error - The underlying error or rejection reason, if any.
     */
    protected logError(message: string, error?: unknown): void {
        console.error(`[${this.name}] ERROR: ${message}`, error || "");
    }

    /**
     * Logs a debug message, prefixed with the action's {@link name}. Only
     * emitted when the `DEBUG` environment variable is set (to any truthy
     * value); otherwise this is a no-op. Use for verbose, developer-facing
     * detail that would be noisy in normal pipeline runs (e.g. intermediate
     * file paths, generated sourcemap locations).
     *
     * @param message - The debug message to log.
     */
    protected logDebug(message: string): void {
        if (process.env.DEBUG) {
            console.debug(`[${this.name}] DEBUG: ${message}`);
        }
    }

    /**
     * Logs a warning message, prefixed with the action's {@link name}.
     * Intended for recoverable issues that don't stop execution (e.g.
     * PostCSS plugin warnings surfaced during processing).
     *
     * @param message - The warning message to log.
     */
    protected logWarning(message: string): void {
        console.warn(`[${this.name}] WARNING: ${message}`);
    }
}

/**
 * Describes a kist action plugin package's manifest: metadata about the
 * package plus the set of {@link Action} subclasses it contributes to
 * kist's action registry. A package's default export (see `src/index.ts`)
 * should satisfy this interface so kist can discover, describe, and
 * instantiate its actions.
 *
 * @example
 * ```typescript
 * const plugin: ActionPlugin = {
 *     version: "1.0.0",
 *     description: "PostCSS processing for kist",
 *     author: "kist",
 *     repository: "https://github.com/getkist/kist-action-postcss",
 *     keywords: ["kist", "kist-action", "postcss", "css"],
 *     registerActions() {
 *         return { PostCssAction };
 *     },
 * };
 * export default plugin;
 * ```
 */
export interface ActionPlugin {
    /** Human-readable plugin name shown in kist's plugin listings (default: package name). */
    name?: string;
    /** Semantic version of the plugin package, e.g. `"1.0.0"`. */
    version: string;
    /** Short description of what the plugin provides. */
    description?: string;
    /** Plugin author or maintaining organization. */
    author?: string;
    /** URL of the plugin's source repository. */
    repository?: string;
    /** Search/discovery keywords, e.g. `["kist", "kist-action", "postcss"]`. */
    keywords?: string[];
    /**
     * Static map of action names to their constructors. Prefer
     * {@link registerActions} when the set of actions needs to be computed
     * (e.g. conditionally); use this field only for a fixed, always-present
     * set of actions.
     */
    actions?: Record<string, new () => Action>;
    /**
     * Factory returning a map of action names to their constructors. Called
     * by kist during plugin registration; preferred over the static
     * {@link actions} field because it allows the plugin to build the map
     * at load time rather than declaring it eagerly.
     *
     * @returns A map from action name (as used in kist.yaml pipeline steps)
     * to the corresponding {@link Action} subclass constructor.
     */
    registerActions?: () => Record<string, new () => Action>;
}
