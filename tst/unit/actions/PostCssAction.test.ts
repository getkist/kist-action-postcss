import { PostCssAction } from "../../../src/actions/PostCssAction/PostCssAction.js";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

describe("PostCssAction", () => {
    let action: PostCssAction;
    let testDir: string;
    let inputFile: string;
    let outputFile: string;

    beforeAll(async () => {
        // Create test fixtures directory in temp
        testDir = path.join(os.tmpdir(), `postcss-test-${Date.now()}`);
        await fs.mkdir(testDir, { recursive: true });
        inputFile = path.join(testDir, "input.css");
        outputFile = path.join(testDir, "output.css");
    });

    beforeEach(async () => {
        action = new PostCssAction();
        // Create a sample CSS file for testing
        const sampleCSS = `
/* This is a comment */
.container {
    display: flex;
    user-select: none;
    background: linear-gradient(to right, red, blue);
}

::placeholder {
    color: gray;
}

.button {
    appearance: none;
    transition: all 0.3s ease;
}
`;
        await fs.writeFile(inputFile, sampleCSS, "utf8");
    });

    afterEach(async () => {
        // Clean up test files
        try {
            await fs.unlink(inputFile);
        } catch { /* ignore */ }
        try {
            await fs.unlink(outputFile);
        } catch { /* ignore */ }
        try {
            await fs.unlink(`${outputFile}.map`);
        } catch { /* ignore */ }
    });

    afterAll(async () => {
        // Clean up test directory
        try {
            await fs.rmdir(testDir);
        } catch { /* ignore */ }
    });

    describe("name", () => {
        it("should return the action name", () => {
            expect(action.name).toBe("PostCssAction");
        });
    });

    describe("describe", () => {
        it("should return a description", () => {
            expect(action.describe()).toContain("PostCSS");
        });
    });

    describe("validateOptions", () => {
        it("should return true for valid options", () => {
            const result = action.validateOptions({
                inputPath: inputFile,
                outputPath: outputFile,
            });
            expect(result).toBe(true);
        });

        it("should return false when inputPath is missing", () => {
            const result = action.validateOptions({
                inputPath: "",
                outputPath: outputFile,
            });
            expect(result).toBe(false);
        });

        it("should return false when outputPath is missing", () => {
            const result = action.validateOptions({
                inputPath: inputFile,
                outputPath: "",
            });
            expect(result).toBe(false);
        });

        it("should return false for invalid cssnanoPreset", () => {
            const result = action.validateOptions({
                inputPath: inputFile,
                outputPath: outputFile,
                cssnanoPreset: "invalid" as "default",
            });
            expect(result).toBe(false);
        });

        it("should fail with an actionable message for an uninstalled preset", async () => {
            // Only cssnano-preset-default ships with cssnano. Asking for one
            // of the others used to fail deep inside cssnano with a bare
            // "Cannot load preset" and no hint that a package was missing.
            const action = new PostCssAction();

            await expect(
                action.execute({
                    inputPath: "any.css",
                    outputPath: "out.css",
                    minify: true,
                    cssnanoPreset: "advanced",
                }),
            ).rejects.toThrow(/requires the "cssnano-preset-advanced" package/);
        });

        it("should return true for valid cssnanoPreset", () => {
            const result = action.validateOptions({
                inputPath: inputFile,
                outputPath: outputFile,
                cssnanoPreset: "advanced",
            });
            expect(result).toBe(true);
        });
    });

    describe("execute", () => {
        it("should process CSS with autoprefixer", async () => {
            await action.execute({
                inputPath: inputFile,
                outputPath: outputFile,
                autoprefixer: true,
                minify: false,
            });

            const result = await fs.readFile(outputFile, "utf8");
            
            // Autoprefixer should add vendor prefixes
            expect(result).toContain("-webkit-");
        });

        it("should minify CSS with cssnano", async () => {
            await action.execute({
                inputPath: inputFile,
                outputPath: outputFile,
                autoprefixer: false,
                minify: true,
            });

            const result = await fs.readFile(outputFile, "utf8");
            const input = await fs.readFile(inputFile, "utf8");
            
            // Minified output should be smaller
            expect(result.length).toBeLessThan(input.length);
            // Comments should be removed
            expect(result).not.toContain("/* This is a comment */");
        });

        it("should generate external sourcemap", async () => {
            await action.execute({
                inputPath: inputFile,
                outputPath: outputFile,
                autoprefixer: true,
                sourcemap: true,
                inlineSourcemap: false,
            });

            // Check sourcemap file was created
            const mapExists = await fs.access(`${outputFile}.map`).then(() => true).catch(() => false);
            expect(mapExists).toBe(true);
        });

        it("should generate inline sourcemap", async () => {
            await action.execute({
                inputPath: inputFile,
                outputPath: outputFile,
                autoprefixer: true,
                sourcemap: true,
                inlineSourcemap: true,
            });

            const result = await fs.readFile(outputFile, "utf8");
            expect(result).toContain("sourceMappingURL=data:");
        });

        it("should throw error for invalid options", async () => {
            await expect(
                action.execute({
                    inputPath: "",
                    outputPath: "",
                })
            ).rejects.toThrow("Invalid options");
        });

        it("should throw error for non-existent input file", async () => {
            await expect(
                action.execute({
                    inputPath: "/nonexistent/file.css",
                    outputPath: outputFile,
                })
            ).rejects.toThrow();
        });

        it("should process without autoprefixer when disabled", async () => {
            await action.execute({
                inputPath: inputFile,
                outputPath: outputFile,
                autoprefixer: false,
                minify: false,
            });

            const result = await fs.readFile(outputFile, "utf8");
            
            // Should still have the original CSS without vendor prefixes
            expect(result).toContain("user-select");
        });
    });
});
