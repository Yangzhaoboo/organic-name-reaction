# 人名反应速查 · 有机化学

面向本科有机化学学生的**人名反应检索与复习**网页。中文界面、术语中英对照、手机优先。

- 首页：按人名 (中/英)、俗称、缩写、类型、官能团搜索 + 分类筛选
- 详情页：速查卡（反应式 / 条件 / 选择性 / 易错点）优先，机理与文献折叠
- 自测：答案遮挡，揭晓后自评「会 / 模糊 / 不会」，结果存本地
- 对比：最多 4 个反应并排，自动生成差异摘要
- 收藏 / 已学：存 localStorage，无需登录

## 快速开始

需要 Node.js 18+。

```bash
npm install
npm run dev        # 打开 http://localhost:5173
npm run build      # 产物在 dist/
npm run preview    # 本地预览构建结果
```

## 目录结构

```
name-reactions/
├─ public/
│  └─ schemes/            反应式图片（ChemDraw 导出的 png + svg）
├─ src/
│  ├─ data/
│  │  ├─ index.ts         自动收集 reactions/*.json
│  │  └─ reactions/       ★ 一个反应一个 JSON，加反应只需要往这里丢文件
│  ├─ components/         ReactionCard / SchemeView
│  ├─ pages/              Home / Detail / Compare / Quiz / Favorites
│  ├─ lib/                search / storage / router / ui
│  ├─ types.ts            Reaction 数据结构
│  └─ styles.css          全部样式（含移动端适配）
├─ tools/
│  ├─ schemes.json        ★ 反应式图配置：SMILES + 箭头上/下条件
│  ├─ build_schemes.py    SMILES → ChemDraw CDXML（自动排版）
│  ├─ export_schemes.ps1  CDXML → png/svg（调用本机 ChemDraw）
│  └─ shot.mjs            截图脚本（Playwright，自查用，可选）
└─ .github/workflows/deploy.yml   GitHub Pages 自动部署
```

## 加一个新反应

### 1. 加数据

复制 `src/data/reactions/` 里任意一个 JSON，改内容即可，文件名建议 `11-your-id.json`。
字段含义见 `src/data/reactions/01-friedel-crafts-alkylation.json` 的注释与下表。

| 字段 | 说明 |
| --- | --- |
| `id` | 英文小写 slug，**同时是图片文件名**，改了要同步改图片 |
| `name_zh` / `name_en` | 中英文名（小字副标题显示为「中文 · English」） |
| `title` | 卡片和详情页的大字标题，形如 `Wittig 反应`、`HWE 反应`；不填会从 `name_en` 自动推导 |
| `aliases_zh` / `aliases_en` | 俗称与缩写，**搜索能不能命中全靠它** |
| `category` | 必须是 `src/data/index.ts` 里 `CATEGORIES` 的取值之一 |
| `tags` | 官能团 / 关键词 |
| `difficulty` | 1–5 |
| `scheme_simple` | 纯文本反应式，图片加载失败时兜底 |
| `scheme_above` / `scheme_below` | 箭头上 / 下条件（画图用，也用于文字兜底） |
| `scheme_image` | `public/schemes/` 下的文件名（不含扩展名），留空则只显示文字 |
| `mechanism_steps` | 机理分步，字符串数组，一步一条 |
| `pitfalls` | 易错点，字符串数组 |
| `references` | 文献，字符串数组 |
| `status` | `verified` / `partial` / `todo` |
| `todo_fields` | 待核对字段名数组，会在详情页显示「待核对」清单 |

**数据纪律**：不确定的条件、产率、页码一律写「待核对」，并把字段名登记到 `todo_fields`。
界面会显示黄色提醒，不会假装确定。

### 2. 加反应式图

两种方式：

**A. 自动生成（推荐，日常用这个）**

1. 在 `tools/schemes.json` 里加一条：

```json
{
  "id": "your-id",
  "reactants": ["c1ccccc1", "CC(=O)Cl"],
  "above": "AlCl3 (excess)",
  "below": "CH2Cl2, 0 ~ 25 ℃",
  "products": ["CC(=O)c1ccccc1", "Cl"],
  "layout": "vertical"
}
```

