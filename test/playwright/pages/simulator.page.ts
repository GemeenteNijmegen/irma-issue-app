import { expect, type Page } from '@playwright/test';

export class SimulatorPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async digidLogin(waitForUrl?: string, testBsn?: string) {
    testBsn = testBsn ?? '900026236';
    // Click Simulator
    await this.page.getByText('Simulator').click();
    await expect(this.page).toHaveURL('https://authenticatie-accp.nijmegen.nl/broker/authn/simulator/selection');

    // Click DigiD >> nth=0
    await this.page.getByText('DigiD').first().click();
    await expect(this.page).toHaveURL('https://authenticatie-accp.nijmegen.nl/broker/authn/simulator/authenticate/digid');

    // Fill input[name="bsn"]
    await this.page.locator('input[name="bsn"]').fill(testBsn);

    // Click send button
    await this.page.locator('[data-test="send-button"]').click();

    if (waitForUrl) {
      await expect(this.page).toHaveURL(waitForUrl);
    }
  }

  async eherkenningLogin(waitForUrl?: string, testKvk?: string) {
    testKvk = testKvk ?? '69599084';
    // Click Simulator
    await this.page.getByText('Simulator').click();
    await expect(this.page).toHaveURL('https://authenticatie-accp.nijmegen.nl/broker/authn/simulator/selection');

    // Click DigiD >> nth=0
    await this.page.getByText('eHerkenning').first().click();
    await expect(this.page).toHaveURL('https://authenticatie-accp.nijmegen.nl/broker/authn/simulator/authenticate/eh');

    // Fill input[name="bsn"]
    await this.page.locator('input[name="entityConcernedIdKvKnr"]').fill(testKvk);

    // Click send button
    await this.page.locator('[data-test="authenticate-button"]').click();

    if (waitForUrl) {
      await expect(this.page).toHaveURL(waitForUrl);
    }
  }
}
