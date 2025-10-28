export const loadFromLocalStorage = <T>(key: string): T | null => {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	const rawValue = localStorage.getItem(key);
	if (!rawValue) {
		return null;
	}

	try {
		return JSON.parse(rawValue) as T;
	} catch (error) {
		console.error(`Failed to parse localStorage item "${key}"`, error);
		return null;
	}
};

export const saveToLocalStorage = <T>(key: string, value: T): void => {
	if (typeof localStorage === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error(`Failed to save localStorage item "${key}"`, error);
	}
};