2. 生成并导出（需要 Python + RDKit + 本机 ChemDraw）：

```bash
pip install rdkit pillow
python tools/build_schemes.py            # 只生成某一个：加 id 参数
powershell -ExecutionPolicy Bypass -File tools/export_schemes.ps1
```

3. `public/schemes/` 下会出现 `<id>.png` 与 `<id>.svg`。

`layout` 说明：

- `vertical`（默认）：反应物一行 → 向下箭头（条件在右侧）→ 产物一行，手机最友好
- `horizontal`：传统横排，窄反应式用
- `auto`：宽度超过 430pt 自动转竖排

**B. 自己用 ChemDraw 画**

1. 在 ChemDraw 里画好，存成 `tools/out/<id>.cdxml`
2. 跑 `tools/export_schemes.ps1` 批量导出

> 导出前请先关闭正在使用的 ChemDraw，避免和自动化实例抢文档。
> 若是手动调过版的文件，导出脚本不会重排，只做导出。

### 3. 调排版细节

`tools/build_schemes.py` 顶部常量：

```python
BL = 16.0    # 键长
SIZE = 10    # 字号
GAP = 24.0   # 加号两侧间距
PAD = 20.0   # 箭头两侧留白
```

箭头上下条件默认按**箭头中点居中**（ChemDraw 会忽略文本居中属性，脚本按实测文字宽度手动对中）。
条件文字比箭头长时箭头会自动加长。

## 部署到帽子云（Hatcloud）

帽子云可以直接读 GitHub 仓库，两种接法任选其一：

**方式 A：让帽子云自己构建（推荐）**

| 配置项 | 填写 |
| --- | --- |
| 仓库 | 你的 GitHub 仓库 |
| 分支 | `main` |
| 构建命令 | `npm install && npm run build` |
| 输出目录 | `dist` |
| Node 版本 | 18 或 20 |

**方式 B：仓库里已有构建好的 `dist/`，直接托管**

把「输出目录」设成 `dist`、构建命令留空即可（本仓库已提交 `dist/`，每次改完记得本地 `npm run build` 再提交）。

> `vite.config.ts` 里 `base: './'` 用的是相对路径，放在任何子目录/自定义域名下都能正常打开。
> 路由走 hash（`#/r/wittig-reaction`），刷新不会 404。

## 部署到 GitHub Pages

### 方式一：GitHub Actions（推荐）

1. 新建仓库，把整个项目推上去（`main` 分支）
2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
3. 之后每次 `git push` 都会自动构建部署，地址形如
   `https://<你的用户名>.github.io/<仓库名>/`

`vite.config.ts` 里 `base: './'` 已经处理好子路径问题，不用改。

### 方式二：手动上传 dist

```bash
npm run build
```

把 `dist/` 里的**全部内容**（含 `.nojekyll`）传到 Pages 分支根目录即可。
路由使用 hash（`#/r/wittig-reaction`），刷新不会 404。

## 常见问题

**搜索不到某个叫法**
把俗称加进 `aliases_zh`、缩写加进 `aliases_en`。搜索不区分大小写，且忽略空格和标点。

**反应式图不显示**
确认 `public/schemes/<id>.svg`（或 `.png`）存在，且 JSON 里 `scheme_image` 与文件名一致。
都缺失时会自动回退到 `scheme_simple` 的纯文本。

**条件文字里的数字变成下标**
ChemDraw 会做化学解释，`>1 eq` 里的 1 会被吃掉。建议写成 `excess` 或 `1.1 eq`，或把整段放进引号。

**想在手机上试**
`npm run dev -- --host` 后，用手机访问电脑局域网 IP。

## 数据来源与许可

示例数据整理自课程课件《有机合成化学》第二章（河南工业大学），条件与产率未逐条核对，标记为「待核对」。
正式发布前请按 `todo_fields` 逐条核对教材或原始文献。
