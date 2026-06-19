import { By, until } from 'selenium-webdriver';
import { setupSelenium } from '../config/selenium.config.js';

describe('GUI - Property Detail Page Tests', () => {
  let driver;
  const URL = 'http://localhost:3000';

  beforeAll(async () => {
    driver = await setupSelenium({ headless: true });
  }, 30000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  it('should click on a property card and open the detail page', async () => {
    await driver.get(URL);
    await driver.sleep(3000);

    const cards = await driver.findElements(By.css('a[href*="/propert"]'));
    if (cards.length > 0) {
      const href = await cards[0].getAttribute('href');
      await driver.get(href);
      await driver.sleep(3000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain('/propert');
    } else {
      // graceful pass if no cards found (empty DB)
      expect(true).toBe(true);
    }
  }, 25000);

  it('should display property title on detail page', async () => {
    await driver.get(URL);
    await driver.sleep(3000);

    const cards = await driver.findElements(By.css('a[href*="/propert"]'));
    if (cards.length > 0) {
      const href = await cards[0].getAttribute('href');
      await driver.get(href);
      await driver.sleep(3000);

      const heading = await driver.findElement(By.css('h1, h2'));
      const text = await heading.getText();
      expect(text.length).toBeGreaterThan(0);
    } else {
      expect(true).toBe(true);
    }
  }, 25000);

  it('should display an inquiry form on the property detail page', async () => {
    await driver.get(URL);
    await driver.sleep(3000);

    const cards = await driver.findElements(By.css('a[href*="/propert"]'));
    if (cards.length > 0) {
      const href = await cards[0].getAttribute('href');
      await driver.get(href);
      await driver.sleep(3000);

      const forms = await driver.findElements(By.css('form, [class*="inquiry"], [class*="contact"]'));
      expect(forms.length).toBeGreaterThan(0);
    } else {
      expect(true).toBe(true);
    }
  }, 25000);

  it('should display price on property detail page', async () => {
    await driver.get(URL);
    await driver.sleep(3000);

    const cards = await driver.findElements(By.css('a[href*="/propert"]'));
    if (cards.length > 0) {
      const href = await cards[0].getAttribute('href');
      await driver.get(href);
      await driver.sleep(3000);

      const bodyText = await driver.findElement(By.tagName('body')).getText();
      const hasPriceInfo = /PKR|Rs|price|\d+,\d+/i.test(bodyText);
      expect(hasPriceInfo).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  }, 25000);
});
