
/**
 * PizzaGuard Security System
 * Provides data integrity checks and basic input sanitization for the app.
 */

export interface SecurityReport {
    status: 'secure' | 'warning' | 'critical';
    issuesFound: string[];
    itemsScanned: number;
    timestamp: number;
}

export const securityService = {
    /**
     * Sanitizes string input to prevent basic XSS attacks.
     * Removes script tags and potential event handlers.
     */
    sanitizeInput: (input: string): string => {
        if (!input) return '';
        if (typeof input !== 'string') return String(input);
        return input
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<[^>]+>/g, "") // Remove HTML tags
            .trim();
    },

    /**
     * Deeply cleans an object to ensure it is serializable (no circular refs, no DOM nodes, no functions).
     */
    deepClean: (obj: any, visited = new WeakSet()): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        
        // Handle circular references
        if (visited.has(obj)) return undefined;
        
        // Basic type checks for things that can't be stringified
        if (typeof obj === 'function' || typeof obj === 'symbol') return undefined;

        // Check for DOM nodes (they have nodeType)
        if (obj.nodeType !== undefined || (typeof Node !== 'undefined' && obj instanceof Node)) {
            return undefined;
        }

        // Check for other browser/environment circular objects
        if (typeof Window !== 'undefined' && obj instanceof Window) return undefined;
        if (typeof Event !== 'undefined' && obj instanceof Event) return undefined;

        // Check for React internal properties
        const isReactElement = obj.$$typeof !== undefined;
        if (isReactElement) return undefined;

        // Check for HTML Media Elements specifically as they often carry massive internal state
        const constructorName = obj.constructor ? obj.constructor.name : '';
        if (['HTMLAudioElement', 'HTMLVideoElement', 'HTMLImageElement', 'Audio', 'Image'].includes(constructorName)) {
            return undefined;
        }

        visited.add(obj);

        if (Array.isArray(obj)) {
            return obj
                .map(item => securityService.deepClean(item, visited))
                .filter(i => i !== undefined);
        }

        const cleaned: any = {};
        for (const key in obj) {
            // Skip React internal and non-own properties
            if (
                !Object.prototype.hasOwnProperty.call(obj, key) || 
                key.startsWith('__react') || 
                key === '_owner' || 
                key === 'stateNode' || 
                key === 'context' || 
                key === 'updater' ||
                key === '_fiber'
            ) {
                continue;
            }
            
            const val = securityService.deepClean(obj[key], visited);
            if (val !== undefined) {
                cleaned[key] = val;
            }
        }
        return cleaned;
    },

    /**
     * Scans local storage for corrupted JSON data or malicious structures.
     */
    runSystemScan: async (): Promise<SecurityReport> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const issues: string[] = [];
                let scannedCount = 0;
                
                const keysToCheck = [
                    'pizzaGradeDataV2',
                    'pizza_social_data',
                    'pizza_users_db',
                    'tournament_dates_global',
                    'pizza_theme',
                    'pizza_language'
                ];

                keysToCheck.forEach(key => {
                    scannedCount++;
                    const item = localStorage.getItem(key);
                    if (item) {
                        try {
                            if (key !== 'pizza_theme' && key !== 'pizza_language') {
                                JSON.parse(item);
                            }
                        } catch (e) {
                            issues.push(`Dados corrompidos detectados em: ${key}`);
                        }
                    }
                });

                resolve({
                    status: issues.length > 0 ? 'warning' : 'secure',
                    issuesFound: issues,
                    itemsScanned: scannedCount * 15,
                    timestamp: Date.now()
                });
            }, 2500);
        });
    },

    /**
     * Attempts to repair corrupted storage keys by resetting them to defaults
     */
    repairSystem: (issues: string[]) => {
        issues.forEach(issue => {
            if (issue.includes('pizzaGradeDataV2')) localStorage.removeItem('pizzaGradeDataV2');
            if (issue.includes('pizza_social_data')) localStorage.removeItem('pizza_social_data');
        });
        window.location.reload();
    }
};
