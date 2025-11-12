import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';

export type Theme = 'light' | 'dark';

function getSavedTheme(): Theme {
	let theme: Theme = 'dark';
	if (typeof window !== 'undefined') {
		const savedTheme = loadFromLocalStorage<Theme>('theme');
		if (savedTheme === 'light' || savedTheme === 'dark') {
			theme = savedTheme;
		} else {
			const prefersDark =
				window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			theme = prefersDark ? 'dark' : 'light';
		}
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document.documentElement.classList.toggle('light', theme === 'light');
	}
	return theme;
}

let theme = $state<Theme>(getSavedTheme());

export function getTheme() {
	return theme;
}

export function toggleTheme() {
	const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
	theme = newTheme;
	if (typeof window !== 'undefined') {
		document.documentElement.classList.toggle('dark', newTheme === 'dark');
		document.documentElement.classList.toggle('light', newTheme === 'light');
	}
	saveToLocalStorage('theme', newTheme);
}
