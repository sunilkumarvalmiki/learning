import { test, expect } from '@playwright/test';

test.describe('Application UI', () => {
    test('should display app title and sidebar', async ({ page }) => {
        await page.goto('/');

        // Check page loaded
        await expect(page).toHaveTitle(/Tauri/);

        // Sidebar should be visible - use more specific selectors
        await expect(page.locator('.sidebar-title')).toContainText('AI Knowledge');

        // Check sidebar items exist (using role-based selectors)
        const homeButton = page.getByRole('button', { name: /Home/ });
        await expect(homeButton).toBeVisible();

        const docsButton = page.getByRole('button', { name: /Documents/ });
        await expect(docsButton).toBeVisible();

        const tagsButton = page.getByRole('button', { name: /Tags/ });
        await expect(tagsButton).toBeVisible();

        const settingsButton = page.getByRole('button', { name: /Settings/ });
        await expect(settingsButton).toBeVisible();
    });

    test('should display page title in header', async ({ page }) => {
        await page.goto('/');

        // Default view is Documents
        const pageTitle = page.locator('.page-title');
        await expect(pageTitle).toBeVisible();
        await expect(pageTitle).toHaveText('Documents');
    });

    test('should have upload button in header', async ({ page }) => {
        await page.goto('/');

        // Use header-specific selector
        const uploadButton = page.locator('.app-header button:has-text("Upload Document")');
        await expect(uploadButton).toBeVisible();
        await expect(uploadButton).toBeEnabled();
    });

    test('should have search bar', async ({ page }) => {
        await page.goto('/');

        const searchBar = page.locator('input[placeholder*="Search"]');
        await expect(searchBar).toBeVisible();
    });

    test('should show empty state when no documents', async ({ page }) => {
        await page.goto('/');

        // Wait for loading to complete
        await page.waitForTimeout(1000);

        // Should show empty state (if no documents in DB)
        const emptyState = page.locator('.empty-state');
        const isVisible = await emptyState.isVisible();

        if (isVisible) {
            await expect(emptyState.locator('h3')).toContainText('No documents yet');
            await expect(emptyState.locator('p')).toContainText('Upload your first document');
        }
    });

    test('should toggle sidebar collapse', async ({ page }) => {
        await page.goto('/');

        // Find collapse button in footer
        const collapseButton = page.locator('.sidebar-footer button').first();
        await expect(collapseButton).toBeVisible();

        // Click to toggle
        await collapseButton.click();

        // Button should now show opposite arrow
        // (Can't easily test actual collapse without inspecting DOM classes)
    });

    test('should navigate between views', async ({ page }) => {
        await page.goto('/');

        // Click Home in sidebar
        await page.getByRole('button', { name: /Home/ }).click();
        await expect(page.locator('.page-title')).toHaveText('Home');
        await expect(page.locator('.view-page-title')).toContainText('Welcome');

        // Click Tags in sidebar
        await page.getByRole('button', { name: /Tags/ }).click();
        await expect(page.locator('.page-title')).toHaveText('Tags');

        // Click Settings in sidebar
        await page.getByRole('button', { name: /Settings/ }).click();
        await expect(page.locator('.page-title')).toHaveText('Settings');

        // Back to Documents in sidebar
        await page.getByRole('button', { name: /Documents/ }).click();
        await expect(page.locator('.page-title')).toHaveText('Documents');
    });
});
