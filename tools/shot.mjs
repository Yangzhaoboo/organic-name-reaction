import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://127.0.0.1:4321'
const OUT = 'shots'

const browser = await chromium.launch({ channel: 'msedge' })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
})
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

async function shot(path, file, full = false) {
  await page.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: full })
  console.log('shot', file, path)
}

await shot('/', '01-home', true)
await shot('/r/wittig-reaction', '02-detail', true)
await shot('/compare', '03-compare-empty')
await shot('/quiz', '04-quiz')
await shot('/fav', '05-fav')

// 对比页：先写入 localStorage 再刷新（同 URL 只改 hash 不会重新加载）
await page.goto(`${BASE}/#/compare`, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.setItem(
    'nrs.compare',
    JSON.stringify(['friedel-crafts-alkylation', 'baeyer-villiger-oxidation', 'wittig-reaction'])
  )
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/06-compare-two.png`, fullPage: true })

// 详情页折叠展开
await page.goto(`${BASE}/#/r/beckmann-rearrangement`, { waitUntil: 'networkidle' })
await page.locator('details summary').first().click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/07-detail-open.png`, fullPage: true })

// 自测：显示答案
await page.goto(`${BASE}/#/quiz`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '显示答案' }).click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/08-quiz-revealed.png` })

console.log('console errors:', errors.length ? errors : 'none')
await browser.close()
