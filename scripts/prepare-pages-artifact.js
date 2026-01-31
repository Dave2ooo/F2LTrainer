import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
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

// Create .nojekyll file to prevent GitHub Pages from ignoring files starting with _
writeFileSync(path.join(buildDir, '.nojekyll'), '', 'utf8');

// Ensure env.js exists for $env/dynamic/public support
// SvelteKit generates a reference to this file in the HTML, but may not create it
// if no PUBLIC_* environment variables are set during build
const envJsPath = path.join(buildDir, '_app', 'env.js');
if (!existsSync(envJsPath)) {
	mkdirSync(path.dirname(envJsPath), { recursive: true });
	writeFileSync(envJsPath, 'export const env = {};', 'utf8');
}

// Copy index.html to 404.html for client-side routing fallback
const indexHtmlPath = path.join(buildDir, 'index.html');
const fallbackPath = path.join(buildDir, '404.html');
if (existsSync(indexHtmlPath)) {
	cpSync(indexHtmlPath, fallbackPath, { force: true });
}

console.log(`Prepared GitHub Pages artifact at ${buildDir}`);
