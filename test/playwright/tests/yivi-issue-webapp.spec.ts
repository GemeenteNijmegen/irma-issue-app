import { expect } from '@playwright/test';
import test from '../lambdatest-setup';
import { BasePage } from '../pages/base.page';
import { SimulatorPage } from '../pages/simulator.page';

const BASE_URL = 'https://yivi.accp.nijmegen.nl';

test('Shows QR code', async ({ page }) => {
  const basePage = new BasePage(page);
  const simulatorPage = new SimulatorPage(page);

  // Create page once and sign in.
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(`${BASE_URL}/login`);
  await basePage.clickLoginButton();
  await expect(page).toHaveURL('https://authenticatie-accp.nijmegen.nl/broker/select/authn');

  //BSN Login via simulator and wait for page
  await simulatorPage.digidLogin(`${BASE_URL}`);
  await expect(page.getByText('Yivi persoonsgegevens laden via DigiD')).toBeVisible({ timeout: 6000 });
  await expect(basePage.qrCode).toBeVisible({ timeout: 6000 });

  await basePage.clickLogoutButton();
  await expect(page).toHaveURL(`${BASE_URL}/logout`);

});


test('Internet.nl', async ({ page }) => {

  const url = `https://internet.nl/site/${BASE_URL}`;

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