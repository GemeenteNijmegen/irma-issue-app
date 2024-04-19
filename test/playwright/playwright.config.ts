import { PlaywrightTestConfig } from '@playwright/test';

const localProjects: any = [
  // Config for running tests in local
  // {
  //   name: "chrome",
  //   use: {
  //     browserName: "chromium",
  //     channel: "chrome",
  //   },
  // },
  // {
  //   name: "safari",
  //   use: {
  //     browserName: "webkit",
  //     viewport: { width: 1200, height: 750 },
  //   },
  // },
  {
    name: 'firefox',
    use: {
      browserName: 'firefox',
      viewport: { width: 1625, height: 1240 },
      httpCredentials: {
        username: 'nijmegen',
        password: 'nijmegen',
      },
    },
  },
];

const lambdaTestProjects: any = [
  // -- LambdaTest Config --
  // name in the format: browserName:browserVersion:platform@lambdatest
  // Browsers allowed: `Chrome`, `MicrosoftEdge`, `pw-chromium`, `pw-firefox` and `pw-webkit`
  // Use additional configuration options provided by Playwright if required: https://playwright.dev/docs/api/class-testconfig
  {
    name: 'chrome:latest:MacOS Ventura@lambdatest',
    use: {
      viewport: { width: 1920, height: 1080 },
      httpCredentials: {
        username: 'nijmegen',
        password: 'nijmegen',
      },
    },
  },
  // {
  //   name: "chrome:latest:Windows 11@lambdatest",
  //   use: {
  //     viewport: { width: 1280, height: 720 },
  //   },
  // },
  // {
  //   name: "MicrosoftEdge:109:MacOS Ventura@lambdatest",
  //   use: {
  //     ...devices["iPhone 12 Pro Max"],
  //   },
  // },
  // {
  //   name: "pw-firefox:latest:Windows 11@lambdatest",
  //   use: {
  //     viewport: { width: 1280, height: 720 },
  //   },
  // },
  // {
  //   name: "pw-webkit:latest:Windows 10@lambdatest",
  //   use: {
  //     viewport: { width: 1920, height: 1080 },
  //   },
  // },
];

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'https://app6-accp.nijmegen.nl',
  },
  reporter: process.env.CI ? 'line' : [['html', { outputFolder: 'tests/report' }]],
  workers: process.env.CI ? 1: undefined,
  projects: (process.env?.LT_USERNAME && process.env?.LT_ACCESS_KEY) ? lambdaTestProjects : localProjects,
};

export default config;
