// ============================================================================
// Import
// ============================================================================

import { PostCssAction, PostCssActionOptions } from "./PostCssAction.js";

// ============================================================================
// Export
// ============================================================================

/**
 * Barrel export for the PostCssAction module. Re-exports {@link PostCssAction}
 * and its {@link PostCssActionOptions} options type so consumers can import
 * from `actions/PostCssAction` without reaching into `PostCssAction.ts`
 * directly.
 */
export { PostCssAction, PostCssActionOptions };
