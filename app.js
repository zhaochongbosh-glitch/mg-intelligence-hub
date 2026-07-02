const APP_ROOT = new URL(".", import.meta.url);
const DATA_ROOT = new URL("data/", APP_ROOT);
const LANGUAGE_STORAGE_KEY = "mgih-language";

const state = {
  data: {},
  journalMetricIndex: null,
  language: getInitialLanguage(),
  filters: {
    feedQuery: "",
    feedCategory: "all",
    feedSource: "all",
    feedLanguage: "all",
    chinaQuery: "",
    chinaTopic: "all",
    treatmentQuery: "",
    treatmentClass: "all",
    biomarker: "all",
    trialMechanism: "all",
    trialStatus: "all",
    trialSource: "all"
  }
};

const pageMeta = {
  home: {
    zh: {
      title: "重症肌无力信息港 | MG研究、治疗证据、临床试验与药物安全情报",
      description: "重症肌无力信息港聚合近 7 天 PubMed 摘要、中国研究者成果、获批治疗药物、临床试验、全球批准、FAERS 安全监测和指南路径。"
    },
    en: {
      title: "MG Intelligence Hub | Research, therapies, trials and safety intelligence",
      description: "A bilingual intelligence hub for myasthenia gravis research, therapies, China access, clinical trials, safety monitoring and evidence provenance."
    }
  },
  research: {
    zh: { title: "研究情报 | 重症肌无力信息港", description: "近 7 天 MG 研究摘要、中国研究者成果和实时情报流。" },
    en: { title: "Research Intelligence | MG Intelligence Hub", description: "Recent MG research digests, China scholar publications and live intelligence feeds." }
  },
  therapy: {
    zh: { title: "治疗与证据 | 重症肌无力信息港", description: "重症肌无力获批治疗药物、作用机制、循证证据和真实世界研究证据。" },
    en: { title: "Therapy and Evidence | MG Intelligence Hub", description: "Approved MG therapies, mechanisms of action, evidence matrix and real-world evidence." }
  },
  "china-access": {
    zh: { title: "中国准入与商业化 | 重症肌无力信息港", description: "MG 治疗药物中国获批、适应症、批准机构、准入和商业化信息。" },
    en: { title: "China Access and Commercialization | MG Intelligence Hub", description: "China approval, indication, access and commercialization intelligence for MG therapies." }
  },
  "huashan-team": {
    zh: { title: "华山MG团队 | 重症肌无力信息港", description: "华山医院神经内科 MG 相关研究文章与 PubMed/WoS 线索。" },
    en: { title: "Huashan MG Team | MG Intelligence Hub", description: "MG publications from Huashan Hospital Neurology and related PubMed/Web of Science signals." }
  },
  "evidence-chain": {
    zh: { title: "人工复核与证据链 | 重症肌无力信息港", description: "展示人工复核记录、来源链接、结构化数据文件和前台同步状态。" },
    en: { title: "Manual Review and Evidence Chain | MG Intelligence Hub", description: "Manual review records, source links, structured data files and front-end synchronization status." }
  },
  conferences: {
    zh: { title: "重症肌无力相关会议资讯 | 会议撷英与学术动态 | 重症肌无力信息港", description: "重症肌无力相关会议资讯，汇总会议撷英、国际会议摘要解读、学术动态和研究进展专题整理。" },
    en: { title: "MG Conference Intelligence | MG Intelligence Hub", description: "Conference highlights, congress abstract interpretation and curated MG meeting intelligence." }
  },
  safety: {
    zh: { title: "重症肌无力药物安全监测 | FAERS、openFDA与上市后风险信号", description: "汇总重症肌无力治疗药物安全性重点、上市后监测、FAERS/openFDA可视化入口、标签链接和人工复核提示。" },
    en: { title: "MG Drug Safety Monitoring | FAERS, openFDA and Post-Marketing Signals", description: "Safety priorities, post-marketing surveillance, FAERS/openFDA links, labels and manual review prompts for MG therapies." }
  },
  "trials-market": {
    zh: { title: "重症肌无力临床试验与全球市场 | ClinicalTrials.gov、ChiCTR与销售线索", description: "追踪重症肌无力临床试验、试验机制、全球批准、市场销售额和中国本土注册研究入口。" },
    en: { title: "MG Trials and Global Market | ClinicalTrials.gov, ChiCTR and Sales Signals", description: "Clinical trial radar, mechanisms, global approvals, market sales and China-registered study access for myasthenia gravis." }
  },
  guidance: {
    zh: { title: "重症肌无力指南路径 | 诊疗流程、治疗升级与证据矩阵", description: "整理重症肌无力诊疗路径、治疗升级、危象救援、指南建议、证据矩阵和可及性决策要点。" },
    en: { title: "MG Guidance Pathway | Care Flow, Treatment Escalation and Evidence Matrix", description: "Guidance pathways for MG care, escalation decisions, crisis rescue, evidence mapping and access considerations." }
  },
  disclaimer: {
    zh: { title: "免责声明与数据使用说明 | 重症肌无力信息港", description: "说明重症肌无力信息港的数据来源、自动更新、人工复核、医学免责声明和引用边界。" },
    en: { title: "Disclaimer and Data Use Notes | MG Intelligence Hub", description: "Data source notes, automated update boundaries, manual review status, medical disclaimer and citation guidance for MG Intelligence Hub." }
  },
  "data-status": {
    zh: { title: "重症肌无力信息港数据更新状态 | 自动更新与人工复核队列", description: "展示重症肌无力信息港各数据源更新时间、自动更新结果、来源容错记录和人工复核队列。" },
    en: { title: "MG Intelligence Hub Data Status | Updates and Manual Review Queue", description: "Update timestamps, automation status, source fallback records and manual review queues for MG Intelligence Hub data sources." }
  },
  faers: {
    zh: { title: "重症肌无力药物FAERS可视化 | openFDA不良事件报告概览", description: "基于 openFDA/FAERS 汇总重症肌无力相关治疗药物不良事件报告概览和风险信号入口。" },
    en: { title: "MG Therapy FAERS Visualization | openFDA Adverse Event Overview", description: "openFDA/FAERS adverse event overview and signal exploration entry points for MG-related therapies." }
  }
};

