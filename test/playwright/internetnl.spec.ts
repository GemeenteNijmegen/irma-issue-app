import { test, expect, Page } from '@playwright/test';

let page: Page;
let baseUrl = 'irma-issue.auth-prod.csp-nijmegen.nl';
const isAcceptance = process.env.ENVIRONMENT ? process.env.ENVIRONMENT == 'acceptance': true;

test.beforeAll(async ({ browser }) => {

  if (isAcceptance) {
    baseUrl = 'irma-issue.accp.csp-nijmegen.nl';
  }
  console.log('Running internet.nl test with base url:', baseUrl);

  // Create page once.
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
