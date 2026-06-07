# 重症肌无力信息中枢

这是一个零代码友好的静态网站，用来汇总重症肌无力相关的 PubMed 文献、研发动态、会议摘要、FDA 与 CDE/NMPA 信息入口。

## 本地预览

Windows 用户可以直接双击 `start-local.bat`，然后打开显示出来的网址。

也可以在 PowerShell 中运行：

```powershell
node scripts/serve.mjs
```

打开输出里的地址，通常是 `http://localhost:4173`。

## 页面结构

网站已拆成多页面，便于后续维护：

- `index.html`：首页仪表盘
- `pages/research/index.html`：最新研究、中国研究者和信息流
- `pages/therapy.html`：治疗图谱和药物证据矩阵
- `pages/safety.html`：安全性与上市后监测
- `pages/china-access.html`：中国准入与商业化
- `pages/trials-market.html`：临床试验雷达、全球批准和市场
- `pages/guidance.html`：指南与诊疗路径
- `pages/data-status.html`：数据更新状态与人工复核队列

## 手动更新数据

Windows 用户可以直接双击 `update-data.bat`。

也可以在 PowerShell 中运行：

```powershell
node scripts/update-data.mjs
```

脚本会从 PubMed 和 FDA RSS 拉取公开数据，并保留 CDE/NMPA、ClinicalTrials.gov、会议摘要等核心入口。发布到 GitHub 后，`.github/workflows/update-data.yml` 会每天自动运行一次。

### 自动更新策略

当前自动更新分成三层：

- 每日自动更新：PubMed 信息流、近 7 天研究摘要、中国机构相关研究、FDA RSS 命中条目、ClinicalTrials.gov 试验雷达。
- 人工复核来源：ChiCTR 中国临床试验注册中心先作为中国本土注册试验入口和重点条目保留；官网如需验证时不做强自动抓取。
- 自动记录状态：每次运行都会写入 `data/update-status.json`，记录更新时间、更新范围、各来源成功/失败状态和输出条数。
- 人工复核更新：全球批准、中国准入、医保/医院准入、销售额、指南路径、安全性结论等仍需人工复核后更新，避免自动脚本误改高风险字段。

`pages/data-status.html` 会读取 `data/update-status.json` 展示自动更新状态，并根据各模块的 `reviewStatus`、来源类型和 ChiCTR 条目自动生成“人工复核队列”。这个页面建议作为日常质量控制入口：先看是否有数据源失败，再处理监管批准、市场销售额、安全性信号和证据矩阵等高优先级复核项。

容错规则：任一外部来源失败时，脚本会保留该来源上一版数据，并在 `update-status.json` 标记失败；不会把页面对应板块清空。

GitHub Actions 支持手动选择更新范围：`all`、`literature`、`latest`、`feed`、`china`、`trials`。日常定时任务默认运行 `all`。

自动任务还会运行 `npm run health:data` 做数据健康检查：确认关键 JSON 非空、自动来源全部成功、`update-status.json` 有输出记录、近 7 天研究摘要存在、ClinicalTrials.gov 与 ChiCTR 条目保留，并对 OpenAI 中文摘要缺失或更新过旧等情况给出 warning。`.github/workflows/health-check.yml` 会每周一单独运行一次同样的健康检查，不改写数据，只用于巡检。

## 近 7 天研究摘要

`data/latest-research.json` 保存 PubMed 过去 7 天内新上线或更新的 MG 文献摘要。自动任务每天运行一次；如果在 GitHub 仓库 Settings -> Secrets and variables -> Actions 中配置 `OPENAI_API_KEY`，脚本会自动生成中文摘要和中文要点。未配置密钥时，网站仍会显示新文献、英文摘要和“等待中文摘要”状态。

配置 `OPENAI_API_KEY` 后，近 7 天研究会按医学情报格式结构化：中文摘要、3-4 条要点、研究类型、研究对象、关键发现、对 MG 临床/研发/安全监测/准入的意义，以及需要人工复核的重点。中文内容仅作为阅读辅助，正式判断仍需回到英文摘要、全文和原始来源。

## 数据来源与人工复核标签

