import { ActionPlugin } from "./types/Action.js";
import { PostCssAction } from "./actions/PostCssAction/index.js";

const plugin: ActionPlugin = {
    name: "@getkist/action-postcss",
    version: "1.0.0",
    actions: { PostCssAction },
};

export default plugin;
export type { PostCssActionOptions } from "./actions/PostCssAction/index.js";
export { PostCssAction };
export { Action, ActionPlugin, ActionOptionsType } from "./types/Action.js";
