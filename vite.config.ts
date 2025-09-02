import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
   resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    alias: {
      // Optional: alias for cleaner imports
      "@pdfjs": path.resolve(__dirname, "node_modules/pdfjs-dist"),
    },
  },
  build: {
    commonjsOptions: {
      include: [/pdfjs-dist/, /node_modules/],
    },
  },
  server: {
    fs: {
      // Optional: allow access to files outside root if needed
      allow: [".."],
    },
  },

});
