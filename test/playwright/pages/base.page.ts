import { type Locator, type Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly qrCode: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.locator('.digid.button');
    this.logoutButton = page.locator('a.button.secondary');
    this.qrCode = page.locator('canvas.yivi-web-qr-canvas');;
  }

  async clickLoginButton() {
    await this.loginButton.click();
  }

  async clickLogoutButton() {
    await this.logoutButton.click();
  }

}
