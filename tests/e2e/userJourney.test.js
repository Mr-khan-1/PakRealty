import { By, until } from 'selenium-webdriver';
import { setupSelenium } from '../config/selenium.config.js';

describe('E2E User Journey', () => {
  let driver;
  const FRONTEND_URL = 'http://localhost:3000';

  beforeAll(async () => {
    driver = await setupSelenium({ headless: true });
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('Scenario 1: Full flow from Home to Property Details', async () => {
    // 1. Visit homepage
    await driver.get(`${FRONTEND_URL}`);
    
    // 2. Wait for Properties grid to load
    await driver.wait(until.elementLocated(By.className('properties-grid')), 10000);

    // 3. Find the first property card and click it
    const firstPropertyCards = await driver.findElements(By.css('.properties-grid > div'));
    expect(firstPropertyCards.length).toBeGreaterThan(0);
    
    // We get the property title before clicking
    const titleElement = await firstPropertyCards[0].findElement(By.css('h3'));
    const propertyTitle = await titleElement.getText();

    await firstPropertyCards[0].click();

    // 4. Wait for detail page to load by checking if the title matches
    const detailTitle = await driver.wait(
      until.elementLocated(By.css('h1')),
      10000
    );
    expect(await detailTitle.getText()).toContain(propertyTitle);

    // 5. Verify the Inquiry form exists on the right side
    const inquiryForm = await driver.findElement(By.css('form'));
    expect(await inquiryForm.isDisplayed()).toBe(true);
  });
});
