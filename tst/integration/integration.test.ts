import fs from "fs/promises";
import os from "os";
import path from "path";

import { PostCssAction } from "../../src/actions/PostCssAction/PostCssAction.js";

/**
 * Runs a real PostCSS pipeline over real files, rather than asserting against
 * a mocked processor. That is the part the unit tests cannot cover: whether
 * the options this action assembles mean to PostCSS what the action assumes.
 */
describe("PostCssAction integration", () => {
    const tmpDir = path.join(os.tmpdir(), `postcss-integration-${Date.now()}`);
    const inputPath = path.join(tmpDir, "in.css");
    const outputPath = path.join(tmpDir, "out.css");

    beforeAll(async () => {
        await fs.mkdir(tmpDir, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it("writes processed CSS to the output path", async () => {
        await fs.writeFile(inputPath, ".a { color: red; }\n", "utf8");

        await new PostCssAction().execute({ inputPath, outputPath });

        await expect(fs.readFile(outputPath, "utf8")).resolves.toContain("color");
    });

    it("adds vendor prefixes when autoprefixer is enabled", async () => {
        const out = path.join(tmpDir, "prefixed.css");
        await fs.writeFile(inputPath, ".a { user-select: none; }\n", "utf8");

        await new PostCssAction().execute({
            inputPath,
            outputPath: out,
            autoprefixer: true,
            browsers: ["safari >= 10"],
        });

        await expect(fs.readFile(out, "utf8")).resolves.toContain("-webkit-user-select");
    });

    it("produces smaller output when minifying", async () => {
        const plain = path.join(tmpDir, "plain.css");
        const minified = path.join(tmpDir, "minified.css");
        const css = ".a {\n    color: #ff0000;\n}\n\n.b {\n    color: blue;\n}\n";
        await fs.writeFile(inputPath, css, "utf8");

        await new PostCssAction().execute({
            inputPath,
            outputPath: plain,
            autoprefixer: false,
        });
        await new PostCssAction().execute({
            inputPath,
            outputPath: minified,
            autoprefixer: false,
            minify: true,
        });

        const [a, b] = await Promise.all([
            fs.readFile(plain, "utf8"),
            fs.readFile(minified, "utf8"),
        ]);
        expect(b.length).toBeLessThan(a.length);
        expect(b).not.toContain("\n\n");
    });

    it("creates the output directory when it does not exist", async () => {
        const nested = path.join(tmpDir, "nested", "deep", "out.css");
        await fs.writeFile(inputPath, ".a { color: red; }\n", "utf8");

        await new PostCssAction().execute({ inputPath, outputPath: nested });

        await expect(fs.readFile(nested, "utf8")).resolves.toContain("color");
    });

    it("rejects when the input file does not exist", async () => {
        await expect(
            new PostCssAction().execute({
                inputPath: path.join(tmpDir, "missing.css"),
                outputPath,
            }),
        ).rejects.toThrow();
    });
});
