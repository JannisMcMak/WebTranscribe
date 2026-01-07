import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/** Format time in seconds to MM:SS:MMM (zero-padded). */
export function formatTime(time?: number, excludeMillis = false): string {
	if (typeof time === 'undefined') {
		return excludeMillis ? '--:--' : '--:--:---';
	}
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	const milliseconds = Math.floor((time % 1) * 1000);
	let res = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	if (!excludeMillis) {
		res += `:${milliseconds.toString().padStart(3, '0')}`;
	}
	return res;
}
