import * as core from '@actions/core';
import { chromium, firefox, webkit, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface TestConfig {
  url: string;
  testDuration: number;
  browser: string;
  mcpServer: string;
  screenshotPath: string;
  maxActions: number;
  actionDelay: number;
}

interface TestResult {
  screenshotCount: number;
  actionsPerformed: number;
  errorsFound: number;
  summary: string;
}

class MonkeyTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: TestConfig;
  private screenshotCount = 0;
  private actionsPerformed = 0;
  private errorsFound = 0;
  private errors: string[] = [];

  constructor(config: TestConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    core.info('Initializing browser...');
    
    // Create screenshot directory
    if (!fs.existsSync(this.config.screenshotPath)) {
      fs.mkdirSync(this.config.screenshotPath, { recursive: true });
    }

    // Launch browser
    switch (this.config.browser.toLowerCase()) {
      case 'firefox':
        this.browser = await firefox.launch({ headless: true });
        break;
      case 'webkit':
        this.browser = await webkit.launch({ headless: true });
        break;
      default:
        this.browser = await chromium.launch({ headless: true });
    }

    this.page = await this.browser.newPage();
    
    // Set up error handling
    this.page.on('pageerror', (error) => {
      this.errorsFound++;
      this.errors.push(`Page error: ${error.message}`);
      core.warning(`Page error detected: ${error.message}`);
    });

    this.page.on('response', (response) => {
      if (response.status() >= 400) {
        this.errorsFound++;
        this.errors.push(`HTTP error: ${response.status()} ${response.url()}`);
        core.warning(`HTTP error: ${response.status()} ${response.url()}`);
      }
    });
  }

  async navigateToUrl(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    core.info(`Navigating to ${this.config.url}...`);
    await this.page.goto(this.config.url, { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    await this.takeScreenshot('initial');
  }

  async performMonkeyTest(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = Date.now();
    const duration = this.config.testDuration * 60 * 1000; // Convert to milliseconds
    
    core.info(`Starting monkey test for ${this.config.testDuration} minutes...`);

    while (Date.now() - startTime < duration && this.actionsPerformed < this.config.maxActions) {
      try {
        await this.performRandomAction();
        this.actionsPerformed++;
        
        // Wait between actions
        await this.page.waitForTimeout(this.config.actionDelay);
        
        // Take periodic screenshots
        if (this.actionsPerformed % 10 === 0) {
          await this.takeScreenshot(`action-${this.actionsPerformed}`);
        }
        
      } catch (error) {
        this.errorsFound++;
        this.errors.push(`Action error: ${error instanceof Error ? error.message : String(error)}`);
        core.warning(`Error during action: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Take final screenshot
    await this.takeScreenshot('final');
  }

  async performRandomAction(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    // Get all interactive elements
    const elements = await this.page.$$eval('button, a, input, select, textarea, [onclick], [role="button"]', 
      elements => elements.map((el, index) => ({
        index,
        tagName: el.tagName,
        type: (el as any).type || '',
        visible: el.offsetWidth > 0 && el.offsetHeight > 0,
        disabled: (el as any).disabled || false
      }))
    );

    const interactiveElements = elements.filter(el => el.visible && !el.disabled);
    
    if (interactiveElements.length === 0) {
      // If no interactive elements, scroll randomly
      await this.randomScroll();
      return;
    }

    // Pick a random element
    const randomElement = interactiveElements[Math.floor(Math.random() * interactiveElements.length)];
    const selector = `${randomElement.tagName.toLowerCase()}:nth-of-type(${randomElement.index + 1})`;

    // Perform random action based on element type
    try {
      if (randomElement.tagName === 'INPUT') {
        await this.handleInputElement(selector, randomElement.type);
      } else if (randomElement.tagName === 'SELECT') {
        await this.handleSelectElement(selector);
      } else if (randomElement.tagName === 'TEXTAREA') {
        await this.handleTextareaElement(selector);
      } else {
        // Click for buttons, links, etc.
        await this.page.click(selector);
        core.debug(`Clicked element: ${selector}`);
      }
    } catch (error) {
      // Element might have become stale, try scrolling instead
      await this.randomScroll();
    }
  }

  async handleInputElement(selector: string, type: string): Promise<void> {
    if (!this.page) return;

    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'search':
        const testText = this.generateRandomText();
        await this.page.fill(selector, testText);
        core.debug(`Filled input with: ${testText}`);
        break;
      case 'checkbox':
      case 'radio':
        await this.page.click(selector);
        core.debug(`Clicked checkbox/radio: ${selector}`);
        break;
      case 'submit':
      case 'button':
        await this.page.click(selector);
        core.debug(`Clicked submit/button: ${selector}`);
        break;
      default:
        await this.page.click(selector);
        core.debug(`Clicked input: ${selector}`);
    }
  }

  async handleSelectElement(selector: string): Promise<void> {
    if (!this.page) return;

    const options = await this.page.$$eval(`${selector} option`, options => 
      options.map(option => option.value).filter(value => value)
    );

    if (options.length > 0) {
      const randomOption = options[Math.floor(Math.random() * options.length)];
      await this.page.selectOption(selector, randomOption);
      core.debug(`Selected option: ${randomOption}`);
    }
  }

  async handleTextareaElement(selector: string): Promise<void> {
    if (!this.page) return;

    const testText = this.generateRandomText(50);
    await this.page.fill(selector, testText);
    core.debug(`Filled textarea with: ${testText.substring(0, 30)}...`);
  }

  async randomScroll(): Promise<void> {
    if (!this.page) return;

    const scrollDirection = Math.random() > 0.5 ? 1 : -1;
    const scrollAmount = Math.floor(Math.random() * 500) + 100;
    
    await this.page.evaluate(({direction, amount}: {direction: number, amount: number}) => {
      // @ts-ignore
      window.scrollBy(0, direction * amount);
    }, {direction: scrollDirection, amount: scrollAmount});
    
    core.debug(`Scrolled ${scrollDirection > 0 ? 'down' : 'up'} by ${scrollAmount}px`);
  }

  generateRandomText(maxLength = 20): string {
    const words = ['test', 'example', 'demo', 'sample', 'monkey', 'action', 'playwright', 'random'];
    const numWords = Math.floor(Math.random() * 3) + 1;
    const selectedWords = [];
    
    for (let i = 0; i < numWords; i++) {
      selectedWords.push(words[Math.floor(Math.random() * words.length)]);
    }
    
    return selectedWords.join(' ').substring(0, maxLength);
  }

  async takeScreenshot(name: string): Promise<void> {
    if (!this.page) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(this.config.screenshotPath, filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    this.screenshotCount++;
    
    core.info(`Screenshot saved: ${filename}`);
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  getResults(): TestResult {
    return {
      screenshotCount: this.screenshotCount,
      actionsPerformed: this.actionsPerformed,
      errorsFound: this.errorsFound,
      summary: `Performed ${this.actionsPerformed} actions, captured ${this.screenshotCount} screenshots, found ${this.errorsFound} errors`
    };
  }

  getErrors(): string[] {
    return this.errors;
  }
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const config: TestConfig = {
      url: core.getInput('url', { required: true }),
      testDuration: parseInt(core.getInput('test-duration') || '5'),
      browser: core.getInput('browser') || 'chromium',
      mcpServer: core.getInput('mcp-server') || '',
      screenshotPath: core.getInput('screenshot-path') || './screenshots',
      maxActions: parseInt(core.getInput('max-actions') || '100'),
      actionDelay: parseInt(core.getInput('action-delay') || '1000')
    };

    core.info('Starting Playwright MCP Monkey Test...');
    core.info(`Target URL: ${config.url}`);
    core.info(`Test Duration: ${config.testDuration} minutes`);
    core.info(`Browser: ${config.browser}`);
    core.info(`Max Actions: ${config.maxActions}`);

    // Initialize and run monkey test
    const tester = new MonkeyTester(config);
    
    await tester.initialize();
    await tester.navigateToUrl();
    await tester.performMonkeyTest();
    
    const results = tester.getResults();
    const errors = tester.getErrors();
    
    // Set outputs
    core.setOutput('screenshot-count', results.screenshotCount.toString());
    core.setOutput('test-result', results.summary);
    core.setOutput('errors-found', results.errorsFound.toString());
    
    // Log results
    core.info('=== Test Results ===');
    core.info(results.summary);
    
    if (errors.length > 0) {
      core.warning('Errors encountered during testing:');
      errors.forEach(error => core.warning(`- ${error}`));
    }
    
    await tester.cleanup();
    
    core.info('Monkey test completed successfully!');
    
  } catch (error) {
    core.setFailed(`Action failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// MCP Integration placeholder
async function mcpIntegration(server: string, testResults: TestResult): Promise<void> {
  if (!server) {
    core.info('No MCP server specified, skipping MCP integration');
    return;
  }
  
  core.info(`MCP integration with server: ${server}`);
  // TODO: Implement MCP protocol communication
  // This would involve sending test results and screenshots to the MCP server
  // for AI analysis and feedback
}

run();