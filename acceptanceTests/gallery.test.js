'use strict'

const puppeteer = require('puppeteer')
const { configureToMatchImageSnapshot } = require('jest-image-snapshot')
const PuppeteerHar = require('puppeteer-har')
const shell = require('shelljs')

const width = 800
const height = 600
const delayMS = 5

let browser
let page
let har

// threshold is the difference in pixels before the snapshots dont match
const toMatchImageSnapshot = configureToMatchImageSnapshot({
	customDiffConfig: { threshold: 2 },
	noColors: true,
})
expect.extend({ toMatchImageSnapshot })

beforeAll( async() => {
	browser = await puppeteer.launch({ headless: true, slowMo: delayMS, args: [`--window-size=${width},${height}`] })
	page = await browser.newPage()
	har = new PuppeteerHar(page)
	await page.setViewport({ width, height })
	await shell.exec('acceptanceTests/scripts/beforeAll.sh')
})

afterAll( async() => {
	browser.close()
	await shell.exec('acceptanceTests/scripts/afterAll.sh')
})

beforeEach(async() => {
	await shell.exec('acceptanceTests/scripts/beforeEach.sh')
})

describe('AddItem', () => {
	test('Adding and item to gallery', async done => {
		//start generating a trace file.
		await page.tracing.start({path: 'trace/registering_user_har.json',screenshots: true})
		await har.start({path: 'trace/registering_user_trace.har'})
		//ARRANGE
		await page.goto('http://localhost:8080/register', { timeout: 30000, waitUntil: 'load' })
		//ACT
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=paypal]', 'paypalname')
		await page.type('input[name=email]', 'NewUser@gmail.com')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')

		await page.goto('http://localhost:8080/login', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')

		await page.goto('http://localhost:8080/addItem', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=title]', 'title test')
		await page.type('input[name=price]', '1')
		await page.type('input[name=shortDesc]', 'short desc')
		await page.type('input[name=longDesc]', 'a bigger desc')
		await page.click('input[type=submit]')

		//ASSERT
		//check that the user is taken to the homepage after attempting to login as the new user:
		await page.waitForSelector('div[class=title]')
		expect( await page.evaluate( () => document.querySelector('div[class=title]').innerText ) )
			.toBe('title test')

		// grab a screenshot
		const image = await page.screenshot()
		// compare to the screenshot from the previous test run
		expect(image).toMatchImageSnapshot()
		// stop logging to the trace files
		await page.tracing.stop()
		await har.stop()
		done()
	}, 16000)
})

describe('Editing the title', () => {
	test('Changing the title', async done => {
		//start generating a trace file.
		await page.tracing.start({path: 'trace/registering_user_har.json',screenshots: true})
		await har.start({path: 'trace/registering_user_trace.har'})
		//ARRANGE
		await page.goto('http://localhost:8080/register', { timeout: 30000, waitUntil: 'load' })
		//ACT
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=paypal]', 'paypalname')
		await page.type('input[name=email]', 'NewUser@gmail.com')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]') 

		await page.goto('http://localhost:8080/login', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')

		await page.goto('http://localhost:8080/addItem', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=title]', 'title test')
		await page.type('input[name=price]', '1')
		await page.type('input[name=shortDesc]', 'short desc')
		await page.type('input[name=longDesc]', 'a bigger desc')
		await page.click('input[type=submit]')

		await page.goto('http://localhost:8080/items/1/edit', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=title]', 'edited title')
		await page.click('input[type=submit]')

		await page.goto('http://localhost:8080/gallery', { timeout: 30000, waitUntil: 'load' })


		//ASSERT
		//check that the user is taken to the homepage after attempting to login as the new user:
		await page.waitForSelector('div[class=title]')
		expect( await page.evaluate( () => document.querySelector('div[class=title]').innerText ) )
			.toBe('edited title')

		// grab a screenshot
		const image = await page.screenshot()
		// compare to the screenshot from the previous test run
		expect(image).toMatchImageSnapshot()
		// stop logging to the trace files
		await page.tracing.stop()
		await har.stop()
		done()
	}, 16000)
})

describe('Search', () => {
	test('Searching known item on gallery page', async done => {
		//start generating a trace file.
		await page.tracing.start({path: 'trace/registering_user_har.json',screenshots: true})
		await har.start({path: 'trace/registering_user_trace.har'})
		//ARRANGE
		await page.goto('http://localhost:8080/register', { timeout: 30000, waitUntil: 'load' })
		//ACT
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=paypal]', 'paypalname')
		await page.type('input[name=email]', 'NewUser@gmail.com')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')

		await page.goto('http://localhost:8080/login', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')

		await page.goto('http://localhost:8080/addItem', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=title]', 'title test')
		await page.type('input[name=price]', '1')
		await page.type('input[name=shortDesc]', 'short desc')
		await page.type('input[name=longDesc]', 'a bigger desc')
		await page.click('input[type=submit]')
		await page.type('input[name=search]', 'a bigger desc')
		await page.click('input[type=submit]')

		//ASSERT
		//check that the user is taken to the homepage after attempting to login as the new user:
		await page.waitForSelector('div[class=title]')
		expect( await page.evaluate( () => document.querySelector('div[class=title]').innerText ) )
			.toBe('title test')

		// grab a screenshot
		const image = await page.screenshot()
		// compare to the screenshot from the previous test run
		expect(image).toMatchImageSnapshot()
		// stop logging to the trace files
		await page.tracing.stop()
		await har.stop()
		done()
	}, 16000)
})
