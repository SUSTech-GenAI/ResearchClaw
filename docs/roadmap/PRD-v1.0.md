Research Claw 产品需求文档（PRD v1.0）

1. 文档信息

项目名称：Research Claw
文档版本：v1.0
文档类型：产品需求文档（PRD）
适用阶段：MVP / 第一阶段立项与开发

⸻

2. 项目概述

2.1 项目背景

Research Claw 是一个面向科研工作流的多角色智能体系统，目标不是做通用聊天助手，也不是单纯做 coding agent，而是围绕科研闭环，帮助用户从一个粗粒度想法出发，完成研究计划生成、实验执行推进、结果评估与论文写作。

在团队讨论中，已经明确以下判断：
	1.	纯代码生成与常规工程实现可以大量复用现有 Coding Agent 能力，本项目的核心价值不在于重复造一个通用编程助手。
	2.	真正关键的是围绕 research loop 建立闭环能力，包括：高层研究方向制定、计划推进、实验要求生成、结果评估、论文撰写。
	3.	角色应尽量少而清晰，避免把能力错误建模为角色，导致系统结构膨胀。
	4.	文献检索、文件阅读、实验运行、引用构建等应作为共享 skills，由不同角色按需调用。
	5.	系统首先要支持最小可用闭环，优先实现“提出方向—执行实验—评估结果—形成文稿”，再逐步扩展审稿修改、外部集成和更复杂的资源调度能力。

2.2 产品定义

Research Claw 是一个由 Researcher、Executor、Writer 三类角色组成，并由共享 skills 提供文献检索、文件阅读、实验执行、写作辅助等能力的科研闭环系统。

2.3 核心目标

构建一个可以实际推进科研任务的系统，使用户能够：
	•	从一句粗糙 idea 启动项目
	•	获得高层研究计划与实验要求
	•	自动完成或辅助完成实验执行
	•	对实验结果进行批判性评估
	•	生成论文初稿并支持迭代修改

2.4 非目标

当前阶段不作为主要目标：
	•	构建通用 Coding Agent 平台
	•	做复杂的多层级 agent hierarchy 编排系统
	•	做高并发、多租户、大规模调度平台
	•	做完整 IM/企业协同平台
	•	做“全自动无人监督科研”系统

⸻

3. 产品目标与成功标准

3.1 产品目标

本产品的目标是搭建一个最小但完整的 research loop，让系统能够在用户提供粗粒度输入的情况下，围绕以下主链条持续运行：

Idea / Plan → Execution → Evaluation → Writing → Next Iteration

3.2 成功标准

若 MVP 达到以下标准，则视为成功：
	1.	用户输入一个粗略研究想法后，系统可以生成结构化研究 spec。
	2.	Researcher 可以生成 high-level 研究计划与实验要求。
	3.	Executor 可以将要求细化为可执行任务，并产出结构化实验结果。
	4.	Researcher 可以基于结果给出批判性评估，判断是否继续、补实验或调整方向。
	5.	Writer 可以基于研究结论、实验结果和文献信息生成论文初稿。
	6.	文献检索、文件阅读、引用生成等共享能力可被所有角色调用。
	7.	所有关键产物可沉淀到 workspace 中，并支持后续迭代。

⸻

4. 用户画像与使用场景

4.1 用户画像

主要用户包括：
	•	AI 研究员
	•	应用研究工程师
	•	算法工程师
	•	博士生 / 研究型学生
	•	小型研究团队或实验室

4.2 核心使用场景

场景 A：从想法到研究计划
用户输入一句粗糙想法，例如“想做一个更好的 agent-based research workflow 验证系统”。
系统应帮助用户：
	•	明确研究问题
	•	生成高层研究计划
	•	定义实验要求与验收标准
	•	梳理风险与边界

场景 B：从计划到实验执行
Researcher 形成方向后，Executor 将计划细化为：
	•	具体任务清单
	•	baseline 选择
	•	数据与指标设计
	•	代码与实验执行
	•	结果记录与初步分析

