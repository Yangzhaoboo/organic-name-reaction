// 把 dist 打包成「单文件版」：JS/CSS 内联进 index.html，只保留 schemes 图片
// 用途：某些静态托管对 /assets 子目录处理异常时，单文件版更稳
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const out = 'dist-single'

const html = readFileSync(join(dist, 'index.html'), 'utf8')
const jsName = html.match(/src="\.\/assets\/([^"]+\.js)"/)?.[1]
const cssName = html.match(/href="\.\/assets\/([^"]+\.css)"/)?.[1]

if (!jsName) throw new Error('没找到 JS 入口，先跑 npm run build')

const js = readFileSync(join(dist, 'assets', jsName), 'utf8')
const css = cssName ? readFileSync(join(dist, 'assets', cssName), 'utf8') : ''

// 关键：包里的 JS 可能含有 "</script>" 或 "<!--"，直接内联会让 HTML 提前结束，
// 浏览器就把剩下的 JS 当正文显示出来（表现为满屏乱码）。
const safeJs = js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--')
const safeCss = css.replace(/<\/style/gi, '<\\/style')

let outHtml = html
  .replace(
    /<script type="module"[^>]*src="\.\/assets\/[^"]+"><\/script>/,
    () => `<script type="module">\n${safeJs}\n</script>`
  )
  .replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/[^"]+">/, () => `<style>\n${safeCss}\n</style>`)

// 检查一下内联是否成功（失败时页面会白屏）
if (!outHtml.includes('createRoot') && !outHtml.includes('react')) {
  throw new Error('内联失败：index.html 里没有找到打包后的 JS')
}
if (outHtml.includes('src="./assets/')) {
  throw new Error('内联失败：仍然引用了外部 assets')
}

if (existsSync(out)) rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'index.html'), outHtml, 'utf8')
writeFileSync(join(out, '.nojekyll'), '', 'utf8')

// 图片目录整体搬过去
if (existsSync(join(dist, 'schemes'))) cpSync(join(dist, 'schemes'), join(out, 'schemes'), { recursive: true })

const size = (readFileSync(join(out, 'index.html')).length / 1024).toFixed(0)
console.log(`dist-single/index.html  ${size} KB（已内联 JS+CSS）`)
console.log('schemes:', readdirSync(join(out, 'schemes')).length, '个文件')
