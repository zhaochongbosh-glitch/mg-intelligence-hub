# 人工复核 SOP

本 SOP 用于维护重症肌无力信息港中的人工整理数据。目标是让监管、市场、安全性、指南和本土试验信息可追溯、可复核、可持续更新。

## 复核原则

- 原始来源优先：监管批准、适应症、标签、安全性、销售额和试验状态必须回到原始网站、正式文件、财报或论文确认。
- 结论克制：页面文字只描述已核查事实，不把自发报告解释为发生率，不把注册试验解释为疗效证据。
- 口径透明：销售额需说明全球产品级、中国市场、MG 单适应症或未拆分口径。
- 保留链接：每次复核至少记录一个可打开的原始来源链接。
- 记录不确定性：无法确认的字段标记为“待复核”或“未公开披露”，不要猜测。

## 每周复核顺序

1. 数据状态页
   - 打开 `pages/data-status.html`，确认自动来源是否成功。
   - 如果 `latest-research`、`pubmed-feed`、`clinical-trials`、`fda-rss` 或 `china-research` 失败，先检查 GitHub Actions 日志。

2. 近 7 天研究摘要
   - 查看是否有 `translationStatus: pending` 或 `error`。
   - 对重要研究打开 PubMed 摘要，确认研究类型、样本、人群、终点、主要结论和限制。
   - 若中文情报摘要与英文摘要不一致，人工修订 `data/latest-research.json` 对应条目，并记录到 `data/manual-review-log.json`。

3. CDE/NMPA
   - 检索药物通用名、商品名、公司名、适应症关键词和“重症肌无力”。
   - 核对受理号、审评状态、批准日期、适应症文本、儿童/青少年扩展和抗体分型。
   - 更新 `data/global-market.json`、`data/evidence-matrix.json` 或 `data/treatments.json` 中的中国相关字段。

4. ChiCTR
   - 在中国临床试验注册中心检索“重症肌无力 / myasthenia gravis / gMG / 药物名”。
   - 核对注册号、版本号、研究状态、申办者、研究者、入排标准、干预措施和主要终点。
   - 更新 `data/trial-radar.json` 中的 ChiCTR 条目。

5. 全球批准与销售额
   - 优先核对 FDA、EMA、NMPA、PMDA、MHRA、Health Canada 等监管来源。
   - 销售额以公司年报、季报、投资者材料为主，注明年份和口径。
   - 更新 `data/global-market.json` 的 `approvals`、`sales` 和 `trust.lastChecked`。

6. 安全性与上市后监测
   - 核对标签、风险管理计划、FDA/EMA 安全通报、openFDA/FAERS 入口和真实世界研究。
   - 自发报告只作为信号，不写成发生率或因果结论。
   - 更新 `data/treatments.json` 的 `postMarketing`、`safetySignals` 和安全来源链接。

7. 指南路径与证据矩阵
   - 核对国际指南、专家共识、重要 RCT/OLE/RWE 论文和中国实践变化。
   - 只在有明确来源时调整证据层级、路径节点和临床意义。

## 记录格式

每次复核后，在 `data/manual-review-log.json` 的 `items` 中追加一条记录。建议字段如下：

- `id`：唯一记录号，例如 `review-2026-06-07-nmpa-inebilizumab`
- `date`：复核日期，格式 `YYYY-MM-DD`
- `reviewer`：复核人
- `module`：对应模块，例如 `china-access`、`safety`、`market`、`latest-research`
- `itemId`：被复核的数据条目 ID、药物 ID、PMID 或注册号
- `topic`：复核主题
- `sourceUrls`：原始来源链接数组
- `decision`：`confirmed`、`updated`、`needs-follow-up`、`no-change`
- `summary`：本次复核结论
- `changesMade`：修改了哪些文件或字段
- `nextReviewDate`：建议下次复核日期
- `riskLevel`：`high`、`medium`、`low`
- `notes`：备注

## 复核频率建议

- 高优先级：监管批准、适应症变化、重大安全信号、销售额口径变化。建议每周或事件触发复核。
- 中优先级：真实世界证据、长期随访、临床试验状态、指南更新。建议每月复核。
- 低优先级：综述、会议线索、背景性机制文章。建议按需复核。

## 不应自动改写的字段

- 中国获批适应症原文
- 医保、医院准入和支付路径
- 销售额和商业化判断
- 安全性结论和风险解释
- 指南推荐级别
- 证据等级

这些字段可以由自动脚本提示或提供线索，但应由人工复核后再更新。
