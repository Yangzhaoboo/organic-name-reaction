import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:5174'
const OUT = 'shots'

const browser = await chromium.launch({ channel: 'msedge' })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
})
const page = await ctx.newPage()

async function view(path, file, actions) {
  await page.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(350)
  if (actions) await actions()
  await page.screenshot({ path: `${OUT}/${file}.png` })
  console.log('shot', file)
}

await view('/', 'p1-home')
await view('/r/wittig-reaction', 'p2-detail')
await view('/quiz', 'p3-quiz', async () => {
  await page.getByRole('button', { name: '显示答案' }).click()
  await page.waitForTimeout(250)
})

// 对比：写入 3 个反应后刷新
await page.goto(`${BASE}/#/compare`, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.setItem(
    'nrs.compare',
    JSON.stringify(['friedel-crafts-alkylation', 'wittig-reaction', 'beckmann-rearrangement'])
  )
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/p4-compare.png` })
console.log('shot p4-compare')

await browser.close()
