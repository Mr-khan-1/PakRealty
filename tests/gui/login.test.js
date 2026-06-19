import { By, until } from 'selenium-webdriver';
import { setupSelenium } from '../config/selenium.config.js';

describe('GUI Login Tests', () => {
  let driver;
  const FRONTEND_URL = 'http://localhost:3000'; // Assuming frontend runs on 3000 during test

  beforeAll(async () => {
    // Setup Selenium in headless mode for CI/CD
    driver = await setupSelenium({ headless: true });
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should display the login page with all required elements', async () => {
    await driver.get(`${FRONTEND_URL}/login`);
    
    const emailInput = await driver.findElement(By.id('email'));
    const passwordInput = await driver.findElement(By.id('password'));
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));

    expect(await emailInput.isDisplayed()).toBe(true);
    expect(await passwordInput.isDisplayed()).toBe(true);
    expect(await submitBtn.isDisplayed()).toBe(true);
  });

  it('should show error toast on invalid credentials', async () => {
    await driver.get(`${FRONTEND_URL}/login`);
    
    await driver.findElement(By.id('email')).sendKeys('wrong@example.com');
    await driver.findElement(By.id('password')).sendKeys('WrongPass1!');
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Wait for the toast notification to appear
    const toast = await driver.wait(
      until.elementLocated(By.className('go3958317564')), // Default react-hot-toast class
      5000
    );
    
    const toastText = await toast.getText();
    expect(toastText).toContain('Invalid email or password');
  });
});
