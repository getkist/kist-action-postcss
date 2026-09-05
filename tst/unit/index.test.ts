import { createRequire } from "module";

import plugin, { Action, ActionPlugin, PostCssAction } from "../../src/index.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { name: string; version: string };

describe("package entry point", () => {
    it("re-exports every action it provides", () => {
        expect(PostCssAction).toBeDefined();
        expect(new PostCssAction()).toBeInstanceOf(Action);
    });

    it("exports a plugin manifest as the default export", () => {
        const manifest: ActionPlugin = plugin;
        expect(typeof manifest.version).toBe("string");
        expect(manifest.description).toBeTruthy();
        expect(manifest.keywords).toEqual(
            expect.arrayContaining(["kist", "kist-action"]),
        );
    });

    // The manifest version is hand-written, so it silently drifts from the
    // published version unless something compares the two.
    it("declares the same version as package.json", () => {
        expect(plugin.version).toBe(pkg.version);
    });

    it("registers its actions by the name pipeline steps use", () => {
        expect(plugin.registerActions).toBeDefined();
        const actions = plugin.registerActions!();
        expect(Object.keys(actions).sort()).toEqual(["PostCssAction"]);
        expect(new actions.PostCssAction()).toBeInstanceOf(PostCssAction);
    });
});