const translationMap = new Map([
  ["首页", "Home"],
  ["研究情报", "Research"],
  ["会议资讯", "Conferences"],
  ["会议撷英", "Conference Highlights"],
  ["华山MG团队", "Huashan MG Team"],
  ["治疗与证据", "Therapy & Evidence"],
  ["安全监测", "Safety"],
  ["中国准入", "China Access"],
  ["证据链", "Evidence Chain"],
  ["试验与市场", "Trials & Market"],
  ["指南路径", "Guidance"],
  ["使用说明", "Notes"],
  ["数据状态", "Data Status"],
  ["文献", "Literature"],
  ["研发动态", "R&D news"],
  ["会议摘要", "Conference abstracts"],
  ["监管动态", "Regulatory news"],
  ["入口", "Source portal"],
  ["中国研究", "China research"],
  ["重症肌无力信息港", "MG Intelligence Hub"],
  ["面向科研、医学事务和产业情报的 MG 专题工作台，聚合最新研究、治疗证据、临床试验、全球批准和指南路径。", "A focused MG intelligence workspace for research, medical affairs and industry teams, integrating recent studies, therapy evidence, trials, global approvals and guidance pathways."],
  ["篇近 7 天文献", "articles in 7 days"],
  ["项试验", "trials"],
  ["个治疗项", "therapies"],
  ["更新于", "Updated"],
  ["读取中", "Loading"],
  ["过去 7 天 PubMed 新上线或更新的 MG 研究摘要。", "MG PubMed records newly indexed or updated in the past 7 days."],
  ["中国机构相关 MG 研究，按发表时间自动更新。", "MG studies linked to China-based institutions, updated by publication date."],
  ["获批治疗药物、机制、循证证据和上市后安全监测。", "Approved therapies, mechanisms, evidence and post-marketing safety monitoring."],
  ["全球 MG 临床试验雷达，按机制和状态持续追踪。", "Global MG trial radar tracked by mechanism and status."],
  ["今日速览", "Today's Snapshot"],
  ["首页只保留关键摘要和模块入口；深入内容已拆到独立页面。", "The home page keeps key summaries and module entry points; detailed content lives in dedicated pages."],
  ["展示华山医院神经内科相关 MG 研究，按 PubMed 发表时间持续更新。", "Publications related to Huashan Hospital Neurology and MG, updated by PubMed publication date."],
  ["获批治疗图谱、药物证据矩阵和真实世界证据。", "Approved therapy map, evidence matrix and real-world evidence."],
  ["上市后风险信号、FAERS 入口、标签链接和人工复核状态。", "Post-marketing signals, FAERS access, label links and manual review status."],
  ["NMPA 批准、适应症、企业、销售口径和后续准入复核。", "NMPA approvals, indications, companies, sales scope and access review."],
  ["人工复核与证据链", "Manual Review & Evidence Chain"],
  ["展示人工复核结论、原始来源、结构化数据文件和前台同步状态。", "Review conclusions, primary sources, structured data files and front-end sync status."],
  ["ClinicalTrials.gov 试验雷达、全球批准和市场销售额。", "ClinicalTrials.gov radar, global approvals and market sales."],
  ["指南、诊疗路径、危象救援和准入可及性对照。", "Guidelines, care pathways, crisis rescue and access considerations."],
  ["数据状态与复核队列", "Data Status & Review Queue"],
  ["查看自动更新状态、来源容错记录，以及需要人工核对的监管、市场、安全和证据事项。", "Monitor automated updates, source fallbacks and manual review needs for regulatory, market, safety and evidence items."],
  ["近 7 天研究摘要", "Recent 7-Day Research Digest"],
  ["正在读取最新研究摘要", "Loading recent research digests"],
  ["中文摘要已生成", "Chinese summary ready"],
  ["等待中文摘要", "Chinese summary pending"],
  ["暂无摘要", "No abstract available"],
  ["摘要生成失败", "Summary generation failed"],
  ["待处理", "Pending"],
  ["查看英文摘要", "View English abstract"],
  ["PubMed 摘要", "PubMed abstract"],
  ["研究类型", "Study type"],
  ["研究对象", "Population"],
  ["关键发现", "Key finding"],
  ["情报意义", "Intelligence implication"],
  ["复核重点", "Review focus"],
  ["中国学者研究", "China Scholar Watch"],
  ["正在读取中国研究数据", "Loading China scholar data"],
  ["PubMed 更新", "PubMed update"],
  ["发表", "Published"],
  ["机构信息见 PubMed 摘要", "Affiliation details in PubMed abstract"],
  ["华山MG团队发表文章", "Huashan MG Team Publications"],
  ["正在读取华山团队论文数据。", "Loading Huashan team publication data."],
  ["篇团队论文", "team publications"],
  ["按发表日期倒序", "Sorted by publication date"],
  ["最新论文期刊待读取", "Latest journal pending"],
  ["Web of Science 需人工复核或 API 接入。", "Web of Science requires manual review or API access."],
  ["作者信息见 PubMed", "Authors available in PubMed"],
  ["中文摘要待生成。", "Chinese summary pending."],
  ["PubMed 暂未提供摘要。", "PubMed abstract is not available."],
  ["证据矩阵", "Evidence Matrix"],
  ["正在读取证据矩阵", "Loading evidence matrix"],
  ["药物/机制", "Drug / mechanism"],
  ["适用人群", "Population"],
  ["关键 RCT", "Key RCT"],
  ["长期数据", "Long-term data"],
  ["真实世界", "Real-world"],
  ["安全性重点", "Safety focus"],
  ["中国可及性", "China access"],
  ["证据层级", "Evidence level"],
  ["获批治疗图谱", "Approved Therapy Map"],
  ["正在读取药物数据库", "Loading therapy database"],
  ["机制", "Mechanism"],
  ["抗体/标志物", "Antibody / biomarker"],
  ["给药", "Administration"],
  ["关键证据", "Key evidence"],
  ["真实世界证据", "Real-world evidence"],
  ["上市后安全", "Post-marketing safety"],
  ["批准状态", "Approval status"],
  ["证据待补充", "Evidence pending"],
  ["需补充", "To be completed"],
  ["中国获批产品", "China-approved products"],
  ["NMPA 记录", "NMPA records"],
  ["覆盖机制", "Mechanism coverage"],
  ["涉及企业", "Companies"],
  ["最新记录", "Latest record"],
  ["日期待补充", "Date pending"],
  ["公司待补充", "Company pending"],
  ["适应症文本待补充", "Indication text pending"],
  ["商业化口径", "Commercial scope"],
  ["公开销售额", "Public sales"],
  ["未单独披露", "Not separately disclosed"],
  ["人工复核记录", "manual review records"],
  ["已录入的正式人工复核记录", "Formal manual review records entered"],
  ["已确认或已更新网站数据的条目", "Items confirmed or updated on the site"],
  ["需优先随访的高变化字段", "High-priority fields for follow-up"],
  ["最近一次计划复核日期", "Nearest planned review date"],
  ["待安排", "To be scheduled"],
  ["暂无正式人工复核记录", "No formal manual review records yet"],
  ["完成复核后，在 data/manual-review-log.json 中录入记录，即可在这里展示证据链。", "After review, add records to data/manual-review-log.json to display the evidence chain here."],
  ["已确认", "Confirmed"],
  ["已更新", "Updated"],
  ["需随访", "Follow-up needed"],
  ["无需改动", "No change"],
  ["待复核", "Pending review"],
  ["复核日期", "Review date"],
  ["复核人", "Reviewer"],
  ["关联条目", "Linked item"],
  ["下次复核", "Next review"],
  ["本次改动", "Changes made"],
  ["原始来源", "Primary sources"],
  ["人工复核", "Manual review"],
  ["结构化数据", "Structured data"],
  ["前台展示", "Front-end display"],
  ["证据链判定规则", "Evidence Chain Rules"],
  ["每条人工复核记录必须能回到公开来源、结构化数据字段和前台展示位置。", "Each manual review record should connect public sources, structured data fields and front-end display."],
  ["来源优先级", "Source priority"],
  ["监管文件、说明书、企业正式公告、PubMed 原文优先；二手新闻仅作线索。", "Regulatory documents, labels, official company releases and PubMed records are prioritized; secondary news is only a lead."],
  ["字段同步", "Field synchronization"],
  ["复核结论需要同步到治疗、准入、市场或证据矩阵等对应 JSON 字段。", "Review conclusions should sync to the corresponding therapy, access, market or evidence JSON fields."],
  ["风险分层", "Risk stratification"],
  ["批准状态、适应症、安全警示、销售口径等高变化字段优先进入下次复核。", "High-change fields such as approval status, indication, safety warnings and sales scope receive priority follow-up."],
  ["前台可解释", "Front-end explainability"],
  ["读者应能看到来源链接、复核日期、改动内容和下一次复核安排。", "Readers should see source links, review date, changes and next scheduled review."],
  ["追踪 MG 最新文献、中国研究者成果和多来源情报流。", "Track recent MG literature, China scholar outputs and multi-source intelligence feeds."],
  ["中国研究者发表研究", "China Scholar Publications"],
  ["信息流", "Intelligence Feed"],
  ["正在读取数据", "Loading data"],
  ["核心入口", "Core Links"],
  ["仅用于科研与商业情报跟踪，不构成医疗建议。", "For research and intelligence tracking only; not medical advice."],
  ["比较已获批治疗药物、关键临床证据、真实世界研究和上市后安全性。", "Compare approved therapies, pivotal clinical evidence, real-world evidence and post-marketing safety."],
  ["药物证据矩阵", "Drug Evidence Matrix"],
  ["个药物", "drugs"],
  ["单独追踪 MG/gMG 治疗药物在中国的 NMPA 批准、适应症文本、企业、公开销售口径和后续准入复核事项。", "Track NMPA approvals, indication text, companies, public sales scope and follow-up access review for MG/gMG therapies in China."],
  ["中国获批与商业化概览", "China Approval and Commercialization Overview"],
  ["正在读取中国准入数据", "Loading China access data"],
  ["个产品", "products"],
  ["中国本土注册试验", "China-Registered Trials"],
  ["ChiCTR 用于补足 ClinicalTrials.gov 对中国研究者发起研究和本土注册项目的覆盖不足；当前采用人工复核入口与重点条目方式接入。", "ChiCTR complements ClinicalTrials.gov coverage for investigator-initiated and locally registered China studies; this MVP uses manual review entry points and priority records."],
  ["个 ChiCTR 入口/条目", "ChiCTR entries"],
  ["后续准入复核清单", "Access Follow-up Checklist"],
  ["核对 NMPA 批准日期、抗体分型、年龄范围、是否联合常规治疗和儿童/青少年扩展。", "Verify NMPA approval dates, antibody subtype, age range, combination with standard therapy and pediatric/adolescent extensions."],
  ["持续追踪国家医保谈判、地方惠民保、商保目录、患者援助和院内支付路径。", "Track NRDL negotiations, local supplementary insurance, commercial insurance, patient assistance and hospital payment pathways."],
  ["记录重点医院/省份准入、处方科室、药房路径、冷链/输注/皮下给药服务配置。", "Record access in key hospitals/provinces, prescribing departments, pharmacy pathways and service configuration."],
  ["区分全球产品销售额、中国销售额和 MG 单适应症销售额，避免混用财报口径。", "Separate global product sales, China sales and MG-specific indication sales to avoid mixing reporting scopes."],
  ["仅用于科研与商业情报跟踪，不构成医疗建议。中国准入状态请以 NMPA、医保局、企业公告和正式标签为准。", "For research and intelligence tracking only; not medical advice. China access status should be verified against NMPA, NHSA, company announcements and official labels."],
  ["华山 MG 团队", "Huashan MG Team"],
  ["展示作者署名单位中包含 Huashan Hospital / Department of Neurology 的重症肌无力研究文章，按最新发表日期排列。", "Display MG articles whose author affiliations include Huashan Hospital / Department of Neurology, sorted by latest publication date."],
  ["华山医院神经内科重症肌无力研究展示", "Huashan Neurology MG Research Showcase"],
  ["当前页面优先使用 PubMed 公开数据自动更新；Web of Science 通常需要机构订阅或 API 权限，先作为人工复核来源保留，后续可接入导出题录。", "This page currently prioritizes automated PubMed public data; Web of Science usually requires institutional subscription or API access and is kept as a manual review source."],
  ["团队发表文章", "Team Publications"],
  ["团队论文归属基于 PubMed 作者署名单位字段自动识别；正式团队成果、通讯作者、第一作者和 Web of Science 收录状态需人工复核。", "Team publication attribution is inferred from PubMed affiliation fields; official output status, corresponding/first authorship and WoS indexing require manual review."],
  ["把专家复核、原始监管/企业来源、结构化数据文件和前台展示模块串起来，让每一次关键更新都可追溯。", "Connect expert review, primary regulatory/company sources, structured data files and front-end modules so every key update is traceable."],
  ["已完成复核", "Completed Reviews"],
  ["正在读取人工复核记录", "Loading manual review records"],
  ["条记录", "records"],
  ["NMPA/CDE、药品注册证、企业正式公告、说明书、财报和 PubMed 原始记录优先于二次转载。", "NMPA/CDE records, drug registration certificates, official company announcements, labels, financial reports and PubMed records take priority over secondary reposts."],
  ["每条人工复核记录必须包含复核日期、复核人、来源链接、决策类型、改动内容和下次复核日期。", "Each manual review record must include review date, reviewer, source links, decision type, changes made and next review date."],
  ["复核结论同步到对应 JSON 数据文件，前台页面只读取结构化数据，避免散落在文档或聊天记录里。", "Review conclusions are synchronized to the corresponding JSON data files; front-end pages read structured data instead of scattered documents or chat logs."],
  ["监管标签、医保准入、销售额、安全性信号和指南路径属于高变化字段，按月或按季度回看。", "Regulatory labels, reimbursement access, sales, safety signals and guidance pathways are high-change fields reviewed monthly or quarterly."],
  ["本站用于公开医学情报整理和科研参考；正式判断请回到原始来源并进行人工复核。", "This site is for public medical intelligence curation and research reference; formal judgments should return to primary sources and manual review."]
  ["安全性与上市后监测", "Safety & Post-Marketing Monitoring"],
  ["把获批 MG/gMG 治疗药物的重点风险、上市后信号、标签与 FAERS 入口单独整理，便于持续复核。", "Key risks, post-marketing signals, labels and FAERS access points for approved MG/gMG therapies are organized for ongoing review."],
  ["上市后安全信号地图", "Post-Marketing Safety Signal Map"],
  ["正在读取安全性数据", "Loading safety data"],
  ["复核工作流", "Review Workflow"],
  ["原始标签", "Primary labels"],
  ["优先核对 FDA/EMA/NMPA 标签、风险管理要求、黑框警告和禁忌证。", "Prioritize FDA/EMA/NMPA labels, risk management requirements, boxed warnings and contraindications."],
  ["自发报告", "Spontaneous reports"],
  ["FAERS 等数据库用于发现信号；报告数量不能直接代表发生率或因果关系。", "FAERS and similar databases help detect signals; report counts do not directly indicate incidence or causality."],
  ["队列、登记研究和长期随访用于判断信号是否稳定、是否与人群或合并用药相关。", "Cohorts, registries and long-term follow-up help assess whether signals are stable or linked to populations and concomitant therapies."],
  ["每次更新后记录核查日期、来源链接和需要继续跟踪的安全问题。", "After each update, record review dates, source links and safety issues requiring follow-up."],
  ["安全性判断请以原始标签、监管文件和临床专业判断为准。", "Safety judgments should rely on primary labels, regulatory documents and professional clinical interpretation."],
  ["指南与诊疗路径", "Guidance and Care Pathways"],
  ["把指南共识、中国实践关注和情报用途组织成可比较的路径节点。", "Guideline consensus, China-practice considerations and intelligence use cases are organized as comparable pathway nodes."],
  ["指南与诊疗路径对照", "Guidance and Care Pathway Comparison"],
  ["正在读取诊疗路径数据", "Loading pathway data"],
  ["数据更新状态与人工复核队列", "Data Update Status and Manual Review Queue"],
  ["集中查看自动更新是否运行、外部来源是否异常，以及监管批准、销售额、安全性和证据矩阵中需要人工核对的事项。", "Review automation status, source failures and manual-check items for approvals, sales, safety and evidence matrix fields."],
  ["自动更新状态", "Automated Update Status"],
  ["读取 `data/update-status.json`，将每日自动抓取来源、人工复核来源和本次输出记录分开展示。", "Reads `data/update-status.json` and separates daily automated sources, manual-review sources and current output records."],
  ["双语覆盖率与术语表", "Bilingual Coverage and Terminology"],
  ["读取核心结构化数据和 `data/terminology.json`，展示英文结构字段、文献英文摘要和术语表维护状态。", "Reads core structured datasets and `data/terminology.json` to show English field coverage, English abstracts and terminology maintenance status."],
  ["正在读取双语状态", "Loading bilingual status"],
  ["人工复核队列", "Manual Review Queue"],
  ["根据数据来源状态和各模块的复核标签自动生成，优先暴露不适合完全自动化的高风险字段。", "Generated from source status and module review labels, prioritizing high-risk fields that should not be fully automated."],
  ["先监管后市场", "Regulatory before market"],
  ["批准日期、适应症文本、抗体分型和年龄范围优先回到监管原始来源确认。", "Approval dates, indication wording, antibody subtype and age range should be verified first against primary regulatory sources."],
  ["销售额看口径", "Check sales scope"],
  ["区分全球产品级、中国市场和 MG 单适应症，避免把财报总销售额误解为 MG 销售额。", "Separate global product sales, China sales and MG-specific indication sales to avoid misreading financial-report totals."],
  ["安全信号不等于发生率", "Safety signals are not incidence rates"],
  ["FAERS、自发报告和上市后案例用于发现信号，结论必须结合标签、队列研究和临床判断。", "FAERS, spontaneous reports and post-marketing cases are signal-detection tools; conclusions require labels, cohort evidence and clinical judgment."],
  ["免责声明与数据使用说明", "Disclaimer and Data Use Notes"],
  ["说明本站信息边界、自动摘要限制、人工复核原则、FAERS 解读注意事项和访问统计用途。", "Explains information boundaries, automated-summary limits, manual review principles, FAERS interpretation cautions and analytics use."],
  ["信息用途", "Information Use"],
  ["本站面向科研、医学事务、产业情报和团队知识管理，用于快速发现和整理重症肌无力相关公开信息。", "This site supports research, medical affairs, industry intelligence and team knowledge management by organizing public MG information."],
  ["不替代临床诊疗", "Not a substitute for clinical care"],
  ["本站内容不构成个体化医疗建议、诊断意见、用药建议或治疗推荐。患者诊疗决策应由具备资质的临床医生结合具体病情完成。", "Site content is not individualized medical, diagnostic, prescribing or treatment advice. Patient care decisions should be made by qualified clinicians."],
  ["回到原始来源", "Return to primary sources"],
  ["自动摘要需复核", "Automated summaries require review"],
  ["数据解释边界", "Data Interpretation Boundaries"],
  ["FAERS 与上市后监测", "FAERS and post-marketing monitoring"],
  ["临床试验登记", "Clinical trial registration"],
  ["市场与准入信息", "Market and access information"],
  ["团队论文归属", "Team publication attribution"],
  ["访问统计与隐私", "Analytics and Privacy"],
  ["相关国际会议", "Related International Meetings"],
  ["相关国际会议基本信息", "Basic Information for Related International Meetings"],
  ["会议摘要证据提醒", "Conference Abstract Evidence Note"],
  ["阅读全文", "Read full article"],
  ["返回会议资讯索引", "Back to conference index"],
  ["返回相关国际会议频道", "Back to related international meetings"],]);

const translationRules = [
  [/^(\d+)\s*篇近\s*7\s*天文献$/, "$1 articles in 7 days"],
  [/^(\d+)\s*项试验$/, "$1 trials"],
  [/^(\d+)\s*个治疗项$/, "$1 therapies"],
  [/^(\d+)\s*篇新研究$/, "$1 new studies"],
  [/^(\d+)\s*篇团队论文$/, "$1 team publications"],
  [/^(\d+)\s*条人工复核记录$/, "$1 manual review records"],
  [/^(\d+)\s*个中国获批产品$/, "$1 China-approved products"],
  [/^(\d+)\s*个药物$/, "$1 drugs"],
  [/^(\d+)\s*个产品$/, "$1 products"],
  [/^(\d+)\s*条记录$/, "$1 records"],
  [/^(\d+)\s*个 ChiCTR 入口\/条目$/, "$1 ChiCTR entries"],
  [/^(\d+)\s*个路径节点$/, "$1 pathway nodes"],
  [/^(\d+)\s*\/\s*(\d+)\s*个治疗项$/, "$1 / $2 therapies"],
  [/^发表\s+(.+)$/, "Published $1"],
  [/^PubMed 上线\/更新：(.+)$/, "PubMed indexed/updated: $1"],
  [/^发表：(.+)$/, "Published: $1"],
  [/^来源\s+(\d+)$/, "Source $1"]
];

const textOriginals = new WeakMap();
const attributeOriginals = new WeakMap();

const categoryLabels = ["文献", "研发动态", "会议摘要", "监管动态", "入口", "中国研究"];

const dataFiles = {
  feed: "items.json",
  latest: "latest-research.json",
  china: "china-research.json",
  huashanTeam: "huashan-team.json",
  treatments: "treatments.json",
  market: "global-market.json",
  guidance: "guidance-pathways.json",
  matrix: "evidence-matrix.json",
  trials: "trial-radar.json",
  updateStatus: "update-status.json",
  manualReview: "manual-review-log.json",
  terminology: "terminology.json",
  journalMetrics: "journal-metrics.json"
};

