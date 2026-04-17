const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error));
    await page.goto('file:///c:/Users/sharv/OneDrive/Documents/OS/OS%20Simulation%20-%20Disk%20Scheduling/index.html');
    await page.click('#example-btn');
    console.log('Clicked example-btn');
    await page.click('#simulator-form > div.form-actions > button.btn.btn-primary');
    console.log('Clicked simulate');
    await new Promise(r => setTimeout(r, 2000));
    const items = await page.$$('.algo-card');
    console.log('Cards found:', items.length);
    await browser.close();
})();
