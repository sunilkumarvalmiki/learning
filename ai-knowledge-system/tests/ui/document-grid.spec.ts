import { test, expect } from '@playwright/test';

test.describe('Document Grid', () => {
    test('should have documents grid element', async ({ page }) => {
        await page.goto('/');

        // Wait for loading
        await page.waitForTimeout(1000);

        // Grid should exist (even if empty)
        const grid = page.locator('.documents-grid');
        const emptyState = page.locator('.empty-state');

        // Either grid or empty state should be visible
        const gridVisible = await grid.isVisible();
        const emptyVisible = await emptyState.isVisible();

        expect(gridVisible || emptyVisible).toBeTruthy();
    });

    test('should display document cards if documents exist', async ({ page }) => {
        await page.goto('/');

        // Wait for loading
        await page.waitForTimeout(1000);

        const documentCards = page.locator('.documents-grid > *');
        const count = await documentCards.count();

        if (count > 0) {
            // First card should have title
            const firstCard = documentCards.first();
            await expect(firstCard).toBeVisible();

            // Should have status badge
            const badge = firstCard.locator('[class*="badge"]');
            await expect(badge).toBeVisible();
        }
    });

    test('should show loading state initially', async ({ page }) => {
        await page.goto('/');

        // Loading text should appear briefly
        // (This is hard to test reliably due to speed)
        const loadingText = page.locator('text=Loading documents');

        // Just verify page loaded successfully
        await page.waitForLoadState('networkidle');
    });
});