场景 C：结果评估与方向调整
Executor 交付实验结果后，Researcher 对结果进行批判性分析，回答：
	•	结果是否支持原始 hypothesis
	•	当前方向是否值得继续
	•	是否需要补实验
	•	是否应调整研究方向

场景 D：从结果到论文写作
Writer 基于 workspace 中已有内容生成：
	•	论文大纲
	•	abstract
	•	introduction
	•	related work
	•	experiments
	•	conclusion

场景 E：多轮迭代
用户或 Researcher 基于新结果、反馈或 reviewer comments，发起下一轮研究与写作迭代。

⸻

5. 产品设计原则

5.1 角色只承载职责，不承载所有能力

角色代表责任边界，skills 代表可复用能力。文献检索、文件阅读、结果解析等能力不独占于某一角色。

5.2 Research Loop 优先

系统的主循环必须由 Researcher 主导，核心不是“能生成很多内容”，而是“能推动研究决策不断前进”。

5.3 粗规划，细执行

高层计划可以粗粒度，但执行必须逐步细化。系统不要求一开始写完整细节，而要求能根据结果动态修正。

5.4 评估权与执行权分离

Executor 可以做初步分析，但对于“结果是否成立、是否支持 claim”的最终判断应由 Researcher 负责。

5.5 写作服务于研究，不反客为主

Writer 负责表达、组织和成文，不负责决定研究方向，也不应凭空制造论据。

5.6 所有关键产物可追踪、可复用

研究 spec、实验计划、实验日志、结果表格、文稿草稿等都应在 workspace 中结构化沉淀。

⸻

6. 系统角色设计

6.1 Researcher

角色定位

Researcher 充当人类研究员 / PI / Scientist 的角色，是整个系统的核心决策者。

主要职责
	1.	制定 high-level idea 与研究计划
	2.	阅读相关文件、文献和历史结果后给出研究方向
	3.	提出实验要求、验收标准和优先级
	4.	对实验结果进行批判性评估
	5.	判断当前结果是否支持 hypothesis
	6.	决定下一轮是继续、补实验、调整方向还是结束当前路径

不负责的内容
	•	写代码
	•	具体实现方案细化
	•	直接执行实验
	•	直接负责论文正文撰写

核心循环

Idea / Plan Generation → Result Evaluation

Researcher 的循环是整个系统最核心的 research loop。

核心输入
	•	用户输入的原始想法
	•	历史研究 spec
	•	文献摘要与引用卡片
	•	Executor 交付的结果包
	•	Writer 输出的文稿草稿

核心输出
	•	研究问题定义
	•	high-level 研究计划
	•	实验要求与验收标准
	•	对实验结果的评估结论
	•	下一轮研究方向

⸻

6.2 Executor

角色定位

Executor 充当研究助理 / 工程师的角色，负责把 Researcher 的高层目标落成具体执行。

主要职责
	1.	将 high-level plan 细化为可执行方案
	2.	制定实验步骤、任务拆解、baseline、指标和执行策略
	3.	编写或修改代码
	4.	执行实验，记录日志，处理失败恢复
	5.	整理结果并做初步分析
	6.	形成结构化交付给 Researcher 与 Writer

不负责的内容
	•	决定最终研究方向
	•	决定结果在 scientific judgment 上是否成立
	•	决定论文叙事的最终主线

核心输入
	•	Researcher 下发的 high-level 研究目标
	•	实验要求与验收标准
	•	仓库、环境、数据与历史记录
	•	必要的文献与技术资料

核心输出
	•	细化执行方案
	•	代码与运行脚本
	•	实验日志
	•	结果表格与图表
	•	初步分析报告
	•	structured result package

⸻

6.3 Writer

角色定位

Writer 负责论文撰写，把结构化研究材料组织成学术文本。

主要职责
	1.	生成论文大纲
	2.	撰写各 section
	3.	组织引用与 related work
	4.	将实验结果转化为论文叙事
	5.	处理修改与润色
	6.	在写作过程中暴露证据不足、逻辑断裂和信息缺失

不负责的内容
	•	决定研究方向
	•	决定是否做某个实验
	•	替代 Researcher 做 scientific judgment

