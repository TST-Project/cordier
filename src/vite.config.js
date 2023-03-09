import {defineConfig} from "vite";

export default defineConfig({
    base: "./",
    build: {
        outDir: '../',
        sourcemap: 'inline'
    }
});
