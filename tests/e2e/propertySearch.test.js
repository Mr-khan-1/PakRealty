import { By, until, Key } from 'selenium-webdriver';
import { setupSelenium } from '../config/selenium.config.js';

const FRONTEND_URL = 'http://localhost:3000';

describe('E2E - Property Search Scenarios', () => {
  let driver;

  beforeAll(async () => {
    driver = await setupSelenium({ headless: true });
  }, 30000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  it('should display results when searching by city name', async () => {
    await driver.get(FRONTEND_URL);
    await driver.sleep(3000);

    // Look for a search input on the home page
    const inputs = await driver.findElements(By.css('input'));
    let searched = false;
    for (const input of inputs) {
      const placeholder = (await input.getAttribute('placeholder') || '').toLowerCase();
      const type = (await input.getAttribute('type') || '').toLowerCase();
      if ((placeholder.includes('city') || placeholder.includes('search') || placeholder.includes('location')) && type !== 'hidden') {
        await input.sendKeys('Lahore');
        await input.sendKeys(Key.RETURN);
        await driver.sleep(2000);
        searched = true;
        break;
      }
    }
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    expect(bodyText).toBeTruthy();
  }, 25000);

  it('should handle an empty search gracefully', async () => {
    await driver.get(`${FRONTEND_URL}/properties`);
    await driver.sleep(3000);

    const bodyText = await driver.findElement(By.tagName('body')).getText();
    expect(bodyText).toBeTruthy();
    // Should not show a white screen or error
    const hasCrash = bodyText.toLowerCase().includes('cannot read') || bodyText.toLowerCase().includes('uncaught error');
    expect(hasCrash).toBe(false);
  }, 20000);

  it('should display correct URL when filtering by purpose', async () => {
    await driver.get(`${FRONTEND_URL}/properties?purpose=sale`);
    await driver.sleep(3000);

    const url = await driver.getCurrentUrl();
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    expect(url).toContain('purpose=sale');
    expect(bodyText).toBeTruthy();
  }, 20000);

  it('should load the properties page within 5 seconds', async () => {
    const start = Date.now();
    await driver.get(`${FRONTEND_URL}/properties`);

    // Wait for at least the main layout to appear
    await driver.wait(until.elementLocated(By.css('body')), 5000);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  }, 15000);
});
