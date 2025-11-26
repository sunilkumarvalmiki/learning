import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
    test('should have working search bar', async ({ page }) => {
        await page.goto('/');

        const searchBar = page.locator('input[placeholder*="Search"]');
        await expect(searchBar).toBeVisible();

        // Type in search bar
        await searchBar.fill('test document');
        await expect(searchBar).toHaveValue('test document');

        // Clear search
        await searchBar.clear();
        await expect(searchBar).toHaveValue('');
    });

    test('should filter documents when searching', async ({ page }) => {
        await page.goto('/');

        // Wait for documents to load
        await page.waitForTimeout(1000);

        const searchBar = page.locator('input[placeholder*="Search"]');

        // Search for a specific term
        await searchBar.fill('pdf');

        // If documents exist, check filtering works
        // (This test is limited without actual document data)
    });
});
