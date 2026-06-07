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
- `pages/trials-market.html`：临床试验雷达、全球批准和市场
- `pages/guidance.html`：指南与诊疗路径

## 手动更新数据

Windows 用户可以直接双击 `update-data.bat`。

也可以在 PowerShell 中运行：

```powershell
node scripts/update-data.mjs
```

脚本会从 PubMed 和 FDA RSS 拉取公开数据，并保留 CDE/NMPA、ClinicalTrials.gov、会议摘要等核心入口。发布到 GitHub 后，`.github/workflows/update-data.yml` 会每天自动运行一次。

## 近 24 小时研究摘要

`data/latest-research.json` 保存 PubMed 过去 24 小时内新上线或更新的 MG 文献摘要。自动任务每天运行一次；如果在 GitHub 仓库 Settings -> Secrets and variables -> Actions 中配置 `OPENAI_API_KEY`，脚本会自动生成中文摘要和中文要点。未配置密钥时，网站仍会显示新文献、英文摘要和“等待中文摘要”状态。

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

`data/trial-radar.json` 保存 ClinicalTrials.gov 自动抓取的 MG 临床试验雷达。`scripts/update-data.mjs` 每次运行都会从 ClinicalTrials.gov v2 API 刷新最新 30 项研究，并按机制分类。

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