核心输入
	•	Researcher 提供的研究问题、主线和结论
	•	Executor 提供的结果表格、图表和分析材料
	•	文献列表、bib 与 workspace 内容

核心输出
	•	论文大纲
	•	abstract
	•	introduction
	•	related work
	•	method
	•	experiments
	•	conclusion
	•	revision / rebuttal 草稿

⸻

7. Shared Skills 设计

7.1 设计原则

Shared Skills 是可被任意角色调用的能力模块，不承载责任归属，不做最终决策，只提供标准化能力接口。

角色与技能的关系
	•	Role：负责决策、判断和产出责任归属
	•	Skill：提供可复用的能力支持
	•	Workspace：承载项目级共享状态与产物

7.2 核心 Skill 列表

文献与知识类
	•	literature_search：检索论文、报告、网页资料
	•	paper_reader：读取论文并提取摘要、方法、结果
	•	citation_builder：生成标准引用与 bib
	•	related_work_mapper：将文献映射到论文 section
	•	survey_summarizer：生成相关工作概览

文件与上下文类
	•	file_reader：读取项目文件、说明文档、日志
	•	workspace_retrieval：读取项目历史产物
	•	memory_retrieval：读取项目记忆摘要
	•	artifact_manager：管理输出文件与结构化结果

计划与任务类
	•	spec_writer：生成或更新研究 spec
	•	task_decomposer：将高层任务拆解为具体执行项
	•	milestone_tracker：维护 milestone 与状态
	•	experiment_planner：生成实验矩阵与执行建议

执行与分析类
	•	repo_reader：理解代码仓库结构
	•	code_runner：运行代码与脚本
	•	environment_setup：处理依赖与环境
	•	experiment_runner：执行实验任务
	•	result_parser：解析日志、结果表格和图表
	•	chart_builder：生成图表与结果展示

写作类
	•	outline_writer：生成论文大纲
	•	section_writer：撰写具体章节
	•	abstract_writer：生成摘要
	•	rebuttal_writer：生成审稿回复与修订草稿
	•	latex_formatter：格式化 LaTeX 文本
	•	bib_exporter：导出 bib 文件

7.3 Skill 调用原则
	1.	所有角色都可以调用共享 skills。
	2.	同一个 skill 被不同角色调用时，调用目的不同，但 skill 自身不做角色判断。
	3.	最终结论仍归属于角色，而不是 skill。

例如：
	•	Researcher 调用 literature_search，目的是形成研究方向或评估结果。
	•	Executor 调用 literature_search，目的是实现 baseline 或补充技术方案。
	•	Writer 调用 literature_search，目的是完善 related work 与 citation。

⸻

8. Workspace 设计

8.1 定义

Workspace 是项目级共享状态与产物容器，承载所有角色共同依赖的信息。

8.2 主要内容

建议最小目录结构：
	•	spec/：研究问题、目标、约束、验收标准
	•	literature/：论文列表、摘要、引用卡片、bib
	•	plans/：高层计划、任务分解、milestones
	•	experiments/：实验配置、代码、日志、结果、图表
	•	reports/：阶段总结、交付包、批判性评估
	•	writing/：大纲、章节草稿、终稿
	•	memory/：项目摘要、关键决策、历史变更

8.3 设计要求
	1.	结构化可读写
	2.	支持版本更新
	3.	支持角色间共享
	4.	支持未来扩展权限边界
	5.	支持被 skills 高效读取

⸻

9. 核心工作流设计

9.1 Loop A：Research Loop（主循环）

由 Researcher 主导。

流程
	1.	接收用户 idea 或已有项目状态
	2.	调用共享 skills 阅读文献、项目文件与历史结果
	3.	生成或更新 high-level plan
	4.	向 Executor 下发实验要求与 success criteria
	5.	接收 Executor 交付的实验结果包
	6.	对结果进行批判性评估
	7.	决定下一步：继续、补实验、调整方向或转入写作

输出
	•	更新后的研究 spec
	•	新一轮实验要求
	•	对当前结果的批判性结论
	•	下一轮方向建议

9.2 Loop B：Execution Loop