const trustDefaults = {
  feed: {
    sourceType: "聚合来源",
    evidenceLevel: "信息线索",
    reviewStatus: "自动更新",
    reviewNote: "自动聚合条目用于情报线索，临床或监管结论需回到原始链接复核。"
  },
  latest: {
    sourceType: "PubMed",
    evidenceLevel: "文献摘要",
    reviewStatus: "自动更新",
    reviewNote: "每日抓取 PubMed 近 7 天新上线或更新记录；中文摘要仅作阅读辅助。"
  },
  china: {
    sourceType: "PubMed Affiliation",
    evidenceLevel: "文献索引",
    reviewStatus: "自动更新",
    reviewNote: "通过机构字段近似识别中国研究者/机构，仍需打开 PubMed 摘要确认。"
  },
  huashanTeam: {
    sourceType: "PubMed Affiliation / Web of Science manual review",
    evidenceLevel: "团队论文索引",
    reviewStatus: "PubMed 自动更新，WoS 待人工复核",
    reviewNote: "作者署名单位由 PubMed Affiliation 字段近似识别；Web of Science 需机构订阅或导出文件后人工复核。"
  },
  treatments: {
    sourceType: "标签/文献/监管文件",
    evidenceLevel: "人工证据汇总",
    reviewStatus: "部分核查",
    reviewNote: "药物机制、适应症、证据和安全性为人工整理，后续应逐条复核说明书、审评文件和文献。"
  },
  safety: {
    sourceType: "标签/openFDA/上市后报告",
    evidenceLevel: "安全性信号",
    reviewStatus: "部分核查",
    reviewNote: "自发报告用于发现信号，不能直接证明发生率或因果关系；请回到标签、监管文件和原始报告复核。"
  },
  "china-access": {
    sourceType: "NMPA/财报/公司公告",
    evidenceLevel: "中国准入与商业化",
    reviewStatus: "需定期复核",
    reviewNote: "中国批准、医保、医院准入和销售口径会持续变化；请按 NMPA、医保局、企业公告和财报逐条复核。"
  },
  matrix: {
    sourceType: "RCT/OLE/RWE 文献",
    evidenceLevel: "人工证据矩阵",
    reviewStatus: "部分核查",
    reviewNote: "用于横向比较证据层级，不替代原始研究和正式指南。"
  },
  trials: {
    sourceType: "ClinicalTrials.gov",
    evidenceLevel: "试验登记",
    reviewStatus: "自动更新",
    reviewNote: "登记信息反映试验状态，不等同于已发表疗效或安全性证据。"
  },
  market: {
    sourceType: "监管/财报/公司公告",
    evidenceLevel: "市场情报",
    reviewStatus: "需定期复核",
    reviewNote: "批准国家和销售额会变动，建议按季度回看监管数据库、年报和公司公告。"
  },
  guidance: {
    sourceType: "指南/共识/监管文件",
    evidenceLevel: "专家路径",
    reviewStatus: "人工整理",
    reviewNote: "路径用于形成临床问题和情报框架，具体决策应结合最新版指南与患者情况。"
  }
};

boot();

async function boot() {
  try {
    state.data = await loadAllData();
    state.journalMetricIndex = buildJournalMetricIndex(state.data.journalMetrics?.records || []);
    hydrateStats();
    hydrateControls();
    bindControls();
    renderVisibleModules();
    hydrateShareTools();
    hydrateLanguageTools();
    hydrateMobileNavigation();
    applyLanguage();
  } catch (error) {
    console.error(error);
    for (const target of document.querySelectorAll("[data-render]")) {
      target.innerHTML = `<article class="item"><h3>数据读取失败</h3><p>请稍后刷新页面，或检查 data 文件是否存在。</p></article>`;
    }
    hydrateLanguageTools();
    hydrateMobileNavigation();
    applyLanguage();
  }
}
function getInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const urlLanguage = params.get("lang");
  if (urlLanguage === "en" || urlLanguage === "zh") return urlLanguage;
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    // localStorage can be unavailable in strict privacy modes.
  }
  return "zh";
}

async function loadAllData() {
  const entries = await Promise.all(
    Object.entries(dataFiles).map(async ([key, file]) => {
      const response = await fetch(new URL(`${file}?ts=${Date.now()}`, DATA_ROOT));
      if (!response.ok) throw new Error(`${file} HTTP ${response.status}`);
      return [key, await response.json()];
    })
  );
  return Object.fromEntries(entries);
}

function hydrateLanguageTools() {
  for (const nav of document.querySelectorAll(".section-nav")) {
    if (nav.querySelector(".language-toggle")) continue;
    const group = document.createElement("div");
    group.className = "language-toggle";
    group.setAttribute("aria-label", "Language selector");
    group.innerHTML = `
      <button type="button" data-language-option="zh">中文</button>
      <button type="button" data-language-option="en">English</button>
    `;
    group.addEventListener("click", (event) => {
      const button = event.target.closest("[data-language-option]");
      if (button) setLanguage(button.dataset.languageOption);
    });
    nav.append(group);
  }
  syncLanguageToggle();
  syncLanguageLinks();
}

function hydrateMobileNavigation() {
  for (const nav of document.querySelectorAll(".section-nav")) {
    if (nav.dataset.mobileNavHydrated === "true") continue;
    nav.dataset.mobileNavHydrated = "true";
    if (!nav.id) nav.id = `section-nav-${Math.random().toString(36).slice(2, 8)}`;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "mobile-nav-toggle";
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "导航";

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "mobile-nav-backdrop";
    backdrop.setAttribute("aria-label", "关闭导航菜单");

    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body?.classList.remove("mobile-nav-open");
    };
    const open = () => {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body?.classList.add("mobile-nav-open");
    };

    toggle.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) close();
      else open();
    });
    backdrop.addEventListener("click", close);
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a[href]")) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    nav.before(toggle);
    nav.after(backdrop);
  }
}

function setLanguage(language) {
  if (language !== "zh" && language !== "en") return;
  state.language = language;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures; the URL parameter still keeps the current view.
  }
  syncLanguageUrl();
  hydrateStats();
  renderVisibleModules();
  hydrateShareTools();
  hydrateLanguageTools();
  applyLanguage();
}

function applyLanguage() {
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  document.body?.setAttribute("data-language", state.language);
  applyMetaLanguage();
  translateTextNodes(document.body);
  translateAttributes(document.body);
  syncLanguageToggle();
  syncLanguageLinks();
}

function applyMetaLanguage() {
  const page = document.body?.dataset.page || "home";
  const bodyMeta = {
    zh: {
      title: document.body?.dataset.titleZh,
      description: document.body?.dataset.descriptionZh
    },
    en: {
      title: document.body?.dataset.titleEn,
      description: document.body?.dataset.descriptionEn
    }
  };
  const meta = (bodyMeta[state.language]?.title && bodyMeta[state.language]?.description)
    ? bodyMeta[state.language]
    : pageMeta[page]?.[state.language] || pageMeta[page]?.zh;
  if (!meta) return;
  document.title = meta.title;
  for (const selector of ["meta[name='description']", "meta[property='og:description']"]) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute("content", meta.description);
  }
  for (const selector of ["meta[property='og:title']"]) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute("content", meta.title);
  }
}
function translateTextNodes(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (parent.closest("script, style, noscript, code, pre, textarea")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
    const original = textOriginals.get(node);
    node.nodeValue = state.language === "en" ? translateText(original) : original;
  }
}

function translateAttributes(root) {
  if (!root) return;
  for (const element of root.querySelectorAll("[placeholder], [aria-label], [title]")) {
    let originals = attributeOriginals.get(element);
    if (!originals) {
      originals = {};
      attributeOriginals.set(element, originals);
    }
    for (const attr of ["placeholder", "aria-label", "title"]) {
      if (!element.hasAttribute(attr)) continue;
      if (!Object.prototype.hasOwnProperty.call(originals, attr)) originals[attr] = element.getAttribute(attr);
      const original = originals[attr];
      element.setAttribute(attr, state.language === "en" ? translateText(original) : original);
    }
  }
}

function translateText(raw = "") {
  const leading = raw.match(/^\s*/)?.[0] || "";
  const trailing = raw.match(/\s*$/)?.[0] || "";
  const text = raw.trim();
  if (!text) return raw;
  if (translationMap.has(text)) return `${leading}${translationMap.get(text)}${trailing}`;
  for (const [pattern, replacement] of translationRules) {
    if (pattern.test(text)) return `${leading}${text.replace(pattern, replacement)}${trailing}`;
  }
  return raw;
}

