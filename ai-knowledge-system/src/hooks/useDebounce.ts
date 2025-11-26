import { useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing values
 * Delays updating the value until after the specified delay
 * Useful for search inputs, API calls, etc.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 * 
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * 
 * useEffect(() => {
 *   // This only runs 300ms after user stops typing
 *   fetchResults(debouncedQuery);
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        // Clear the previous timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Set a new timer
        timerRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay) as unknown as number;

        // Cleanup on unmount or value change
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, delay]);

    return debouncedValue;
}

// Import React for useState
import React from 'react';
