import { build } from "electron-builder";
import { execSync } from "child_process";

async function buildElectron() {
  try {
    console.log("Building TypeScript for Electron...");
    execSync("npx tsc -p electron/tsconfig.json", { stdio: "inherit" });

    console.log("Building Vite project...");
    execSync("npm run build", { stdio: "inherit" });

    console.log("Building Electron app...");
    await build({
      config: {
        appId: "com.everclimb.app",
        productName: "Everclimb",
        directories: {
          output: "release",
        },
        files: ["dist/**/*", "dist-electron/**/*"],
        mac: {
          category: "public.app-category.games",
        },
        win: {
          target: "nsis",
        },
        linux: {
          target: "AppImage",
        },
      },
    });

    console.log("Electron app built successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildElectron().catch(console.error);