由 Executor 主导。

流程
	1.	接收 Researcher 提供的 high-level 目标
	2.	调用 task_decomposer / experiment_planner 等 skills 进行细化
	3.	生成执行方案
	4.	调用 repo_reader / code_runner / experiment_runner 等完成实验
	5.	调用 result_parser 解析结果
	6.	形成结构化结果包并提交给 Researcher 和 Writer

输出
	•	执行方案
	•	日志与结果
	•	初步分析
	•	结构化交付包

9.3 Loop C：Writing Loop

由 Writer 主导。

流程
	1.	接收 Researcher 的研究问题与核心结论
	2.	接收 Executor 的结果表格与图表
	3.	调用 outline_writer / section_writer / citation_builder 等 skills
	4.	生成初稿
	5.	将文稿中暴露出的逻辑缺口反馈给 Researcher 或 Executor
	6.	根据反馈修改文稿

输出
	•	论文草稿
	•	章节文本
	•	引用与 bib
	•	修订建议

⸻

10. 功能需求

10.1 项目创建与初始化

功能描述

允许用户以一句粗粒度 idea 创建研究项目。

输入
	•	项目名称（可选）
	•	初始想法 / 研究目标
	•	附加材料（可选）

输出
	•	项目 workspace
	•	初版 spec
	•	当前阶段状态

验收要求
	•	支持从模糊描述启动
	•	支持自动生成初始研究问题定义

⸻

10.2 Researcher 工作台

功能描述

支持 Researcher 生成计划、阅读材料、评估结果并维护主循环。

子功能
	•	研究问题定义
	•	high-level plan 生成
	•	success criteria 定义
	•	结果批判性评估
	•	下一步方向生成

验收要求
	•	能从粗 idea 中提炼出结构化 spec
	•	能对结果做明确判断，而不是泛泛总结

⸻

10.3 Executor 工作台

功能描述

支持 Executor 拆解任务、执行实验并交付结果。

子功能
	•	任务细化
	•	baseline / 数据 / 指标配置
	•	代码运行
	•	实验日志采集
	•	失败恢复
	•	结果解析与结构化交付

验收要求
	•	实验过程可记录
	•	结果格式可供后续自动读取

⸻

10.4 Writer 工作台

功能描述

支持 Writer 按项目状态与实验结果生成论文内容。

子功能
	•	论文大纲生成
	•	章节写作
	•	引用组织
	•	图表说明生成
	•	revision / rebuttal 写作

验收要求
	•	生成内容应和 workspace 中证据保持一致
	•	不应凭空捏造实验结论

⸻

10.5 Skills 调用系统

功能描述

统一管理所有共享 skills 的注册、调用和权限。

子功能
	•	skill registry
	•	skill 参数定义
	•	调用日志记录
	•	调用结果缓存
	•	失败回退策略

验收要求
	•	三个角色都可调用共享 skills
	•	调用历史可追踪

⸻

10.6 Workspace 管理系统

功能描述

管理项目内所有结构化产物。

子功能
	•	文档归档
	•	结果存储
	•	实验版本记录
	•	文稿版本管理
	•	项目记忆摘要

验收要求
	•	支持多轮迭代
	•	支持角色间共享

⸻

11. 数据模型建议

11.1 Research Spec

建议包含字段：
	•	project_id
	•	title
	•	problem_statement
	•	hypothesis
	•	scope
	•	constraints
	•	success_criteria
	•	current_stage
	•	next_actions

11.2 Experiment Task

建议包含字段：
	•	task_id
	•	goal
	•	assignee_role
	•	input_requirements
	•	execution_plan
	•	status
	•	acceptance_criteria
	•	artifacts

11.3 Result Package

建议包含字段：
	•	experiment_id
	•	summary
	•	configs
	•	logs
	•	metrics
	•	tables
	•	figures
	•	preliminary_analysis
	•	open_questions

11.4 Writing Package

建议包含字段：
	•	paper_outline
	•	section_drafts
	•	citations
	•	bib_entries
	•	missing_evidence
	•	revision_notes

⸻

12. MVP 范围