function syncLanguageToggle() {
  for (const button of document.querySelectorAll("[data-language-option]")) {
    const active = button.dataset.languageOption === state.language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function syncLanguageUrl() {
  const url = new URL(window.location.href);
  if (state.language === "en") url.searchParams.set("lang", "en");
  else url.searchParams.delete("lang");
  window.history.replaceState({}, "", url);
}

function syncLanguageLinks() {
  for (const link of document.querySelectorAll("a[href]")) {
    const raw = link.getAttribute("href");
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) continue;
    let url;
    try {
      url = new URL(raw, window.location.href);
    } catch {
      continue;
    }
    if (url.origin !== window.location.origin) continue;
    if (state.language === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    link.setAttribute("href", url.pathname + url.search + url.hash);
  }
}

function hydrateStats() {
  setAll("[data-stat='latest']", latestItems().length);
  setAll("[data-stat='china']", chinaItems().length);
  setAll("[data-stat='treatments']", treatmentItems().length);
  setAll("[data-stat='trials']", trialItems().length);
  setAll("[data-stat='updated']", formatDate(state.data.feed?.updatedAt));
}

function hydrateControls() {
  fillSelect("feed-category", categoryLabels);
  fillSelect("feed-source", [...new Set(feedItems().map((item) => item.source).filter(Boolean))].sort());
  fillSelect("china-topic", [...new Set(chinaItems().map((item) => item.topic).filter(Boolean))].sort());
  fillSelect("treatment-class", [...new Set(treatmentItems().map((item) => item.class).filter(Boolean))].sort());
  fillSelect("biomarker", [...new Set(treatmentItems().map((item) => item.biomarker).filter(Boolean))].sort());
  fillSelect("trial-mechanism", [...new Set(trialItems().map((item) => item.mechanism).filter(Boolean))].sort());
  fillSelect("trial-source", [...new Set(trialItems().map(trialRegistry).filter(Boolean))].sort());
  fillSelect(
    "trial-status",
    [...new Set(trialItems().map((item) => item.status).filter(Boolean))].sort(),
    formatTrialStatus
  );
}

function bindControls() {
  onInput("feed-search", (value) => {
    state.filters.feedQuery = value.toLowerCase();
    renderFeed();
  });
  onChange("feed-category", (value) => {
    state.filters.feedCategory = value;
    renderFeed();
  });
  onChange("feed-source", (value) => {
    state.filters.feedSource = value;
    renderFeed();
  });
  onChange("feed-language", (value) => {
    state.filters.feedLanguage = value;
    renderFeed();
  });
  onInput("china-search", (value) => {
    state.filters.chinaQuery = value.toLowerCase();
    renderChina();
  });
  onChange("china-topic", (value) => {
    state.filters.chinaTopic = value;
    renderChina();
  });
  onInput("treatment-search", (value) => {
    state.filters.treatmentQuery = value.toLowerCase();
    renderTreatments();
  });
  onChange("treatment-class", (value) => {
    state.filters.treatmentClass = value;
    renderTreatments();
  });
  onChange("biomarker", (value) => {
    state.filters.biomarker = value;
    renderTreatments();
  });
  onChange("trial-mechanism", (value) => {
    state.filters.trialMechanism = value;
    renderTrials();
  });
  onChange("trial-status", (value) => {
    state.filters.trialStatus = value;
    renderTrials();
  });
  onChange("trial-source", (value) => {
    state.filters.trialSource = value;
    renderTrials();
  });
}

function renderVisibleModules() {
  if (exists("latest")) renderLatest();
  if (exists("china")) renderChina();
  if (exists("huashan-team")) renderHuashanTeam();
  if (exists("feed")) renderFeed();
  if (exists("matrix")) renderMatrix();
  if (exists("treatments")) renderTreatments();
  if (exists("supportive")) renderSupportive();
  if (exists("safety")) renderSafety();
  if (exists("china-access")) renderChinaAccess();
  if (exists("china-registered-trials")) renderChinaRegisteredTrials();
  if (exists("trials")) renderTrials();
  if (exists("market")) renderMarket();
  if (exists("guidance")) renderGuidance();
  if (exists("update-status")) renderUpdateStatus();
  if (exists("i18n-status")) renderI18nStatus();
  if (exists("review-queue")) renderReviewQueue();
  if (exists("evidence-chain")) renderEvidenceChain();
  if (exists("faers")) renderFaersExplorer();
}

function hydrateShareTools() {
  const footer = document.querySelector("footer");
  if (!footer || footer.querySelector(".site-share")) return;

  const title = document.title || "重症肌无力信息港";
  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=188x188&data=${encodedUrl}`;

  const share = document.createElement("section");
  share.className = "site-share";
  share.setAttribute("aria-label", "页面分享");
  share.innerHTML = `
    <span class="site-share__label">分享本页</span>
    <div class="site-share__actions">
      <button class="share-button" type="button" data-share="native">系统分享</button>
      <button class="share-button" type="button" data-share="wechat">微信</button>
      <a class="share-button" href="https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}" target="_blank" rel="noreferrer">微博</a>
      <a class="share-button" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noreferrer">LinkedIn</a>
      <button class="share-button" type="button" data-share="copy">复制链接</button>
    </div>
    <span class="share-copy-status" aria-live="polite"></span>
  `;

  const modal = document.createElement("div");
  modal.className = "share-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="share-modal__panel" role="dialog" aria-modal="true" aria-label="微信分享二维码">
      <div class="share-modal__head">
        <strong>微信分享</strong>
        <button class="share-button share-button--compact" type="button" data-share="close">关闭</button>
      </div>
      <img class="share-modal__qr" src="${escapeAttribute(qrUrl)}" alt="当前页面二维码">
      <p>${escapeHtml(title)}</p>
      <button class="share-button" type="button" data-share="copy">复制链接</button>
    </div>
  `;

  footer.append(share);
  document.body.append(modal);

  const status = share.querySelector(".share-copy-status");
  const setStatus = (message) => {
    status.textContent = message;
    window.setTimeout(() => {
      status.textContent = "";
    }, 2200);
  };
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("已复制");
    } catch {
      window.prompt("复制本页链接", url);
    }
  };
  const openModal = () => {
    modal.hidden = false;
    modal.querySelector("[data-share='close']")?.focus();
  };
  const closeModal = () => {
    modal.hidden = true;
  };

  share.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-share]");
    if (!target) return;
    const action = target.dataset.share;
    if (action === "native") {
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch {
          // User canceled native share.
        }
      } else {
        await copyUrl();
      }
    }
    if (action === "wechat") openModal();
    if (action === "copy") await copyUrl();
  });

  modal.addEventListener("click", async (event) => {
    if (event.target === modal || event.target.closest("[data-share='close']")) {
      closeModal();
      return;
    }
    if (event.target.closest("[data-share='copy']")) await copyUrl();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
}

function renderLatest() {
  const items = latestItems().sort(sortByDateDesc);
  setScope("latest", state.data.latest?.scopeNote);
  setCount("latest", `${items.length} 篇新研究`);
  const target = targetFor("latest");
  if (!items.length) {
    target.innerHTML = `<article class="latest-empty"><h3>近 7 天暂未抓取到新摘要</h3><p>PubMed 未必每周都有新上线的 MG 摘要；自动任务仍会每日检查一次。</p></article>`;
    return;
  }
  target.innerHTML = items.map(renderLatestCard).join("");
}

function renderLatestCard(item) {
  const indexedDate = item.indexedAt || item.date;
  const statusLabel = {
    translated: "中文摘要已生成",
    pending: "等待中文摘要",
    "no-abstract": "暂无摘要",
    error: "摘要生成失败"
  }[item.translationStatus] || "待处理";
  const points = (localizedList(item, "keyPoints") || item.keyPoints || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  const intelligence = renderLatestIntelligence(item);
  const primaryAbstract = state.language === "en" ? item.abstract || item.zhSummary : item.zhSummary || item.abstract;
  const secondaryAbstract = state.language === "en" ? item.zhSummary || item.abstract : item.abstract || item.zhSummary;
  const secondaryLabel = state.language === "en" ? "View Chinese summary" : "查看英文摘要";
  return `
    <article class="latest-card">
      <div class="latest-card__head">
        <div>
          <p class="section-kicker">PMID ${escapeHtml(item.pmid || "")}</p>
          <h3>${escapeHtml(item.title || "未命名研究")}</h3>
          <p>${escapeHtml([item.journal, item.authors].filter(Boolean).join(" | "))}</p>
          ${renderJournalMetric(item)}
        </div>
        <span>${escapeHtml(statusLabel)}</span>
      </div>
      ${renderTrustMeta(item, "latest")}
      <p class="zh-abstract">${escapeHtml(primaryAbstract || "中文摘要待生成。")}</p>
      ${intelligence}
      ${points ? `<ul class="latest-points">${points}</ul>` : ""}
      <details>
        <summary>${escapeHtml(secondaryLabel)}</summary>
        <p>${escapeHtml(secondaryAbstract || "PubMed 暂未提供摘要。")}</p>
      </details>
      <div class="latest-actions">
        <div class="latest-actions__dates">
          <span>PubMed 上线/更新：${formatDate(indexedDate)}</span>
          <span>发表：${formatDate(item.date)}</span>
        </div>
        <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 摘要</a>
      </div>
    </article>
  `;
}

function renderLatestIntelligence(item = {}) {
  if (state.language === "en" && !item.en?.intelligence) return "";
  const intelligence = localizedObject(item, "intelligence") || item.intelligence || {};
  const rows = [
    ["研究类型", intelligence.studyType],
    ["研究对象", intelligence.population],
    ["关键发现", intelligence.keyFinding],
    ["情报意义", intelligence.clinicalImplication],
    ["复核重点", intelligence.reviewFocus]
  ].filter(([, value]) => value);

  if (!rows.length) return "";

  return `
    <dl class="latest-intel-grid">
      ${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
    </dl>
  `;
}

function renderChina() {
  const items = chinaItems().filter(matchesChina).sort(sortByDateDesc);
  setScope("china", state.data.china?.scopeNote);
  targetFor("china").innerHTML = items.length
    ? items.map(renderChinaCard).join("")
    : `<article class="china-card"><h3>没有找到匹配研究</h3><p>可以换一个作者、机构或主题关键词。</p></article>`;
}

function renderChinaCard(item) {
  const indexedDate = item.indexedAt || item.date;
  const tags = (item.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const summary = state.language === "en" ? item.abstract || item.summary || item.authors || "" : item.summary || item.authors || "";
  return `
    <article class="china-card">
      <div class="china-card__date">
        <span>PubMed 更新</span>
        <strong>${formatDate(indexedDate)}</strong>
        <small>发表 ${formatDate(item.date)}</small>
      </div>
      <div>
        <div class="china-card__meta">
          <span>${escapeHtml(item.topic || "研究")}</span>
          <span>${escapeHtml(item.journal || "PubMed")}</span>
          ${renderJournalMetric(item)}
        </div>
        ${renderTrustMeta(item, "china")}
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(summary)}</p>
        <p class="institution">${escapeHtml(item.institutionHint || "机构信息见 PubMed 摘要")}</p>
        <div class="china-card__footer">
          <div class="china-tags">${tags}</div>
          <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 摘要</a>
        </div>
      </div>
    </article>
  `;
}

function renderHuashanTeam() {
  const items = huashanTeamItems().sort(sortByDateDesc);
  const data = state.data.huashanTeam || {};
  setScope("huashan-team", data.scopeNote);
  setCount("huashan-team", `${items.length} 篇团队论文`);
  const summary = targetFor("huashan-summary", false);
  if (summary) summary.innerHTML = renderHuashanSummary(items, data);
  targetFor("huashan-team").innerHTML = items.length
    ? items.map(renderHuashanArticle).join("")
    : `<article class="huashan-paper"><h3>暂未抓取到团队论文</h3><p>请检查 PubMed 检索式或稍后重新运行数据更新。</p></article>`;
}

function renderHuashanSummary(items, data = {}) {
  const years = items.map((item) => String(item.date || "").slice(0, 4)).filter(Boolean);
  const latest = items[0];
  return `
    <div class="huashan-overview">
      <article>
        <span>PubMed records</span>
        <strong>${items.length}</strong>
        <p>按发表日期倒序</p>
      </article>
      <article>
        <span>Latest year</span>
        <strong>${escapeHtml(years[0] || "待更新")}</strong>
        <p>${escapeHtml(latest?.journal || "最新论文期刊待读取")}</p>
      </article>
      <article>
        <span>Source status</span>
        <strong>PubMed</strong>
        <p>${escapeHtml(data.webOfScience?.note || "Web of Science 需人工复核或 API 接入。")}</p>
      </article>
    </div>
  `;
}

function renderHuashanArticle(item) {
  const indexedDate = item.indexedAt || item.date;
  const tags = (item.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const authors = item.authors ? item.authors.split(", ").slice(0, 8).join(", ") : "作者信息见 PubMed";
  const primaryAbstract = state.language === "en" ? item.abstract || item.zhSummary : item.zhSummary || item.abstract;
  const secondaryAbstract = state.language === "en" ? item.zhSummary || item.abstract : item.abstract || item.zhSummary;
  const secondaryLabel = state.language === "en" ? "View Chinese summary" : "查看英文摘要";
  return `
    <article class="huashan-paper">
      <div class="huashan-paper__date">
        <span>PubMed 更新</span>
        <strong>${formatDate(indexedDate)}</strong>
        <small>发表 ${formatDate(item.date)}</small>
      </div>
      <div class="huashan-paper__body">
        <div class="huashan-paper__meta">
          <span>${escapeHtml(item.journal || "PubMed")}</span>
          ${renderJournalMetric(item)}
          <span>PMID ${escapeHtml(item.pmid || "")}</span>
          <span>${escapeHtml(item.webOfScienceStatus || "WoS 待复核")}</span>
        </div>
        ${renderTrustMeta(item, "huashanTeam")}
        <h3>${escapeHtml(item.title || "未命名论文")}</h3>
        <p class="huashan-authors">${escapeHtml(authors)}</p>
        <p class="zh-abstract">${escapeHtml(primaryAbstract || "中文摘要待生成。")}</p>
        ${item.sourceAffiliation ? `<p class="institution">${escapeHtml(item.sourceAffiliation)}</p>` : ""}
        <details>
          <summary>${escapeHtml(secondaryLabel)}</summary>
          <p>${escapeHtml(secondaryAbstract || "PubMed 暂未提供摘要。")}</p>
        </details>
        <div class="huashan-paper__footer">
          <div class="china-tags">${tags}</div>
          <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 摘要</a>
        </div>
      </div>
    </article>
  `;
}

function renderFeed() {
  const items = feedItems().filter(matchesFeed).sort(sortByDateDesc);
  setCount("feed", `${items.length} 条匹配信息`);
  targetFor("feed").innerHTML = items.length
    ? items.map(renderFeedItem).join("")
    : `<article class="item"><h3>没有找到匹配条目</h3><p>可以调整关键词、类型或来源筛选。</p></article>`;
}

function renderFeedItem(item) {
  const tags = (item.tags || []).map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("");
  return `
    <article class="item" data-category="${escapeAttribute(item.category || "")}">
      <div class="item__top">
        <span class="pill">${escapeHtml(item.category || "信息")}</span>
        <span>${escapeHtml(item.source || "未知来源")}</span>
        <span>${formatDate(item.date)}</span>
        ${renderJournalMetric(item)}
      </div>
      ${renderTrustMeta(item, "feed")}
      <h3>${escapeHtml(item.title || "未命名条目")}</h3>
      <p>${escapeHtml(item.summary || "")}</p>
      <div class="item__actions">
        <div class="tags">${tags}</div>
        <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">查看原文</a>
      </div>
    </article>
  `;
}

function renderMatrix() {
  const items = matrixItems();
  setScope("matrix", state.data.matrix?.scopeNote);
  setCount("matrix", `${items.length} 个药物`);
  const rows = items
    .map((item) => `
      <tr>
        <th><strong>${escapeHtml(localizedField(item, "brand"))}</strong><span>${escapeHtml(localizedField(item, "mechanism"))}</span></th>
        <td>${escapeHtml(localizedField(item, "population"))}</td>
        <td>${escapeHtml(localizedField(item, "pivotalTrial"))}</td>
        <td>${escapeHtml(localizedField(item, "longTermEvidence"))}</td>
        <td>${escapeHtml(localizedField(item, "realWorldEvidence"))}</td>
        <td>${escapeHtml(localizedField(item, "safetyFocus"))}</td>
        <td>${escapeHtml(localizedField(item, "chinaAccess"))}</td>
        <td>
          <span class="evidence-badge">${escapeHtml(localizedField(item, "evidenceLevel"))}</span>
          ${renderReviewNote(item, "matrix")}
        </td>
      </tr>
    `)
    .join("");
  targetFor("matrix").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>药物/机制</th><th>适用人群</th><th>关键 RCT</th><th>长期数据</th>
          <th>真实世界</th><th>安全性重点</th><th>中国可及性</th><th>证据层级</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderTreatments() {
  const items = treatmentItems().filter(matchesTreatment);
  setScope("treatments", state.data.treatments?.scopeNote);
  setCount("treatments", `${items.length} / ${treatmentItems().length} 个治疗项`);
  targetFor("treatments").innerHTML = items.map(renderTreatmentCard).join("");
}

function renderTreatmentCard(item) {
  const approval = item.approval || {};
  const signals = localizedList(item, "safetySignals").map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");
  const links = (item.links || [])
    .map((link) => normalizeSourceLink(link, item))
    .map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join("");
  return `
    <article class="treatment-card">
      <div class="treatment-card__head">
        <div>
          <p class="eyebrow-dark">${escapeHtml(localizedField(item, "class") || "治疗")}</p>
          <h3>${escapeHtml(localizedField(item, "brand"))} <span>${escapeHtml(localizedField(item, "generic"))}</span></h3>
          <p>${escapeHtml(localizedField(item, "zhName") || "")}</p>
        </div>
        <strong>${escapeHtml(localizedField(item, "evidenceGrade") || "证据待补充")}</strong>
      </div>
      ${renderTrustMeta(item, "treatments")}
      <dl class="treatment-grid">
        <div><dt>机制</dt><dd>${escapeHtml(localizedField(item, "mechanism"))}</dd></div>
        <div><dt>适用人群</dt><dd>${escapeHtml(localizedField(item, "approvedUse"))}</dd></div>
        <div><dt>抗体/标志物</dt><dd>${escapeHtml(localizedField(item, "biomarker"))}</dd></div>
        <div><dt>给药</dt><dd>${escapeHtml(localizedField(item, "route"))}</dd></div>
        <div><dt>关键证据</dt><dd>${escapeHtml(localizedField(item, "pivotalEvidence"))}</dd></div>
        <div><dt>真实世界证据</dt><dd>${escapeHtml(localizedField(item, "realWorldEvidence"))}</dd></div>
        <div><dt>上市后安全</dt><dd>${escapeHtml(localizedField(item, "postMarketing"))}</dd></div>
        <div><dt>批准状态</dt><dd>FDA: ${escapeHtml(approval.fda || "需补充")}；EMA: ${escapeHtml(approval.ema || "需补充")}；NMPA: ${escapeHtml(approval.nmpa || "需补充")}</dd></div>
      </dl>
      <div class="safety-tags">${signals}</div>
      <div class="treatment-links">${links}</div>
    </article>
  `;
}

function renderSupportive() {
  targetFor("supportive").innerHTML = (state.data.treatments?.offLabelOrSupportive || [])
    .map((item) => `<p><strong>${escapeHtml(localizedField(item, "name"))}</strong>：${escapeHtml(localizedField(item, "note"))}</p>`)
    .join("");
}

function renderSafety() {
  const items = treatmentItems();
  setScope("safety", "按药物整理重点安全信号、上市后监测说明和原始数据入口；自发报告信号不等同于因果关系。");
  setCount("safety", `${items.length} 个治疗项`);
  const summary = targetFor("safety-summary", false);
  if (summary) summary.innerHTML = renderSafetySummary(items);
  targetFor("safety").innerHTML = items.map(renderSafetyCard).join("");
}

function renderSafetySummary(items) {
  const signalCounts = new Map();
  for (const item of items) {
    for (const signal of item.safetySignals || []) {
      signalCounts.set(signal, (signalCounts.get(signal) || 0) + 1);
    }
  }
  const topSignals = [...signalCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, 8)
    .map(([signal, count]) => `<span>${escapeHtml(signal)} <strong>${count}</strong></span>`)
    .join("");
  const classes = [...new Set(items.map((item) => item.class).filter(Boolean))]
    .map((name) => `<span>${escapeHtml(name)}</span>`)
    .join("");
  return `
    <div class="safety-overview">
      <article>
        <p>监测药物</p>
        <strong>${items.length}</strong>
        <span>来自获批治疗图谱</span>
      </article>
      <article>
        <p>重点信号</p>
        <div class="safety-signal-cloud">${topSignals}</div>
      </article>
      <article>
        <p>机制类别</p>
        <div class="safety-signal-cloud">${classes}</div>
      </article>
    </div>
  `;
}

function renderSafetyCard(item) {
  const signals = (item.safetySignals || []).map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");
  const links = safetyLinks(item)
    .map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join("");
  return `
    <article class="safety-card">
      <div class="safety-card__head">
        <div>
          <p class="eyebrow-dark">${escapeHtml(item.class || "治疗药物")}</p>
          <h3>${escapeHtml(item.brand)} <span>${escapeHtml(item.generic || "")}</span></h3>
          <p>${escapeHtml(item.zhName || "")}</p>
        </div>
        <strong>${escapeHtml(item.route || "给药待补充")}</strong>
      </div>
      ${renderTrustMeta(item, "safety")}
      <div class="safety-alert">
        <span>上市后监测重点</span>
        <p>${escapeHtml(item.postMarketing || "待补充上市后安全性监测说明。")}</p>
      </div>
      <div class="safety-tags">${signals}</div>
      <dl class="safety-detail">
        <div><dt>适用人群</dt><dd>${escapeHtml(item.approvedUse || "待补充")}</dd></div>
        <div><dt>抗体/标志物</dt><dd>${escapeHtml(item.biomarker || "待补充")}</dd></div>
        <div><dt>风险阅读提示</dt><dd>自发报告数据库适合发现潜在信号，不能直接估计发生率，也不能单独证明药物因果关系。</dd></div>
      </dl>
      <div class="safety-links">${links}</div>
    </article>
  `;
}

function safetyLinks(item) {
  const links = item.links || [];
  const preferred = links.filter((link) => /openFDA|FAERS|Label|标签|DailyMed|FDA/i.test(link.label || link.url || ""));
  return (preferred.length ? preferred : links).slice(0, 4).map((link) => normalizeSourceLink(link, item));
}

function normalizeSourceLink(link = {}, item = {}) {
  if (!/openFDA|FAERS|api\.fda\.gov\/drug\/event/i.test(`${link.label || ""} ${link.url || ""}`)) return link;
  const url = new URL("pages/faers.html", APP_ROOT);
  if (item.id) url.searchParams.set("drug", item.id);
  if (item.brand) url.searchParams.set("brand", item.brand);
  if (item.generic) url.searchParams.set("generic", item.generic);
  if (link.url) url.searchParams.set("api", link.url);
  return {
    ...link,
    label: "FAERS 可视化",
    url: url.href
  };
}

async function renderFaersExplorer() {
  const target = targetFor("faers");
  const params = new URLSearchParams(window.location.search);
  const treatment = findFaersTreatment(params);
  const title = treatment ? `${treatment.brand} (${treatment.generic})` : params.get("brand") || params.get("generic") || "FAERS";
  setAll("[data-faers-title]", title);
  setAll("[data-faers-subtitle]", treatment?.zhName || "openFDA FAERS 药品不良事件报告");
  target.innerHTML = `<article class="faers-loading"><h3>正在读取 openFDA FAERS 数据</h3><p>请稍候。</p></article>`;

  try {
    const apiUrl = buildFaersApiUrl(params, treatment);
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`openFDA HTTP ${response.status}`);
    const data = await response.json();
    target.innerHTML = renderFaersDashboard(data, treatment, apiUrl);
  } catch (error) {
    target.innerHTML = `
      <article class="faers-empty">
        <h3>暂时无法读取 FAERS 数据</h3>
        <p>${escapeHtml(error.message || "openFDA 请求失败。")}</p>
        <a href="safety.html">返回安全监测</a>
      </article>
    `;
  }
}

function findFaersTreatment(params) {
  const drug = params.get("drug");
  const brand = params.get("brand");
  const generic = params.get("generic");
  return treatmentItems().find((item) =>
    (drug && item.id === drug) ||
    (brand && item.brand?.toLowerCase() === brand.toLowerCase()) ||
    (generic && item.generic?.toLowerCase() === generic.toLowerCase())
  );
}

function buildFaersApiUrl(params, treatment) {
  const existing = params.get("api");
  if (existing) {
    const url = new URL(existing);
    url.searchParams.set("sort", "receivedate:desc");
    url.searchParams.set("limit", "100");
    return url.href;
  }

  const brand = params.get("brand") || treatment?.brand;
  const generic = params.get("generic") || treatment?.generic;
  const search = brand
    ? `patient.drug.openfda.brand_name:"${brand}"`
    : `patient.drug.openfda.generic_name:"${generic || ""}"`;
  const url = new URL("https://api.fda.gov/drug/event.json");
  url.searchParams.set("search", search);
  url.searchParams.set("sort", "receivedate:desc");
  url.searchParams.set("limit", "100");
  return url.href;
}

function renderFaersDashboard(data = {}, treatment, apiUrl) {
  const reports = Array.isArray(data.results) ? data.results : [];
  const total = data.meta?.results?.total ?? reports.length;
  const serious = reports.filter((report) => report.serious === "1").length;
  const deaths = reports.filter((report) => report.seriousnessdeath === "1").length;
  const latestDate = reports.map(reportDate).filter(Boolean).sort().at(-1);
  const reactionBars = renderFaersBars(countFaersValues(reports, reactionTerms), "reaction");
  const countryBars = renderFaersBars(countFaersValues(reports, (report) => [report.primarysourcecountry || report.primarysource?.reportercountry]), "country");
  const outcomeBars = renderFaersBars(countFaersValues(reports, outcomeTerms), "outcome");
  const tableRows = reports.slice(0, 12).map(renderFaersReportRow).join("");
  const labelSignals = (treatment?.safetySignals || []).map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");

  return `
    <div class="faers-disclaimer">
      <strong>解读边界</strong>
      <span>FAERS 是自发报告系统。报告数可用于发现潜在信号，不能直接代表发生率、风险比或药物因果关系。</span>
    </div>
    <div class="faers-kpis">
      <article><span>openFDA 命中</span><strong>${formatNumber(total)}</strong><p>当前查询的报告总数</p></article>
      <article><span>本页样本</span><strong>${reports.length}</strong><p>最多展示最近 100 条</p></article>
      <article><span>严重报告</span><strong>${serious}</strong><p>本页样本内 serious=1</p></article>
      <article><span>死亡结局</span><strong>${deaths}</strong><p>本页样本内 death=1</p></article>
      <article><span>最近接收</span><strong>${latestDate ? formatFaersDate(latestDate) : "未显示"}</strong><p>按 receivedate 估算</p></article>
    </div>
    ${treatment ? `
      <section class="faers-panel">
        <div class="section-heading compact">
          <div>
            <p class="section-kicker">Label Context</p>
            <h2>标签/人工整理的重点风险</h2>
          </div>
        </div>
        <p>${escapeHtml(treatment.postMarketing || "暂无人工整理的上市后监测说明。")}</p>
        <div class="safety-tags">${labelSignals}</div>
      </section>
    ` : ""}
    <section class="faers-grid">
      <article class="faers-panel">
        <h2>常见报告反应</h2>
        ${reactionBars || `<p class="muted">暂无 reaction 字段。</p>`}
      </article>
      <article class="faers-panel">
        <h2>报告来源国家/地区</h2>
        ${countryBars || `<p class="muted">暂无国家字段。</p>`}
      </article>
      <article class="faers-panel">
        <h2>严重性结局标记</h2>
        ${outcomeBars || `<p class="muted">暂无严重性结局字段。</p>`}
      </article>
    </section>
    <section class="faers-panel">
      <div class="section-heading compact">
        <div>
          <p class="section-kicker">Recent Reports</p>
          <h2>最近报告样本</h2>
        </div>
        <a class="ghost-link" href="${escapeAttribute(apiUrl)}" target="_blank" rel="noreferrer">查看原始 JSON</a>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>接收日期</th><th>国家</th><th>性别/年龄</th><th>报告反应</th><th>疑似药物</th><th>严重性</th></tr>
          </thead>
          <tbody>${tableRows || `<tr><td colspan="6">暂无报告样本。</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

function countFaersValues(reports, getter) {
  const counts = new Map();
  for (const report of reports) {
    for (const value of getter(report).filter(Boolean)) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
}

function reactionTerms(report) {
  return (report.patient?.reaction || []).map((item) => item.reactionmeddrapt);
}

function outcomeTerms(report) {
  const map = [
    ["seriousnessdeath", "Death"],
    ["seriousnesslifethreatening", "Life-threatening"],
    ["seriousnesshospitalization", "Hospitalization"],
    ["seriousnessdisabling", "Disabling"],
    ["seriousnesscongenitalanomali", "Congenital anomaly"],
    ["seriousnessother", "Other serious"]
  ];
  return map.filter(([key]) => report[key] === "1").map(([, label]) => label);
}

function renderFaersBars(entries, type) {
  const max = Math.max(...entries.map(([, count]) => count), 1);
  return entries
    .map(([label, count]) => `
      <div class="faers-bar faers-bar--${type}">
        <span>${escapeHtml(label)}</span>
        <div><i style="width: ${Math.max(4, Math.round((count / max) * 100))}%"></i></div>
        <strong>${count}</strong>
      </div>
    `)
    .join("");
}

function renderFaersReportRow(report) {
  const reactions = reactionTerms(report).slice(0, 4).join("; ");
  const drugs = (report.patient?.drug || [])
    .filter((drug) => drug.drugcharacterization === "1" || drug.drugcharacterization === "2")
    .map((drug) => drug.medicinalproduct || drug.openfda?.brand_name?.[0] || drug.openfda?.generic_name?.[0])
    .filter(Boolean)
    .slice(0, 4)
    .join("; ");
  const patient = [
    formatFaersSex(report.patient?.patientsex),
    report.patient?.patientonsetage ? `${report.patient.patientonsetage}${formatFaersAgeUnit(report.patient.patientonsetageunit)}` : ""
  ].filter(Boolean).join(" / ");
  return `
    <tr>
      <td>${escapeHtml(formatFaersDate(reportDate(report)) || "未显示")}</td>
      <td>${escapeHtml(report.primarysourcecountry || report.primarysource?.reportercountry || "未显示")}</td>
      <td>${escapeHtml(patient || "未显示")}</td>
      <td>${escapeHtml(reactions || "未显示")}</td>
      <td>${escapeHtml(drugs || "未显示")}</td>
      <td>${escapeHtml(report.serious === "1" ? outcomeTerms(report).join("; ") || "Serious" : "Non-serious/未标记")}</td>
    </tr>
  `;
}

function reportDate(report) {
  return report.receivedate || report.receiptdate || report.transmissiondate || "";
}

function formatFaersDate(value = "") {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function formatFaersSex(value) {
  return { 1: "男", 2: "女", 0: "未知" }[value] || "";
}

function formatFaersAgeUnit(value) {
  return { 800: "十年", 801: "年", 802: "月", 803: "周", 804: "日", 805: "小时" }[value] || "";
}

function formatNumber(value) {
  return new Intl.NumberFormat(state.language === "en" ? "en-US" : "zh-CN").format(Number(value) || 0);
}

function renderChinaAccess() {
  const items = chinaAccessItems();
  setScope("china-access", "从全球批准与市场数据中单列中国 NMPA 记录，并补充证据矩阵中的中国可及性说明。");
  setCount("china-access", `${items.length} 个中国获批产品`);
  const summary = targetFor("china-access-summary", false);
  if (summary) summary.innerHTML = renderChinaAccessSummary(items);
  targetFor("china-access").innerHTML = items.length
    ? items.map(renderChinaAccessCard).join("")
    : `<article class="china-access-card"><h3>暂无中国准入记录</h3><p>请检查 global-market.json 中是否已录入中国/NMPA 批准信息。</p></article>`;
}

function renderChinaAccessSummary(items) {
  const classes = [...new Set(items.map((item) => localizedField(item.product, "class")).filter(Boolean))];
  const companies = [...new Set(items.map((item) => localizedField(item.product, "company")).filter(Boolean))];
  const latest = items[0];
  return `
    <div class="access-overview">
      <article>
        <p>中国获批产品</p>
        <strong>${items.length}</strong>
        <span>NMPA 记录</span>
      </article>
      <article>
        <p>覆盖机制</p>
        <div class="access-cloud">${classes.map((name) => `<span>${escapeHtml(name)}</span>`).join("")}</div>
      </article>
      <article>
        <p>涉及企业</p>
        <div class="access-cloud">${companies.map((name) => `<span>${escapeHtml(name)}</span>`).join("")}</div>
      </article>
      <article>
        <p>最新记录</p>
        <strong>${escapeHtml(latest?.approval.approvalDate || "待补充")}</strong>
        <span>${escapeHtml(latest ? localizedField(latest.product, "brand") : "")}</span>
      </article>
    </div>
  `;
}

function renderChinaAccessCard(item) {
  const { product, approval, matrix } = item;
  const sales = product.sales || {};
  const sources = (product.sourceUrls || [])
    .slice(0, 4)
    .map((url, index) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">来源 ${index + 1}</a>`)
    .join("");
  return `
    <article class="china-access-card">
      <div class="china-access-card__head">
        <div>
          <p class="eyebrow-dark">${escapeHtml(localizedField(product, "class") || "治疗药物")}</p>
          <h3>${escapeHtml(localizedField(product, "brand"))} <span>${escapeHtml(localizedField(product, "generic") || "")}</span></h3>
          <p>${escapeHtml(localizedField(product, "company") || "公司待补充")}</p>
        </div>
        <strong>${escapeHtml(approval.approvalDate || "日期待补充")}</strong>
      </div>
      ${renderTrustMeta(product, "china-access")}
      <div class="approval-highlight">
        <span>${escapeHtml(localizedField(approval, "agency") || "NMPA")}</span>
        <p>${escapeHtml(localizedField(approval, "indication") || "适应症文本待补充")}</p>
      </div>
      <dl class="china-access-grid">
        <div><dt>中国可及性</dt><dd>${escapeHtml(localizedField(matrix, "chinaAccess") || "需补充医保、医院准入和真实世界使用信息。")}</dd></div>
        <div><dt>证据层级</dt><dd>${escapeHtml(localizedField(matrix, "evidenceLevel") || "证据层级待补充")}</dd></div>
        <div><dt>商业化口径</dt><dd>${escapeHtml(localizedField(sales, "scope") || "销售口径待补充")}</dd></div>
        <div><dt>公开销售额</dt><dd>${escapeHtml([sales.year, localizedField(sales, "value")].filter(Boolean).join("：") || "未单独披露")} ${localizedField(sales, "trend") ? `（${escapeHtml(localizedField(sales, "trend"))}）` : ""}</dd></div>
      </dl>
      <div class="access-links">${sources}</div>
    </article>
  `;
}

function chinaAccessItems() {
  return marketItems()
    .map((product) => ({
      product,
      approval: chinaApproval(product),
      matrix: matrixForProduct(product)
    }))
    .filter((item) => item.approval)
    .sort((a, b) => approvalTimestamp(b.approval.approvalDate) - approvalTimestamp(a.approval.approvalDate));
}

function chinaApproval(product) {
  return (product.approvals || []).find((approval) => /中国|China/i.test(approval.countryOrRegion || "") || /NMPA|CDE/i.test(approval.agency || ""));
}

function matrixForProduct(product) {
  const text = `${product.id || ""} ${product.brand || ""} ${product.generic || ""}`.toLowerCase();
  return matrixItems().find((item) => text.includes(String(item.id || "").toLowerCase()) || textIncludesAny(text, item.brand));
}

function textIncludesAny(text, value = "") {
  return String(value)
    .toLowerCase()
    .split(/\s+|\/|,|，/)
    .filter((part) => part.length > 3)
    .some((part) => text.includes(part));
}

function approvalTimestamp(value = "") {
  const match = String(value).match(/\d{4}(?:-\d{1,2})?/);
  return match ? new Date(`${match[0]}-01`).getTime() : 0;
}

function renderTrials() {
  const items = trialItems().filter(matchesTrial);
  setScope("trials", state.data.trials?.scopeNote);
  setCount("trials", `${items.length} / ${trialItems().length} 项试验`);
  targetFor("trials").innerHTML = items.map(renderTrialCard).join("");
}

function renderTrialCard(item) {
  const interventions = (item.interventions || []).map((name) => `<span>${escapeHtml(name)}</span>`).join("");
  const registry = trialRegistry(item);
  return `
    <article class="trial-card">
      <div class="trial-card__head">
        <div>
          <p class="section-kicker">${escapeHtml(registry)} · ${escapeHtml(item.mechanism || "机制待分类")}</p>
          <h3>${escapeHtml(item.title || item.nctId)}</h3>
          <p>${escapeHtml([item.sponsor, item.phase].filter(Boolean).join(" | "))}</p>
        </div>
        <strong>${escapeHtml(formatTrialStatus(item.status))}</strong>
      </div>
      <div class="trial-meta">
        <span>注册号: ${escapeHtml(item.nctId || item.id || "待补充")}</span>
        <span>更新: ${escapeHtml(item.lastUpdate || "未知")}</span>
        <span>完成: ${escapeHtml(item.completionDate || "未知")}</span>
      </div>
      ${renderTrustMeta(item, "trials")}
      <div class="trial-tags">${interventions}</div>
      <p>${escapeHtml((item.countries || []).join(", ") || "国家/地区待补充")}</p>
      <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">查看 ${escapeHtml(registry)}</a>
    </article>
  `;
}

function renderChinaRegisteredTrials() {
  const items = trialItems().filter((item) => trialRegistry(item) === "ChiCTR");
  setCount("china-registered-trials", `${items.length} 个 ChiCTR 入口/条目`);
  targetFor("china-registered-trials").innerHTML = items.length
    ? items.map(renderTrialCard).join("")
    : `<article class="trial-card"><h3>暂无 ChiCTR 条目</h3><p>建议在 ChiCTR 官网以“重症肌无力 / myasthenia gravis / gMG”等关键词人工复核。</p></article>`;
}

function renderMarket() {
  const items = marketItems();
  setScope("market", state.data.market?.scopeNote);
  setCount("market", `${items.length} 个产品`);
  targetFor("market").innerHTML = items.map(renderMarketCard).join("");
}

function renderMarketCard(product) {
  const approvals = (product.approvals || [])
    .map((approval) => `
      <li>
        <strong>${escapeHtml(localizedField(approval, "countryOrRegion"))}</strong>
        <span>${escapeHtml(localizedField(approval, "agency"))} · ${escapeHtml(approval.approvalDate)}</span>
        <em>${escapeHtml(localizedField(approval, "indication"))}</em>
      </li>
    `)
    .join("");
  const sources = (product.sourceUrls || [])
    .slice(0, 3)
    .map((url, index) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">来源 ${index + 1}</a>`)
    .join("");
  const sales = product.sales || {};
  return `
    <article class="market-card">
      <div class="market-card__head">
        <div>
          <p class="eyebrow-dark">${escapeHtml(localizedField(product, "class") || "治疗药物")}</p>
          <h3>${escapeHtml(localizedField(product, "brand"))} <span>${escapeHtml(localizedField(product, "generic") || "")}</span></h3>
          <p>${escapeHtml(localizedField(product, "company") || "")}</p>
        </div>
        <strong>${escapeHtml(String(product.approvalCount || (product.approvals || []).length))} 个市场</strong>
      </div>
      ${renderTrustMeta(product, "market")}
      <div class="sales-box">
        <span>${escapeHtml(sales.year || "最新")} 销售额</span>
        <strong>${escapeHtml(localizedField(sales, "value") || "未披露")}</strong>
        <p>${escapeHtml(localizedField(sales, "scope") || "")}</p>
        <small>${escapeHtml(localizedField(sales, "trend") || "")}</small>
      </div>
      <ul class="approval-list">${approvals}</ul>
      <div class="market-links">${sources}</div>
    </article>
  `;
}

function renderGuidance() {
  const items = guidanceItems();
  setScope("guidance", state.data.guidance?.scopeNote);
  setCount("guidance", `${items.length} 个路径节点`);
  targetFor("guidance").innerHTML = items
    .map((item) => {
      const links = (item.sources || [])
        .map((source) => `<a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a>`)
        .join("");
      return `
        <article class="guidance-card">
          <p class="section-kicker">${escapeHtml(item.step)}</p>
          <h3>${escapeHtml(item.clinicalQuestion)}</h3>
          ${renderTrustMeta(item, "guidance")}
          <dl>
            <div><dt>共识方向</dt><dd>${escapeHtml(item.consensus)}</dd></div>
            <div><dt>中国实践关注</dt><dd>${escapeHtml(item.chinaPractice)}</dd></div>
            <div><dt>情报用途</dt><dd>${escapeHtml(item.intelligenceUse)}</dd></div>
          </dl>
          <div class="guidance-links">${links}</div>
        </article>
      `;
    })
    .join("");
}

function renderUpdateStatus() {
  const status = state.data.updateStatus || {};
  const automaticSources = status.sources || [];
  const manualSources = manualReviewSources();
  const attentionCount = automaticSources.filter((source) => /failed|error|失败/i.test(source.status || "")).length;
  setCount("update-status", `${automaticSources.length} 个自动来源，${manualSources.length} 个人工复核来源，${attentionCount} 个异常`);

  const overview = `
    <div class="status-overview">
      <article>
        <span>当前状态</span>
        <strong>${escapeHtml(formatStatusLabel(status.status || "unknown"))}</strong>
        <p>${escapeHtml(status.scope || "未记录更新范围")}</p>
      </article>
      <article>
        <span>最近完成</span>
        <strong>${escapeHtml(formatDateTime(status.runFinishedAt || status.updatedAt))}</strong>
        <p>脚本运行结束时间</p>
      </article>
      <article>
        <span>自动来源</span>
        <strong>${automaticSources.length}</strong>
        <p>${attentionCount ? `${attentionCount} 个自动来源异常` : "本次自动来源暂无异常标记"}</p>
      </article>
      <article>
        <span>人工复核来源</span>
        <strong>${manualSources.length}</strong>
        <p>${escapeHtml(status.nextReviewHint || "监管、市场、安全和指南类数据保持人工复核。")}</p>
      </article>
    </div>
  `;

  const automaticCards = automaticSources.map((source) => renderSourceStatusCard(source, "auto")).join("");
  const manualCards = manualSources.map((source) => renderSourceStatusCard(source, "manual")).join("");

  const outputs = status.outputs?.length
    ? `<div class="status-outputs">${status.outputs.map(renderStatusOutput).join("")}</div>`
    : `<article class="status-empty"><h3>暂无输出明细</h3><p>当前基线数据已建立；自动脚本正式运行后会在这里记录各数据文件的更新条数。</p></article>`;

  targetFor("update-status").innerHTML = `
    ${overview}
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Automatic Sources</p>
          <h3>自动更新来源</h3>
        </div>
        <span>${automaticSources.length} 个来源</span>
      </div>
      <div class="source-status-grid">${automaticCards || renderEmptyStatusCard("暂无自动来源记录", "请先运行 GitHub Actions 自动更新任务。")}</div>
    </section>
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Manual Review Sources</p>
          <h3>人工复核来源</h3>
        </div>
        <span>${manualSources.length} 个来源</span>
      </div>
      <div class="source-status-grid">${manualCards}</div>
    </section>
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Generated Outputs</p>
          <h3>本次输出记录</h3>
        </div>
        <span>${(status.outputs || []).length} 个文件</span>
      </div>
      ${outputs}
    </section>
  `;
}

function renderI18nStatus() {
  const structured = bilingualStructuredCoverage();
  const literature = bilingualLiteratureCoverage();
  const terminology = terminologyStatus();
  const allChecks = [...structured, ...literature];
  const avgCoverage = allChecks.length
    ? Math.round(allChecks.reduce((sum, item) => sum + item.percent, 0) / allChecks.length)
    : 0;
  const missingCount = structured.reduce((sum, item) => sum + item.missing.length, 0);
  const termCount = terminology.terms.length;
  const categoryCount = terminology.categories.length;

  setCount(
    "i18n-status",
    state.language === "en"
      ? `${avgCoverage}% average coverage, ${termCount} terms`
      : `平均覆盖率 ${avgCoverage}%，${termCount} 个术语`
  );

  const overview = `
    <div class="i18n-overview">
      <article>
        <span>${state.language === "en" ? "Average coverage" : "平均覆盖率"}</span>
        <strong>${avgCoverage}%</strong>
        <p>${state.language === "en" ? "Structured fields and literature English availability" : "结构化字段和文献英文可用性的综合估算"}</p>
      </article>
      <article>
        <span>${state.language === "en" ? "Structured gaps" : "结构化缺口"}</span>
        <strong>${missingCount}</strong>
        <p>${state.language === "en" ? "Missing English fields in core curated datasets" : "核心人工维护数据中缺少的英文字段"}</p>
      </article>
      <article>
        <span>${state.language === "en" ? "Terminology" : "术语表"}</span>
        <strong>${termCount}</strong>
        <p>${state.language === "en" ? `${categoryCount} categories covered` : `覆盖 ${categoryCount} 个术语类别`}</p>
      </article>
    </div>
  `;

  const structuredCards = structured.map(renderI18nCoverageCard).join("");
  const literatureCards = literature.map(renderI18nCoverageCard).join("");
  const termCloud = terminology.categories.map((name) => `<span>${escapeHtml(name)}</span>`).join("");
  const requiredTerms = terminology.required
    .map((term) => `<span class="${term.present ? "is-present" : "is-missing"}">${escapeHtml(term.key)}</span>`)
    .join("");

  targetFor("i18n-status").innerHTML = `
    ${overview}
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Structured Data</p>
          <h3>${state.language === "en" ? "Core bilingual fields" : "核心结构化字段"}</h3>
        </div>
        <span>${state.language === "en" ? `${structured.length} datasets` : `${structured.length} 个数据源`}</span>
      </div>
      <div class="i18n-grid">${structuredCards}</div>
    </section>
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Literature</p>
          <h3>${state.language === "en" ? "Publication English availability" : "文献英文可用性"}</h3>
        </div>
        <span>${state.language === "en" ? `${literature.length} feeds` : `${literature.length} 个文献源`}</span>
      </div>
      <div class="i18n-grid">${literatureCards}</div>
    </section>
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Terminology</p>
          <h3>${state.language === "en" ? "Terminology baseline" : "术语表基线"}</h3>
        </div>
        <span>${state.language === "en" ? `${termCount} terms` : `${termCount} 个术语`}</span>
      </div>
      <div class="terminology-status">
        <article>
          <h4>${state.language === "en" ? "Categories" : "术语类别"}</h4>
          <div class="terminology-cloud">${termCloud}</div>
        </article>
        <article>
          <h4>${state.language === "en" ? "Required terms" : "必备术语"}</h4>
          <div class="terminology-cloud terminology-cloud--required">${requiredTerms}</div>
        </article>
      </div>
    </section>
  `;
}

function renderI18nCoverageCard(item) {
  const tone = item.percent >= 90 ? "good" : item.percent >= 70 ? "warning" : "attention";
  const missing = item.missing.length
    ? `<p>${state.language === "en" ? "Missing: " : "缺口："}${escapeHtml(item.missing.slice(0, 4).join(", "))}${item.missing.length > 4 ? " ..." : ""}</p>`
    : `<p>${state.language === "en" ? "No required gaps detected." : "未发现必备字段缺口。"}</p>`;
  return `
    <article class="i18n-card" data-status="${tone}">
      <div class="i18n-card__head">
        <div>
          <span>${escapeHtml(item.group)}</span>
          <h4>${escapeHtml(item.name)}</h4>
        </div>
        <strong>${item.percent}%</strong>
      </div>
      <div class="i18n-meter"><i style="width: ${item.percent}%"></i></div>
      <p>${escapeHtml(item.covered)} / ${escapeHtml(item.total)} ${escapeHtml(item.unit)}</p>
      ${missing}
    </article>
  `;
}

function bilingualStructuredCoverage() {
  return [
    structuredCoverage({
      name: state.language === "en" ? "Treatments" : "治疗药物",
      group: "treatments.json",
      items: treatmentItems(),
      fields: ["class", "target", "mechanism", "approvedUse", "biomarker", "route", "pivotalEvidence", "realWorldEvidence", "postMarketing", "evidenceGrade"],
      lists: ["safetySignals"]
    }),
    structuredCoverage({
      name: state.language === "en" ? "Evidence matrix" : "证据矩阵",
      group: "evidence-matrix.json",
      items: matrixItems(),
      fields: ["mechanism", "population", "pivotalTrial", "longTermEvidence", "realWorldEvidence", "safetyFocus", "chinaAccess", "evidenceLevel"]
    }),
    structuredCoverage({
      name: state.language === "en" ? "Global market" : "全球准入/市场",
      group: "global-market.json",
      items: marketItems(),
      fields: ["brand", "generic", "company", "class"],
      nested: [["sales", "value"], ["sales", "scope"], ["sales", "trend"]],
      arrays: [{ key: "approvals", fields: ["countryOrRegion", "agency", "indication"] }]
    }),
    structuredCoverage({
      name: state.language === "en" ? "Evidence chain" : "人工复核证据链",
      group: "manual-review-log.json",
      items: manualReviewItems(),
      fields: ["topic", "summary", "notes"],
      lists: ["changesMade"]
    })
  ];
}

function structuredCoverage({ name, group, items = [], fields = [], lists = [], nested = [], arrays = [] }) {
  let covered = 0;
  let total = 0;
  const missing = [];
  for (const item of items) {
    const id = item.id || item.itemId || item.brand || "item";
    for (const field of fields) {
      total += 1;
      if (hasEnglishValue(item, field)) covered += 1;
      else missing.push(`${id}: en.${field}`);
    }
    for (const field of lists) {
      total += 1;
      if (Array.isArray(item.en?.[field]) && item.en[field].length) covered += 1;
      else missing.push(`${id}: en.${field}`);
    }
    for (const [parent, field] of nested) {
      total += 1;
      if (item[parent]?.en?.[field]) covered += 1;
      else missing.push(`${id}: ${parent}.en.${field}`);
    }
    for (const arrayCheck of arrays) {
      for (const [index, row] of (item[arrayCheck.key] || []).entries()) {
        for (const field of arrayCheck.fields) {
          total += 1;
          if (row.en?.[field]) covered += 1;
          else missing.push(`${id}: ${arrayCheck.key}[${index}].en.${field}`);
        }
      }
    }
  }
  return {
    name,
    group,
    covered,
    total,
    unit: state.language === "en" ? "fields" : "字段",
    percent: percentage(covered, total),
    missing
  };
}

function bilingualLiteratureCoverage() {
  return [
    literatureCoverage(state.language === "en" ? "Latest research" : "近 7 天研究", "latest-research.json", latestItems()),
    literatureCoverage(state.language === "en" ? "China research" : "中国研究", "china-research.json", chinaItems()),
    literatureCoverage(state.language === "en" ? "Huashan team" : "华山团队", "huashan-team.json", huashanTeamItems())
  ];
}

function literatureCoverage(name, group, items = []) {
  const titleCount = items.filter((item) => item.title && !looksMostlyChinese(item.title)).length;
  const abstractCount = items.filter((item) => item.abstract && !looksMostlyChinese(item.abstract)).length;
  const total = items.length * 2;
  const covered = titleCount + abstractCount;
  const missing = [];
  if (titleCount < items.length) missing.push(`${items.length - titleCount} missing English titles`);
  if (abstractCount < items.length) missing.push(`${items.length - abstractCount} missing English abstracts`);
  return {
    name,
    group,
    covered,
    total,
    unit: state.language === "en" ? "title/abstract fields" : "题名/摘要字段",
    percent: percentage(covered, total),
    missing
  };
}

function terminologyStatus() {
  const terms = state.data.terminology?.terms || [];
  const categories = [...new Set(terms.map((term) => term.category).filter(Boolean))].sort();
  const keys = new Set(terms.map((term) => term.key));
  const requiredKeys = ["MG", "gMG", "AChR", "MuSK", "FcRn", "C5 inhibitor", "post-marketing safety", "real-world evidence", "China access"];
  return {
    terms,
    categories,
    required: requiredKeys.map((key) => ({ key, present: keys.has(key) }))
  };
}

function hasEnglishValue(item = {}, field) {
  const value = item.en?.[field];
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function percentage(covered, total) {
  if (!total) return 0;
  return Math.round((covered / total) * 100);
}

function looksMostlyChinese(value = "") {
  const text = String(value);
  const chinese = (text.match(/[\u3400-\u9fff]/g) || []).length;
  return chinese > Math.max(8, text.length * 0.25);
}

function renderSourceStatusCard(source = {}, mode = "auto") {
  const isManual = mode === "manual";
  const tone = isManual ? "manual" : sourceStatusTone(source.status);
  const timing = source.finishedAt ? `完成：${formatDateTime(source.finishedAt)}` : source.lastChecked ? `核查：${formatDate(source.lastChecked)}` : "";
  const count = Number.isFinite(source.count) ? `${source.count} 条` : source.countLabel || "";
  const link = source.url
    ? `<a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">打开来源</a>`
    : "";
  return `
    <article class="source-status-card" data-status="${escapeAttribute(tone)}">
      <div>
        <p class="section-kicker">${escapeHtml(source.frequency || (isManual ? "MANUAL REVIEW" : "AUTO RUN"))}</p>
        <h3>${escapeHtml(source.name || "未命名来源")}</h3>
      </div>
      <div class="source-status-card__badges">
        <strong>${escapeHtml(formatStatusLabel(source.status || (isManual ? "manual-review" : "unknown")))}</strong>
        ${count ? `<span>${escapeHtml(count)}</span>` : ""}
      </div>
      <p>${escapeHtml(source.fallbackPolicy || source.reason || "暂无容错说明")}</p>
      ${timing || link ? `<div class="source-status-card__meta">${timing ? `<span>${escapeHtml(timing)}</span>` : ""}${link}</div>` : ""}
    </article>
  `;
}

function renderEmptyStatusCard(title, body) {
  return `<article class="status-empty"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`;
}

function renderStatusOutput(output = {}) {
  return `
    <article>
      <strong>${escapeHtml(output.file || output.name || "未命名输出")}</strong>
      <span>${escapeHtml(output.count ?? output.status ?? "已记录")}</span>
    </article>
  `;
}

function renderReviewQueue() {
  const queue = reviewQueueItems();
  const highCount = queue.filter((item) => item.priority === "高").length;
  setCount("review-queue", `${queue.length} 项待复核，${highCount} 项高优先级`);
  targetFor("review-queue").innerHTML = queue.length
    ? queue.map(renderReviewQueueCard).join("")
    : `<article class="review-card"><h3>暂无待复核事项</h3><p>当数据来源失败、监管/销售额/安全性字段需要人工确认时，会自动出现在这里。</p></article>`;
}

function renderReviewQueueCard(item) {
  const link = item.url
    ? `<a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">打开来源</a>`
    : `<span>暂无直接来源链接</span>`;
  return `
    <article class="review-card">
      <div class="review-card__head">
        <div>
          <p class="section-kicker">${escapeHtml(item.type)}</p>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <strong class="priority-badge priority-${escapeAttribute(priorityClass(item.priority))}">${escapeHtml(item.priority)}</strong>
      </div>
      <p>${escapeHtml(item.reason)}</p>
      <div class="review-meta">
        <span>状态：${escapeHtml(item.status || "待复核")}</span>
        <span>建议频率：${escapeHtml(item.cadence || "按需")}</span>
        <span>最近核查：${escapeHtml(item.lastChecked ? formatDate(item.lastChecked) : "未记录")}</span>
      </div>
      <div class="review-actions">${link}</div>
    </article>
  `;
}

function renderEvidenceChain() {
  const log = state.data.manualReview || {};
  const items = manualReviewItems().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const highRisk = items.filter((item) => item.riskLevel === "high").length;
  const changed = items.filter((item) => item.decision === "updated" || item.decision === "confirmed").length;
  const nextReview = items
    .map((item) => item.nextReviewDate)
    .filter(Boolean)
    .sort()[0];

  setCount("evidence-chain", `${items.length} 条人工复核记录`);
  setScope("evidence-chain", log.provenance?.reviewNote || log.scopeNote || "读取 manual-review-log.json，展示人工复核结论、来源链接和已同步的数据字段。");

  const summary = targetFor("evidence-chain-summary", false);
  if (summary) {
    summary.innerHTML = `
      <article>
        <span>Review records</span>
        <strong>${items.length}</strong>
        <p>已录入的正式人工复核记录</p>
      </article>
      <article>
        <span>Confirmed / updated</span>
        <strong>${changed}</strong>
        <p>已确认或已更新网站数据的条目</p>
      </article>
      <article>
        <span>High priority</span>
        <strong>${highRisk}</strong>
        <p>需优先随访的高变化字段</p>
      </article>
      <article>
        <span>Next review</span>
        <strong>${escapeHtml(nextReview ? formatDate(nextReview) : "待安排")}</strong>
        <p>最近一次计划复核日期</p>
      </article>
    `;
  }

  targetFor("evidence-chain").innerHTML = items.length
    ? items.map(renderEvidenceChainCard).join("")
    : `<article class="evidence-chain-card"><h3>暂无正式人工复核记录</h3><p>完成复核后，在 data/manual-review-log.json 中录入记录，即可在这里展示证据链。</p></article>`;
}

function renderEvidenceChainCard(item = {}) {
  const sourceLinks = (item.sourceUrls || [])
    .map((url, index) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">来源 ${index + 1}</a>`)
    .join("");
  const changes = localizedList(item, "changesMade").map((change) => `<li>${escapeHtml(change)}</li>`).join("");
  const chain = evidenceChainFor(item);
  return `
    <article class="evidence-chain-card">
      <div class="evidence-chain-card__head">
        <div>
          <p class="section-kicker">${escapeHtml(item.module || "manual-review")}</p>
          <h3>${escapeHtml(localizedField(item, "topic") || item.itemId || "未命名复核记录")}</h3>
        </div>
        <strong class="decision-badge decision-${escapeAttribute(item.decision || "needs-follow-up")}">${escapeHtml(formatDecisionLabel(item.decision))}</strong>
      </div>
      <p>${escapeHtml(localizedField(item, "summary") || "暂无复核摘要。")}</p>
      <dl class="evidence-chain-meta">
        <div><dt>复核日期</dt><dd>${escapeHtml(formatDate(item.date))}</dd></div>
        <div><dt>复核人</dt><dd>${escapeHtml(item.reviewer || "未记录")}</dd></div>
        <div><dt>关联条目</dt><dd>${escapeHtml(item.itemId || "未记录")}</dd></div>
        <div><dt>下次复核</dt><dd>${escapeHtml(item.nextReviewDate ? formatDate(item.nextReviewDate) : "待安排")}</dd></div>
      </dl>
      ${changes ? `<div class="evidence-changes"><h4>本次改动</h4><ul>${changes}</ul></div>` : ""}
      <div class="evidence-chain-flow" aria-label="证据链">
        <span>原始来源</span>
        <span>人工复核</span>
        <span>结构化数据</span>
        <span>前台展示</span>
      </div>
      <div class="evidence-chain-data">
        ${chain.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
      </div>
      ${sourceLinks ? `<div class="evidence-source-links">${sourceLinks}</div>` : ""}
      ${localizedField(item, "notes") ? `<p class="evidence-note">${escapeHtml(localizedField(item, "notes"))}</p>` : ""}
    </article>
  `;
}

function evidenceChainFor(item = {}) {
  const chain = [];
  if (marketItems().some((product) => product.id === item.itemId)) chain.push("global-market.json");
  if (treatmentItems().some((treatment) => JSON.stringify(treatment).includes(item.itemId || "") || productTreatmentIds(item.itemId).includes(treatment.id))) {
    chain.push("treatments.json");
  }
  if (matrixItems().some((entry) => productMatrixId(item.itemId) === entry.id)) chain.push("evidence-matrix.json");
  chain.push("manual-review-log.json");
  return [...new Set(chain)];
}

function productTreatmentIds(productId = "") {
  const map = {
    vyvgart: ["efgartigimod-iv", "efgartigimod-hytrulo"],
    rystiggo: ["rozanolixizumab"],
    zilbrysq: ["zilucoplan"],
    ultomiris: ["ravulizumab"],
    imaavy: ["nipocalimab"],
    uplizna: ["inebilizumab"]
  };
  return map[productId] || [];
}

function productMatrixId(productId = "") {
  return {
    vyvgart: "efgartigimod",
    rystiggo: "rozanolixizumab",
    zilbrysq: "zilucoplan",
    ultomiris: "ravulizumab",
    imaavy: "nipocalimab",
    uplizna: "inebilizumab"
  }[productId] || "";
}

function formatDecisionLabel(value = "") {
  return {
    confirmed: "已确认",
    updated: "已更新",
    "needs-follow-up": "需随访",
    "no-change": "无需改动"
  }[value] || value || "待复核";
}

function reviewQueueItems() {
  const queue = [];
  const add = (item) => {
    if (!item?.title) return;
    queue.push({
      priority: priorityForReview(item.status, item.type),
      cadence: "每月",
      ...item
    });
  };

  for (const source of state.data.updateStatus?.sources || []) {
    if (/failed|error|manual|review|人工|失败|待/i.test(source.status || "")) {
      add({
        type: "数据源",
        title: source.name,
        status: formatStatusLabel(source.status),
        reason: source.fallbackPolicy || "该来源需要确认自动化状态或人工处理规则。",
        cadence: source.frequency || "按运行日志",
        lastChecked: state.data.updateStatus?.updatedAt
      });
    }
  }

  for (const product of marketItems()) {
    const meta = resolveTrustMeta(product, "market");
    add({
      type: "全球批准/市场",
      title: `${product.brand || product.generic || "未命名产品"} · ${product.company || "公司待补充"}`,
      status: meta.reviewStatus,
      reason: "批准国家、批准时间、适应症文本和销售额口径会持续变化，需回到监管数据库、财报和公司公告复核。",
      cadence: "每月/财报季",
      lastChecked: meta.lastChecked,
      url: product.sourceUrls?.[0]
    });
  }

  for (const treatment of treatmentItems()) {
    const meta = resolveTrustMeta(treatment, "treatments");
    add({
      type: "治疗证据/安全",
      title: `${treatment.brand || treatment.generic || "未命名治疗"} · ${treatment.zhName || treatment.class || ""}`.trim(),
      status: meta.reviewStatus,
      reason: "机制、适应症、关键 RCT、真实世界证据和上市后风险信号应逐条对照标签、审评文件和原始文献。",
      cadence: "每月",
      lastChecked: meta.lastChecked,
      url: treatment.links?.[0]?.url
    });
  }

  for (const trial of trialItems().filter((item) => trialRegistry(item) === "ChiCTR")) {
    const meta = resolveTrustMeta(trial, "trials");
    add({
      type: "ChiCTR",
      title: trial.title || trial.nctId || trial.id,
      status: meta.reviewStatus,
      reason: "中国临床试验注册中心目前作为人工复核入口保留，需打开官网核对注册版本、状态和研究者信息。",
      cadence: "每周/手动",
      lastChecked: meta.lastChecked,
      url: trial.url
    });
  }

  for (const pathway of guidanceItems()) {
    const meta = resolveTrustMeta(pathway, "guidance");
    add({
      type: "指南路径",
      title: pathway.clinicalQuestion || pathway.step,
      status: meta.reviewStatus,
      reason: "指南、共识和中国实践路径需要按新版指南、专家共识和监管变化更新。",
      cadence: "每季度",
      lastChecked: meta.lastChecked,
      url: pathway.sources?.[0]?.url
    });
  }

  for (const item of matrixItems()) {
    const meta = resolveTrustMeta(item, "matrix");
    add({
      type: "证据矩阵",
      title: `${item.brand || "未命名药物"} · ${item.mechanism || ""}`.trim(),
      status: meta.reviewStatus,
      reason: "横向比较依赖关键 RCT、长期随访和真实世界研究，新增证据后需要同步调整证据层级。",
      cadence: "每月/文献更新后",
      lastChecked: meta.lastChecked
    });
  }

  return queue.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || a.type.localeCompare(b.type, "zh-CN"));
}

function manualReviewSources() {
  return [
    {
      name: "CDE/NMPA",
      status: "manual-review",
      frequency: "WEEKLY / MANUAL",
      countLabel: "官方入口",
      reason: "CDE/NMPA 站内检索、受理号、审评进度、批准日期和适应症文本需要打开官方页面逐条确认。",
      url: "https://www.cde.org.cn/main/fullsearch/fullsearchpage"
    },
    {
      name: "ChiCTR",
      status: "manual-review",
      frequency: "WEEKLY / MANUAL",
      countLabel: `${trialItems().filter((item) => trialRegistry(item) === "ChiCTR").length} 条`,
      reason: "中国临床试验注册中心作为本土注册试验入口保留；注册号、版本、状态和研究者信息需人工核对。",
      url: "https://www.chictr.org.cn/"
    },
    {
      name: "全球批准与销售额",
      status: "needs-review",
      frequency: "MONTHLY / QUARTERLY",
      countLabel: `${marketItems().length} 个产品`,
      reason: "批准国家、批准机构、适应症和销售额口径会变化，需按监管数据库、财报和公司公告复核。",
      url: "trials-market.html"
    },
    {
      name: "中国准入与商业化",
      status: "needs-review",
      frequency: "MONTHLY",
      countLabel: `${chinaAccessItems().length} 个中国获批产品`,
      reason: "NMPA 批准、医保谈判、医院准入、患者援助和中国销售口径属于高变化字段，不能完全自动改写。",
      url: "china-access.html"
    },
    {
      name: "安全性与上市后监测",
      status: "partial-review",
      frequency: "MONTHLY",
      countLabel: `${treatmentItems().length} 个治疗项`,
      reason: "标签、FAERS/openFDA 信号、真实世界研究和风险管理结论需人工解释；自发报告不能直接代表发生率。",
      url: "safety.html"
    },
    {
      name: "指南路径与证据矩阵",
      status: "manual-curation",
      frequency: "QUARTERLY",
      countLabel: `${guidanceItems().length + matrixItems().length} 个节点`,
      reason: "指南、共识、证据等级和真实世界研究更新需要人工判断临床意义后再调整页面内容。",
      url: "guidance.html"
    }
  ];
}

function sourceStatusTone(status = "") {
  if (/failed|error|失败/i.test(status)) return "failed";
  if (/manual|review|人工|待/i.test(status)) return "manual";
  if (/configured|success|ok|成功|已配置/i.test(status)) return "ok";
  return "unknown";
}

function formatStatusLabel(status = "") {
  const map = {
    "strategy-defined": "策略已定义",
    configured: "已配置",
    "manual-review": "人工复核",
    "needs-review": "需定期复核",
    "partial-review": "部分核查",
    "manual-curation": "人工整理",
    skipped: "跳过",
    partial: "部分成功",
    failed: "失败",
    success: "成功"
  };
  return map[status] || status || "未记录";
}

function priorityForReview(status = "", type = "") {
  const text = `${status} ${type}`;
  if (/failed|error|失败|全球批准|市场|ChiCTR|数据源|需|待/i.test(text)) return "高";
  if (/部分|人工|指南|证据/i.test(text)) return "中";
  return "低";
}

function priorityRank(priority = "") {
  return { 高: 3, 中: 2, 低: 1 }[priority] || 0;
}

function priorityClass(priority = "") {
  return { 高: "high", 中: "medium", 低: "low" }[priority] || "low";
}

function renderTrustMeta(item = {}, moduleName) {
  const meta = resolveTrustMeta(item, moduleName);
  const parts = [
    ["来源", meta.sourceType],
    ["证据", meta.evidenceLevel],
    ["复核", meta.reviewStatus],
    ["核查", meta.lastChecked ? formatDate(meta.lastChecked) : ""]
  ].filter(([, value]) => value);

  if (!parts.length) return "";

  const note = meta.reviewNote ? ` title="${escapeAttribute(meta.reviewNote)}"` : "";
  const pills = parts
    .map(([label, value]) => `<span class="trust-pill ${trustPillClass(label, value)}"${label === "复核" ? note : ""}>${label}: ${escapeHtml(value)}</span>`)
    .join("");
  return `<div class="trust-row" aria-label="数据来源与人工复核">${pills}</div>`;
}

function renderJournalMetric(item = {}) {
  const metric = findJournalMetric(item);
  if (!metric?.impactFactor) return "";
  const year = state.data.journalMetrics?.metricYear || "";
  const category = metric.category ? metric.category.split("|")[0] : "";
  const title = [
    metric.journalName,
    metric.abbreviatedJournal,
    category,
    metric.jifRank ? `JIF Rank ${metric.jifRank}` : "",
    metric.jcrRank ? `JCR Rank ${metric.jcrRank}` : "",
    metric.fiveYearImpactFactor ? `5-year IF ${formatMetricNumber(metric.fiveYearImpactFactor)}` : "",
    state.data.journalMetrics?.sourceFile || ""
  ].filter(Boolean).join(" | ");
  const label = [
    year,
    `IF ${formatMetricNumber(metric.impactFactor)}`,
    metric.quartile || ""
  ].filter(Boolean).join("\u00b7 ");
  return `<span class="journal-metric" title="${escapeAttribute(title)}">${escapeHtml(label)}</span>`;
}

function findJournalMetric(item = {}) {
  const index = state.journalMetricIndex;
  if (!index) return null;
  for (const value of [item.issn, item.eissn]) {
    const key = normalizeIssn(value);
    if (key && index.issn.has(key)) return index.issn.get(key);
  }
  for (const value of [item.journal, item.journalName, item.abbreviatedJournal]) {
    const key = normalizeJournalName(value);
    if (key && index.name.has(key)) return index.name.get(key);
  }
  return null;
}

function buildJournalMetricIndex(records = []) {
  const index = { name: new Map(), issn: new Map() };
  for (const record of records) {
    for (const value of [record.issn, record.eissn]) {
      const key = normalizeIssn(value);
      if (key && !index.issn.has(key)) index.issn.set(key, record);
    }
    for (const value of [record.journalName, record.abbreviatedJournal]) {
      const key = normalizeJournalName(value);
      if (key && !index.name.has(key)) index.name.set(key, record);
    }
  }
  return index;
}

function normalizeIssn(value = "") {
  return String(value || "").replace(/[^0-9X]/gi, "").toUpperCase();
}

function normalizeJournalName(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bthe\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatMetricNumber(value) {
  if (typeof value === "number") return value.toFixed(1).replace(/\.0$/, "");
  return String(value || "");
}

function renderReviewNote(item = {}, moduleName) {
  const meta = resolveTrustMeta(item, moduleName);
  const status = meta.reviewStatus || "待复核";
  const checked = meta.lastChecked ? ` · ${formatDate(meta.lastChecked)}` : "";
  return `<small class="review-note">${escapeHtml(status)}${escapeHtml(checked)}</small>`;
}

function resolveTrustMeta(item = {}, moduleName) {
  const moduleData = state.data[moduleName] || {};
  const fallback = trustDefaults[moduleName] || {};
  const root = moduleData.provenance || moduleData.trust || {};
  const itemTrust = item.trust || item.provenance || {};
  const sourceType = itemTrust.sourceType || item.sourceType || item.source || root.sourceType || fallback.sourceType;
  const evidenceLevel =
    itemTrust.evidenceLevel || item.evidenceLevel || item.evidenceGrade || root.evidenceLevel || fallback.evidenceLevel;
  const reviewStatus = itemTrust.reviewStatus || item.reviewStatus || root.reviewStatus || fallback.reviewStatus;
  const lastChecked =
    itemTrust.lastChecked || item.lastChecked || root.lastChecked || moduleData.updatedAt || item.lastUpdate || item.date || fallback.lastChecked;
  const reviewNote = itemTrust.reviewNote || item.reviewNote || root.reviewNote || fallback.reviewNote;
  return { sourceType, evidenceLevel, reviewStatus, lastChecked, reviewNote };
}

function trustPillClass(label, value = "") {
  const text = `${label} ${value}`;
  if (/待|需|部分/.test(text)) return "trust-pill--warning";
  if (/自动/.test(text)) return "trust-pill--auto";
  if (/已核查|人工/.test(text)) return "trust-pill--review";
  return "";
}

function matchesFeed(item) {
  const text = [item.title, item.summary, item.source, item.category, ...(item.tags || [])].join(" ").toLowerCase();
  return (
    (!state.filters.feedQuery || text.includes(state.filters.feedQuery)) &&
    (state.filters.feedCategory === "all" || item.category === state.filters.feedCategory) &&
    (state.filters.feedSource === "all" || item.source === state.filters.feedSource) &&
    (state.filters.feedLanguage === "all" || item.language === state.filters.feedLanguage)
  );
}

function matchesChina(item) {
  const text = [item.title, item.journal, item.authors, item.institutionHint, item.topic, item.summary, ...(item.tags || [])]
    .join(" ")
    .toLowerCase();
  return (
    (!state.filters.chinaQuery || text.includes(state.filters.chinaQuery)) &&
    (state.filters.chinaTopic === "all" || item.topic === state.filters.chinaTopic)
  );
}

function matchesTreatment(item) {
  const text = [
    item.brand,
    item.generic,
    item.zhName,
    item.class,
    item.target,
    item.mechanism,
    item.approvedUse,
    item.biomarker,
    item.pivotalEvidence,
    item.realWorldEvidence,
    item.postMarketing,
    ...(item.safetySignals || []),
    JSON.stringify(item.en || {})
  ]
    .join(" ")
    .toLowerCase();
  return (
    (!state.filters.treatmentQuery || text.includes(state.filters.treatmentQuery)) &&
    (state.filters.treatmentClass === "all" || item.class === state.filters.treatmentClass) &&
    (state.filters.biomarker === "all" || item.biomarker === state.filters.biomarker)
  );
}

function matchesTrial(item) {
  return (
    (state.filters.trialMechanism === "all" || item.mechanism === state.filters.trialMechanism) &&
    (state.filters.trialStatus === "all" || item.status === state.filters.trialStatus) &&
    (state.filters.trialSource === "all" || trialRegistry(item) === state.filters.trialSource)
  );
}

function trialRegistry(item = {}) {
  return item.registry || item.source || item.trust?.sourceType || "ClinicalTrials.gov";
}

function feedItems() {
  return state.data.feed?.items || [];
}

function latestItems() {
  return state.data.latest?.items || [];
}

function chinaItems() {
  return state.data.china?.items || [];
}

function huashanTeamItems() {
  return state.data.huashanTeam?.items || [];
}

function treatmentItems() {
  return state.data.treatments?.treatments || [];
}

function marketItems() {
  return state.data.market?.products || [];
}

function guidanceItems() {
  return state.data.guidance?.pathways || [];
}

function matrixItems() {
  return state.data.matrix?.items || [];
}

function trialItems() {
  return state.data.trials?.items || [];
}

function manualReviewItems() {
  return state.data.manualReview?.items || [];
}

function localizedField(item = {}, key, fallback = "") {
  if (state.language === "en" && item?.en && item.en[key] !== undefined && item.en[key] !== null) return item.en[key];
  return item?.[key] ?? fallback;
}

function localizedList(item = {}, key) {
  const value = localizedField(item, key);
  return Array.isArray(value) ? value : [];
}

function localizedObject(item = {}, key) {
  const value = localizedField(item, key);
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function fillSelect(name, values, labeler = (value) => value) {
  const select = document.querySelector(`[data-control="${name}"]`);
  if (!select) return;
  for (const value of values) {
    select.append(new Option(labeler(value), value));
  }
}

function onInput(name, handler) {
  const input = document.querySelector(`[data-control="${name}"]`);
  if (input) {
    input.addEventListener("input", (event) => {
      handler(event.target.value.trim());
      applyLanguage();
    });
  }
}

function onChange(name, handler) {
  const select = document.querySelector(`[data-control="${name}"]`);
  if (select) {
    select.addEventListener("change", (event) => {
      handler(event.target.value);
      applyLanguage();
    });
  }
}

function exists(name) {
  return Boolean(targetFor(name, false));
}

function targetFor(name, required = true) {
  const target = document.querySelector(`[data-render="${name}"]`);
  if (!target && required) throw new Error(`Missing render target ${name}`);
  return target;
}

function setCount(name, value) {
  setAll(`[data-count="${name}"]`, value);
}

function setScope(name, value) {
  setAll(`[data-scope="${name}"]`, value || "");
}

function setAll(selector, value) {
  for (const element of document.querySelectorAll(selector)) {
    element.textContent = value ?? "";
  }
}

function sortByDateDesc(a, b) {
  return new Date(b.indexedAt || b.date || b.lastUpdate || 0).getTime() - new Date(a.indexedAt || a.date || a.lastUpdate || 0).getTime();
}

function formatDate(value) {
  if (!value) return "未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(state.language === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(state.language === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatTrialStatus(status = "") {
  const map = state.language === "en" ? {
    RECRUITING: "Recruiting",
    NOT_YET_RECRUITING: "Not yet recruiting",
    ACTIVE_NOT_RECRUITING: "Active, not recruiting",
    COMPLETED: "Completed",
    TERMINATED: "Terminated",
    WITHDRAWN: "Withdrawn",
    SUSPENDED: "Suspended",
    MANUAL_REVIEW: "Manual review portal"
  } : {
    RECRUITING: "招募中",
    NOT_YET_RECRUITING: "尚未招募",
    ACTIVE_NOT_RECRUITING: "进行中不招募",
    COMPLETED: "已完成",
    TERMINATED: "已终止",
    WITHDRAWN: "已撤回",
    SUSPENDED: "暂停",
    MANUAL_REVIEW: "人工复核入口"
  };
  return map[status] || status || (state.language === "en" ? "Unknown" : "未知");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value || "#");
}
