---
title: AI 时代，还得磨破鞋底
date: 2026-11-08
standfirst: 一条指令就能把公开数据集变成一篇过得去的流行病学论文。这时候该问一问：我们的论文究竟值多少，流行病学家又还有什么用。
description: 一位癌症流行病学研究者谈 AI 写出的论文、泛滥的套路化研究，以及为何“有些人为什么会生病”这个问题，仍然得靠双脚去找答案。
og_alt: EpiDetective。随笔。AI 时代，还得磨破鞋底。万汶鑫的个人项目。
---

## 研讨会上的笑声

几年前我去听一个研讨会，一位博士生报告她做的咖啡与慢性阻塞性肺疾病研究。结果大多是阴性的。最后一张幻灯片放出来，会场的气氛一下子松了下来。大家举起手里的咖啡杯，互相看看，笑了。我也跟着笑了。

没有人在笑她。她做的，正是博士生被训练去做的事。可那一刻我一直忘不掉。它让我看清，这个研究问题和背后的动机，离会议室外的人所说的“问题”已经有多远。这个结果只让手里端着咖啡的人放了心。

此后我常想起那阵笑声，尤其是这几年，流行病学和人工智能都已经家喻户晓。新冠疫情让全世界认识了再生数，也知道了什么叫“压平曲线”。2022 年 11 月 ChatGPT 发布，大语言模型从此成了日常工具。它们从海量文字里学到规律，再一次次预测接下来该出现什么，就这样生成文本；撑起这一切的，是庞大的算力。做一名流行病学家，正赶上一个奇怪的时代。两个领域如今碰到了一起，我不敢说这次相遇让我们脸上有光。

## 流行病学是做什么的？

流行病学的工作大致分两支。一支收集人群数据，靠研究设计回答因果问题：X 会不会导致 Y？另一支给疾病（通常是传染病）建模，估算它在人群中有多常见、传播得有多快。

两支共用一种思维习惯。看到一个规律，就问什么能解释它，同时提防那些可能骗过我们的东西：混杂、反向因果、选择偏倚，诸如此类。这些都不是我们独有的。经济学家、社会学家和心理学家也用观察性数据，也担心许多同样的陷阱，尽管流行病学曾帮忙给这些陷阱起了精确的名字。

这就引出一个有点尴尬的问题，我猜不少同行私下想过，只是很少说出口：我们这门学科，到底为人类认识世界添了什么？物理学给了我们定律。化学给了我们能在实验台上重复的反应。我们给出的，是带着置信区间的相对危险度。

