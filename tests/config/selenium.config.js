import { Builder, Browser } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

export const setupSelenium = async (options = {}) => {
  const { headless = true, implicitWait = 10000, pageLoadTimeout = 30000 } = options;

  let chromeOptions = new chrome.Options();
  if (headless) {
    chromeOptions.addArguments('--headless=new');
  }
  chromeOptions.addArguments('--disable-gpu');
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
    .build();

  await driver.manage().setTimeouts({
    implicit: implicitWait,
    pageLoad: pageLoadTimeout
  });

  return driver;
};
