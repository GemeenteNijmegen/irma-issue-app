import { test, expect, Page } from '@playwright/test';

let page: Page;
const isAcceptance = process.env.ENVIRONMENT ? process.env.ENVIRONMENT == 'acceptance': true;

test.beforeAll(async ({ browser }) => {
  // Create page once and sign in.
  page = await browser.newPage();

  await page.goto('https://irma-issue.accp.csp-nijmegen.nl/');

  if(!isAcceptance) return; // We cannot authenticate using DigiD in prod

  // Click text=Inloggen via DigiD
  await page.locator('text=Inloggen via DigiD').click();
  await expect(page).toHaveURL('https://authenticatie-accp.nijmegen.nl/broker/select/authn');

  // Click text=Simulator
  await page.locator('text=Simulator').click();
  await expect(page).toHaveURL('https://authenticatie-accp.nijmegen.nl/broker/authn/simulator/selection');

  // Click text=DigiD >> nth=0
  await page.locator('text=DigiD').first().click();
  await expect(page).toHaveURL('https://authenticatie-accp.nijmegen.nl/broker/authn/simulator/authenticate/digid');

  // Fill input[name="bsn"]
  await page.locator('input[name="bsn"]').fill('900026236');

  // Click [data-test="send-button"]
  await page.locator('[data-test="send-button"]').click();
  await expect(page).toHaveURL('https://irma-issue.accp.csp-nijmegen.nl');
});

test.afterAll(async () => {
  await page.close();
});

test('Visiting issue page', async () => {
  if(isAcceptance) return;
  
  await expect(page).toHaveURL('https://irma-issue.accp.csp-nijmegen.nl');
  await page.screenshot({ path: 'test/playwright/screenshots/issue.png', fullPage: true });
  // Check if session ptr is set in html
  await expect(page.locator('#session-ptr-u')).toHaveAttribute('data', /^https:\/\/gw-test.nijmegen.nl\/irma\/session\/.*/);
  await expect(page.locator('#session-ptr-qr')).toHaveAttribute('data', 'issuing');
});