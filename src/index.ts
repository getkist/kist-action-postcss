// ============================================================================
// Export
// ============================================================================

export { PostCssAction } from "./actions/PostCssAction/index.js";
export type { PostCssActionOptions } from "./actions/PostCssAction/index.js";
export { Action, ActionPlugin } from "./types/Action.js";
export type { ActionOptionsType } from "./types/Action.js";

// ============================================================================
// Plugin Definition
// ============================================================================

import { ActionPlugin } from "./types/Action.js";
import { PostCssAction } from "./actions/PostCssAction/index.js";

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