这种担心由来已久。1995 年，记者加里·陶布斯（Gary Taubes）在《科学》（*Science*）上发表[《流行病学面临极限》](https://www.science.org/doi/10.1126/science.7618077)，认为观察性研究太容易受偏倚影响，碰到弱关联就靠不住。到 2022 年，这篇文章已被引用一千多次。同一年，埃默里大学的一个团队回头检查了他举的例子，[发现](https://pubmed.ncbi.nlm.nih.gov/35675391/)他当年质疑的关联里，约四分之一如今已被普遍认为是因果关系，包括饮酒与乳腺癌、室内氡与肺癌。这门学科真正发挥作用时，成就是实实在在的。不过他清单上的大多数关联，至今仍未证实。更难回答的是：我们今天发表的东西，将来有多少能跻身这些成就之列。

## 论文泛滥

这个问题一年比一年难回答，因为我们发表的论文一年比一年多。英国生物样本库（UK Biobank）、美国国家健康与营养调查（NHANES）这类大型资源被翻来覆去地分析，很多时候只是为了问一句：喝咖啡或喝茶，会不会改变得脑癌的风险。在我看来，这类研究给公众的东西很少，有时甚至还不如没有：每多一项，那堆互相矛盾的新闻标题就多一条。

这类抱怨大家都听过，可背后的数字还是让我皱眉。2013 年，乔纳森·舍恩菲尔德（Jonathan Schoenfeld）和约翰·约安尼季斯（John Ioannidis）[从一本美国老菜谱里随机挑出食谱，选了 50 种食材](https://pubmed.ncbi.nlm.nih.gov/23193004/)，逐一去查文献。其中 40 种有人研究过与癌症的关系。大多数单项研究都声称发现了效应，不是升高风险，就是降低风险。可是四分之三的估计值统计证据很弱，或者没过通常的显著性门槛；放进荟萃分析合并之后，效应随之缩小了。近年，萨里大学的一个团队[清点了基于 NHANES 的套路化论文](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3003152)，也就是把单一预测因素和单一疾病挂钩的那种。2014 到 2021 年，这类论文每年大约 4 篇；2022 年 33 篇，2023 年 82 篇，2024 年到 10 月初已有 190 篇。作者认为，推手是可以直接交给 AI 处理的数据和 AI 辅助的工作流程，并提醒说，这个套路很容易被论文工厂利用。

在象牙塔里，发表的压力人人都有。年轻研究者靠论文活下去；资深研究者靠论文让课题组拿到经费。所以我们大多数人，都在某个时候发表过自己心里存疑的东西。

年轻研究者最难，因为课题很少由他们自己选。多数人接手的项目，出自为了打动资助方而写的申请书，里面的承诺太大，现有的时间和经费都撑不起来。

## 磨破鞋底

我们这行最好的问题，常常是用脚走出来的。可要是问大家什么算好问题，得到的多半是标准答案：要来自真实世界，要解决真实问题，要着眼于预防。人人点头。然后，几百万的经费照样花在追逐那些碰巧冒出来的发现上。

我的答案很老派：流行病学家不该成天待在屋里。开创这门学科的人，是磨破了鞋底的。他们亲手收集数据，访谈病人，自己动手测量。统计学家戴维·弗里德曼（David Freedman）回顾约翰·斯诺（John Snow）19 世纪 50 年代在伦敦做的霍乱研究时说，这项研究的力量主要来自清晰的推理和扎扎实实的实地奔走，统计技巧倒在其次。他把这种功夫叫作[“鞋底功夫”](https://www.jstor.org/stable/270939)（shoe leather）。

如今我们大多数人坐在电脑前，研究别人用问卷收来的数字。我们只能希望填问卷的人认真答了，没有为了赶紧填完、去干点更有意思的事而随便应付。调查研究者给这种现象起了个名字，叫[“满意即止”](https://doi.org/10.1002/acp.2350050305)（satisficing）：找到一个看着过得去的答案就停下。这个局限大家都熟悉，但熟悉不该成为忽视它的理由。

流行病学首先该为一件事服务：让人不生病。起点也一样朴素。数病人。找异常。再用仔细挑选的参照组去查原因。

两个老案例能说明，这条路可以走多远。1966 到 1969 年，波士顿的医生先后接诊了八名十几岁到二十出头的年轻女性，她们患的是阴道腺癌，这种癌症在这个年纪几乎闻所未闻。阿瑟·赫布斯特（Arthur Herbst）和同事给每位患者配了四名对照，然后去访谈她们的母亲。[八名患者里有七人的母亲](https://doi.org/10.1056/NEJM197104222841604)在怀孕早期服用过己烯雌酚，这是一种合成雌激素。32 名对照的母亲，无一人服用过。

几年后，在美国肯塔基州路易斯维尔附近的一家氯乙烯工厂，厂医约翰·克里奇（John Creech）和公司医务主任莫里斯·约翰逊（Maurice Johnson）一起，仔细询问了几名肝血管肉瘤男性患者的病史。这种肿瘤罕见到全美国一年也许只有 25 例。他们发现，这几个人都在[同一个聚合车间](https://www.cdc.gov/mmwr/preview/mmwrhtml/00046136.htm)工作过。1974 年，美国监管机构提议把接触限值降到原来的五百分之一，从百万分之 500 降到百万分之 1。业界说做不到；结果不到一年，一套闭环工艺就让这成了常规。改动之后才开始接触氯乙烯的工人里，这种肿瘤几乎绝迹。

两项发现都不需要生物样本库，也不需要机器学习流程。它们靠的是有人离病人够近，近到能察觉不对劲，又够好奇，肯追问下一个问题。这两种都是罕见肿瘤，相对危险度极高，差不多是我们这行能碰到的最响的信号。我们现在研究的东西，大多安静得多。正因如此，贴近真实病人、仔细观察的习惯就更可贵。追查病因，是我们做的事里最有意思的一件，不该被复杂的算法和统计行话埋没。

## AI 改变了什么

短期内，AI 最先改变的是常规工作的成本。筛文献、写代码、起草文字，机器都已经能提速。这一点上我同意大多数评论者，包括伦敦大学学院的[戴维·班恩（David Bann）和同事](https://doi.org/10.1093/ije/dyaf210)，他们今年在《国际流行病学杂志》（*International Journal of Epidemiology*）上发表了文章。在他们的测试里，前沿模型拿到一段用日常语言写的指令和一个模拟数据集，就写出了完整的流行病学论文。表面上看，表现最好的论文符合 STROBE 报告清单，只是有些参考文献是错的，论文也还有其他缺陷。我自己猜，我们这行很多常规劳动会就此消失。

他们更尖锐的警告，关乎谁会吃亏。按惯例，分析和写作由初级流行病学研究人员在资深同事带领下完成。这部分工作一旦没了，培养下一代的学徒制也就去了大半。作者认为，任其发展下去，这门学科可能会垮掉。在更广的劳动力市场上，已经能看到类似的苗头。斯坦福大学的一个团队用美国的工资发放数据发现：到 2026 年年中，在最易受 AI 影响的岗位上，[22 到 25 岁年轻人的就业](https://digitaleconomy.stanford.edu/wp-content/uploads/2025/08/Canaries_BrynjolfssonChandarChen.pdf)比按受影响较小岗位的增速推算出的应有水平，低了大约五分之一。同样岗位上年纪大些的员工，就业还在增长。作者把这称作早期预警信号，没有断言是 AI 造成的。

第二个变化是数量。ChatGPT 出现之前，产出就已经跑在审稿能力前面：2016 到 2022 年，Scopus 和 Web of Science 收录的文章[增加了约 47%](https://doi.org/10.1162/qss_a_00327)，远快于在职科学家人数的增长。上面 NHANES 的数字，已经预示了写一篇论文的成本趋近于零时会怎样。编辑面对的是潮水一样涌来的漂亮稿件，每篇都有一段信心满满的文字，解释自己的发现为什么重要；愿意审稿的人却越来越少。我怀疑投稿的平均质量还在一路下滑，这种时候，谁还有时间去核对数字？

数学界刚给了我们一次预演。10 月 6 日，OpenAI 公布了 [722 篇 AI 写的稿件](https://retractionwatch.com/2026/10/08/openai-withdraws-preprints-722-manuscripts-unsolved-math-problems/)，称在 372 个未解问题上取得了进展。不到一天，就有三篇因为一个正负号错误被撤回，另有 14 篇做了修改；发布时，约一半结果还没经过形式化验证。也有些工作确实站得住：其中最受瞩目的一项结果是黎曼猜想的一种弱形式，研究过它的数论学家[大体认为它是对的](https://www.quantamagazine.org/ai-proved-the-quasi-riemann-hypothesis-what-happens-now-20261019/)。麻烦正在这里。既然有些结果可能是真的，哪一篇都不能随手打发掉。每一篇仍要一位人类专家去核查、去读懂。这件事已经被人戏称为“数学末日”（mathocalypse）。

## 留给我们的还有什么

总的来说，我是悲观的，既为这门学科，也为那些满怀热情的年轻流行病学家，大家指望他们把这门学科传下去。我猜，其他实证性的、离不开数据的学科，前景也差不多。数学的例子说明，连演绎性的学科也不安全。

还有一点希望，它来自人的思维方式。我们的直觉、创造力和价值判断，出自一种跟个人经历纠缠在一起的推理，没错，也跟个人偏见纠缠在一起。正是这种混杂，让我们能提出一些想法，推理机器可能会嫌它们不合逻辑而丢掉。大多数是错的。少数几个，能推动整个领域。

在流行病学里，这也许意味着更有人情味地去理解暴露：人们为什么明知有害，还会因为工作或习惯，把自己置于危险之中。也许意味着把信息本身当作一种暴露，像当年追踪病毒那样，研究一种观点怎样在人群中传开。公共卫生已经在往这条路上走。海迪·拉森（Heidi Larson）2018 年就[提出警告](https://www.nature.com/articles/d41586-018-07034-4)：下一场大疫情的推手，可能更多是侵蚀疫苗信任的情绪传染，而不是疫苗本身的短缺。两年后，世界卫生组织已经在做应对新冠[“信息疫情”](https://www.who.int/health-topics/infodemic)（infodemic）的项目。

两种思路都把我们带出了流行病学，我不觉得这是巧合。我们这行大量借助生物学和心理学。我们研究疾病在人群中怎么分布，可人群是由一个个人组成的。要解释这些规律，就得懂人怎么想，懂生命系统怎样应对变化的环境。要弄明白不同人群为什么活得如此不同，还得请经济学家和社会学家帮忙。相对危险度也许能告诉我，把呼吸防护面罩挂在钩子上不戴的工人更常生病。它没法告诉我，他们为什么把面罩留在那儿。

所以我们不该把自己圈起来。这类问题的答案，常常就在篱笆那边，在别人的期刊里。别再让术语来决定一门学科到哪儿为止、另一门从哪儿开始。我们该好好打磨那些仍比机器强的能力：创造概念、组合概念、在概念之间推理，再判断哪些问题值得花时间。每一样都多给我们一条路，去接近这个领域里一直最要紧的那个问题。

有些人为什么会生病？

杰弗里·罗斯（Geoffrey Rose）在[一篇 1985 年发表的讲稿](https://doi.org/10.1093/ije/14.1.32)里，把这个问题拆成两个：为什么某些个人会生病，为什么某些人群的病要多得多。用生物样本库训练出来的模型，也许很快就能比我们任何人都更准地预测哪些人会生病。第二个问题，还得有人愿意去磨破鞋底。

## 参考资料

- Bann D, Lowther E, Wright L, Kovalchuk Y. [Why can’t epidemiology be automated (yet)?](https://doi.org/10.1093/ije/dyaf210) *Int J Epidemiol* 2026;55:dyaf210.
- Brynjolfsson E, Chandar B, Chen R. [Canaries in the coal mine? Six facts about the recent employment effects of artificial intelligence](https://digitaleconomy.stanford.edu/wp-content/uploads/2025/08/Canaries_BrynjolfssonChandarChen.pdf). Stanford Digital Economy Lab working paper, first released August 2025; version of August 2026.
- Centers for Disease Control. [Angiosarcoma of the liver among polyvinyl chloride workers, Kentucky](https://www.cdc.gov/mmwr/preview/mmwrhtml/00046136.htm). *MMWR* 1974;23:49-50; reprinted with commentary 1997.
- Freedman DA. [Statistical models and shoe leather](https://www.jstor.org/stable/270939). *Sociol Methodol* 1991;21:291-313.
- Gallegos A. [OpenAI withdraws three preprints a day after releasing 722 manuscripts on unsolved math problems](https://retractionwatch.com/2026/10/08/openai-withdraws-preprints-722-manuscripts-unsolved-math-problems/). Retraction Watch, 8 October 2026.
- Hanson MA, Gómez Barreiro P, Crosetto P, Brockington D. [The strain on scientific publishing](https://doi.org/10.1162/qss_a_00327). *Quant Sci Stud* 2024;5:823-843.
- Herbst AL, Ulfelder H, Poskanzer DC. [Adenocarcinoma of the vagina: association of maternal stilbestrol therapy with tumor appearance in young women](https://doi.org/10.1056/NEJM197104222841604). *N Engl J Med* 1971;284:878-881.
- Kakaes K. [AI proved the quasi-Riemann hypothesis. What happens now?](https://www.quantamagazine.org/ai-proved-the-quasi-riemann-hypothesis-what-happens-now-20261019/) *Quanta Magazine*, 19 October 2026.
- Krosnick JA. [Response strategies for coping with the cognitive demands of attitude measures in surveys](https://doi.org/10.1002/acp.2350050305). *Appl Cogn Psychol* 1991;5:213-236.
- Larson HJ. [The biggest pandemic risk? Viral misinformation](https://www.nature.com/articles/d41586-018-07034-4). *Nature* 2018;562:309.
- McCullough LE, et al. [Epidemiology beyond its limits](https://pubmed.ncbi.nlm.nih.gov/35675391/). *Sci Adv* 2022;8:eabn3328.
- Rose G. [Sick individuals and sick populations](https://doi.org/10.1093/ije/14.1.32). *Int J Epidemiol* 1985;14:32-38 (reprinted 2001;30:427-432).
- Schoenfeld JD, Ioannidis JPA. [Is everything we eat associated with cancer? A systematic cookbook review](https://pubmed.ncbi.nlm.nih.gov/23193004/). *Am J Clin Nutr* 2013;97:127-134.
- Suchak T, Aliu AE, Harrison C, et al. [Explosion of formulaic research articles, including inappropriate study designs and false discoveries, based on the NHANES US national health database](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3003152). *PLOS Biol* 2025;23:e3003152.
- Taubes G. [Epidemiology faces its limits](https://doi.org/10.1126/science.7618077). *Science* 1995;269:164-169.
- World Health Organization. [Infodemic](https://www.who.int/health-topics/infodemic). Health topic page.
