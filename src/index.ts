// ============================================================================
// Export
// ============================================================================

/**
 * Package entry point for `@getkist/action-postcss`.
 *
 * Re-exports the public API (the {@link PostCssAction} action and its
 * options type, plus the shared {@link Action} base class/types this
 * package built against) so consumers can `import { PostCssAction } from
 * "@getkist/action-postcss"` directly, and provides the default-exported
 * {@link ActionPlugin} manifest that kist loads to discover this package's
 * actions.
 */
export { PostCssAction } from "./actions/PostCssAction/index.js";
export type { PostCssActionOptions } from "./actions/PostCssAction/index.js";
export { Action, ActionPlugin } from "./types/Action.js";
export type { ActionOptionsType } from "./types/Action.js";

// ============================================================================
// Plugin Definition
// ============================================================================

import { ActionPlugin } from "./types/Action.js";
import { PostCssAction } from "./actions/PostCssAction/index.js";

/**
 * The kist plugin manifest for this package. kist loads this as the
 * package's default export and calls {@link ActionPlugin.registerActions}
 * to obtain the `"PostCssAction"` constructor, which it then instantiates
 * per pipeline step that references it in kist.yaml. Update `version` here
 * in lockstep with the `version` field in `package.json`.
 */
const plugin: ActionPlugin = {
    version: "1.0.0",
    description: "PostCSS processing for kist",
    author: "kist",
    repository: "https://github.com/getkist/kist-action-postcss",
    keywords: ["kist", "kist-action", "postcss", "css"],
    registerActions() {
        return {
            PostCssAction,
        };
    },
};

export default plugin;
