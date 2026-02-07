import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [
        react({
            jsxRuntime: "classic",
        }),
    ],
    resolve: {
        alias: {
            "@": path.join(__dirname, "client", "src"),
            "@shared": path.join(__dirname, "shared"),
        },
    },
    root: path.join(__dirname, "client"),
    envDir: __dirname,
    build: {
        outDir: path.join(__dirname, "dist", "public"),
        emptyOutDir: true,
        sourcemap: false,
        minify: "terser",
        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true,
        },
    },
    server: {
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
});