每个主要数据文件都带有 `provenance` 字段，页面会把它显示成小标签：

- `sourceType`：数据来源类型，例如 PubMed、ClinicalTrials.gov、监管文件、财报或人工整理。
- `evidenceLevel`：证据层级或信息性质，例如文献摘要、试验登记、人工证据矩阵、市场情报。
- `reviewStatus`：复核状态，例如自动更新、部分核查、人工整理、需定期复核。
- `lastChecked`：最近核查日期。
- `reviewNote`：复核备注，用来提醒哪些结论必须回到原始链接确认。

建议人工复核优先级：监管批准和适应症文本 > 销售额/财报口径 > 上市后安全性信号 > 会议摘要和媒体转载。每次人工核查后，更新对应 JSON 文件里的 `provenance.lastChecked` 和 `reviewStatus`。

## 治疗图谱

`data/treatments.json` 保存已获批 MG/gMG 治疗药物、作用机制、关键证据、真实世界研究状态和上市后安全性监测入口。当前第一版以 FDA 可核验批准药物为核心，并预留 EMA、NMPA/CDE 字段。

## 安全性与上市后监测

`pages/safety.html` 会从 `data/treatments.json` 自动读取 `postMarketing`、`safetySignals` 和药品标签/openFDA/FAERS 链接，形成独立的安全监测页。该页面用于信号追踪和人工复核，不把自发报告数据库中的报告数量解释为发生率，也不单独判断药物因果关系。

## 中国准入与商业化

`pages/china-access.html` 会从 `data/global-market.json` 中筛选中国/NMPA 批准记录，并联动 `data/evidence-matrix.json` 的 `chinaAccess` 字段，形成中国获批产品、适应症文本、企业、销售口径和准入复核清单。销售额需区分全球产品级、中国市场和 MG 单适应症口径。

## 中国研究者发表研究

`data/china-research.json` 保存中国研究者/中国机构相关的 MG 研究。自动更新脚本使用 PubMed 检索：

```text
("myasthenia gravis"[Title/Abstract] OR "generalized myasthenia gravis"[Title/Abstract] OR "ocular myasthenia"[Title/Abstract])
AND (China[Affiliation] OR Chinese[Affiliation] OR "Hong Kong"[Affiliation] OR Taiwan[Affiliation] OR Macau[Affiliation])
```

这个规则用机构字段透明识别“中国相关研究”，避免只凭作者姓名主观判断。

## 全球批准与市场

`data/global-market.json` 保存 MG/gMG 相关核心靶向/生物制剂的主要获批国家或地区、批准机构、批准时间、适应症和公开销售额。销售额字段会标注口径：部分公司只披露产品级销售额，未拆分 MG 单适应症。

## 指南、证据矩阵和临床试验雷达

`data/guidance-pathways.json` 保存指南/诊疗路径对照，用于把初诊分型、对症治疗、传统免疫治疗、靶向药升级、危象救援和准入可及性组织成决策路径。

`data/evidence-matrix.json` 保存药物证据矩阵，用于横向比较关键 RCT、长期数据、真实世界证据、安全性重点和中国可及性。

`data/trial-radar.json` 保存 ClinicalTrials.gov 自动抓取的 MG 临床试验雷达，并保留 ChiCTR 中国临床试验注册中心入口/人工复核条目。`scripts/update-data.mjs` 每次运行都会从 ClinicalTrials.gov v2 API 刷新最新 30 项研究，并合并保留 ChiCTR 条目，按机制和来源分类。

## 发布到全网

1. 新建一个 GitHub 仓库，或使用 GitHub CLI 创建仓库。
2. 把本文件夹推送到 GitHub。
3. 在 GitHub Pages 中选择从 `gh-pages` 分支 `/root` 发布。
4. 若需要中文摘要自动生成，在 GitHub 仓库 Settings -> Secrets and variables -> Actions 中添加 `OPENAI_API_KEY`。

## 后续可扩展

- 增加企业新闻 RSS 或新闻源。
- 增加会议摘要专页。
- 增加 CDE/NMPA 药物关键词监控。
- 增加邮件/微信提醒。