12.1 MVP 必做范围
	1.	三角色基础框架：Researcher / Executor / Writer
	2.	workspace 基础结构
	3.	共享 skills 基础框架
	4.	初始 idea → spec 生成功能
	5.	Researcher high-level 计划与实验要求输出
	6.	Executor 执行方案细化与结果交付
	7.	Writer 论文大纲与基础 section 输出
	8.	文献检索、文件阅读、引用生成作为共享 skills
	9.	结果评估与下一轮计划更新

12.2 MVP 可暂缓内容
	•	审稿意见自动处理
	•	飞书 / 钉钉 / QQ 机器人集成
	•	大规模并发实验调度
	•	复杂权限系统
	•	多用户协作编辑
	•	高级资源管理与锁机制

⸻

13. 非功能需求

13.1 可扩展性
	•	支持新增 skill
	•	支持新增模型后端
	•	支持未来扩展更多外围系统集成

13.2 可观测性
	•	记录角色行为日志
	•	记录 skill 调用链
	•	记录实验执行状态
	•	记录产物版本变化

13.3 安全性
	•	外部命令执行需受控
	•	文件读写需有边界
	•	高风险工具默认关闭或隔离
	•	实验环境尽量与核心状态隔离

13.4 稳定性
	•	skill 调用失败可回退
	•	实验失败可记录并恢复
	•	长流程支持中断后继续

13.5 可用性
	•	支持一句话启动项目
	•	支持逐步补充上下文
	•	输出清晰，不要求用户理解系统内部机制

⸻

14. 里程碑规划

Milestone 1：骨架搭建

目标：打通最小结构。

交付：
	•	三角色基础定义
	•	workspace 基础结构
	•	skill registry
	•	初始 spec 生成功能

Milestone 2：研究与执行闭环

目标：Research Loop 和 Execution Loop 跑通。

交付：
	•	Researcher 计划生成
	•	Executor 任务细化与结果交付
	•	结果评估与下一轮计划更新

Milestone 3：写作打通

目标：把研究结果变成论文草稿。

交付：
	•	Writer 大纲与章节输出
	•	文献、引用、结果接入写作流程
	•	文稿反馈回主循环

Milestone 4：迭代增强

目标：提升质量与可用性。

交付：
	•	更完善的文献与结果管理
	•	更好的 revision 支持
	•	更稳定的实验执行与恢复机制

⸻

15. 风险与挑战

15.1 最大风险

系统可能退化成“会写很多材料，但不真正推进研究”的内容生产机。为避免这种情况，必须坚持以 Research Loop 为核心，把结果评估能力放在中心位置。

15.2 结果评估质量不足

如果 Researcher 不能正确区分“有趣结果”和“支持 hypothesis 的证据”，系统会快速偏航。

15.3 写作与证据脱节

如果 Writer 无法可靠读取 workspace 中的证据材料，容易生成看上去顺滑、实际上无支撑的文本。

15.4 执行复杂性上升过快

若过早引入复杂并发、重型 orchestration、资源锁与多租户调度，MVP 复杂度会失控。

15.5 Skill 边界不清

如果 skills 设计得像半个 agent，会重新引入角色混乱问题。因此必须坚持：skill 提供能力，role 负责判断。

⸻

16. 验收标准

MVP 完成时，应至少满足：
	1.	用户输入一个粗 idea，可创建项目并生成初版 spec。
	2.	Researcher 能输出 high-level 研究计划与实验要求。
	3.	Executor 能细化执行方案并交付结构化结果。
	4.	Researcher 能对结果做明确评估，并生成下一步决策。
	5.	Writer 能基于已有材料生成论文大纲和至少部分章节草稿。
	6.	文献检索等能力已下沉为共享 skills，并可被三个角色调用。
	7.	项目状态和核心产物沉淀在 workspace 中，可支持下一轮迭代。

⸻

17. 一句话总结

Research Claw 是一个以 Researcher 为核心决策者、Executor 为执行者、Writer 为表达者，并由 共享 skills 与项目 workspace 支撑的科研闭环系统。它的目标不是堆叠更多 agent，而是把研究真正推进下去。