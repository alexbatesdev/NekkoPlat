/**
 * Central URL helpers.
 *
 * Usage:
 *   import { getHashTarget } from './urlParams.js';
 *   getHashTarget();         // → 'door-1' for '#door-1', else null
 */

const params = new URLSearchParams(window.location.search);

/** Returns the value of the named query param, or null if absent. */
export const getParam = (name) => params.get(name);

/** Returns true if the named query param is present (even if empty). */
export const hasParam = (name) => params.has(name);

/** Returns URL hash target without '#', or null if absent. */
export const getHashTarget = () => {
	const hash = window.location.hash;
	if (!hash || hash.length <= 1) return null;
	return decodeURIComponent(hash.slice(1));
};

export default params;
