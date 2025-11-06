import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, '.svelte-kit', 'output');
const clientDir = path.join(outputDir, 'client');
const prerenderedPagesDir = path.join(outputDir, 'prerendered', 'pages');
const buildDir = path.join(projectRoot, 'build');

function assertDirExists(dir, label) {
	if (!existsSync(dir)) {
		throw new Error(`Cannot find ${label} directory at ${dir}. Did you run \
\`npm run build\`?`);
	}
}

function copyDirContents(srcDir, destDir) {
	if (!existsSync(srcDir)) {
		return;
	}

	for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
		const srcPath = path.join(srcDir, entry.name);
		const destPath = path.join(destDir, entry.name);

		if (entry.isDirectory()) {
			mkdirSync(destPath, { recursive: true });
			copyDirContents(srcPath, destPath);
		} else if (entry.isFile()) {
			cpSync(srcPath, destPath, { force: true });
		}
	}
}

assertDirExists(clientDir, 'SvelteKit client output');

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });

copyDirContents(clientDir, buildDir);
copyDirContents(prerenderedPagesDir, buildDir);

const indexHtmlPath = path.join(buildDir, 'index.html');
const fallbackPath = path.join(buildDir, '404.html');

if (existsSync(indexHtmlPath) && !existsSync(fallbackPath)) {
	cpSync(indexHtmlPath, fallbackPath, { force: true });
}

console.log(`Prepared GitHub Pages artifact at ${buildDir}`);
