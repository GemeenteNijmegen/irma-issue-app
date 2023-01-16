import { test, expect, Page } from '@playwright/test';

let page: Page;
const baseUrl = process.env.ENVIRONMENT_SUBDOMAIN ?? `yivi.accp.csp-nijmegen.nl`;

test.beforeAll(async ({ browser }) => {
  console.log('Running internet.nl test with base url:', baseUrl);
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

test('Test internet.nl', async () => {

  const url = `https://internet.nl/site/${baseUrl}`;

  // Go to url
  await page.goto(url);

  // Wait for results to finish
  await page.locator('#testresults-overview').waitFor({
    timeout: 2*60*1000, //2 mins
  });

  // Save results
  await page.screenshot({ path: 'test/playwright/screenshots/internet.nl.png', fullPage: true });

  // Make sure score is 100
  await expect(page.locator('#testresults-overview .testresults-percentage')).toHaveAttribute('data-resultscore', '100');

});
