// @ts-nocheck
/* Pixel-faithful port of 康尼 honor/index.html embed=mobile. */
import React from 'react';
import { goCEndPortal } from '../../../app/navigation';
import { formatCEndDateTime } from '../formatDateTime';
import { IconBack } from '../activities/components/Icons';
import { HonorNavFab } from './h5/HonorNavFab';
import { H5HonorEmployeeHome } from './h5/H5HonorEmployeeHome';
import { H5HonorManagerHome } from './h5/H5HonorManagerHome';

function honorDate(value) {
  if (!value || value === '—') return '—';
  return formatCEndDateTime(value);
}


// app-data.js — Honor Engine 评优活动 Agent 数据层
const AppData = {
  activities: [
    {
      id: 1,
      title: "2025年度最佳创新项目",
      desc: "寻找改变业务格局的关键创新项目，鼓励全员提名过去一年中最具影响力的创新成果，激励技术与商业的深度融合。",
      type: "项目",
      status: "voting",
      deadline: "2026-06-30",
      nominateEnd: "2026-06-10",
      nominations: 12,
      totalVotes: 847,
      creator: "张晓梅",
      creatorRole: "HR总监",
      dept: "全公司",
      tags: ["创新", "年度"],
      nominators: ["陈志远", "李思远", "王芳", "刘军", "赵欣"],
      cover: "gradient1",
      criteria: ["创新性：方案的独创性与突破性", "影响力：对业务指标的实际提升", "可复制性：能否在更大范围推广"],
      rewards: { points: 100, badge: { icon: "💡", name: "创新先锋" } },
    },
    {
      id: 2,
      title: "Q2季度最佳员工",
      desc: "表彰二季度在业绩、协作与个人成长三个维度均表现突出的员工，每部门可提名1名。",
      type: "个人",
      status: "nominating",
      deadline: "2026-06-20",
      nominateEnd: "2026-06-05",
      nominations: 6,
      totalVotes: 0,
      creator: "李明",
      creatorRole: "总经理",
      dept: "全公司",
      tags: ["季度", "员工"],
      nominators: ["各部门主管"],
      cover: "gradient2",
      criteria: ["业绩表现：目标达成与超额贡献", "团队协作：跨部门配合与支持", "个人成长：持续学习与突破"],
      rewards: { points: 50, badge: { icon: "🏆", name: "卓越贡献" } },
    },
    {
      id: 3,
      title: "最佳跨部门协作团队",
      desc: "致敬那些打破边界、协同共创的跨部门团队，选出年度最具凝聚力与执行力的协作典范。",
      type: "团队",
      status: "reviewing",
      deadline: "2026-05-20",
      nominateEnd: "2026-05-10",
      nominations: 8,
      totalVotes: 1204,
      creator: "王芳",
      creatorRole: "HRBP",
      dept: "全公司",
      tags: ["团队", "协作"],
      nominators: ["高峰", "林晓峰", "吴婷婷", "马建国", "赵欣", "陈志远", "李思远", "王芳"],
      cover: "gradient3",
      criteria: ["凝聚力：团队协作与互信程度", "执行力：目标拆解与落地效率", "创新力：跨界协同与问题解决"],
      rewards: {
        points: 50,
        badge: { icon: "🤝", name: "协作之星" },
        certificate: { title: "荣誉证书", subtitle: "专属证书" },
      },
    },
    {
      id: 4,
      title: "年度最佳导师",
      desc: "致敬那些在知识传递和人才培养上倾注心血的导师，感谢他们让公司的传承成为可能。",
      type: "个人",
      status: "draft",
      deadline: "2026-07-20",
      nominateEnd: "2026-07-10",
      nominations: 0,
      totalVotes: 0,
      creator: "张晓梅",
      creatorRole: "HR总监",
      dept: "技术部门",
      tags: ["导师", "成长"],
      nominators: [],
      cover: "gradient4",
    },
    {
      id: 5,
      title: "Q1季度最佳员工",
      desc: "表彰一季度在业绩与团队贡献上表现卓越的员工，激励全员追求卓越。",
      type: "个人",
      status: "published",
      deadline: "2026-03-31",
      nominateEnd: "2026-03-20",
      nominations: 9,
      totalVotes: 968,
      creator: "李明",
      creatorRole: "总经理",
      dept: "全公司",
      tags: ["季度", "员工"],
      nominators: [],
      cover: "gradient2",
      rewards: {
        points: 80,
        certificate: { title: "荣誉证书", subtitle: "专属证书" },
      },
    },
    {
      id: 6,
      title: "年度最佳客户之声项目",
      desc: "评选最能倾听并响应客户需求、显著提升客户满意度的服务创新项目。",
      type: "项目",
      status: "published",
      deadline: "2026-02-28",
      nominateEnd: "2026-02-18",
      nominations: 11,
      totalVotes: 1056,
      creator: "王芳",
      creatorRole: "HRBP",
      dept: "全公司",
      tags: ["客户", "服务"],
      nominators: [],
      cover: "gradient1",
      rewards: { badge: { icon: "❤️", name: "用户挚友" } },
    },
  ],

  // 各已结束活动的最终结果（冠军 + 前三）
  // members: 获奖人员明细（弹层用）；title 由姓名拼接，供列表缩写展示
  results: {
    3: {
      winner: {
        name: "协同创新平台",
        title: "张三、李四、王五、赵六、钱七",
        members: [
          { name: "张三", dept: "产品中心", job: "产品经理" },
          { name: "李四", dept: "技术架构部", job: "高级工程师" },
          { name: "王五", dept: "数据中台", job: "数据分析师" },
          { name: "赵六", dept: "设计中心", job: "交互设计师" },
          { name: "钱七", dept: "运营中心", job: "运营专员" },
        ],
        nominator: "高峰", nominatorDept: "产品中心", votes: 412,
        highlights: ["全员参与率↑60%", "协作效率×3", "跨部门项目↑45%"],
      },
      runners: [
        {
          name: "DevOps全链路改造",
          title: "陈一、陈二、陈三、陈四、陈五",
          members: [
            { name: "陈一", dept: "技术架构部", job: "架构师" },
            { name: "陈二", dept: "技术架构部", job: "后端工程师" },
            { name: "陈三", dept: "运维中心", job: "SRE" },
            { name: "陈四", dept: "测试中心", job: "测试工程师" },
            { name: "陈五", dept: "技术架构部", job: "前端工程师" },
          ],
          nominator: "林晓峰", nominatorDept: "技术架构部", votes: 356,
          highlights: ["发布频率↑10倍", "故障率↓80%", "人效↑200%"],
        },
        {
          name: "客户360画像系统",
          title: "刘一、刘二、刘三、刘四",
          members: [
            { name: "刘一", dept: "数据中台", job: "数据科学家" },
            { name: "刘二", dept: "数据中台", job: "BI分析师" },
            { name: "刘三", dept: "市场营销部", job: "增长运营" },
            { name: "刘四", dept: "产品中心", job: "产品经理" },
          ],
          nominator: "吴婷婷", nominatorDept: "数据中台", votes: 298,
          highlights: ["精准营销↑35%", "流失预警准确率92%", "年增收2000万"],
        },
      ],
    },
    5: {
      winner: {
        title: "陈志远",
        members: [{ name: "陈志远", dept: "物流科技事业部", job: "高级工程师" }],
        nominator: "陈志远", nominatorDept: "物流科技事业部", votes: 389,
        highlights: ["跨仓调度标杆", "降本1800万", "省级科技进步奖"],
      },
      runners: [
        {
          title: "赵欣",
          members: [{ name: "赵欣", dept: "市场营销部", job: "市场总监" }],
          nominator: "赵欣", nominatorDept: "市场营销部", votes: 312,
          highlights: ["签约额↑58%", "新客户120+", "团队NPS第一"],
        },
        {
          title: "刘军",
          members: [{ name: "刘军", dept: "金融科技部", job: "风控负责人" }],
          nominator: "刘军", nominatorDept: "金融科技部", votes: 267,
          highlights: ["风控降损3000万", "0重大事故", "带教6名新人"],
        },
      ],
    },
    6: {
      winner: {
        name: "客户智能服务中台",
        title: "孙八、周九、吴十、郑一、冯二、陈志远",
        members: [
          { name: "孙八", dept: "客户体验中心", job: "高级产品经理" },
          { name: "周九", dept: "客户体验中心", job: "客服主管" },
          { name: "吴十", dept: "数据中台", job: "算法工程师" },
          { name: "郑一", dept: "客户体验中心", job: "客户专员" },
          { name: "冯二", dept: "技术架构部", job: "全栈工程师" },
          { name: "陈志远", dept: "物流科技事业部", job: "高级工程师" },
        ],
        nominator: "李思远", nominatorDept: "客户体验中心", votes: 428,
        highlights: ["响应↓90%", "NPS+28分", "500万用户"],
      },
      runners: [
        {
          name: "全渠道工单系统",
          title: "黄一、黄二、黄三、黄四、黄五、黄六",
          members: [
            { name: "黄一", dept: "客户体验中心", job: "客服主管" },
            { name: "黄二", dept: "客户体验中心", job: "客户专员" },
            { name: "黄三", dept: "产品中心", job: "产品经理" },
            { name: "黄四", dept: "技术架构部", job: "后端工程师" },
            { name: "黄五", dept: "数据中台", job: "数据分析师" },
            { name: "黄六", dept: "运维中心", job: "运维工程师" },
          ],
          nominator: "马建国", nominatorDept: "客户体验中心", votes: 341,
          highlights: ["处理时效↑70%", "一次解决率91%", "成本↓25%"],
        },
        {
          name: "客户健康分模型",
          title: "何一、何二、何三、何四、何五",
          members: [
            { name: "何一", dept: "数据中台", job: "数据科学家" },
            { name: "何二", dept: "数据中台", job: "算法工程师" },
            { name: "何三", dept: "客户体验中心", job: "客户成功经理" },
            { name: "何四", dept: "产品中心", job: "产品经理" },
            { name: "何五", dept: "市场营销部", job: "营销专员" },
          ],
          nominator: "林晓峰", nominatorDept: "数据中台", votes: 287,
          highlights: ["流失预警准确92%", "续约率↑19%", "增收1500万"],
        },
      ],
    },
  },

  // 跨活动聚合：荣誉之星个人累计排行
  honorStars: [
    { name: "李思远", dept: "客户体验中心", awards: 2, gold: 1, totalVotes: 662, latest: "年度最佳客户之声 · 冠军" },
    { name: "林晓峰", dept: "技术架构部", awards: 3, gold: 0, totalVotes: 643, latest: "最佳跨部门协作团队 · 亚军" },
    { name: "赵欣", dept: "市场营销部", awards: 1, gold: 0, totalVotes: 312, latest: "Q1季度最佳员工 · 亚军" },
    { name: "高峰", dept: "产品中心", awards: 1, gold: 1, totalVotes: 412, latest: "最佳跨部门协作 · 冠军" },
    { name: "吴婷婷", dept: "数据中台", awards: 2, gold: 0, totalVotes: 565, latest: "Q1季度最佳员工 · 参与" },
    { name: "陈志远", dept: "物流科技事业部", awards: 2, gold: 2, totalVotes: 817, latest: "Q1季度最佳员工 · 冠军" },
  ],

  nominations: [
    {
      id: 1, activityId: 1,
      title: "智能仓储调度系统",
      nominees: "陈志远、林晓峰、周浩、孙悦",
      members: [
        { name: "陈志远", dept: "物流科技事业部", job: "高级工程师" },
        { name: "林晓峰", dept: "技术架构部", job: "架构师" },
        { name: "周浩", dept: "物流科技事业部", job: "工程师" },
        { name: "孙悦", dept: "物流科技事业部", job: "测试工程师" },
      ],
      nominator: "陈志远", nominatorDept: "物流科技事业部",
      votes: 287, rank: 1, myVote: false,
      desc: "通过自研AI调度算法将仓储分拣效率提升42%，年节约运营成本1800万元，已在全国15个仓库完成部署，并获得省级科技进步奖。",
      highlights: ["效率↑42%", "节省1800万/年", "15仓全覆盖"],
    },
    {
      id: 2, activityId: 1,
      title: "客户智能服务中台",
      nominees: "孙八、周九、吴十、郑一、冯二",
      members: [
        { name: "孙八", dept: "客户体验中心", job: "高级产品经理" },
        { name: "周九", dept: "客户体验中心", job: "客服主管" },
        { name: "吴十", dept: "数据中台", job: "算法工程师" },
        { name: "郑一", dept: "客户体验中心", job: "客户专员" },
        { name: "冯二", dept: "技术架构部", job: "全栈工程师" },
      ],
      nominator: "李思远", nominatorDept: "客户体验中心",
      votes: 234, rank: 2, myVote: true,
      desc: "构建统一客服AI中台，将平均响应时长从8分钟压缩至45秒，NPS评分提升28分，累计服务500万+用户，复购率提升17%。",
      highlights: ["响应↓90%", "NPS+28分", "500万用户"],
    },
    {
      id: 3, activityId: 1,
      title: "供应链全链路可视化",
      nominees: "王芳、高峰、钱进",
      members: [
        { name: "王芳", dept: "供应链管理部", job: "产品经理" },
        { name: "高峰", dept: "产品中心", job: "产品总监" },
        { name: "钱进", dept: "数据中台", job: "数据科学家" },
      ],
      nominator: "王芳", nominatorDept: "供应链管理部",
      votes: 198, rank: 3, myVote: false,
      desc: "实现全链路供应链实时可视化看板，库存积压降低35%，缺货率从12%降至2.3%，年度降本贡献超4000万。",
      highlights: ["库存↓35%", "缺货率2.3%", "降本4000万"],
    },
    {
      id: 4, activityId: 1,
      title: "AI风控决策引擎",
      nominees: "刘军、黄磊、周凯、吴倩、郑涛、冯娜、曹磊、蒋婷、沈浩、韩雪、朱强、秦薇、尤斌、许晴、何鹏、罗丹、高翔、梁静、宋杰、唐琳",
      members: [
        { name: "刘军", dept: "金融科技部", job: "风控负责人" },
        { name: "黄磊", dept: "金融科技部", job: "数据工程师" },
        { name: "周凯", dept: "金融科技部", job: "算法工程师" },
        { name: "吴倩", dept: "金融科技部", job: "风控分析师" },
        { name: "郑涛", dept: "技术架构部", job: "后端工程师" },
        { name: "冯娜", dept: "数据中台", job: "数据科学家" },
        { name: "曹磊", dept: "金融科技部", job: "策略工程师" },
        { name: "蒋婷", dept: "产品中心", job: "产品经理" },
        { name: "沈浩", dept: "金融科技部", job: "测试工程师" },
        { name: "韩雪", dept: "客户体验中心", job: "客户成功经理" },
        { name: "朱强", dept: "金融科技部", job: "高级工程师" },
        { name: "秦薇", dept: "数据中台", job: "BI分析师" },
        { name: "尤斌", dept: "技术架构部", job: "架构师" },
        { name: "许晴", dept: "金融科技部", job: "合规专员" },
        { name: "何鹏", dept: "运维中心", job: "SRE" },
        { name: "罗丹", dept: "金融科技部", job: "前端工程师" },
        { name: "高翔", dept: "数据中台", job: "算法工程师" },
        { name: "梁静", dept: "产品中心", job: "交互设计师" },
        { name: "宋杰", dept: "金融科技部", job: "风控专员" },
        { name: "唐琳", dept: "市场营销部", job: "运营专员" },
      ],
      nominator: "刘军", nominatorDept: "金融科技部",
      votes: 128, rank: 4, myVote: false,
      desc: "自研AI风控模型，贷款审批欺诈率从0.8%降至0.12%，决策响应<200ms，年挽回潜在损失超3000万元。",
      highlights: ["欺诈率↓85%", "<200ms响应", "挽损3000万"],
    },
    // ── activityId 3：最佳跨部门协作团队（复核中，与 results[3] 对齐）──
    {
      id: 5, activityId: 3,
      title: "协同创新平台",
      nominees: "张三、李四、王五、赵六、钱七",
      members: [
        { name: "张三", dept: "产品中心", job: "产品经理" },
        { name: "李四", dept: "技术架构部", job: "高级工程师" },
        { name: "王五", dept: "数据中台", job: "数据分析师" },
        { name: "赵六", dept: "设计中心", job: "交互设计师" },
        { name: "钱七", dept: "运营中心", job: "运营专员" },
      ],
      nominator: "高峰", nominatorDept: "产品中心",
      votes: 412, rank: 1, myVote: false, reviewStatus: "approved",
      desc: "打通产品、研发、设计与运营的协同创新平台，全员参与率提升60%，跨部门项目交付周期缩短45%，协作人效提升3倍。",
      highlights: ["全员参与率↑60%", "协作效率×3", "跨部门项目↑45%"],
    },
    {
      id: 6, activityId: 3,
      title: "DevOps全链路改造",
      nominees: "陈一、陈二、陈三、陈四、陈五",
      members: [
        { name: "陈一", dept: "技术架构部", job: "架构师" },
        { name: "陈二", dept: "技术架构部", job: "后端工程师" },
        { name: "陈三", dept: "运维中心", job: "SRE" },
        { name: "陈四", dept: "测试中心", job: "测试工程师" },
        { name: "陈五", dept: "技术架构部", job: "前端工程师" },
      ],
      nominator: "林晓峰", nominatorDept: "技术架构部",
      votes: 356, rank: 2, myVote: false, reviewStatus: "approved",
      desc: "端到端 DevOps 改造，发布频率提升10倍，生产故障率下降80%，研发人效提升200%，成为公司级工程效能标杆。",
      highlights: ["发布频率↑10倍", "故障率↓80%", "人效↑200%"],
    },
    {
      id: 7, activityId: 3,
      title: "客户360画像系统",
      nominees: "刘一、刘二、刘三、刘四",
      members: [
        { name: "刘一", dept: "数据中台", job: "数据科学家" },
        { name: "刘二", dept: "数据中台", job: "BI分析师" },
        { name: "刘三", dept: "市场营销部", job: "增长运营" },
        { name: "刘四", dept: "产品中心", job: "产品经理" },
      ],
      nominator: "吴婷婷", nominatorDept: "数据中台",
      votes: 298, rank: 3, myVote: false, reviewStatus: "approved",
      desc: "数据、市场与产品共建客户360画像，精准营销转化提升35%，流失预警准确率92%，年增收贡献约2000万。",
      highlights: ["精准营销↑35%", "流失预警准确率92%", "年增收2000万"],
    },
    {
      id: 8, activityId: 3,
      title: "供应链协同作战室",
      nominees: "周敏、韩磊、徐倩、罗斌",
      members: [
        { name: "周敏", dept: "供应链管理部", job: "供应链经理" },
        { name: "韩磊", dept: "物流科技事业部", job: "高级工程师" },
        { name: "徐倩", dept: "数据中台", job: "数据分析师" },
        { name: "罗斌", dept: "产品中心", job: "产品经理" },
      ],
      nominator: "马建国", nominatorDept: "供应链管理部",
      votes: 48, rank: 4, myVote: false, reviewStatus: "approved",
      desc: "跨部门供应链作战室机制，库存周转加快22%，紧急缺货响应从48小时压至6小时。",
      highlights: ["周转↑22%", "缺货响应6h", "跨部周会机制"],
    },
    {
      id: 9, activityId: 3,
      title: "品牌增长联合突击队",
      nominees: "赵欣、唐琳、梁静、宋杰",
      members: [
        { name: "赵欣", dept: "市场营销部", job: "市场总监" },
        { name: "唐琳", dept: "市场营销部", job: "运营专员" },
        { name: "梁静", dept: "产品中心", job: "交互设计师" },
        { name: "宋杰", dept: "客户体验中心", job: "客户成功经理" },
      ],
      nominator: "赵欣", nominatorDept: "市场营销部",
      votes: 35, rank: 5, myVote: false, reviewStatus: "approved",
      desc: "市场、产品与客成联合突击，大促期间GMV同比+41%，客诉率下降18%。",
      highlights: ["GMV↑41%", "客诉↓18%", "联合作战SOP"],
    },
    {
      id: 10, activityId: 3,
      title: "安全合规护航小组",
      nominees: "许晴、尤斌、何鹏",
      members: [
        { name: "许晴", dept: "金融科技部", job: "合规专员" },
        { name: "尤斌", dept: "技术架构部", job: "架构师" },
        { name: "何鹏", dept: "运维中心", job: "SRE" },
      ],
      nominator: "陈志远", nominatorDept: "物流科技事业部",
      votes: 28, rank: 6, myVote: false, reviewStatus: "approved",
      desc: "法务合规、架构与运维共建护航机制，重大变更零违规，审计一次性通过。",
      highlights: ["零违规变更", "审计一次过", "联审清单"],
    },
    {
      id: 11, activityId: 3,
      title: "新员工融入跨部营",
      nominees: "韩雪、蒋婷、沈浩、曹磊",
      members: [
        { name: "韩雪", dept: "客户体验中心", job: "客户成功经理" },
        { name: "蒋婷", dept: "产品中心", job: "产品经理" },
        { name: "沈浩", dept: "金融科技部", job: "测试工程师" },
        { name: "曹磊", dept: "金融科技部", job: "策略工程师" },
      ],
      nominator: "李思远", nominatorDept: "客户体验中心",
      votes: 18, rank: 7, myVote: false, reviewStatus: "approved",
      desc: "跨部门导师营帮助新人90天胜任率提升至88%，部门墙感知显著下降。",
      highlights: ["90天胜任88%", "导师双轨", "融入NPS↑"],
    },
    {
      id: 12, activityId: 3,
      title: "办公协同体验共建组",
      nominees: "秦薇、罗丹、高翔",
      members: [
        { name: "秦薇", dept: "数据中台", job: "BI分析师" },
        { name: "罗丹", dept: "金融科技部", job: "前端工程师" },
        { name: "高翔", dept: "数据中台", job: "算法工程师" },
      ],
      nominator: "王芳", nominatorDept: "供应链管理部",
      votes: 9, rank: 8, myVote: false, reviewStatus: "approved",
      desc: "数据与研发共建内部协同体验改进，常用流程点击路径缩短30%。",
      highlights: ["路径↓30%", "月活工具↑", "体验工单闭环"],
    },
  ],

  imConvos: [
    {
      id: "honor", name: "荣誉引擎", isBot: true,
      lastMsg: "张晓梅邀请您为「2025年度最佳创新项目」提名...",
      time: "09:30", unread: 2,
    },
    {
      id: "assistant", name: "企业助手", isBot: true,
      lastMsg: "您的年假申请已审批通过，剩余5天可用",
      time: "昨天", unread: 0,
    },
    {
      id: "announce", name: "公司公告", isBot: false,
      lastMsg: "2026年端午节放假安排：6月19日-21日放假共3天",
      time: "昨天", unread: 1,
    },
  ],

  // 铃铛通知列表（评优触达）
  notifications: [
    {
      id: 6,
      type: "review-result",
      title: "投票结束",
      summary: "「最佳跨部门协作团队」投票已结束，请进行结果复核",
      time: "刚刚",
      unread: true,
      target: { screen: "activity-detail", params: { activityId: 3 }, role: "hr" },
    },
    {
      id: 5,
      type: "review",
      title: "提报审核",
      summary: "有人提报了「Q2季度最佳员工」的名单，请尽快审核",
      time: "刚刚",
      unread: true,
      target: { screen: "activity-detail", params: { activityId: 2 }, role: "hr" },
    },
    {
      id: 1,
      type: "invite",
      title: "提名邀请",
      summary: "张晓梅邀请您参与「2025年度最佳创新项目」提名",
      time: "今天 09:30",
      unread: true,
      target: { screen: "activity-detail", params: { activityId: 1 } },
    },
    {
      id: 2,
      type: "vote",
      title: "投票开始",
      summary: "「2025年度最佳创新项目」已进入投票，共 9 个项目入围",
      time: "今天 10:00",
      unread: true,
      target: { screen: "activity-detail", params: { activityId: 1 } },
    },
    {
      id: 3,
      type: "result",
      title: "结果公示",
      summary: "「Q1季度最佳员工」获奖结果已揭晓，冠军：陈志远",
      time: "昨天 18:00",
      unread: false,
      target: { screen: "activity-result", params: { activityId: 5 } },
    },
    {
      id: 4,
      type: "reminder",
      title: "截止提醒",
      summary: "「2025年度最佳创新项目」提名还剩 3 天截止",
      time: "昨天 18:00",
      unread: false,
      target: { screen: "activity-detail", params: { activityId: 1 } },
    },
  ],

  honorMessages: [
    {
      id: 1, from: "bot", time: "今天 09:30",
      type: "invite",
      title: "提名邀请",
      content: "您好，陈志远！HR总监 张晓梅 邀请您参与「2025年度最佳创新项目」评优活动，为您认为最优秀的创新项目提名。",
      activityId: 1,
      meta: { deadline: "6月10日截止", count: "已有9项目提名" },
      actionLabel: "立即提名",
    },
    {
      id: 2, from: "bot", time: "昨天 18:00",
      type: "reminder",
      title: "截止提醒",
      content: "「2025年度最佳创新项目」提名还剩 3 天截止，目前已有 9 个项目完成提名，快去提名吧！",
    },
    {
      id: 3, from: "user", time: "昨天 18:05",
      content: "好的，我来准备一下",
    },
    {
      id: 4, from: "bot", time: "昨天 18:06",
      type: "ai-offer",
      content: "需要我帮您用 AI 撰写提名内容吗？只需告诉我项目名称，我来帮您生成精彩的推荐描述 ✨",
      quickReplies: ["帮我写", "我自己填"],
    },
    {
      id: 5, from: "bot", time: "今天 09:00",
      type: "submitted",
      title: "提名成功",
      content: "您已成功提名「智能仓储调度系统」，感谢您的参与！活动进入投票阶段后，我会第一时间通知您。",
    },
    {
      id: 6, from: "bot", time: "今天 10:00",
      type: "broadcast",
      variant: "vote-start",
      title: "投票开始",
      audience: "致全体员工",
      content: "「2025年度最佳创新项目」提名已结束，正式进入投票阶段！共 9 个项目入围，快为你心目中的最佳创新投出一票。",
      activityId: 1,
      meta: { deadline: "6月16日 18:00 截止", count: "9 个项目入围" },
      actionLabel: "去投票",
    },
    {
      id: 7, from: "bot", time: "6月16日 18:00",
      type: "broadcast",
      variant: "vote-end",
      title: "投票结束",
      audience: "致全体员工",
      content: "「Q1季度最佳员工」投票已结束，感谢全体同事的踊跃参与！获奖结果已正式揭晓，快来看看花落谁家。",
      activityId: 5,
      meta: { total: "389 票最高得票", winner: "🏆 陈志远 · 物流科技事业部" },
      actionLabel: "查看结果",
    },
  ],

  // 按时间范围的洞察数据（仅 3 个核心指标：活动 / 提名 / 投票）
  insightRanges: [
    { id: "1d",  label: "近1天" },
    { id: "3d",  label: "近3天" },
    { id: "7d",  label: "近7天" },
    { id: "30d", label: "近1月" },
  ],
  insightsByRange: {
    "1d":  [
      { key: "activities", label: "活动数量", value: "2",  delta: "+1",   trend: "up" },
      { key: "nominations", label: "提名数量", value: "5",  delta: "+5",   trend: "up" },
      { key: "votes",       label: "投票数量", value: "138", delta: "+138", trend: "up" },
    ],
    "3d":  [
      { key: "activities", label: "活动数量", value: "3",  delta: "+1",   trend: "up" },
      { key: "nominations", label: "提名数量", value: "14", delta: "+9",   trend: "up" },
      { key: "votes",       label: "投票数量", value: "402", delta: "+264", trend: "up" },
    ],
    "7d":  [
      { key: "activities", label: "活动数量", value: "4",  delta: "+2",   trend: "up" },
      { key: "nominations", label: "提名数量", value: "23", delta: "+11",  trend: "up" },
      { key: "votes",       label: "投票数量", value: "847", delta: "+31%", trend: "up" },
    ],
    "30d": [
      { key: "activities", label: "活动数量", value: "8",  delta: "+3",   trend: "up" },
      { key: "nominations", label: "提名数量", value: "47", delta: "+12%", trend: "up" },
      { key: "votes",       label: "投票数量", value: "2.1k", delta: "+18%", trend: "up" },
    ],
  },

  statusConfig: {
    draft:       { label: "草稿", color: "#5A5A6A", bg: "rgba(90,90,106,0.15)" },
    nominating:  { label: "征集中", color: "#4ECBFF", bg: "rgba(78,203,255,0.12)" },
    voting:      { label: "投票中", color: "#F5B842", bg: "rgba(245,184,66,0.15)" },
    reviewing:   { label: "投票结果复核中", color: "#9B8FFF", bg: "rgba(155,143,255,0.14)" },
    published:   { label: "已公示", color: "#3DDC84", bg: "rgba(61,220,132,0.12)" },
    ended:       { label: "已结束", color: "#5A5A6A", bg: "rgba(90,90,106,0.15)" },
  },

  typeIcons: { "项目": "🚀", "个人": "⭐", "团队": "🏅" },

  // 已有勋章库（可在创建活动时复用）
  badges: [
    { id: "b1", name: "创新先锋", icon: "💡", color: "#F5B842" },
    { id: "b2", name: "协作之星", icon: "🤝", color: "#4ECBFF" },
    { id: "b3", name: "卓越贡献", icon: "🏆", color: "#FF8C42" },
    { id: "b4", name: "客户之声", icon: "💬", color: "#3DDC84" },
    { id: "b5", name: "匠心品质", icon: "🎯", color: "#9B8FFF" },
    { id: "b6", name: "成长之星", icon: "🌱", color: "#2DD6B0" },
    { id: "b7", name: "技术先锋", icon: "🚀", color: "#F5B842" },
    { id: "b8", name: "效率达人", icon: "⚡", color: "#4ECBFF" },
    { id: "b9", name: "质量卫士", icon: "🛡️", color: "#FF8C42" },
    { id: "b10", name: "金牌导师", icon: "🎓", color: "#3DDC84" },
    { id: "b11", name: "团队基石", icon: "🧱", color: "#9B8FFF" },
    { id: "b12", name: "破局先锋", icon: "🔥", color: "#2DD6B0" },
    { id: "b13", name: "数据之星", icon: "📊", color: "#F5B842" },
    { id: "b14", name: "用户挚友", icon: "❤️", color: "#FF6B6B" },
  ],
  // 创建勋章可选图标（旧版扁平列表，保留兼容）
  badgeIcons: ["💡", "🤝", "🏆", "💬", "🎯", "🌱", "🚀", "⭐", "🔥", "👑", "💎", "🦄"],
  // 创建勋章可选图标（分类，支持浏览更多）
  badgeIconGroups: [
    { id: "rec",    label: "推荐", icons: ["💡", "🤝", "🏆", "🎯", "🌱", "🚀", "⭐", "🔥", "👑", "💎", "🦄", "🏅"] },
    { id: "honor",  label: "荣誉", icons: ["🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "👑", "💎", "🎗️", "🌟", "✨", "🏵️"] },
    { id: "skill",  label: "能力", icons: ["💡", "🎯", "🧠", "📈", "📊", "🚀", "⚡", "🔬", "🛠️", "⚙️", "🧭", "🔑"] },
    { id: "spirit", label: "品格", icons: ["🤝", "❤️", "🌱", "🕊️", "🛡️", "🧩", "🎨", "🌈", "☀️", "🌍", "🤲", "🙌"] },
    { id: "object", label: "物件", icons: ["🎁", "🔔", "⚓", "🪙", "🎀", "📌", "🗝️", "💠", "🧲", "🎈", "🍀", "🌠"] },
  ],

  // 组织架构（树形，企业微信式通讯录）
  org: {
    tree: [
      { id: "d1", name: "技术研发中心", children: [
        { id: "d1-1", name: "后端架构组", members: [
          { id: "u1", name: "陈志远", title: "高级工程师", gender: "男", tenure: 5, jobType: "技术" },
          { id: "u2", name: "林晓峰", title: "架构师", gender: "男", tenure: 8, jobType: "技术" },
        ]},
        { id: "d1-2", name: "测试质量组", members: [
          { id: "u3", name: "周浩", title: "工程师", gender: "男", tenure: 2, jobType: "技术" },
          { id: "u4", name: "孙悦", title: "测试工程师", gender: "女", tenure: 3, jobType: "技术" },
        ]},
      ]},
      { id: "d2", name: "产品中心", members: [
        { id: "u5", name: "高峰", title: "产品总监", gender: "男", tenure: 10, jobType: "管理" },
        { id: "u6", name: "李思远", title: "高级产品经理", gender: "男", tenure: 6, jobType: "产品" },
        { id: "u7", name: "王芳", title: "产品经理", gender: "女", tenure: 4, jobType: "产品" },
      ]},
      { id: "d3", name: "市场营销部", children: [
        { id: "d3-1", name: "品牌组", members: [
          { id: "u8", name: "赵欣", title: "市场总监", gender: "女", tenure: 9, jobType: "管理" },
        ]},
        { id: "d3-2", name: "增长组", members: [
          { id: "u9", name: "刘洋", title: "营销专员", gender: "男", tenure: 1, jobType: "市场" },
        ]},
      ]},
      { id: "d4", name: "客户体验中心", members: [
        { id: "u10", name: "吴婷婷", title: "客户成功经理", gender: "女", tenure: 5, jobType: "运营" },
        { id: "u11", name: "马建国", title: "客服主管", gender: "男", tenure: 7, jobType: "管理" },
        { id: "u12", name: "郑爽", title: "客户专员", gender: "女", tenure: 2, jobType: "运营" },
      ]},
      { id: "d5", name: "金融科技部", members: [
        { id: "u13", name: "刘军", title: "风控负责人", gender: "男", tenure: 8, jobType: "技术" },
        { id: "u14", name: "黄磊", title: "数据工程师", gender: "男", tenure: 3, jobType: "技术" },
      ]},
      { id: "d6", name: "数据中台", members: [
        { id: "u15", name: "钱进", title: "数据科学家", gender: "男", tenure: 4, jobType: "技术" },
        { id: "u16", name: "冯雪", title: "BI分析师", gender: "女", tenure: 2, jobType: "技术" },
      ]},
    ],
  },
  // 规则条件可选项
  ruleOptions: {
    genders: ["不限", "男", "女"],
    tenures: [
      { id: "any", label: "不限", min: 0 },
      { id: "1+", label: "满1年", min: 1 },
      { id: "3+", label: "满3年", min: 3 },
      { id: "5+", label: "满5年", min: 5 },
    ],
    jobTypes: ["技术", "产品", "市场", "运营", "管理"],
  },
};

let HonorPersist;
/** 提名 / 活动 localStorage 持久化 + 双 iframe 联动（演示） */
(function honorNominationPersist() {
  const NOM_KEY = 'kangni-honor-nominations-v1';
  const ACT_KEY = 'kangni-honor-activities-v1';
  const COUNT_KEY = 'kangni-honor-activity-nom-counts-v1';
  const STATUS_KEY = 'kangni-honor-activity-status-v2';
  const ME_NAME = '陈志远';
  const ME_DEPT = '物流科技事业部';
  const SYNC_KEYS = [NOM_KEY, ACT_KEY, COUNT_KEY, STATUS_KEY];
  const clientId = Math.random().toString(36).slice(2);
  var writing = false;
  var bc = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('kangni-honor');
    }
  } catch (e) { /* ignore */ }

  function notifyLocal() {
    try {
      window.dispatchEvent(new CustomEvent('honor-data'));
    } catch (e) { /* ignore */ }
  }

  function notifyPeers() {
    notifyLocal();
    if (!bc) return;
    try {
      bc.postMessage({ type: 'honor-data', from: clientId, t: Date.now() });
    } catch (e) { /* ignore */ }
  }

  function save() {
    writing = true;
    try {
      localStorage.setItem(ACT_KEY, JSON.stringify(AppData.activities));
      localStorage.setItem(NOM_KEY, JSON.stringify(AppData.nominations));
      const counts = {};
      const statuses = {};
      AppData.activities.forEach(function (a) {
        counts[a.id] = a.nominations;
        statuses[a.id] = a.status;
      });
      localStorage.setItem(COUNT_KEY, JSON.stringify(counts));
      localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
    } catch (e) { /* quota / private mode */ }
    writing = false;
    notifyPeers();
  }

  function applyLegacyCountsStatus() {
    try {
      var countsRaw = localStorage.getItem(COUNT_KEY);
      if (countsRaw) {
        var counts = JSON.parse(countsRaw);
        AppData.activities.forEach(function (a) {
          if (counts[a.id] != null) a.nominations = counts[a.id];
        });
      }
      var statusRaw = localStorage.getItem(STATUS_KEY);
      if (statusRaw) {
        var statuses = JSON.parse(statusRaw);
        AppData.activities.forEach(function (a) {
          if (statuses[a.id]) a.status = statuses[a.id];
        });
      }
    } catch (e) { /* ignore */ }
  }

  function hydrate() {
    try {
      var actRaw = localStorage.getItem(ACT_KEY);
      if (actRaw) {
        var acts = JSON.parse(actRaw);
        if (Array.isArray(acts)) AppData.activities = acts;
      } else {
        applyLegacyCountsStatus();
      }

      var nomRaw = localStorage.getItem(NOM_KEY);
      if (nomRaw) {
        var stored = JSON.parse(nomRaw);
        if (Array.isArray(stored)) AppData.nominations = stored;
      }
    } catch (e) { /* ignore corrupt */ }
  }

  function reloadFromStorage() {
    if (writing) return;
    hydrate();
    HonorPersist.normalizeAll();
    notifyLocal();
  }

  function normalizeReviewStatus(n) {
    if (!n.reviewStatus) n.reviewStatus = 'approved';
    return n;
  }

  function normalizeActivityStatus(a) {
    if (a.status === 'ended') a.status = 'published';
    return a;
  }

  HonorPersist = {
    meName: ME_NAME,
    meDept: ME_DEPT,
    REVIEW: {
      pending: { id: 'pending', label: '待审核', color: '#4ECBFF', bg: 'rgba(78,203,255,0.12)' },
      approved: { id: 'approved', label: '已通过', color: '#3DDC84', bg: 'rgba(61,220,132,0.12)' },
      rejected: { id: 'rejected', label: '已驳回', color: '#E5534B', bg: 'rgba(229,83,75,0.12)' },
    },
    isPublished: function (status) {
      return status === 'published' || status === 'ended';
    },
    canShowResult: function (role, status) {
      return role === 'hr' || this.isPublished(status);
    },
    normalizeAll: function () {
      AppData.nominations.forEach(normalizeReviewStatus);
      AppData.activities.forEach(normalizeActivityStatus);
    },
    save: save,
    saveNominations: save,
    setActivityStatus: function (id, status) {
      var act = AppData.activities.find(function (a) { return a.id === id; });
      if (!act) return null;
      act.status = status;
      save();
      return act;
    },
    endVoting: function (id) {
      return this.setActivityStatus(id, 'reviewing');
    },
    publishResult: function (id) {
      return this.setActivityStatus(id, 'published');
    },
    addNomination: function (nom) {
      if (!nom.reviewStatus) nom.reviewStatus = 'pending';
      AppData.nominations.push(nom);
      var act = AppData.activities.find(function (a) { return a.id === nom.activityId; });
      if (act) {
        act.nominations = (act.nominations || 0) + 1;
        if (!act.nominators) act.nominators = [];
        if (nom.nominator && act.nominators.indexOf(nom.nominator) < 0) {
          act.nominators.push(nom.nominator);
        }
      }
      save();
      return nom;
    },
    updateNomination: function (id, patch) {
      var n = AppData.nominations.find(function (x) { return x.id === id; });
      if (!n) return null;
      Object.keys(patch).forEach(function (k) { n[k] = patch[k]; });
      save();
      return n;
    },
    deleteNomination: function (id) {
      var idx = AppData.nominations.findIndex(function (x) { return x.id === id; });
      if (idx < 0) return false;
      var nom = AppData.nominations[idx];
      AppData.nominations.splice(idx, 1);
      var act = AppData.activities.find(function (a) { return a.id === nom.activityId; });
      if (act && act.nominations > 0) act.nominations -= 1;
      save();
      return true;
    },
    deleteActivity: function (id) {
      var i = AppData.activities.findIndex(function (a) { return a.id === id; });
      if (i < 0) return false;
      AppData.activities.splice(i, 1);
      AppData.nominations = AppData.nominations.filter(function (n) {
        return n.activityId !== id;
      });
      save();
      return true;
    },
    isPinned: function (a) {
      return !!(a && a.pinnedAt);
    },
    setPinned: function (id, on) {
      var act = AppData.activities.find(function (a) { return a.id === id; });
      if (!act) return null;
      act.pinnedAt = on ? Date.now() : null;
      save();
      return act;
    },
    sortByPin: function (list) {
      return (list || []).slice().sort(function (a, b) {
        var pa = a.pinnedAt || 0;
        var pb = b.pinnedAt || 0;
        if (pb !== pa) return pb - pa;
        return new Date(b.deadline) - new Date(a.deadline);
      });
    },
  };

  hydrate();
  HonorPersist.normalizeAll();
  save();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', function (e) {
      if (e.key && SYNC_KEYS.indexOf(e.key) < 0) return;
      reloadFromStorage();
    });
  }
  if (bc) {
    bc.onmessage = function (ev) {
      var data = ev && ev.data;
      if (!data || data.type !== 'honor-data' || data.from === clientId) return;
      reloadFromStorage();
    };
  }
})();




// shell.jsx — StatusBar, TabBar, Header, ActivityBadge shared components

function StatusBar() {
  return (
    <div style={{
      height: 50, padding: '14px 24px 0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>09:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="4" width="3" height="8" rx="1" fill="currentColor" opacity="0.3"/>
          <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="currentColor" opacity="0.5"/>
          <rect x="9" y="1" width="3" height="11" rx="1" fill="currentColor" opacity="0.7"/>
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="currentColor"/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 3C5.8 3 3.8 3.9 2.4 5.3L1 3.8C2.8 2.1 5.3 1 8 1s5.2 1.1 7 2.8L13.6 5.3C12.2 3.9 10.2 3 8 3z" fill="currentColor" opacity="0.4"/>
          <path d="M8 6.5C6.6 6.5 5.4 7.1 4.6 8L3.2 6.5C4.4 5.3 6.1 4.5 8 4.5s3.6.8 4.8 2L11.4 8C10.6 7.1 9.4 6.5 8 6.5z" fill="currentColor" opacity="0.7"/>
          <circle cx="8" cy="10.5" r="1.5" fill="currentColor"/>
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke="currentColor" opacity="0.35"/>
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor"/>
          <path d="M24 4v4a2 2 0 000-4z" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

function TabBar({ tabs, activeTab, onSelect }) {
  return (
    <div style={{
      height: 80, paddingBottom: 16, display: 'flex', alignItems: 'flex-start',
      paddingTop: 8, borderTop: '1px solid var(--border)',
      background: 'rgba(247,245,242,0.96)', backdropFilter: 'blur(20px)',
      flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      {tabs.map(t => {
        const active = activeTab === t.id;
        return (
          <div key={t.id}
            onClick={() => onSelect(t)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, cursor: 'pointer', padding: '4px 0',
            }}
          >
            <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {t.star ? (
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M13 2L15.5 9.5H23L17 14L19.5 21.5L13 17L6.5 21.5L9 14L3 9.5H10.5L13 2Z"
                    fill={active ? 'var(--accent)' : 'var(--text-dim)'}
                    style={{ filter: active ? 'drop-shadow(0 0 6px var(--accent))' : 'none', transition: 'all 0.2s' }}
                  />
                </svg>
              ) : (
                <span style={{
                  fontSize: 22, lineHeight: 1,
                  filter: active ? 'drop-shadow(0 0 5px var(--accent))' : 'grayscale(0.4) opacity(0.85)',
                  transition: 'filter 0.2s',
                }}>{t.icon}</span>
              )}
              {t.badge > 0 && !active && (
                <div style={{
                  position: 'absolute', top: -2, right: -2,
                  minWidth: 16, height: 16, padding: '0 4px', background: '#E5534B',
                  borderRadius: 8, fontSize: 10, fontWeight: 700,
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{t.badge}</div>
              )}
            </div>
            <span style={{
              fontSize: 11, fontWeight: active ? 700 : 500,
              color: active ? 'var(--accent)' : 'var(--text-dim)',
              transition: 'color 0.2s',
            }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// 顶部消息入口（员工视角：保留消息触达）
function MsgButton({ nav, unread = 0 }) {
  return (
    <div onClick={() => nav.navigate('im-list')} style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      position: 'relative',
    }}>
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
        <path d="M3 5.5C3 4.7 3.7 4 4.5 4h11c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5H8l-3.2 2.6c-.5.4-1.3.1-1.3-.6V5.5Z"
          stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
      {unread > 0 && (
        <div style={{
          position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, padding: '0 4px',
          background: '#E5534B', borderRadius: 8, fontSize: 10, fontWeight: 700, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg)',
        }}>{unread}</div>
      )}
    </div>
  );
}

// 通知铃铛：进通知二级页；有未读时显示红点
function countUnreadNotifications() {
  return (AppData.notifications || []).filter(function (n) { return n.unread; }).length;
}

function BellButton({ nav }) {
  const unread = countUnreadNotifications();
  return (
    <div
      onClick={() => nav && nav.navigate('notifications')}
      style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        position: 'relative',
      }}
    >
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
        <path d="M10 2.5c-.8 0-1.5.6-1.6 1.4C6.5 4.5 5 6.3 5 8.5V12l-1.4 1.8c-.3.4 0 1 .5 1H16c.5 0 .8-.6.5-1L15 12V8.5c0-2.2-1.5-4-3.4-4.6C11.5 3.1 10.8 2.5 10 2.5Z"
          stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8.2 15.5a1.8 1.8 0 0 0 3.6 0" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      {unread > 0 && (
        <div style={{
          position: 'absolute', top: 5, right: 6, width: 7, height: 7,
          background: '#E5534B', borderRadius: '50%',
          border: '1.5px solid var(--bg-elevated)',
        }} />
      )}
    </div>
  );
}

// 角色切换 + 铃铛（顶栏右侧统一）
function HeaderRoleRight({ nav, roleSwitcher }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {roleSwitcher}
      <BellButton nav={nav} />
    </div>
  );
}

// 员工视角顶栏右侧：消息 +（角色切换+铃铛）
function EmpHeaderRight({ nav, roleSwitcher }) {
  const unread = AppData.imConvos.reduce((s, c) => s + (c.unread || 0), 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <MsgButton nav={nav} unread={unread} />
      {roleSwitcher}
    </div>
  );
}

function Header({ title, subtitle, onBack, right }) {
  return (
    <header className="c-h5-top">
      {onBack ? (
        <button className="c-icon-btn" type="button" aria-label="返回" onClick={onBack}>
          <IconBack />
        </button>
      ) : (
        <span className="c-icon-btn" aria-hidden />
      )}
      <h1 className="c-h5-title">
        {title}
        {subtitle ? <span className="c-h5-honor-sub">{subtitle}</span> : null}
      </h1>
      {right ? <div className="c-icon-btn">{right}</div> : <span className="c-icon-btn" aria-hidden />}
    </header>
  );
}

function honorIsPc() {
  return false;
}

function PcPage({ title, actions, children, pad = true }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {(title || actions) && (
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
        }}>
          {title ? <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{title}</div> : <div style={{ flex: 1 }} />}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: pad ? '16px 20px 24px' : 0 }}>{children}</div>
    </div>
  );
}

function PcTable({ columns, rows, empty, onRowClick }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{
        border: '1px dashed var(--border)', borderRadius: 12, padding: '40px 20px',
        textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-card)',
      }}>{empty || '暂无数据'}</div>
    );
  }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--bg-elevated, var(--bg))', borderBottom: '1px solid var(--border)' }}>
            {columns.map(c => (
              <th key={c.key} style={{
                textAlign: 'left', padding: '10px 14px', fontWeight: 700, color: 'var(--text-muted)',
                width: c.width || 'auto', whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id != null ? row.id : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                cursor: onRowClick ? 'pointer' : 'default',
                background: i % 2 ? 'rgba(0,0,0,0.015)' : 'transparent',
              }}
            >
              {columns.map(c => (
                <td key={c.key} style={{ padding: '12px 14px', color: 'var(--text)', verticalAlign: 'middle' }}
                  onClick={c.stopRowClick ? (e) => e.stopPropagation() : undefined}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PcBtn({ children, onClick, primary, danger }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
      style={{
        border: primary || danger ? 'none' : '1px solid var(--border)',
        background: danger ? '#E5534B' : primary ? 'var(--accent)' : 'var(--bg-card)',
        color: primary || danger ? (primary ? 'var(--on-accent, #fff)' : '#fff') : 'var(--text)',
        borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap',
      }}
    >{children}</button>
  );
}

const AD_STATUS_TAG = {
  draft: { label: '草稿', color: 'default' },
  nominating: { label: '征集中', color: 'processing' },
  voting: { label: '投票中', color: 'warning' },
  reviewing: { label: '复核中', color: 'purple' },
  published: { label: '已公示', color: 'success' },
  ended: { label: '已结束', color: 'default' },
};
const AD_CHART_COLORS = ['#1677ff', '#13c2c2', '#722ed1', '#fa8c16', '#52c41a', '#eb2f96'];

function AdTag({ color, children }) {
  return <span className={`ad-tag ad-tag-${color || 'default'}`}>{children}</span>;
}
function AdStatusTag({ status }) {
  const cfg = AD_STATUS_TAG[HonorPersist.isPublished(status) ? 'published' : status] || AD_STATUS_TAG.draft;
  return <AdTag color={cfg.color}>{cfg.label}</AdTag>;
}
function AdBtn({ type, onClick, children, htmlType }) {
  const cls = type === 'primary' ? 'ad-btn ad-btn-primary' : type === 'link' ? 'ad-btn-link' : 'ad-btn';
  return (
    <button type={htmlType || 'button'} className={cls} onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}>
      {children}
    </button>
  );
}
function AdAlert({ type, message, description, showIcon }) {
  return (
    <div className={`ad-alert ad-alert-${type || 'info'}`}>
      {showIcon ? <span className="ad-alert-icon">!</span> : null}
      <div>
        {message ? <div className="ad-alert-msg">{message}</div> : null}
        {description ? <div className="ad-alert-desc">{description}</div> : null}
      </div>
    </div>
  );
}
function AdStatistic({ title, value, tip }) {
  return (
    <div className="ad-statistic">
      <div className="ad-statistic-title">{title}</div>
      <div className="ad-statistic-value">{value}</div>
      {tip ? <div className="ad-statistic-tip">{tip}</div> : null}
    </div>
  );
}
function AdPager({ total, page, pageSize, onChange, onPageSize }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (pageSize || 10)));
  const nums = [];
  for (let i = 1; i <= pages; i++) nums.push(i);
  return (
    <div className="ad-pager">
      <span>共 {total} 条</span>
      <select value={pageSize} onChange={e => onPageSize(Number(e.target.value))}>
        {[10, 20, 50].map(n => <option key={n} value={n}>{n} 条/页</option>)}
      </select>
      {nums.map(n => (
        <button key={n} type="button" className={n === page ? 'ad-pager-on' : ''} onClick={() => onChange(n)}>{n}</button>
      ))}
    </div>
  );
}
function AdDonut({ segments, size = 168, thickness = 26 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const denom = total || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2 - 4;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map((seg, i) => {
    if (seg.value <= 0) return null;
    const len = (seg.value / denom) * C;
    const node = (
      <circle key={seg.label} cx={cx} cy={cy} r={r} fill="none"
        stroke={AD_CHART_COLORS[i % AD_CHART_COLORS.length]}
        strokeWidth={thickness} strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`}>
        <title>{seg.label}: {seg.value}</title>
      </circle>
    );
    offset += len;
    return node;
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{arcs}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.45)">合计</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="22" fontWeight="600" fill="rgba(0,0,0,0.88)">{total}</text>
      </svg>
      <div style={{ minWidth: 140, flex: 1 }}>
        {segments.map((seg, i) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: AD_CHART_COLORS[i % AD_CHART_COLORS.length], flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{seg.label}</span>
            <span style={{ color: 'rgba(0,0,0,0.88)', fontWeight: 500 }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** PC 居中弹窗 / 手机底部抽屉。mobileHeight 有值则固定高度；否则仅 maxHeight。 */
function HonorOverlay({
  onClose, children, zIndex = 120, maxWidth = 560,
  maxHeight = '82vh', mobileHeight, mobileMaxHeight = '82%',
  bg = 'var(--bg)', fitContent = false,
}) {
  const isPc = honorIsPc();
  if (isPc) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative', width: '100%', maxWidth,
            maxHeight: fitContent ? '90vh' : maxHeight,
            height: fitContent ? 'auto' : undefined,
            background: bg, borderRadius: 16, border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  const sheetSize = mobileHeight != null
    ? { height: mobileHeight, maxHeight: mobileHeight }
    : { height: 'auto', maxHeight: mobileMaxHeight };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'fadeIn 0.2s ease' }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', background: bg, borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--border)',
          ...sheetSize,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function HonorSheetHandle({ style }) {
  if (honorIsPc()) return null;
  return (
    <div style={{
      width: 36, height: 4, borderRadius: 2, background: 'var(--border)',
      margin: '0 auto 12px', ...style,
    }} />
  );
}

function RoleSwitcher({ role, onSwitch }) {
  return (
    <div onClick={onSwitch} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '4px 10px 4px 5px', cursor: 'pointer',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: 'var(--on-accent)',
      }}>{role === 'hr' ? 'H' : 'E'}</div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {role === 'hr' ? '管理视角' : '员工视角'}
      </span>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 4L5 7L8 4" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = AppData.statusConfig[status] || AppData.statusConfig.draft;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 8px',
      borderRadius: 6, color: cfg.color, background: cfg.bg,
      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap',
    }}>
      {status === 'voting' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>}
      {status === 'reviewing' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>}
      {cfg.label}
    </span>
  );
}

function ReviewStatusBadge({ status }) {
  const cfg = (HonorPersist && HonorPersist.REVIEW && HonorPersist.REVIEW[status])
    || { label: status || '已通过', color: '#3DDC84', bg: 'rgba(61,220,132,0.12)' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px',
      borderRadius: 5, color: cfg.color, background: cfg.bg,
      flexShrink: 0, whiteSpace: 'nowrap',
    }}>{cfg.label}</span>
  );
}

/** 活动待审提名数 */
function countPendingNoms(activityId) {
  return AppData.nominations.filter(n =>
    n.activityId === activityId && (n.reviewStatus || 'approved') === 'pending'
  ).length;
}

/** 征集中卡片：待审数展示 */
function PendingNomStat({ activityId }) {
  const n = countPendingNoms(activityId);
  const hot = n > 0;
  return (
    <div style={{ fontSize: 12, color: hot ? '#4ECBFF' : 'var(--text-muted)' }}>
      <span style={{ fontWeight: 700, color: hot ? '#4ECBFF' : 'var(--text)' }}>{n}</span> 份待审
    </div>
  );
}

function AiBadge({ label = 'AI 生成' }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
      color: 'var(--on-accent)', fontSize: 10, fontWeight: 800,
      padding: '2px 7px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>✦ {label}</span>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)', borderRadius: 'var(--r)',
      border: '1px solid var(--border)', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: onClick ? 'opacity 0.15s' : 'none',
      ...style,
    }}>{children}</div>
  );
}

function BtnPrimary({ children, onClick, style, small }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 700,
      fontSize: small ? 13 : 15, border: 'none', borderRadius: small ? 10 : 14,
      padding: small ? '9px 16px' : '14px 24px', cursor: 'pointer',
      width: style && style.width ? style.width : '100%',
      fontFamily: 'var(--font)', letterSpacing: '-0.2px', transition: 'opacity 0.15s',
      ...style,
    }}>{children}</button>
  );
}

function BtnGhost({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', color: 'var(--accent)', fontWeight: 600,
      fontSize: 14, border: '1.5px solid var(--accent-border)', borderRadius: 12,
      padding: '10px 18px', cursor: 'pointer', fontFamily: 'var(--font)',
      transition: 'all 0.15s', ...style,
    }}>{children}</button>
  );
}

function AiBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--accent-dim)', color: 'var(--accent)', fontWeight: 600,
      fontSize: 13, border: '1px solid var(--accent-border)', borderRadius: 10,
      padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--font)',
      display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
      ...style,
    }}>✦ {children}</button>
  );
}

function Divider({ mx = 20 }) {
  return <div style={{ height: 1, background: 'var(--border)', margin: `0 ${mx}px` }}/>;
}

/** 拆分多人姓名（顿号分隔） */
function parsePeopleNames(title) {
  if (!title || typeof title !== 'string') return [];
  return title.split('、').map(s => s.trim()).filter(Boolean);
}

/** 多人姓名：前 keep 个全显，超出为「等x人」（x=总人数）；默认 keep=3 */
function formatPeopleNames(title, keep = 3) {
  const parts = parsePeopleNames(title);
  if (parts.length === 0) return title;
  if (parts.length <= keep) return parts.join('、');
  return `${parts.slice(0, keep).join('、')}等${parts.length}人`;
}






// home.jsx — Agent 主页 (管理视角 + 员工视角)

function AgentHomePage({ nav, roleSwitcher }) {
  return nav.role === 'hr'
    ? <HRHomePage nav={nav} roleSwitcher={roleSwitcher} />
    : <EmployeeHomePage nav={nav} roleSwitcher={roleSwitcher} />;
}

// ─── HR / 管理者主页 ───────────────────────────────────────────────
function shortHonorTitle(title) {
  return String(title || '').replace(/^\d{4}年度/, '').replace(/^Q\d季度/, '');
}

function HRHomePage({ nav, roleSwitcher }) {
  void roleSwitcher;
  const { activities } = AppData;
  const active = HonorPersist.sortByPin(
    activities.filter(a => a.status === 'voting' || a.status === 'nominating')
  );
  const [range, setRange] = React.useState('30d');
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const insights = AppData.insightsByRange[range];
  const rangeLabel = AppData.insightRanges.find(r => r.id === range).label;
  const featured = [...active].sort((a, b) => (b.nominations || 0) - (a.nominations || 0))[0];

  return (
    <div style={{ background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="荣誉 Agent" onBack={goCEndPortal} />
      <H5HonorManagerHome
        me="张晓东"
        dateLabel={formatEmpHomeDate(new Date())}
        ongoingCount={active.length}
        featuredTitle={featured ? shortHonorTitle(featured.title) : ''}
        featuredNominations={featured ? featured.nominations : 0}
        rangeLabel={rangeLabel}
        rangeOpen={rangeOpen}
        ranges={AppData.insightRanges}
        selectedRange={range}
        onToggleRange={() => setRangeOpen(o => !o)}
        onSelectRange={(id) => { setRange(id); setRangeOpen(false); }}
        insights={insights}
        activities={active.map(act => ({
          id: act.id,
          title: act.title,
          type: act.type,
          status: act.status,
          publisher: act.creatorRole,
          nominations: act.nominations,
          votes: act.totalVotes,
          deadlineLabel: `截止 ${honorDate(act.deadline)}`,
        }))}
        onCreate={() => nav.navigate('create-activity')}
        onAllActs={() => nav.navigate('activity-list')}
        onHall={() => nav.navigate('leaderboard')}
        onOpenActivity={(id) => nav.navigate('activity-detail', { activityId: id })}
        onSwitchRole={() => nav.switchRole()}
      />
    </div>
  );
}

// ─── PC 管理区 · 概览（指标 + 简易图表）────────────────────────────
function PcSparkLine({ points, color, height = 56, width = 220 }) {
  const vals = points.map(Number).filter(v => !Number.isNaN(v));
  if (vals.length < 2) return null;
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const span = Math.max(max - min, 1);
  const coords = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (width - 8) + 4;
    const y = height - 6 - ((v - min) / span) * (height - 14);
    return `${x},${y}`;
  });
  const area = `4,${height - 4} ${coords.join(' ')} ${width - 4},${height - 4}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => {
        const [x, y] = c.split(',');
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function PcHBar({ label, value, max, color, suffix }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{value}{suffix || ''}</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-elevated, var(--border))', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: color || 'var(--accent)', transition: 'width 0.35s ease',
        }} />
      </div>
    </div>
  );
}

function HROverviewPage({ nav }) {
  const acts = AppData.activities || [];
  const noms = AppData.nominations || [];
  const pendingNoms = noms.filter(n => (n.reviewStatus || 'approved') === 'pending').length;
  const approvedNoms = noms.filter(n => (n.reviewStatus || 'approved') === 'approved').length;
  const rejectedNoms = noms.filter(n => n.reviewStatus === 'rejected').length;
  const totalVotes = acts.reduce((s, a) => s + (a.totalVotes || 0), 0) || noms.reduce((s, n) => s + (n.votes || 0), 0);
  const statusBars = [
    { id: 'nominating', label: '征集中', color: '#4ECBFF', count: acts.filter(a => a.status === 'nominating').length },
    { id: 'voting', label: '投票中', color: '#F5B842', count: acts.filter(a => a.status === 'voting').length },
    { id: 'reviewing', label: '复核中', color: '#9B8FFF', count: acts.filter(a => a.status === 'reviewing').length },
    { id: 'published', label: '已公示', color: '#3DDC84', count: acts.filter(a => HonorPersist.isPublished(a.status)).length },
    { id: 'draft', label: '草稿', color: '#5A5A6A', count: acts.filter(a => a.status === 'draft').length },
  ];
  const typeBars = ['项目', '个人', '团队'].map(t => ({
    label: `${AppData.typeIcons[t] || ''} ${t}`,
    color: t === '项目' ? '#F5B842' : t === '个人' ? '#4ECBFF' : '#9B8FFF',
    count: acts.filter(a => a.type === t).length,
  }));
  const typeMax = Math.max(...typeBars.map(t => t.count), 1);

  const voteTrend = (AppData.insightRanges || []).map(r => {
    const row = (AppData.insightsByRange[r.id] || []).find(i => i.key === 'votes');
    const raw = row ? String(row.value).replace(/k/i, '000').replace(/,/g, '') : '0';
    return { label: r.label, value: parseFloat(raw) || 0 };
  });
  const nomTrend = (AppData.insightRanges || []).map(r => {
    const row = (AppData.insightsByRange[r.id] || []).find(i => i.key === 'nominations');
    return { label: r.label, value: parseFloat(row && row.value) || 0 };
  });

  const topNoms = [...noms].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 6);
  const todoActs = acts.filter(a => a.status === 'reviewing' || a.status === 'nominating').slice(0, 5);
  const unread = (AppData.notifications || []).filter(n => n.unread).length;

  const kpis = [
    { label: '活动总数', value: acts.length, tip: '含草稿与已公示' },
    { label: '进行中', value: acts.filter(a => !HonorPersist.isPublished(a.status) && a.status !== 'draft').length, tip: '征集 / 投票 / 复核' },
    { label: '提名总量', value: noms.length, tip: `待审 ${pendingNoms}` },
    { label: '累计票数', value: totalVotes.toLocaleString(), tip: '全活动合计' },
  ];
  const reviewingActCount = acts.filter(a => a.status === 'reviewing').length;
  const statusDonut = statusBars.map(s => ({ label: s.label, value: s.count }));

  return (
    <div className="ad-admin">
      <div className="ad-stack">
        <AdAlert
          type="warning"
          showIcon
          message="待办提醒"
          description={`${reviewingActCount} 个活动待复核，${pendingNoms} 个提名待审核${unread ? `，${unread} 条未读通知` : ''}。`}
        />
        <div className="ad-kpi">
          {kpis.map(k => (
            <div key={k.label} className="ad-kpi-card">
              <AdStatistic title={k.label} value={k.value} tip={k.tip} />
            </div>
          ))}
        </div>
        <div className="ad-grid-2">
          <div className="ad-card">
            <div className="ad-card-title">活动状态分布</div>
            <AdDonut segments={statusDonut} />
          </div>
          <div className="ad-card">
            <div className="ad-card-title">评优类型占比</div>
            {typeBars.map((t, i) => (
              <PcHBar key={t.label} label={t.label} value={t.count} max={typeMax} color={AD_CHART_COLORS[i % AD_CHART_COLORS.length]} />
            ))}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--ad-border)' }}>
              <div className="ad-card-title">提名审核漏斗</div>
              <div className="ad-kpi" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[
                  { label: '待审', n: pendingNoms },
                  { label: '已通过', n: approvedNoms },
                  { label: '已驳回', n: rejectedNoms },
                ].map(x => (
                  <AdStatistic key={x.label} title={x.label} value={x.n} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card-title">投票与提名趋势</div>
          <div className="ad-grid-2">
            <div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 8 }}>投票（按洞察区间）</div>
              <PcSparkLine points={voteTrend.map(p => p.value)} color="#1677ff" height={88} width={320} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {voteTrend.map(p => (
                  <div key={p.label} style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textAlign: 'center', flex: 1 }}>{p.label}</div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 8 }}>提名（近区间累计）</div>
              <PcSparkLine points={nomTrend.map(p => p.value)} color="#13c2c2" height={88} width={240} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {nomTrend.map(p => (
                  <div key={p.label} style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textAlign: 'center', flex: 1 }}>{p.label}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="ad-grid-2">
          <div className="ad-card">
            <div className="ad-toolbar">
              <div className="ad-card-title" style={{ margin: 0 }}>高票提名 Top</div>
              <AdBtn type="link" onClick={() => nav.navigate('activity-list')}>全部活动</AdBtn>
            </div>
            {topNoms.length === 0 ? (
              <div className="ad-empty">暂无提名数据</div>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>提名</th><th>活动</th><th>票数</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    {topNoms.map(n => {
                      const a = acts.find(x => x.id === n.activityId);
                      return (
                        <tr key={n.id} className="ad-row-click" onClick={() => nav.navigate('activity-detail', { activityId: n.activityId })}>
                          <td>{n.title}</td>
                          <td>{a ? a.title : '—'}</td>
                          <td>{n.votes || 0}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <AdBtn type="link" onClick={() => nav.navigate('activity-detail', { activityId: n.activityId })}>查看</AdBtn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="ad-card">
            <div className="ad-toolbar">
              <div className="ad-card-title" style={{ margin: 0 }}>待办聚焦</div>
              <AdBtn type="primary" onClick={() => nav.navigate('activity-list')}>进入活动列表</AdBtn>
            </div>
            {todoActs.length === 0 ? (
              <div className="ad-empty">暂无待办活动</div>
            ) : todoActs.map(a => (
              <div key={a.id} className="ad-todo-item" onClick={() => nav.navigate('activity-detail', { activityId: a.id })}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ad-todo-title">{a.title}</div>
                  <div className="ad-todo-sub">{a.status === 'reviewing' ? '待公示 / 可改票' : '征集中'} · {a.nominations || 0} 提名</div>
                </div>
                <AdStatusTag status={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PC 管理区 · 提名列表（跨活动）────────────────────────────────
function HRNominationListPage({ nav }) {
  const [tick, setTick] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [actFilter, setActFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  void tick;
  const bump = () => setTick(t => t + 1);

  const acts = AppData.activities || [];
  const rows = (AppData.nominations || [])
    .map(n => ({
      ...n,
      _rs: n.reviewStatus || 'approved',
      _act: acts.find(a => a.id === n.activityId),
    }))
    .filter(n => statusFilter === 'all' || n._rs === statusFilter)
    .filter(n => actFilter === 'all' || String(n.activityId) === String(actFilter))
    .filter(n => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const hay = [n.title, n.nominees, n.nominator, n._act && n._act.title].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  const statusFilters = [
    { id: 'all', label: '全部' },
    { id: 'pending', label: '待审核' },
    { id: 'approved', label: '已通过' },
    { id: 'rejected', label: '已驳回' },
  ];
  const statusCount = (id) => {
    const all = AppData.nominations || [];
    if (id === 'all') return all.length;
    return all.filter(n => (n.reviewStatus || 'approved') === id).length;
  };

  function setStatus(id, reviewStatus) {
    HonorPersist.updateNomination(id, { reviewStatus });
    bump();
  }

  return (
    <PcPage>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14,
        padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索提名标题、被提名人、提名人、活动…"
            style={{
              flex: '1 1 220px', minWidth: 180, height: 36, padding: '0 12px',
              borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none',
            }}
          />
          <select
            value={actFilter}
            onChange={e => setActFilter(e.target.value)}
            style={{
              height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)',
            }}
          >
            <option value="all">全部活动</option>
            {acts.map(a => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            共 <b style={{ color: 'var(--text)' }}>{rows.length}</b> 条
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {statusFilters.map(f => (
            <PcBtn key={f.id} primary={statusFilter === f.id} onClick={() => setStatusFilter(f.id)}>
              {f.label} · {statusCount(f.id)}
            </PcBtn>
          ))}
        </div>
      </div>
      <PcTable
        empty="暂无提名"
        rows={rows}
        columns={[
          { key: 'activity', label: '活动', width: 160, render: (n) => (n._act && n._act.title) || '—' },
          { key: 'title', label: '提名', render: (n) => (
            <div>
              <div style={{ fontWeight: 700 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {(n.members && n.members.length
                  ? formatPeopleNames(n.members.map(m => m.name).join('、'))
                  : formatPeopleNames(n.nominees || '')) || '—'}
              </div>
            </div>
          )},
          { key: 'nominator', label: '提名人', width: 90, render: (n) => n.nominator || '—' },
          { key: 'status', label: '审核', width: 90, render: (n) => <ReviewStatusBadge status={n._rs} /> },
          { key: 'votes', label: '票数', width: 70, render: (n) => (
            <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{n.votes || 0}</span>
          )},
          { key: 'ops', label: '操作', width: 220, stopRowClick: true, render: (n) => (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {n._rs === 'pending' && (
                <>
                  <PcBtn primary onClick={() => setStatus(n.id, 'approved')}>通过</PcBtn>
                  <PcBtn danger onClick={() => setStatus(n.id, 'rejected')}>驳回</PcBtn>
                </>
              )}
              <PcBtn onClick={() => nav.navigate('activity-detail', { activityId: n.activityId })}>查看详情</PcBtn>
            </div>
          )},
        ]}
        onRowClick={(n) => nav.navigate('activity-detail', { activityId: n.activityId })}
      />
    </PcPage>
  );
}

// ─── PC 管理区 · 投票复核管理─────────────────────────────────────
function HRVoteReviewPage({ nav }) {
  const [tick, setTick] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState(null);
  void tick;
  const bump = () => setTick(t => t + 1);

  const reviewingActs = (AppData.activities || [])
    .filter(a => a.status === 'reviewing')
    .filter(a => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (a.title || '').toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

  const activeId = selectedId && reviewingActs.some(a => a.id === selectedId)
    ? selectedId
    : (reviewingActs[0] && reviewingActs[0].id);
  const active = reviewingActs.find(a => a.id === activeId) || null;
  const noms = active
    ? (AppData.nominations || [])
        .filter(n => n.activityId === active.id && (n.reviewStatus || 'approved') === 'approved')
        .slice()
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    : [];

  function saveVotes(nomId, nextVotes) {
    const v = Math.max(0, Number(nextVotes) || 0);
    HonorPersist.updateNomination(nomId, { votes: v });
    const act = AppData.activities.find(a => a.id === activeId);
    if (act) {
      const sum = (AppData.nominations || [])
        .filter(n => n.activityId === act.id && (n.reviewStatus || 'approved') === 'approved')
        .reduce((s, n) => s + (n.votes || 0), 0);
      act.totalVotes = sum;
    }
    bump();
  }

  function publishActive() {
    if (!active) return;
    if (!window.confirm('确认公示结果？公示后全体员工可查看最终榜单，不可撤销。')) return;
    HonorPersist.publishResult(active.id);
    setSelectedId(null);
    bump();
    if (nav.refresh) nav.refresh();
  }

  return (
    <PcPage>
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14,
        padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)',
      }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索复核中活动…"
          style={{
            flex: '1 1 200px', minWidth: 160, height: 36, padding: '0 12px',
            borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none',
          }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          复核中 <b style={{ color: '#9B8FFF' }}>{reviewingActs.length}</b> 场
        </span>
      </div>

      {reviewingActs.length === 0 ? (
        <div style={{
          border: '1px dashed var(--border)', borderRadius: 12, padding: '48px 20px',
          textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-card)',
        }}>暂无复核中活动</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14, minHeight: 420 }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card)' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>
              复核中活动
            </div>
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {reviewingActs.map(a => {
                const on = a.id === activeId;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    style={{
                      padding: '12px 12px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: on ? 'var(--accent-dim)' : 'transparent',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: on ? 800 : 600, color: on ? 'var(--accent)' : 'var(--text)' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {a.nominations || 0} 提名 · {(a.totalVotes || 0).toLocaleString()} 票
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {active && (
              <>
                <div style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{active.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      可改票 · 确认后公示
                    </div>
                  </div>
                  <PcBtn onClick={() => nav.navigate('activity-detail', { activityId: active.id })}>打开详情</PcBtn>
                  <PcBtn primary onClick={publishActive}>公示结果</PcBtn>
                </div>
                <div style={{ padding: 12, flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <PcTable
                    empty="暂无已通过提名"
                    rows={noms}
                    columns={[
                      { key: 'rank', label: '名次', width: 56, render: (n, i) => {
                        const idx = noms.indexOf(n) + 1;
                        return <span style={{ fontWeight: 800 }}>#{idx}</span>;
                      }},
                      { key: 'title', label: '提名', render: (n) => (
                        <div>
                          <div style={{ fontWeight: 700 }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {(n.members && n.members.length
                  ? formatPeopleNames(n.members.map(m => m.name).join('、'))
                  : formatPeopleNames(n.nominees || '')) || '—'}
              </div>
                        </div>
                      )},
                      { key: 'votes', label: '票数', width: 120, stopRowClick: true, render: (n) => (
                        <input
                          type="number"
                          min={0}
                          defaultValue={n.votes || 0}
                          key={n.id + '-' + (n.votes || 0) + '-' + tick}
                          onBlur={e => {
                            const next = Number(e.target.value);
                            if (next === (n.votes || 0)) return;
                            saveVotes(n.id, next);
                          }}
                          style={{
                            width: 88, height: 32, padding: '0 8px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg)',
                            color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', fontWeight: 700,
                          }}
                        />
                      )},
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PcPage>
  );
}

// ─── 员工主页（顶部 Tab：评优活动 / 我的获奖 / 我的提名）──────────
function EmpProfileCard({ me, dept, stats }) {
  return (
    <div style={{
      margin: '12px 20px 0',
      background: 'linear-gradient(135deg, #FFF8EE, #FFF4E0)', border: '1px solid var(--accent-border)',
      borderRadius: 18, padding: '18px 18px 4px', position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,184,66,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--on-accent)',
        }}>{(me || '?')[0]}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{me}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{dept}</div>
        </div>
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '12px 4px', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatEmpHomeDate(d) {
  const weeks = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${weeks[d.getDay()]}`;
}

function EmployeeHomePage({ nav, roleSwitcher }) {
  const ME = HonorPersist.meName || '陈志远';
  const myNoms = AppData.nominations.filter(n => n.nominator === ME);
  const awards = collectMyAwards(ME);
  const bestRank = myNoms.length ? Math.min(...myNoms.map(n => n.rank)) : null;
  const votingActs = AppData.activities.filter(a => a.status === 'voting');
  const nominatingActs = AppData.activities.filter(a => a.status === 'nominating');
  const ongoing = HonorPersist.sortByPin([...votingActs, ...nominatingActs]).map(act => ({
    id: act.id,
    title: act.title,
    desc: act.desc,
    type: act.type,
    status: act.status,
    publisher: `由 ${act.creatorRole}·${act.creator} 发布`,
    nominations: act.nominations,
    votes: act.totalVotes || 0,
    deadlineLabel: `截止${honorDate(act.status === 'voting' ? act.deadline : act.nominateEnd)}`,
  }));
  const hall = AppData.activities
    .filter(a => HonorPersist.isPublished(a.status) && AppData.results[a.id])
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline))
    .slice(0, 1)
    .map(act => {
      const res = AppData.results[act.id];
      const w = res.winner;
      const r = act.rewards || {};
      return {
        id: act.id,
        title: act.title,
        type: act.type,
        championNames: formatPeopleNames(w.title, 2),
        nominator: w.nominator,
        votes: w.votes,
        points: r.points > 0 ? r.points : undefined,
        badgeName: r.badge ? r.badge.name : (r.certificate ? (r.certificate.title || '荣誉证书') : undefined),
        badgeSub: r.badge ? '专属勋章' : (r.certificate ? (r.certificate.subtitle || '电子证书') : undefined),
        runners: (res.runners || []).slice(0, 2).map(x => ({ names: formatPeopleNames(x.title, 2) })),
      };
    });
  const mine = myNoms.map(nom => {
    const act = AppData.activities.find(a => a.id === nom.activityId);
    const rs = nom.reviewStatus || 'approved';
    const cfg = (HonorPersist.REVIEW && HonorPersist.REVIEW[rs]) || { label: '已通过' };
    return {
      id: nom.id,
      activityId: nom.activityId,
      activityTitle: act ? act.title : '未知活动',
      title: nom.title,
      rank: nom.rank,
      votes: nom.votes,
      reviewLabel: cfg.label,
    };
  });

  const [topTab, setTopTab] = React.useState(() => {
    try {
      const saved = localStorage.getItem('emp_top_tab');
      return saved === 'mine' ? 'mine' : 'acts';
    } catch (e) { return 'acts'; }
  });
  function go(id) {
    setTopTab(id);
    try { localStorage.setItem('emp_top_tab', id); } catch (e) {}
  }

  return (
    <div style={{ background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="荣誉 Agent" onBack={goCEndPortal} />
      <H5HonorEmployeeHome
        me={ME}
        dateLabel={formatEmpHomeDate(new Date())}
        voteCount={votingActs.length}
        nominateCount={nominatingActs.length}
        reportCount={myNoms.length}
        awardCount={awards.length}
        rank={bestRank}
        tab={topTab}
        onTab={go}
        ongoing={ongoing}
        hall={hall}
        mine={mine}
        onOpenActivity={(id) => nav.navigate('activity-detail', { activityId: id })}
        onOpenHall={(id) => nav.navigate('activity-result', { activityId: id })}
        onAllActs={() => nav.navigate('activity-list')}
        onAllHall={() => nav.navigate('leaderboard')}
        roleLabel="员工"
        roleAria="员工视角"
        onSwitchRole={() => nav.switchRole()}
      />
    </div>
  );
}






// im.jsx — IM会话列表 + 荣誉引擎对话

// ─── IM 会话列表 ───────────────────────────────────────────────────
function IMListPage({ nav, roleSwitcher }) {
  const { imConvos } = AppData;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="消息" onBack={nav.atRoot ? null : () => nav.goBack()} right={roleSwitcher} />

      {/* 搜索框 */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="var(--text-dim)" strokeWidth="1.5"/>
            <path d="M10 10L13.5 13.5" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>搜索</span>
        </div>
      </div>

      {/* 会话列表 */}
      <div style={{ flex: 1 }}>
        {imConvos.map((c, i) => (
          <div key={c.id} onClick={() => nav.navigate(c.id === 'honor' ? 'im-honor' : 'im-list')}
            style={{ cursor: 'pointer' }}>
            <div style={{
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              {/* Avatar */}
              {c.id === 'honor' ? (
                <div style={{
                  width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  boxShadow: '0 0 16px var(--accent-dim)',
                }}>✦</div>
              ) : (
                <div style={{
                  width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, border: '1px solid var(--border)',
                }}>{c.isBot ? '🤖' : '📢'}</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.lastMsg}
                </div>
              </div>

              {c.unread > 0 && (
                <div style={{
                  width: 18, height: 18, background: '#E5534B', borderRadius: '50%',
                  fontSize: 10, fontWeight: 700, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{c.unread}</div>
              )}
            </div>
            {i < imConvos.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '0 20px 0 84px' }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

const NOTIF_TYPE_ICON = {
  invite: '📝',
  vote: '🗳️',
  result: '🏆',
  reminder: '⏰',
  review: '📋',
  'review-result': '🔍',
};

const NOTIF_TYPE_LABEL = {
  invite: '提名邀请',
  vote: '投票',
  result: '结果',
  reminder: '提醒',
  review: '审核',
  'review-result': '复核',
};

// ─── 铃铛通知列表 ─────────────────────────────────────────────────
function NotificationsPage({ nav }) {
  const [tick, setTick] = React.useState(0);
  void tick;
  const list = AppData.notifications || [];

  function openNotif(n) {
    n.unread = false;
    setTick(t => t + 1);
    if (!n.target || !n.target.screen) return;
    const params = n.target.params || {};
    if (n.target.role && nav.navigateAsRole) {
      nav.navigateAsRole(n.target.role, n.target.screen, params);
    } else {
      nav.navigate(n.target.screen, params);
    }
  }

  if (honorIsPc()) {
    return (
      <PcPage
        actions={!nav.atRoot ? <PcBtn onClick={() => nav.goBack()}>返回</PcBtn> : null}
      >
        <PcTable
          empty="暂无通知"
          columns={[
            { key: 'title', label: '标题', render: (n) => (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: n.unread ? 800 : 600 }}>{n.title}</div>
                {n.summary && (
                  <div style={{
                    fontSize: 12, color: 'var(--text-muted)', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420,
                  }}>{n.summary}</div>
                )}
              </div>
            )},
            { key: 'type', label: '类型', width: 120, render: (n) => (
              <span>{NOTIF_TYPE_ICON[n.type] || '🔔'} {NOTIF_TYPE_LABEL[n.type] || n.type}</span>
            )},
            { key: 'time', label: '时间', width: 120 },
            { key: 'unread', label: '已读', width: 80, render: (n) => (
              n.unread
                ? <span style={{ color: '#E5534B', fontWeight: 700 }}>未读</span>
                : <span style={{ color: 'var(--text-muted)' }}>已读</span>
            )},
            { key: 'ops', label: '操作', width: 100, stopRowClick: true, render: (n) => (
              <PcBtn onClick={() => openNotif(n)}>打开</PcBtn>
            )},
          ]}
          rows={list}
          onRowClick={(n) => openNotif(n)}
        />
      </PcPage>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="通知" onBack={() => nav.goBack()} />
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.7 }}>🔔</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>暂无通知</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>评优相关提醒会出现在这里</div>
          </div>
        ) : (
          list.map((n, i) => (
            <div key={n.id}>
              <div
                onClick={() => openNotif(n)}
                style={{
                  padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
                  cursor: 'pointer', background: n.unread ? 'rgba(201,146,42,0.06)' : 'transparent',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>{NOTIF_TYPE_ICON[n.type] || '🔔'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 15, fontWeight: n.unread ? 800 : 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{n.title}</span>
                    {n.unread && (
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#E5534B', flexShrink: 0,
                      }} />
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>{n.time}</span>
                  </div>
                  <div style={{
                    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{n.summary}</div>
                </div>
              </div>
              {i < list.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '0 20px 0 74px' }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── 荣誉引擎 聊天 ────────────────────────────────────────────────
function HonorChatPage({ nav }) {
  const [msgs, setMsgs] = React.useState(AppData.honorMessages);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const [showNomDone, setShowNomDone] = React.useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
    }
  }, [msgs, typing]);

  function handleQuickReply(reply) {
    const userMsg = { id: Date.now(), from: 'user', time: '刚刚', content: reply };
    setMsgs(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (reply === '帮我写') {
        setMsgs(prev => [...prev, {
          id: Date.now() + 1, from: 'bot', time: '刚刚', type: 'ai-write',
          content: '好的！请告诉我项目名称，我来帮您生成提名内容。',
        }]);
      } else {
        nav.navigate('nomination-form', { activityId: 1 });
      }
    }, 1200);
  }

  function handleSend() {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', time: '刚刚', content: input };
    setInput('');
    setMsgs(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(prev => [...prev, {
        id: Date.now() + 1, from: 'bot', time: '刚刚', type: 'normal',
        content: '收到！我已为您记录，您可以点击上方的「立即提名」卡片开始填写提名内容。',
      }]);
    }, 1000);
  }

  return (
    <div style={{ background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header
        title="荣誉引擎"
        subtitle="AI 评优助手"
        onBack={() => nav.goBack()}
        right={
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>✦</div>
        }
      />

      {/* 消息区 */}
      <div ref={bottomRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'none' }}>
        {/* 时间戳 */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)' }}>今天 09:30</div>

        {msgs.map(msg => (
          <div key={msg.id}>
            {msg.from === 'bot' ? (
              <BotMessage msg={msg} nav={nav} onQuickReply={handleQuickReply} />
            ) : (
              <UserMessage msg={msg} />
            )}
          </div>
        ))}

        {typing && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>✦</div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px 16px 16px 4px', padding: '10px 14px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: 'var(--text-dim)',
                  animation: `bounce 1.2s ${i * 0.2}s infinite`,
                }}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div style={{
        padding: '10px 16px 24px', borderTop: '1px solid var(--border)',
        background: 'var(--bg)', display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <AiBtn onClick={() => nav.navigate('nomination-form', { activityId: 1 })} style={{ flexShrink: 0, fontSize: 12, padding: '8px 12px' }}>
          AI提名
        </AiBtn>
        <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 22, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="发消息…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font)',
            }}
          />
          <div onClick={handleSend} style={{
            width: 28, height: 28, borderRadius: '50%', background: input ? 'var(--accent)' : 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s',
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 12L12 1M12 1H4M12 1V9" stroke={input ? 'var(--bg)' : 'var(--text-dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function BotMessage({ msg, nav, onQuickReply }) {
  const avatar = (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
    }}>✦</div>
  );

  if (msg.type === 'invite') {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {avatar}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--accent-border)',
          borderRadius: '16px 16px 16px 4px', overflow: 'hidden', maxWidth: '80%',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,184,66,0.15), rgba(255,140,66,0.1))',
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🏆</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{msg.title}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{msg.content}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 5 }}>⏱ {msg.meta.deadline}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 5 }}>📊 {msg.meta.count}</span>
            </div>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <button
              onClick={() => nav.navigate('nomination-form', { activityId: msg.activityId })}
              style={{
                width: '100%', background: 'var(--accent)', color: 'var(--on-accent)',
                border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font)',
              }}>{msg.actionLabel}</button>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'broadcast') {
    const isStart = msg.variant === 'vote-start';
    const c1 = isStart ? 'var(--accent)' : '#4ECBFF';
    const grad = isStart
      ? 'linear-gradient(135deg, rgba(245,184,66,0.16), rgba(255,140,66,0.08))'
      : 'linear-gradient(135deg, rgba(78,203,255,0.16), rgba(120,140,255,0.08))';
    const border = isStart ? 'var(--accent-border)' : 'rgba(78,203,255,0.3)';
    const targetScreen = isStart ? 'activity-detail' : 'activity-result';
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {avatar}
        <div style={{
          background: 'var(--bg-card)', border: `1px solid ${border}`,
          borderRadius: '16px 16px 16px 4px', overflow: 'hidden', maxWidth: '82%',
        }}>
          <div style={{ background: grad, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 16 }}>{isStart ? '🗳️' : '🎉'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c1 }}>{msg.title}</span>
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>📣 {msg.audience}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{msg.content}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {Object.values(msg.meta).map((v, i) => (
                <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 5 }}>{i === 0 ? (isStart ? '⏱ ' : '👥 ') : ''}{v}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <button
              onClick={() => nav.navigate(targetScreen, { activityId: msg.activityId })}
              style={{
                width: '100%', background: c1, color: isStart ? 'var(--bg)' : '#06222E',
                border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font)',
              }}>{msg.actionLabel}</button>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'submitted') {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {avatar}
        <div style={{
          background: 'rgba(61,220,132,0.08)', border: '1px solid rgba(61,220,132,0.25)',
          borderRadius: '16px 16px 16px 4px', padding: '12px 14px', maxWidth: '80%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>✅</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3DDC84' }}>{msg.title}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{msg.content}</div>
        </div>
      </div>
    );
  }

  if (msg.type === 'ai-offer' || msg.type === 'reminder') {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {avatar}
        <div style={{ maxWidth: '80%' }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px 16px 16px 4px', padding: '12px 14px', marginBottom: msg.quickReplies ? 8 : 0,
          }}>
            {msg.type === 'reminder' && (
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>⏰ 截止提醒</div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{msg.content}</div>
          </div>
          {msg.quickReplies && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {msg.quickReplies.map(r => (
                <button key={r} onClick={() => onQuickReply(r)} style={{
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  borderRadius: 20, padding: '7px 14px', fontSize: 13, color: 'var(--accent)',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                }}>{r}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {avatar}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px 16px 16px 4px', padding: '12px 14px', maxWidth: '80%',
      }}>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{msg.content}</div>
      </div>
    </div>
  );
}

function UserMessage({ msg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        background: 'var(--accent)', borderRadius: '16px 16px 4px 16px',
        padding: '10px 14px', maxWidth: '75%',
      }}>
        <div style={{ fontSize: 13, color: 'var(--on-accent)', lineHeight: 1.5, fontWeight: 500 }}>{msg.content}</div>
      </div>
    </div>
  );
}






// create.jsx — 创建评优活动 (4步向导 + AI辅助)

const TYPES = ['团队', '个人', '项目'];
const STEPS = ['基本信息', '奖励设置', '指定提名人', '预览发布'];

const POINT_OPTIONS = [10, 20, 50, 100];
const AI_CRITERIA = [
  ['创新性：方案的独创性与突破性', '影响力：对业务指标的实际提升', '可复制性：能否在更大范围推广'],
  ['专业能力：岗位核心技能的精通度', '协作贡献：跨团队配合与支持', '成长性：持续学习与自我突破'],
];

const AI_NAMES = [
  '2025年度最具创新力项目',
  '年度技术突破大奖',
  '最佳业务创新项目',
];
const AI_DESCS = [
  '聚焦过去一年中最具业务影响力的创新实践，鼓励各团队展示技术与商业深度融合的优秀成果，激励全员的创新热情。',
  '表彰在技术研发、产品创新、业务突破等领域做出卓越贡献的项目，以评选驱动创新文化的持续传承。',
];

function CreateActivityPage({ nav, params }) {
  const editActivity = (params && params.editId) ? AppData.activities.find(a => a.id === params.editId) : null;
  const isEdit = !!editActivity;
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState(() => activityToCreateForm(editActivity));
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiField, setAiField] = React.useState(null);
  const [publishing, setPublishing] = React.useState(false);
  const [published, setPublished] = React.useState(false);
  const [badgeSearch, setBadgeSearch] = React.useState('');
  const [badgeModalOpen, setBadgeModalOpen] = React.useState(false);

  function triggerAI(field) {
    setAiField(field);
    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      setAiField(null);
      if (field === 'title') {
        setForm(f => ({ ...f, title: AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)] }));
      } else if (field === 'desc') {
        setForm(f => ({ ...f, desc: AI_DESCS[Math.floor(Math.random() * AI_DESCS.length)] }));
      } else if (field === 'criteria') {
        const pick = AI_CRITERIA[Math.floor(Math.random() * AI_CRITERIA.length)];
        setForm(f => ({ ...f, criteria: pick.slice(0, 3) }));
      }
    }, 1400);
  }

  function publish() {
    setPublishing(true);
    setTimeout(() => {
      if (isEdit) {
        applyFormToActivity(editActivity, form);
        if (HonorPersist) HonorPersist.save();
      } else {
        const maxId = AppData.activities.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0);
        const act = {
          id: maxId + 1,
          title: form.title.trim() || '未命名活动',
          desc: form.desc || '',
          type: form.type || '团队',
          status: 'nominating',
          deadline: form.deadline || '2026-07-01',
          nominateEnd: form.nominateEnd || '2026-06-20',
          nominations: 0,
          totalVotes: 0,
          creator: HonorPersist.meName || 'HR',
          creatorRole: 'HR',
          dept: '全公司',
          tags: [form.type || '团队'],
          nominators: [],
          cover: 'gradient' + ((maxId % 4) + 1),
          criteria: (form.criteria || []).map(c => c.trim()).filter(Boolean),
          rewards: {},
        };
        applyFormToActivity(act, form);
        AppData.activities.push(act);
        if (HonorPersist) HonorPersist.save();
      }
      setPublishing(false);
      setPublished(true);
      setTimeout(() => nav.goBack(), isEdit ? 1500 : 2200);
    }, isEdit ? 800 : 1800);
  }

  const isPc = honorIsPc();

  if (published) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          boxShadow: '0 0 30px var(--accent-dim)',
        }}>✦</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{isEdit ? '修改已保存！' : '活动已发布！'}</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {isEdit
              ? '活动信息已更新，提名人将看到最新内容'
              : <>荣誉引擎将向 {resolveAudience(form.audience).length || 5} 位提名人发送邀请消息</>}
          </div>
        </div>
      </div>
    );
  }

  const titleField = (
    <FieldBlock label="活动名称" required>
      <div style={{ position: 'relative' }}>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="输入活动名称…"
          style={inputStyle}
        />
      </div>
    </FieldBlock>
  );

  const typeField = (
    <FieldBlock label="评优类型" required>
      <div style={{ display: 'flex', gap: 8 }}>
        {TYPES.map(t => (
          <div key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
            style={{
              flex: 1, padding: '10px', textAlign: 'center', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${form.type === t ? 'var(--accent)' : 'var(--border)'}`,
              background: form.type === t ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: form.type === t ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: form.type === t ? 700 : 400, fontSize: 14, transition: 'transform 0.15s',
            }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{AppData.typeIcons[t]}</div>
            {t}
          </div>
        ))}
      </div>
    </FieldBlock>
  );

  const descField = (
    <FieldBlock label="活动简介">
      <div style={{ position: 'relative' }}>
        <textarea
          value={form.desc}
          onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
          placeholder="描述活动目的与背景…"
          rows={4}
          style={{ ...inputStyle, resize: 'none' }}
        />
      </div>
    </FieldBlock>
  );

  const criteriaField = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          评优标准 <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>（最多 3 项）</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {form.criteria.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{i + 1}</div>
            <input
              value={c}
              onChange={e => setForm(f => ({ ...f, criteria: f.criteria.map((v, j) => j === i ? e.target.value : v) }))}
              placeholder={`评优标准 ${i + 1}…`}
              style={{ ...inputStyle, flex: 1 }}
            />
            {form.criteria.length > 1 && (
              <span onClick={() => setForm(f => ({ ...f, criteria: f.criteria.filter((_, j) => j !== i) }))}
                style={{ fontSize: 18, color: 'var(--text-dim)', cursor: 'pointer', flexShrink: 0, padding: '0 2px' }}>×</span>
            )}
          </div>
        ))}
      </div>
      {form.criteria.length < 3 && (
        <button onClick={() => setForm(f => ({ ...f, criteria: [...f.criteria, ''] }))}
          style={{
            marginTop: 8, background: 'none', border: '1.5px dashed var(--border)', borderRadius: 10,
            padding: '9px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            fontFamily: 'var(--font)', width: '100%',
          }}>＋ 添加标准</button>
      )}
    </div>
  );

  const datesField = (
    <div style={{ display: 'grid', gridTemplateColumns: isPc ? '1fr' : '1fr 1fr', gap: 12 }}>
      <FieldBlock label="提名截止">
        <input type="date" value={form.nominateEnd}
          onChange={e => setForm(f => ({ ...f, nominateEnd: e.target.value }))}
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
      </FieldBlock>
      <FieldBlock label="活动截止">
        <input type="date" value={form.deadline}
          onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
      </FieldBlock>
    </div>
  );

  function goNextOrPublish() {
    if (step === 1 && !form.rewardPoints && !form.rewardBadge && !form.rewardCert) return;
    if (step === 1 && form.rewardBadge && !form.badgeId) return;
    if (step === 1 && form.rewardCert && !form.certDataUrl) return;
    if (step < 3) setStep(s => s + 1);
    else publish();
  }

  const nextDisabled = step === 1 && (
    (!form.rewardPoints && !form.rewardBadge && !form.rewardCert)
    || (form.rewardBadge && !form.badgeId)
    || (form.rewardCert && !form.certDataUrl)
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', height: isPc ? '100%' : undefined, display: 'flex', flexDirection: 'column' }}>
      {isPc ? (
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', flex: 1 }}>
            {isEdit ? '编辑评优活动' : '发起评优活动'}
          </div>
          <PcBtn onClick={() => nav.goBack()}>返回</PcBtn>
        </div>
      ) : (
        <Header title={isEdit ? '编辑评优活动' : '发起评优活动'} onBack={() => nav.goBack()} />
      )}

      {/* 进度条 */}
      <div style={{ padding: isPc ? '12px 24px' : '12px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--accent)' : 'var(--bg-elevated)', transition: 'background 0.3s' }}/>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          步骤 {step + 1}/{STEPS.length} · <span style={{ color: 'var(--text)', fontWeight: 600 }}>{STEPS[step]}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isPc ? '0 24px 20px' : '0 20px 20px', scrollbarWidth: 'none', minHeight: 0 }}>

        {/* STEP 0: 基本信息 */}
        {step === 0 && (
          isPc ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>{titleField}</div>
              <div style={{ gridColumn: '1 / -1' }}>{typeField}</div>
              <div style={{ gridColumn: '1 / -1' }}>{datesField}</div>
              <div style={{ gridColumn: '1 / -1' }}>{descField}</div>
              <div style={{ gridColumn: '1 / -1' }}>{criteriaField}</div>
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {titleField}
            {typeField}
            {descField}
            {criteriaField}
            {datesField}
          </div>
          )
        )}

        {/* STEP 1: 奖励设置 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              设置获奖者的奖励方式，可选积分、勋章、电子证书。<b style={{ color: 'var(--text)' }}>所有获奖者均获得等额奖励。</b>
            </div>

            {/* 奖励方式选择 */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'rewardPoints', icon: '🎁', label: '积分奖励' },
                { key: 'rewardBadge', icon: '🏅', label: '勋章奖励' },
                { key: 'rewardCert', icon: '📜', label: '电子证书' },
              ].map(opt => {
                const on = form[opt.key];
                return (
                  <div key={opt.key} onClick={() => setForm(f => ({ ...f, [opt.key]: !f[opt.key] }))}
                    style={{
                      flex: 1, padding: '12px 8px', borderRadius: 14, cursor: 'pointer', position: 'relative',
                      border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                      background: on ? 'var(--accent-dim)' : 'var(--bg-card)', transition: 'transform 0.15s',
                    }}>
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${on ? 'var(--accent)' : 'var(--text-dim)'}`, background: on ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {on && <span style={{ fontSize: 10, color: 'var(--on-accent)', fontWeight: 900 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: on ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                  </div>
                );
              })}
            </div>

            {/* 积分设置 */}
            {form.rewardPoints && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>🎁 积分奖励额度</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {POINT_OPTIONS.map(p => {
                    const on = form.points === p && form.customPoints === '';
                    return (
                      <div key={p} onClick={() => setForm(f => ({ ...f, points: p, customPoints: '' }))}
                        style={{
                          flex: '1 0 calc(25% - 6px)', textAlign: 'center', padding: '12px 0', borderRadius: 10, cursor: 'pointer',
                          border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                          background: on ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                          color: on ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: 15,
                          transition: 'transform 0.15s',
                        }}>{p}</div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>自定义</span>
                  <input
                    type="number" value={form.customPoints}
                    onChange={e => setForm(f => ({ ...f, customPoints: e.target.value, points: e.target.value ? Number(e.target.value) : f.points }))}
                    placeholder="输入积分数值…"
                    style={{ ...inputStyle, flex: 1, borderColor: form.customPoints ? 'var(--accent)' : 'var(--border)' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>分</span>
                </div>
              </div>
            )}

            {/* 勋章设置 */}
            {form.rewardBadge && (() => {
              const sel = AppData.badges.find(b => b.id === form.badgeId);
              return (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>🏅 获奖勋章</div>
                  <div onClick={() => setBadgeModalOpen(true)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: sel ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${sel ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '12px', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: sel ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--bg-input)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      boxShadow: sel ? '0 4px 14px var(--accent-dim)' : 'none', overflow: 'hidden',
                      color: sel ? undefined : 'var(--text-dim)',
                    }}>
                      {sel ? (sel.img ? <img src={sel.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : sel.icon) : '🏅'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: sel ? 'var(--accent)' : 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 1 }}>
                        {sel ? '已选勋章' : '尚未选择'}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: sel ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sel ? sel.name : '点击选择勋章'}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>{sel ? '更换 ›' : '选择 ›'}</span>
                  </div>
                </div>
              );
            })()}

            {/* 电子证书上传 */}
            {form.rewardCert && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>📜 电子证书模板</div>
                <input
                  id="honor-cert-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      e.target.value = '';
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setForm(f => ({
                        ...f,
                        certFileName: file.name,
                        certDataUrl: String(reader.result || ''),
                      }));
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
                {form.certDataUrl ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                    borderRadius: 12, padding: '12px',
                  }}>
                    <img src={form.certDataUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--bg-elevated)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: 0.5, marginBottom: 1 }}>已上传</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.certFileName || '证书文件'}</div>
                    </div>
                    <label htmlFor="honor-cert-upload" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>更换</label>
                    <span
                      onClick={() => setForm(f => ({ ...f, certFileName: '', certDataUrl: '' }))}
                      style={{ fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer', flexShrink: 0 }}
                    >清除</span>
                  </div>
                ) : (
                  <label htmlFor="honor-cert-upload" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '28px 16px', borderRadius: 12, cursor: 'pointer',
                    border: '1.5px dashed var(--border)', background: 'var(--bg-elevated)',
                  }}>
                    <span style={{ fontSize: 28 }}>⬆️</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>上传电子证书</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>仅支持图片格式</span>
                  </label>
                )}
              </div>
            )}

            {!form.rewardPoints && !form.rewardBadge && !form.rewardCert && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: 13 }}>
                请至少选择一种奖励方式
              </div>
            )}
          </div>
        )}

        {/* STEP 2: 指定提名人 */}
        {step === 2 && (
          <NominatorPicker form={form} setForm={setForm} />
        )}

        {/* STEP 3: 预览发布 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,184,66,0.12), rgba(255,140,66,0.08))',
              border: '1px solid var(--accent-border)', borderRadius: 14, padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{AppData.typeIcons[form.type]}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{form.title || '未填写活动名称'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{form.type}评优</div>
                </div>
              </div>
              {form.desc && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>{form.desc}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 5, color: 'var(--text-muted)' }}>📝 提名截止 {honorDate(form.nominateEnd)}</span>
                <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 5, color: 'var(--text-muted)' }}>🏁 活动截止 {honorDate(form.deadline)}</span>
              </div>
            </div>

            {/* 评优标准 */}
            {form.criteria.filter(c => c.trim()).length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>评优标准</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.criteria.filter(c => c.trim()).map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 奖励 */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>获奖者奖励</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {form.rewardPoints && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '8px 14px' }}>
                    <span style={{ fontSize: 18 }}>🎁</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{form.customPoints || form.points} 积分</span>
                  </div>
                )}
                {form.rewardBadge && (() => {
                  const b = AppData.badges.find(x => x.id === form.badgeId);
                  if (!b) return <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>未选择勋章</span>;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '8px 14px' }}>
                      {b.img
                        ? <img src={b.img} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover' }}/>
                        : <span style={{ fontSize: 18 }}>{b.icon}</span>}
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{b.name} 勋章</span>
                    </div>
                  );
                })()}
                {form.rewardCert && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '8px 14px' }}>
                    {form.certDataUrl && form.certDataUrl.startsWith('data:image')
                      ? <img src={form.certDataUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }}/>
                      : <span style={{ fontSize: 18 }}>📜</span>}
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                      {form.certFileName ? `证书 · ${form.certFileName}` : '电子证书'}
                    </span>
                  </div>
                )}
                {!form.rewardPoints && !form.rewardBadge && !form.rewardCert && (
                  <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>未设置奖励</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>所有获奖者均获得等额奖励</div>
            </div>

            {[
              { label: '提名人数', val: `${resolveAudience(form.audience).length} 人` },
              { label: '评优类型', val: form.type },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{item.val}</span>
              </div>
            ))}

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 }}>
                <span>💌</span>
                <span>发布后，荣誉引擎将通过 IM 向 <b style={{ color: 'var(--text)' }}>{resolveAudience(form.audience).length || '所有'}</b> 位提名人发送邀请消息，支持一键提名。</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div style={{
        padding: isPc ? '12px 24px 16px' : '12px 20px 28px',
        borderTop: '1px solid var(--border)', flexShrink: 0,
        display: 'flex', gap: 10, justifyContent: isPc ? 'flex-end' : undefined,
        background: 'var(--bg)',
      }}>
        {step > 0 && (
          isPc
            ? <PcBtn onClick={() => setStep(s => s - 1)}>上一步</PcBtn>
            : <BtnGhost onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>上一步</BtnGhost>
        )}
        {isPc ? (
          <span style={{ opacity: nextDisabled ? 0.5 : 1 }}>
            <PcBtn primary onClick={goNextOrPublish}>
              {step < 3 ? '下一步 →' : (publishing ? (isEdit ? '保存中…' : '发布中…') : (isEdit ? '保存修改' : '发布活动'))}
            </PcBtn>
          </span>
        ) : (
          <BtnPrimary
            onClick={goNextOrPublish}
            style={{ flex: 2, opacity: nextDisabled ? 0.5 : 1 }}
          >
            {step < 3 ? '下一步 →' : (publishing ? (isEdit ? '保存中…' : '发布中…') : (isEdit ? '✓ 保存修改' : '🚀 发布活动'))}
          </BtnPrimary>
        )}
      </div>

      {badgeModalOpen && (
        <BadgeModal
          form={form} setForm={setForm} onClose={() => setBadgeModalOpen(false)}
          badgeSearch={badgeSearch} setBadgeSearch={setBadgeSearch}
        />
      )}
    </div>
  );
}

// ─── 通讯录工具：树形展开 / 统计 / 过滤 ───────────────────────────
function flattenMembers(node) {
  let out = [];
  if (node.members) out = out.concat(node.members.map(m => ({ ...m, deptId: node.id, deptName: node.name })));
  if (node.children) node.children.forEach(c => { out = out.concat(flattenMembers(c)); });
  return out;
}
function allOrgMembers() {
  return AppData.org.tree.flatMap(d => flattenMembers(d));
}
function findDept(id, nodes = AppData.org.tree) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) { const r = findDept(id, n.children); if (r) return r; }
  }
  return null;
}
function deptMemberIds(d) { return flattenMembers(d).map(m => m.id); }

// 应用规则过滤，返回最终命中人数
function resolveAudience(audience) {
  const all = allOrgMembers();
  let base = [];
  if (audience.all) {
    base = all;
  } else {
    const set = new Map();
    audience.deptIds.forEach(did => {
      const d = findDept(did);
      if (d) flattenMembers(d).forEach(m => set.set(m.id, m));
    });
    audience.memberIds.forEach(mid => {
      const m = all.find(x => x.id === mid);
      if (m) set.set(mid, m);
    });
    base = [...set.values()];
  }
  const r = audience.rules;
  const tenureMin = (AppData.ruleOptions.tenures.find(t => t.id === r.tenure) || {}).min || 0;
  return base.filter(m =>
    (r.gender === '不限' || m.gender === r.gender) &&
    (m.tenure >= tenureMin) &&
    (r.jobTypes.length === 0 || r.jobTypes.includes(m.jobType))
  );
}
function hasActiveRules(r) {
  return r.gender !== '不限' || r.tenure !== 'any' || r.jobTypes.length > 0;
}

// 把当前选择展开成具体成员 id 集合
function explicitSelectedSet(au) {
  const all = allOrgMembers();
  if (au.all) return new Set(all.map(m => m.id));
  const s = new Set(au.memberIds);
  au.deptIds.forEach(did => { const d = findDept(did); if (d) deptMemberIds(d).forEach(id => s.add(id)); });
  return s;
}
// 把成员 id 集合折叠回 {all, deptIds, memberIds}：整部门选满显示为部门，全员显示为全员
function collapseSelection(au, set) {
  const all = allOrgMembers();
  if (all.length && all.every(m => set.has(m.id))) return { ...au, all: true, deptIds: [], memberIds: [] };
  const deptNodes = [];
  const walk = nodes => nodes.forEach(n => { if (n.children || n.members) { deptNodes.push(n); if (n.children) walk(n.children); } });
  walk(AppData.org.tree);
  deptNodes.sort((a, b) => deptMemberIds(b).length - deptMemberIds(a).length);
  const chosenDepts = [];
  const covered = new Set();
  deptNodes.forEach(d => {
    const ids = deptMemberIds(d);
    if (ids.length > 0 && ids.every(id => set.has(id)) && !ids.every(id => covered.has(id))) {
      chosenDepts.push(d.id);
      ids.forEach(id => covered.add(id));
    }
  });
  const memberIds = [...set].filter(id => !covered.has(id));
  return { ...au, all: false, deptIds: chosenDepts, memberIds };
}

// ─── 提名人选择（触发弹窗 + 已选摘要）──────────────────────────────
function NominatorPicker({ form, setForm }) {
  const [open, setOpen] = React.useState(false);
  const a = form.audience;
  const count = resolveAudience(a).length;

  // 摘要 chips：全员只显示"全员"，部门显示部门名，个人显示姓名
  const chips = [];
  if (a.all) {
    chips.push({ key: 'all', icon: '🏢', label: '全体员工' });
  } else {
    a.deptIds.forEach(did => {
      const d = findDept(did);
      if (d) chips.push({ key: did, icon: '📁', label: d.name });
    });
    const allM = allOrgMembers();
    a.memberIds.forEach(mid => {
      const m = allM.find(x => x.id === mid);
      if (m) chips.push({ key: mid, icon: null, label: m.name, avatar: m.name[0] });
    });
  }

  function removeChip(c) {
    setForm(f => {
      const au = { ...f.audience };
      if (c.key === 'all') au.all = false;
      else if (c.key.startsWith('d')) au.deptIds = au.deptIds.filter(x => x !== c.key);
      else au.memberIds = au.memberIds.filter(x => x !== c.key);
      return { ...f, audience: au };
    });
  }

  const ruleSummary = [];
  if (a.rules.gender !== '不限') ruleSummary.push(a.rules.gender);
  const tn = AppData.ruleOptions.tenures.find(t => t.id === a.rules.tenure);
  if (tn && tn.id !== 'any') ruleSummary.push(tn.label);
  if (a.rules.jobTypes.length) ruleSummary.push(a.rules.jobTypes.join('/'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        选择有资格提名的人员，可按通讯录选择，荣誉引擎将向命中人员发送 IM 邀请。
      </div>

      {/* 选择入口 */}
      <div onClick={() => setOpen(true)} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👥</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>选择提名人</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {count > 0 ? '命中 ' + count + ' 人' : '点击从通讯录选择'}
          </div>
        </div>
        <span style={{ color: 'var(--accent)', fontSize: 18 }}>›</span>
      </div>

      {/* 已选摘要 */}
      {(chips.length > 0 || ruleSummary.length > 0) && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
            已选范围 · 命中 <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{count}</span> 人
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {chips.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: c.avatar ? '5px 10px 5px 5px' : '6px 12px' }}>
                {c.avatar
                  ? <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{c.avatar}</div>
                  : <span style={{ fontSize: 13 }}>{c.icon}</span>}
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{c.label}</span>
                <span onClick={() => removeChip(c)} style={{ fontSize: 15, color: 'var(--text-dim)', cursor: 'pointer', marginLeft: 2 }}>×</span>
              </div>
            ))}
          </div>
          {ruleSummary.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {ruleSummary.map((r, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '4px 10px' }}>⚙ {r}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {open && <PickerModal form={form} setForm={setForm} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ─── 弹窗：通讯录选择提名人 ─────────────────────────────────────
function PickerModal({ form, setForm, onClose }) {
  const isPc = honorIsPc();
  const [search, setSearch] = React.useState('');
  const a = form.audience;
  const setAudience = updater => setForm(f => ({ ...f, audience: updater(f.audience) }));
  const count = resolveAudience(a).length;

  const body = (
    <>
      <div style={{ padding: isPc ? '18px 22px 0' : '14px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: isPc ? 16 : 17, fontWeight: 700, color: 'var(--text)' }}>选择提名人</span>
          <span onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }}>×</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: isPc ? '8px 22px 16px' : '14px 20px' }}>
        <ContactsTab a={a} setAudience={setAudience} search={search} setSearch={setSearch} />
      </div>

      <div style={{ padding: isPc ? '12px 22px 18px' : '12px 20px 28px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
          命中 <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 16 }}>{count}</span> 人
        </div>
        {isPc ? (
          <PcBtn primary onClick={onClose}>完成</PcBtn>
        ) : (
          <BtnPrimary onClick={onClose} style={{ width: 'auto', padding: '12px 32px' }}>完成</BtnPrimary>
        )}
      </div>
    </>
  );

  if (isPc) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative', width: '100%', maxWidth: 640, maxHeight: '82vh',
            background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
          }}
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'fadeIn 0.2s ease' }}/>
      <div style={{
        position: 'relative', background: 'var(--bg)', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid var(--border)', height: '82%', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden',
      }}>
        {body}
      </div>
    </div>
  );
}

const Check = ({ on, half }) => (
  <div style={{
    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
    border: '1.5px solid ' + (on || half ? 'var(--accent)' : 'var(--text-dim)'),
    background: on ? 'var(--accent)' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {on && <span style={{ fontSize: 12, color: 'var(--on-accent)', fontWeight: 900 }}>✓</span>}
    {half && !on && <span style={{ width: 9, height: 2, background: 'var(--accent)', borderRadius: 1 }}/>}
  </div>
);
const PAvatar = ({ name, size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{name[0]}</div>
);

// 通讯录 tab：树形 + 全员 + 搜索
function ContactsTab({ a, setAudience, search, setSearch }) {
  const [expanded, setExpanded] = React.useState({});
  const allM = allOrgMembers();

  const memberSel = id => a.memberIds.includes(id) || a.all || a.deptIds.some(did => { const d = findDept(did); return d && deptMemberIds(d).includes(id); });
  const toggleMember = id => setAudience(au => {
    const s = explicitSelectedSet(au);
    if (s.has(id)) s.delete(id); else s.add(id);
    return collapseSelection(au, s);
  });

  const deptIds = d => deptMemberIds(d);
  const deptAll = d => { const ids = deptIds(d); return ids.length > 0 && ids.every(memberSel); };
  const deptSome = d => deptIds(d).some(memberSel);
  const toggleDept = d => setAudience(au => {
    const s = explicitSelectedSet(au);
    const ids = deptMemberIds(d);
    const allIn = ids.length > 0 && ids.every(id => s.has(id));
    if (allIn) ids.forEach(id => s.delete(id)); else ids.forEach(id => s.add(id));
    return collapseSelection(au, s);
  });

  const allOn = a.all;
  const toggleAll = () => setAudience(au => au.all ? { ...au, all: false } : { ...au, all: true, deptIds: [], memberIds: [] });

  function renderNode(node, depth) {
    const isDept = !!(node.children || node.members);
    const open = expanded[node.id];
    const selCnt = deptIds(node).filter(memberSel).length;
    return (
      <div key={node.id}>
        <div style={{ padding: '12px 0 12px ' + (depth * 18) + 'px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <div onClick={() => toggleDept(node)} style={{ cursor: 'pointer' }}><Check on={deptAll(node)} half={deptSome(node)} /></div>
          <div onClick={() => setExpanded(e => ({ ...e, [node.id]: !e[node.id] }))} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ fontSize: 16 }}>📁</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{node.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{deptIds(node).length} 人{selCnt > 0 ? ' · 已选 ' + selCnt : ''}</div>
            </div>
            <svg width="11" height="11" viewBox="0 0 10 10" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M2 4L5 7L8 4" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        {open && (
          <div>
            {node.children && node.children.map(c => renderNode(c, depth + 1))}
            {node.members && node.members.map(m => (
              <div key={m.id} onClick={() => toggleMember(m.id)} style={{ padding: '10px 0 10px ' + ((depth + 1) * 18) + 'px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                <Check on={memberSel(m.id)} />
                <PAvatar name={m.name} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.title} · {m.tenure}年 · {m.jobType}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const searchRes = search ? allM.filter(m => m.name.includes(search) || m.deptName.includes(search)) : null;

  return (
    <div>
      {/* 搜索 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="var(--text-dim)" strokeWidth="1.5"/>
          <path d="M10 10L13.5 13.5" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索姓名或部门…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font)' }}/>
        {search && <span onClick={() => setSearch('')} style={{ fontSize: 16, color: 'var(--text-dim)', cursor: 'pointer' }}>×</span>}
      </div>

      {searchRes ? (
        <div>
          {searchRes.map((m, i, arr) => (
            <div key={m.id} onClick={() => toggleMember(m.id)} style={{ padding: '11px 0', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Check on={memberSel(m.id)} />
              <PAvatar name={m.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.deptName} · {m.title}</div>
              </div>
            </div>
          ))}
          {searchRes.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>未找到匹配人员</div>}
        </div>
      ) : (
        <div>
          {/* 全员 — 独立卡片 */}
          <div onClick={toggleAll} style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            background: allOn ? 'var(--accent-dim)' : 'var(--bg-card)',
            border: `1px solid ${allOn ? 'var(--accent-border)' : 'var(--border)'}`,
            borderRadius: 14, marginBottom: 18,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: allOn ? 'var(--accent)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, transition: 'background 0.2s' }}>🏢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>全体员工</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>一键选择全公司 {allM.length} 人</div>
            </div>
            <Check on={allOn} />
          </div>

          {/* 按部门 / 个人 分组标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: 0.5 }}>按部门 / 成员选择</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          {/* 树 */}
          {AppData.org.tree.map(d => renderNode(d, 0))}
        </div>
      )}
    </div>
  );
}

// 规则条件 tab
function RulesTab({ a, setAudience }) {
  const r = a.rules;
  const setRule = patch => setAudience(au => ({ ...au, rules: { ...au.rules, ...patch } }));
  const opt = AppData.ruleOptions;

  const Pill = ({ on, label, onClick }) => (
    <div onClick={onClick} style={{
      padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
      fontWeight: on ? 700 : 500, color: on ? 'var(--accent)' : 'var(--text-muted)',
      background: on ? 'var(--accent-dim)' : 'var(--bg-card)',
      border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--border)'), transition: 'transform 0.15s',
    }}>{label}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        在通讯录选定范围的基础上，叠加以下条件进一步筛选提名人。
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>入职年限</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {opt.tenures.map(t => <Pill key={t.id} on={r.tenure === t.id} label={t.label} onClick={() => setRule({ tenure: t.id })} />)}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>性别</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {opt.genders.map(g => <Pill key={g} on={r.gender === g} label={g} onClick={() => setRule({ gender: g })} />)}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>岗位类型 <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-dim)' }}>（可多选，不选为不限）</span></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {opt.jobTypes.map(j => {
            const on = r.jobTypes.includes(j);
            return <Pill key={j} on={on} label={j} onClick={() => setRule({ jobTypes: on ? r.jobTypes.filter(x => x !== j) : [...r.jobTypes, j] })} />;
          })}
        </div>
      </div>

      {hasActiveRules(r) && (
        <div onClick={() => setRule({ gender: '不限', tenure: 'any', jobTypes: [] })}
          style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: '10px', cursor: 'pointer' }}>
          清除全部条件
        </div>
      )}
    </div>
  );
}


function FieldBlock({ label, required, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text)',
  fontFamily: 'var(--font)', outline: 'none', transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

// ─── 勋章选择弹窗（仅选择已有）───────────────────────────────────
function BadgeModal({ form, setForm, onClose, badgeSearch, setBadgeSearch }) {
  const isPc = honorIsPc();
  const sel = AppData.badges.find(b => b.id === form.badgeId) || null;
  const list = AppData.badges.filter(b => b.name.includes(badgeSearch.trim()));

  const sheet = (
    <>
      <div style={{ padding: isPc ? '18px 22px 0' : '14px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: isPc ? 16 : 17, fontWeight: 700, color: 'var(--text)' }}>选择勋章</span>
          <span onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }}>×</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: isPc ? '8px 22px 16px' : '14px 20px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="var(--text-dim)" strokeWidth="1.5"/>
            <path d="M10 10L13.5 13.5" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input value={badgeSearch} onChange={e => setBadgeSearch(e.target.value)} placeholder="搜索勋章名称…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font)' }}/>
          {badgeSearch && <span onClick={() => setBadgeSearch('')} style={{ fontSize: 16, color: 'var(--text-dim)', cursor: 'pointer' }}>×</span>}
        </div>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)', fontSize: 13 }}>未找到匹配勋章</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isPc ? 'repeat(4, 1fr)' : '1fr 1fr 1fr', gap: 10 }}>
            {list.map(b => {
              const on = form.badgeId === b.id;
              return (
                <div key={b.id} onClick={() => setForm(f => ({ ...f, badgeId: b.id, creatingBadge: false }))}
                  style={{ position: 'relative', padding: '16px 6px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-dim)' : 'var(--bg-card)' }}>
                  {on && <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--on-accent)', fontWeight: 900 }}>✓</div>}
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
                  <div style={{ fontSize: 12, color: on ? 'var(--accent)' : 'var(--text-muted)', fontWeight: on ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: isPc ? '12px 22px 18px' : '12px 20px 28px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: sel ? 'var(--accent-dim)' : 'var(--bg-input)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden',
            color: 'var(--text-dim)',
          }}>
            {sel ? (sel.img ? <img src={sel.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : sel.icon) : '🏅'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sel ? '已选勋章' : '尚未选择'}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: sel ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sel ? sel.name : '请点选上方勋章'}
            </div>
          </div>
        </div>
        {isPc ? (
          <span style={{ opacity: sel ? 1 : 0.45 }}>
            <PcBtn primary onClick={onClose}>完成</PcBtn>
          </span>
        ) : (
          <BtnPrimary
            onClick={onClose}
            style={{ width: 'auto', padding: '12px 32px', opacity: sel ? 1 : 0.45 }}
          >完成</BtnPrimary>
        )}
      </div>
    </>
  );

  if (isPc) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative', width: '100%', maxWidth: 560, maxHeight: '80vh',
            background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
          }}
        >
          {sheet}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'fadeIn 0.2s ease' }}/>
      <div style={{
        position: 'relative', background: 'var(--bg)', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid var(--border)', height: '82%', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden',
      }}>
        {sheet}
      </div>
    </div>
  );
}






// activity.jsx — 活动详情 + 投票 + 提名表单

// ─── 活动详情 + 投票 ──────────────────────────────────────────────
function ActivityDetailPage({ nav, params }) {
  const activityId = params.activityId || 1;
  const activity = AppData.activities.find(a => a.id === activityId) || AppData.activities[0];
  const allNoms = AppData.nominations.filter(n => n.activityId === activityId);
  const isHr = nav.role === 'hr';
  // 投票仅已通过；员工详情列表也只展示已通过（待审在「我的」看）
  const noms = isHr
    ? allNoms
    : allNoms.filter(n => (n.reviewStatus || 'approved') === 'approved');
  const [votes, setVotes] = React.useState(() => {
    const map = {};
    noms.forEach(n => { map[n.id] = n.votes; });
    return map;
  });
  const [myVotes, setMyVotes] = React.useState(() => {
    const s = new Set();
    noms.forEach(n => { if (n.myVote) s.add(n.id); });
    return s;
  });
  const [voteAnim, setVoteAnim] = React.useState(null);
  const [detailNom, setDetailNom] = React.useState(null); // { nom, rank, rankEmoji }
  const [publishConfirm, setPublishConfirm] = React.useState(false);
  const [nomFilter, setNomFilter] = React.useState('all'); // all | pending | approved | rejected
  const [detailEditor, setDetailEditor] = React.useState(null);
  const [detailWinnerPickerOpen, setDetailWinnerPickerOpen] = React.useState(false);
  const [listTick, setListTick] = React.useState(0);
  const [deleteConfirming, setDeleteConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const bumpList = () => setListTick(t => t + 1);
  void listTick;

  React.useEffect(() => {
    function syncFromStore() {
      const latest = AppData.nominations.filter(n => n.activityId === activityId);
      const map = {};
      const s = new Set();
      latest.forEach(n => {
        map[n.id] = n.votes;
        if (n.myVote) s.add(n.id);
      });
      setVotes(map);
      setMyVotes(s);
      bumpList();
    }
    window.addEventListener('honor-data', syncFromStore);
    return () => window.removeEventListener('honor-data', syncFromStore);
  }, [activityId]);

  function doDeleteActivity() {
    setDeleting(true);
    setTimeout(() => {
      deleteActivityById(activity.id);
      setDeleting(false);
      setDeleteConfirming(false);
      nav.goBack();
    }, 500);
  }

  function winnersFromNom(nom) {
    const org = allOrgMembers();
    const byName = name => org.find(m => m.name === name);
    const toWinner = (name, dept, job, i) => {
      const hit = byName(name);
      if (hit) return { id: hit.id, name: hit.name, deptName: hit.deptName, title: hit.title };
      return { id: 'orphan-' + i + '-' + name, name, deptName: dept || '—', title: job || '成员' };
    };
    if (nom.members && nom.members.length) {
      return nom.members.map((m, i) => toWinner(m.name, m.dept, m.job, i)).filter(w => w.name);
    }
    return parsePeopleNames(nom.nominees || '').map((name, i) => toWinner(name, '—', '成员', i));
  }

  function openDetailEdit(nom) {
    const hs = (nom.highlights || []).slice(0, 3);
    while (hs.length < 3) hs.push('');
    setDetailWinnerPickerOpen(false);
    setDetailEditor({
      mode: 'edit',
      id: nom.id,
      title: nom.title || '',
      desc: nom.desc || '',
      highlights: hs,
      winners: winnersFromNom(nom),
      nominator: nom.nominator || HonorPersist.meName,
      nominatorDept: nom.nominatorDept || HonorPersist.meDept,
      reviewStatus: nom.reviewStatus || 'approved',
    });
  }

  function saveDetailEditor() {
    if (!detailEditor || !detailEditor.title.trim() || !detailEditor.desc.trim()) return;
    const highlights = detailEditor.highlights.map(h => h.trim()).filter(Boolean);
    const winners = detailEditor.winners || [];
    const members = winners.map(w => ({
      name: w.name,
      dept: w.deptName || w.dept || '—',
      job: w.title || w.job || '成员',
    }));
    const nominees = members.length
      ? members.map(m => m.name).join('、')
      : detailEditor.title.trim();
    HonorPersist.updateNomination(detailEditor.id, {
      title: detailEditor.title.trim(),
      desc: detailEditor.desc.trim(),
      highlights,
      nominees,
      members: members.length ? members : [{ name: nominees, dept: detailEditor.nominatorDept, job: '成员' }],
      reviewStatus: detailEditor.reviewStatus,
    });
    setDetailWinnerPickerOpen(false);
    setDetailEditor(null);
    setDetailNom(null);
    bumpList();
  }

  function closeDetailEditor() {
    setDetailWinnerPickerOpen(false);
    setDetailEditor(null);
    // PC「修改」直接关；手机从详情进编辑时取消后留在详情层
    if (honorIsPc()) setDetailNom(null);
  }

  function approveNom(id) {
    HonorPersist.updateNomination(id, { reviewStatus: 'approved' });
    setDetailNom(prev => (prev && prev.nom.id === id ? null : prev));
    bumpList();
  }

  function rejectNom(id) {
    HonorPersist.updateNomination(id, { reviewStatus: 'rejected' });
    setDetailNom(prev => (prev && prev.nom.id === id ? null : prev));
    bumpList();
  }

  function handleVote(nomId) {
    if (activity.status !== 'voting') return;
    const target = AppData.nominations.find(n => n.id === nomId);
    if (!target || (target.reviewStatus || 'approved') !== 'approved') return;
    setVoteAnim(nomId);
    setTimeout(() => setVoteAnim(null), 600);
    setMyVotes(prev => {
      const s = new Set(prev);
      if (s.has(nomId)) {
        s.delete(nomId);
        setVotes(v => ({ ...v, [nomId]: (v[nomId] || 0) - 1 }));
      } else {
        s.add(nomId);
        setVotes(v => ({ ...v, [nomId]: (v[nomId] || 0) + 1 }));
      }
      return s;
    });
  }

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(votes), 1);
  const canVote = activity.status === 'voting';
  const canNominate = activity.status === 'nominating' && nav.role !== 'hr';
  const isPublished = HonorPersist.isPublished(activity.status);
  const canShowResult = HonorPersist.canShowResult(nav.role, activity.status);
  const showRewards = !!(activity.rewards && (nav.role === 'hr' || isPublished));
  const canDownloadCert = !isHr && isPublished && isChampionAwardee(activityId, HonorPersist.meName);

  function publishResult() {
    HonorPersist.publishResult(activityId);
    setPublishConfirm(false);
    if (nav.refresh) nav.refresh();
  }

  const sortedNoms = [...noms].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const isPc = honorIsPc();
  const showPublishFab = nav.role === 'hr' && activity.status === 'reviewing';
  const canEditVotes = isHr && activity.status === 'reviewing';
  const contentPad = isPc ? '16px 20px 24px' : undefined;
  const nomStatusCounts = {
    all: allNoms.length,
    pending: allNoms.filter(n => (n.reviewStatus || 'approved') === 'pending').length,
    approved: allNoms.filter(n => (n.reviewStatus || 'approved') === 'approved').length,
    rejected: allNoms.filter(n => (n.reviewStatus || 'approved') === 'rejected').length,
  };
  const filteredSortedNoms = !isHr || nomFilter === 'all'
    ? sortedNoms
    : sortedNoms.filter(n => (n.reviewStatus || 'approved') === nomFilter);
  const NOM_FILTERS = [
    { id: 'all', label: '全部', n: nomStatusCounts.all },
    { id: 'pending', label: '待审核', n: nomStatusCounts.pending },
    { id: 'approved', label: '已通过', n: nomStatusCounts.approved },
    { id: 'rejected', label: '已驳回', n: nomStatusCounts.rejected },
  ];
  const emptyNomHint = (() => {
    if (canNominate) return '快来抢先提交第一份提名吧';
    if (!isHr) return '活动征集中，期待精彩提名';
    if (nomFilter === 'pending') return '暂无待审核提名';
    if (nomFilter === 'approved') return '暂无已通过提名';
    if (nomFilter === 'rejected') return '暂无已驳回提名';
    return '活动征集中，期待精彩提名';
  })();
  const emptyNomTitle = (() => {
    if (!isHr || nomFilter === 'all') return '尚未有人提名';
    if (nomFilter === 'pending') return '暂无待审核';
    if (nomFilter === 'approved') return '暂无已通过';
    return '暂无已驳回';
  })();

  return (
    <div style={{
      background: 'var(--bg)', minHeight: '100%', height: isPc ? '100%' : undefined,
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {isPc ? (
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)',
        }}>
          <div style={{
            fontSize: 15, fontWeight: 800, color: 'var(--text)', flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{activity.title}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {nav.role === 'hr' && (
              <>
                <PcBtn onClick={() => nav.navigate('edit-activity', { editId: activity.id })}>编辑</PcBtn>
                <PcBtn danger onClick={() => setDeleteConfirming(true)}>删除</PcBtn>
              </>
            )}
            <PcBtn onClick={() => nav.goBack()}>返回</PcBtn>
          </div>
        </div>
      ) : (
        <Header
          title={activity.title}
          onBack={() => nav.goBack()}
          right={
            nav.role === 'hr'
              ? (
                <ActivityMenu activity={activity} nav={nav} dark onAfterDelete={() => nav.goBack()} />
              )
              : canShowResult
                ? (
                  <div
                    onClick={() => nav.navigate('activity-result', { activityId })}
                    style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    榜单 ›
                  </div>
                )
                : null
          }
        />
      )}

      <div style={{
        flex: 1, overflowY: 'auto', scrollbarWidth: 'none',
        paddingBottom: showPublishFab && !isPc ? 88 : 0,
        minHeight: 0,
        padding: contentPad,
      }}>
        {/* 活动头部 */}
        <div style={{
          margin: isPc ? '0' : '16px 20px 0', borderRadius: 16,
          background: 'linear-gradient(135deg, #FFF8EE, #FFF4E0)',
          border: '1px solid var(--accent-border)', padding: '16px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,184,66,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>{AppData.typeIcons[activity.type]}</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activity.type}评优 · {activity.creatorRole} {activity.creator}</div>
              </div>
            </div>
            <StatusBadge status={activity.status} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{activity.desc}</div>
        </div>

        {/* 员工：复核中提示 */}
        {nav.role !== 'hr' && activity.status === 'reviewing' && (
          <div style={{
            margin: isPc ? '14px 0 0' : '14px 20px 0', borderRadius: 14, padding: '14px 16px',
            background: 'rgba(155,143,255,0.1)', border: '1px solid rgba(155,143,255,0.28)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>投票结果复核中</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              投票已结束，结果尚未公示。公示后可查看最终榜单与获奖奖励。
            </div>
          </div>
        )}

        {/* 奖励：员工仅公示后可见 */}
        {showRewards && (
          <div style={{ margin: isPc ? '14px 0 0' : '14px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>获奖者奖励</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>所有获奖者均获得等额奖励</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {activity.rewards.points > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 14, padding: '16px 18px' }}>
                  <span style={{ fontSize: 30, flexShrink: 0 }}>🎁</span>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{activity.rewards.points} 积分</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>积分奖励</div>
                  </div>
                </div>
              )}
              {activity.rewards.badge && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 14, padding: '16px 18px' }}>
                  <span style={{ fontSize: 30, flexShrink: 0 }}>{activity.rewards.badge.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1, letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.rewards.badge.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>专属勋章</div>
                  </div>
                </div>
              )}
              {activity.rewards.certificate && (
                <div
                  role={canDownloadCert ? 'button' : undefined}
                  onClick={canDownloadCert ? () => downloadHonorCertificate(activity.rewards.certificate, {
                    awardee: HonorPersist.meName,
                    activityTitle: activity.title,
                    placeLabel: '冠军',
                  }) : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)', borderRadius: 14, padding: '16px 18px',
                    cursor: canDownloadCert ? 'pointer' : 'default',
                  }}
                >
                  {activity.rewards.certificate.dataUrl && activity.rewards.certificate.dataUrl.startsWith('data:image')
                    ? <img src={activity.rewards.certificate.dataUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    : <span style={{ fontSize: 30, flexShrink: 0 }}>📜</span>}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.rewards.certificate.title || activity.rewards.certificate.fileName || '电子证书'}
                    </div>
                    <div style={{
                      fontSize: 12, marginTop: 2,
                      color: canDownloadCert ? 'var(--accent)' : 'var(--text-muted)',
                      fontWeight: canDownloadCert ? 600 : 400,
                    }}>
                      {canDownloadCert ? '点击下载证书' : (activity.rewards.certificate.subtitle || '电子证书')}
                    </div>
                  </div>
                  {canDownloadCert && (
                    <span style={{ fontSize: 16, color: 'var(--accent)', flexShrink: 0 }}>↓</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 评优标准 */}
        {activity.criteria && activity.criteria.length > 0 && (
          <div style={{ margin: isPc ? '16px 0 0' : '16px 20px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>评优标准</div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activity.criteria.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提名入口 (员工+征集中) */}
        {canNominate && (
          <div style={{ margin: isPc ? '14px 0 0' : '14px 20px 0' }}>
            <div onClick={() => nav.navigate('nomination-form', { activityId })}
              style={{
                background: 'rgba(78,203,255,0.08)', border: '1px solid rgba(78,203,255,0.25)',
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
              <span style={{ fontSize: 24 }}>📝</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>提交我的提名</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>截止 {honorDate(activity.nominateEnd)} · 提交后待审核</div>
              </div>
              <span style={{ color: '#4ECBFF', fontSize: 18 }}>›</span>
            </div>
          </div>
        )}

        {/* 提名列表 */}
        <div style={{ margin: isPc ? '16px 0 0' : '16px 20px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: isHr ? 10 : 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{isHr ? '全部提名' : '可投票名单'}</span>
            {canVote && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>仅已通过可投票</span>}
            {canEditVotes && isPc && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>复核中可改票</span>}
          </div>

          {isHr && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none', flexWrap: isPc ? 'wrap' : 'nowrap' }}>
              {NOM_FILTERS.map(f => (
                isPc ? (
                  <PcBtn key={f.id} primary={nomFilter === f.id} onClick={() => setNomFilter(f.id)}>
                    {f.label} {f.n}
                  </PcBtn>
                ) : (
                  <button key={f.id} type="button" onClick={() => setNomFilter(f.id)} style={{
                    flexShrink: 0, border: `1px solid ${nomFilter === f.id ? 'var(--accent-border)' : 'var(--border)'}`,
                    background: nomFilter === f.id ? 'var(--accent-dim)' : 'var(--bg-card)',
                    color: nomFilter === f.id ? 'var(--accent)' : 'var(--text-muted)',
                    borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'var(--font)',
                  }}>
                    {f.label} {f.n}
                  </button>
                )
              ))}
            </div>
          )}

          {isPc ? (
            <PcTable
              empty={emptyNomTitle + ' · ' + emptyNomHint}
              rows={filteredSortedNoms.map((nom, idx) => ({ ...nom, _idx: idx }))}
              onRowClick={(nom) => {
                const idx = nom._idx;
                const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                setDetailNom({ nom, rank: idx + 1, rankEmoji });
              }}
              columns={[
                { key: 'rank', label: '排名', width: 64, render: (nom) => {
                  const idx = nom._idx;
                  return idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                }},
                { key: 'nominees', label: '被提名人', render: (nom) => formatPeopleNames(nom.nominees || nom.title) },
                { key: 'title', label: '标题', render: (nom) => nom.title },
                { key: 'status', label: '状态', width: 90, render: (nom) => <ReviewStatusBadge status={nom.reviewStatus || 'approved'} /> },
                { key: 'votes', label: '票数', width: 72, render: (nom) => (
                  <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{votes[nom.id] || 0}</span>
                )},
                { key: 'ops', label: '操作', width: 220, stopRowClick: true, render: (nom) => {
                  const rs = nom.reviewStatus || 'approved';
                  const canVoteThis = canVote && rs === 'approved';
                  const idx = nom._idx;
                  const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                  const openDetail = () => setDetailNom({ nom, rank: idx + 1, rankEmoji });
                  return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {isHr && rs === 'pending' && (
                        <>
                          <PcBtn primary onClick={() => approveNom(nom.id)}>通过</PcBtn>
                          <PcBtn danger onClick={() => rejectNom(nom.id)}>驳回</PcBtn>
                        </>
                      )}
                      {canEditVotes && rs === 'approved' && (
                        <PcBtn onClick={openDetail}>改票</PcBtn>
                      )}
                      {canVoteThis && (
                        <PcBtn primary={myVotes.has(nom.id)} onClick={() => handleVote(nom.id)}>
                          {myVotes.has(nom.id) ? '已投票' : '投票'}
                        </PcBtn>
                      )}
                      {isHr && activity.status === 'nominating' && rs === 'pending' ? (
                        <PcBtn onClick={() => { openDetail(); openDetailEdit(nom); }}>修改</PcBtn>
                      ) : (
                        <PcBtn onClick={openDetail}>详情</PcBtn>
                      )}
                    </div>
                  );
                }},
              ]}
            />
          ) : filteredSortedNoms.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px dashed var(--border)',
              borderRadius: 16, padding: '32px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 30, marginBottom: 10, opacity: 0.7 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{emptyNomTitle}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {emptyNomHint}
              </div>
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredSortedNoms.map((nom, idx) => {
              const v = votes[nom.id] || 0;
              const pct = maxVotes > 0 ? (v / maxVotes) * 100 : 0;
              const isVoted = myVotes.has(nom.id);
              const isAnimating = voteAnim === nom.id;
              const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
              const rs = nom.reviewStatus || 'approved';
              const canVoteThis = canVote && rs === 'approved';

              return (
                <div key={nom.id}
                  onClick={() => setDetailNom({ nom, rank: idx + 1, rankEmoji })}
                  style={{
                    background: isVoted ? 'rgba(245,184,66,0.06)' : 'var(--bg-card)',
                    border: `1px solid ${isVoted ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 16, padding: '14px 16px',
                    transition: 'all 0.2s', cursor: 'pointer',
                    opacity: (canVote && rs !== 'approved') ? 0.72 : 1,
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, marginRight: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: idx < 3 ? 18 : 13, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{rankEmoji}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, flex: 1 }}>
                          {formatPeopleNames(nom.nominees || nom.title)}
                        </span>
                        <ReviewStatusBadge status={rs} />
                        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>详情 ›</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.35 }}>
                        {nom.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                        由{nom.nominator} · {nom.nominatorDept}提名
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                        {nom.desc.slice(0, 70)}…
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {nom.highlights.map(h => (
                          <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 4 }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 票数进度条 */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isVoted ? 'var(--accent)' : 'var(--bg-elevated-2, #ECECF1)', borderRadius: 2, transition: 'width 0.4s ease' }}/>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: isVoted ? 'var(--accent)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</span> 票
                    </span>
                    {canVoteThis && (
                      <button onClick={(e) => { e.stopPropagation(); handleVote(nom.id); }} style={{
                        background: isVoted ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: isVoted ? 'var(--bg)' : 'var(--text-muted)',
                        border: `1px solid ${isVoted ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 10, padding: '7px 16px', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s',
                        transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
                      }}>
                        {isVoted ? '✓ 已投票' : '投票'}
                      </button>
                    )}
                    {canVote && !canVoteThis && (
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>不可投票</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        <div style={{ height: 24 }} />
      </div>

      {showPublishFab && !isPc && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50,
          padding: '12px 20px 20px',
          background: 'linear-gradient(180deg, transparent 0%, var(--bg) 28%)',
          pointerEvents: 'none',
        }}>
          <button
            type="button"
            onClick={() => setPublishConfirm(true)}
            style={{
              pointerEvents: 'auto', width: '100%', border: 'none', cursor: 'pointer',
              background: '#3DDC84', color: '#062816',
              borderRadius: 14, padding: '15px 18px',
              fontSize: 16, fontWeight: 800, fontFamily: 'var(--font)',
              boxShadow: '0 8px 24px rgba(61,220,132,0.35)',
            }}
          >📢 公示结果</button>
        </div>
      )}

      {showPublishFab && isPc && (
        <div style={{
          position: 'sticky', bottom: 0, zIndex: 50, flexShrink: 0,
          padding: '10px 20px 14px',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <PcBtn primary onClick={() => setPublishConfirm(true)}>公示结果</PcBtn>
        </div>
      )}

      {deleteConfirming && (
        <DeleteConfirm
          activity={activity}
          deleting={deleting}
          onCancel={() => { if (!deleting) setDeleteConfirming(false); }}
          onConfirm={doDeleteActivity}
        />
      )}

      {publishConfirm && (
        <div style={{
          position: honorIsPc() ? 'fixed' : 'absolute', inset: 0, zIndex: 140,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={() => setPublishConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 320, background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 18, padding: 20,
            boxShadow: honorIsPc() ? '0 20px 48px rgba(0,0,0,0.25)' : undefined,
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>确认公示结果？</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 18 }}>
              公示后全体员工可查看最终榜单与获奖奖励，此操作不可撤销。
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: honorIsPc() ? 'flex-end' : undefined }}>
              {honorIsPc() ? (
                <>
                  <PcBtn onClick={() => setPublishConfirm(false)}>取消</PcBtn>
                  <PcBtn primary onClick={publishResult}>确认公示</PcBtn>
                </>
              ) : (
                <>
                  <BtnGhost onClick={() => setPublishConfirm(false)} style={{ flex: 1 }}>取消</BtnGhost>
                  <BtnPrimary onClick={publishResult} style={{ flex: 1.4, background: '#3DDC84', color: '#062816' }}>确认公示</BtnPrimary>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {detailNom && (
        <NominationDetailModal
          nom={detailNom.nom}
          rank={detailNom.rank}
          rankEmoji={detailNom.rankEmoji}
          votes={votes[detailNom.nom.id] || 0}
          isVoted={myVotes.has(detailNom.nom.id)}
          canVote={canVote && (detailNom.nom.reviewStatus || 'approved') === 'approved'}
          onVote={() => handleVote(detailNom.nom.id)}
          onClose={() => setDetailNom(null)}
          hrReview={isHr && (detailNom.nom.reviewStatus || 'approved') === 'pending'}
          canEditVotes={canEditVotes}
          onSaveVotes={(nextVotes) => {
            const id = detailNom.nom.id;
            HonorPersist.updateNomination(id, { votes: nextVotes });
            setVotes(v => {
              const next = { ...v, [id]: nextVotes };
              activity.totalVotes = Object.values(next).reduce((a, b) => a + b, 0);
              return next;
            });
            bumpList();
          }}
          onApprove={() => approveNom(detailNom.nom.id)}
          onReject={() => rejectNom(detailNom.nom.id)}
          onEdit={() => openDetailEdit(detailNom.nom)}
        />
      )}

      {detailEditor && detailNom && (
        <HonorOverlay onClose={closeDetailEditor} zIndex={150} mobileMaxHeight="88%">
          <div style={{ padding: honorIsPc() ? '18px 22px 12px' : '14px 20px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <HonorSheetHandle />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>编辑提名</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: honorIsPc() ? '14px 22px' : '14px 20px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'none' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>提名名称 *</div>
              <input value={detailEditor.title} onChange={e => setDetailEditor(ed => ({ ...ed, title: e.target.value }))} style={nomInputStyle} placeholder="项目或人员名称…" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                被提名人 <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>（通讯录选人，可选）</span>
              </div>
              <div onClick={() => setDetailWinnerPickerOpen(true)} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
                padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>👤</div>
                <span style={{ flex: 1, fontSize: 14, color: (detailEditor.winners || []).length ? 'var(--text)' : 'var(--text-dim)' }}>
                  {(detailEditor.winners || []).length ? `已选 ${detailEditor.winners.length} 人` : '从通讯录选择获奖者'}
                </span>
                <span style={{ color: 'var(--accent)', fontSize: 17 }}>›</span>
              </div>
              {(detailEditor.winners || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {detailEditor.winners.map(w => (
                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 10px 5px 5px' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{(w.name || '?')[0]}</div>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>{w.name}</span>
                      <span onClick={(e) => {
                        e.stopPropagation();
                        setDetailEditor(ed => ({ ...ed, winners: ed.winners.filter(x => x.id !== w.id) }));
                      }} style={{ fontSize: 15, color: 'var(--text-dim)', cursor: 'pointer' }}>×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>推荐理由 *</div>
              <textarea value={detailEditor.desc} onChange={e => setDetailEditor(ed => ({ ...ed, desc: e.target.value }))} rows={4} style={{ ...nomInputStyle, resize: 'none' }} placeholder="推荐理由…" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>亮点</div>
              {detailEditor.highlights.map((h, i) => (
                <input key={i} value={h}
                  onChange={e => setDetailEditor(ed => ({ ...ed, highlights: ed.highlights.map((v, j) => j === i ? e.target.value : v) }))}
                  placeholder={`亮点 ${i + 1}`}
                  style={{ ...nomInputStyle, marginBottom: 8 }}
                />
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>审核状态</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['pending', 'approved', 'rejected'].map(s => (
                  <button key={s} type="button" onClick={() => setDetailEditor(ed => ({ ...ed, reviewStatus: s }))} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)',
                    fontSize: 12, fontWeight: 700,
                    border: `1px solid ${detailEditor.reviewStatus === s ? 'var(--accent-border)' : 'var(--border)'}`,
                    background: detailEditor.reviewStatus === s ? 'var(--accent-dim)' : 'var(--bg-card)',
                    color: detailEditor.reviewStatus === s ? 'var(--accent)' : 'var(--text-muted)',
                  }}>{HonorPersist.REVIEW[s].label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: honorIsPc() ? '12px 22px 18px' : '10px 20px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0, justifyContent: honorIsPc() ? 'flex-end' : undefined }}>
            {honorIsPc() ? (
              <>
                <PcBtn onClick={closeDetailEditor}>取消</PcBtn>
                <PcBtn primary onClick={saveDetailEditor}>保存</PcBtn>
              </>
            ) : (
              <>
                <BtnGhost onClick={closeDetailEditor} style={{ flex: 1 }}>取消</BtnGhost>
                <BtnPrimary onClick={saveDetailEditor} style={{ flex: 1.4 }}>保存</BtnPrimary>
              </>
            )}
          </div>
        </HonorOverlay>
      )}

      {detailEditor && detailWinnerPickerOpen && (
        <WinnerPickerModal
          selected={detailEditor.winners || []}
          onChange={ws => setDetailEditor(ed => ({ ...ed, winners: ws }))}
          onClose={() => setDetailWinnerPickerOpen(false)}
        />
      )}
    </div>
  );
}

// ─── 提名详情弹层 ─────────────────────────────────────────────────
function NominationDetailModal({
  nom, rank, rankEmoji, votes, isVoted, canVote, onVote, onClose,
  hrReview, onApprove, onReject, onEdit,
  canEditVotes, onSaveVotes,
}) {
  const [editingVotes, setEditingVotes] = React.useState(false);
  const [draftVotes, setDraftVotes] = React.useState(String(votes ?? 0));

  React.useEffect(() => {
    setEditingVotes(false);
    setDraftVotes(String(votes ?? 0));
  }, [nom.id, votes]);

  const people = (nom.members && nom.members.length)
    ? nom.members
    : parsePeopleNames(nom.nominees || '').map(name => ({
        name, dept: nom.nominatorDept || '—', job: '成员',
      }));

  function startEditVotes() {
    setDraftVotes(String(votes ?? 0));
    setEditingVotes(true);
  }

  function cancelEditVotes() {
    setDraftVotes(String(votes ?? 0));
    setEditingVotes(false);
  }

  function saveEditVotes() {
    const n = Math.max(0, Math.floor(Number(draftVotes)));
    if (!Number.isFinite(n)) return;
    if (onSaveVotes) onSaveVotes(n);
    setEditingVotes(false);
  }

  return (
    <HonorOverlay onClose={onClose} zIndex={120} mobileMaxHeight="82%">
        <div style={{ padding: honorIsPc() ? '18px 22px 12px' : '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          <HonorSheetHandle />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{rankEmoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>第 {rank} 名</span>
                {(nom.reviewStatus || 'approved') === 'pending' && <ReviewStatusBadge status="pending" />}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4 }}>
                {nom.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                由{nom.nominator} · {nom.nominatorDept}提名
              </div>
            </div>
            <span onClick={onClose} style={{
              width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0,
            }}>×</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '14px 20px 8px' }}>
          {/* 被提名人 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              被提名人 · {people.length || parsePeopleNames(nom.nominees || '').length || 1} 人
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 8px' }}>
              {(people.length ? people : [{ name: formatPeopleNames(nom.nominees || nom.title), dept: nom.nominatorDept || '—', job: '成员' }]).map((m, i) => (
                <div key={(m.name || '') + i} style={{ textAlign: 'center', minWidth: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                    color: 'var(--on-accent)', fontWeight: 800, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px var(--accent-dim)',
                  }}>{(m.name || '?').slice(0, 1)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {m.dept}·{m.job}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 提名说明 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>提名说明</div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
              padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65,
            }}>{nom.desc}</div>
          </div>

          {/* 亮点 */}
          {nom.highlights && nom.highlights.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>关键亮点</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nom.highlights.map(h => (
                  <span key={h} style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)', padding: '8px 12px', borderRadius: 8,
                    display: 'block', width: '100%', boxSizing: 'border-box',
                  }}>{h}</span>
                ))}
              </div>
            </div>
          )}

          {/* 票数 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 8,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>当前票数</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{votes} 票</span>
          </div>
        </div>

        <div style={{ padding: '10px 20px 28px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {editingVotes ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                step={1}
                value={draftVotes}
                onChange={e => setDraftVotes(e.target.value)}
                inputMode="numeric"
                style={{
                  flex: 1.2, padding: '12px 14px', borderRadius: 12, fontFamily: 'var(--font)',
                  fontSize: 16, fontWeight: 800, color: 'var(--text)', background: 'var(--bg-card)',
                  border: '1.5px solid var(--accent-border)', outline: 'none', fontVariantNumeric: 'tabular-nums',
                }}
              />
              <BtnGhost onClick={cancelEditVotes} style={{ flex: 0.85, padding: '12px 6px', fontSize: 13 }}>取消</BtnGhost>
              <BtnPrimary onClick={saveEditVotes} style={{ flex: 0.95, padding: '12px 6px', fontSize: 13 }}>保存</BtnPrimary>
            </div>
          ) : hrReview ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <BtnGhost onClick={onEdit} style={{ flex: 1, padding: '12px 6px', fontSize: 13 }}>编辑</BtnGhost>
              <button type="button" onClick={onReject} style={{
                flex: 1.15, background: 'rgba(229,83,75,0.1)', color: '#E5534B',
                border: '1.5px solid rgba(229,83,75,0.35)', borderRadius: 12,
                padding: '12px 6px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>审核驳回</button>
              <button type="button" onClick={onApprove} style={{
                flex: 1.15, background: '#3DDC84', color: '#062816',
                border: 'none', borderRadius: 12,
                padding: '12px 6px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>审核通过</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <BtnGhost onClick={onClose} style={{ flex: 1 }}>关闭</BtnGhost>
              {canEditVotes && (
                <BtnPrimary onClick={startEditVotes} style={{ flex: 1.4 }}>修改票数</BtnPrimary>
              )}
              {canVote && !canEditVotes && (
                <BtnPrimary onClick={onVote} style={{ flex: 1.4 }}>
                  {isVoted ? '✓ 已投票（再点取消）' : '投票支持'}
                </BtnPrimary>
              )}
            </div>
          )}
        </div>
    </HonorOverlay>
  );
}

// ─── 提名表单 ─────────────────────────────────────────────────────
function NominationFormPage({ nav, params }) {
  const activityId = params.activityId || 1;
  const activity = AppData.activities.find(a => a.id === activityId) || AppData.activities[0];
  const [form, setForm] = React.useState({ title: '', desc: '', highlights: ['', '', ''], winners: [] });
  const [winnerPickerOpen, setWinnerPickerOpen] = React.useState(false);
  const [aiField, setAiField] = React.useState(null); // 'title' | 'desc' | 'highlights' | null
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiDone, setAiDone] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const AI_TITLE = '智能仓储调度系统';
  const AI_DESC = '基于自研强化学习调度算法，将仓储分拣效率提升42%，同时将人工错误率降低至0.03%。系统已在全国15个仓库完成部署，年节约运营成本1800万元，荣获省级科技进步一等奖。';
  const AI_HIGHLIGHTS = ['分拣效率↑42%', '年省1800万元', '15仓全国落地'];

  function triggerAI(field) {
    setAiField(field);
    setAiLoading(true);
    if (field === 'title') {
      setTimeout(() => {
        setForm(f => ({ ...f, title: AI_TITLE }));
        setAiLoading(false);
        setAiField(null);
      }, 900);
      return;
    }
    if (field === 'highlights') {
      setTimeout(() => {
        setAiLoading(false);
        setAiField(null);
        setForm(f => ({ ...f, highlights: AI_HIGHLIGHTS }));
      }, 900);
      return;
    }
    // field === 'desc'：根据名称生成推荐理由 + 亮点（打字机效果）
    setTimeout(() => {
      setForm(f => (f.title ? f : { ...f, title: AI_TITLE }));
      setAiLoading(false);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setForm(f => ({ ...f, desc: AI_DESC.slice(0, i * 4) }));
        if (i * 4 >= AI_DESC.length) {
          clearInterval(interval);
          setAiDone(true);
          setAiField(null);
          setForm(f => ({ ...f, highlights: AI_HIGHLIGHTS }));
        }
      }, 30);
    }, 1200);
  }

  function submit() {
    if (!form.title.trim() || !form.desc.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const members = (form.winners || []).map(w => ({
        name: w.name,
        dept: w.deptName || w.dept || '—',
        job: w.title || w.job || '成员',
      }));
      const nominees = members.length
        ? members.map(m => m.name).join('、')
        : form.title.trim();
      const maxId = AppData.nominations.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);
      const forAct = AppData.nominations.filter(n => n.activityId === activityId);
      const nom = {
        id: maxId + 1,
        activityId,
        title: form.title.trim(),
        nominees,
        members: members.length
          ? members
          : [{ name: form.title.trim(), dept: HonorPersist.meDept, job: '成员' }],
        nominator: HonorPersist.meName,
        nominatorDept: HonorPersist.meDept,
        votes: 0,
        rank: forAct.length + 1,
        myVote: false,
        reviewStatus: 'pending',
        desc: form.desc.trim(),
        highlights: form.highlights.map(h => h.trim()).filter(Boolean),
      };
      HonorPersist.addNomination(nom);
      setSubmitted(true);
      setTimeout(() => nav.goBack(), 2000);
    }, 800);
  }

  if (submitted) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(61,220,132,0.15)', border: '1px solid rgba(61,220,132,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>✅</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>提名成功！</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            名单状态为「待审核」，管理员通过后<br/>方可参与投票
          </div>
        </div>
      </div>
    );
  }

  const activityBanner = (
    <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 20 }}>{AppData.typeIcons[activity.type]}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{activity.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>提名截止 {honorDate(activity.nominateEnd)}</div>
      </div>
    </div>
  );

  const titleField = (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>提名名称 <span style={{ color: 'var(--accent)' }}>*</span></div>
      <div style={{ position: 'relative' }}>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="项目或人员名称…"
          style={nomInputStyle}
        />
      </div>
    </div>
  );

  const winnersField = (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>
        获奖者 <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>（被提名的人员，可选）</span>
      </div>
      <div onClick={() => setWinnerPickerOpen(true)} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
        padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>👤</div>
        <span style={{ flex: 1, fontSize: 14, color: form.winners.length ? 'var(--text)' : 'var(--text-dim)' }}>
          {form.winners.length ? `已选 ${form.winners.length} 人` : '从通讯录选择获奖者'}
        </span>
        <span style={{ color: 'var(--accent)', fontSize: 17 }}>›</span>
      </div>
      {form.winners.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {form.winners.map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 10px 5px 5px' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{w.name[0]}</div>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{w.name}</span>
              <span onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, winners: f.winners.filter(x => x.id !== w.id) })); }}
                style={{ fontSize: 15, color: 'var(--text-dim)', cursor: 'pointer' }}>×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const descField = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>推荐理由 <span style={{ color: 'var(--accent)' }}>*</span></div>
      </div>
      <div style={{ position: 'relative' }}>
        <textarea
          value={form.desc}
          onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
          placeholder="描述为什么推荐这个项目或员工…"
          rows={5}
          style={{ ...nomInputStyle, resize: 'none' }}
        />
      </div>
    </div>
  );

  const highlightsField = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>核心亮点（最多3条）</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {form.highlights.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{i + 1}</div>
            <input
              value={h}
              onChange={e => setForm(f => ({ ...f, highlights: f.highlights.map((v, j) => j === i ? e.target.value : v) }))}
              placeholder={`亮点 ${i + 1}…`}
              style={{ ...nomInputStyle, flex: 1 }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const winnerPicker = winnerPickerOpen ? (
    <WinnerPickerModal
      selected={form.winners}
      onChange={ws => setForm(f => ({ ...f, winners: ws }))}
      onClose={() => setWinnerPickerOpen(false)}
    />
  ) : null;

  if (honorIsPc()) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <PcPage
            title="提交提名"
            actions={<PcBtn onClick={() => nav.goBack()}>返回</PcBtn>}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>{activityBanner}</div>
              <div style={{ gridColumn: '1 / -1' }}>{titleField}</div>
              <div style={{ gridColumn: '1 / -1' }}>{winnersField}</div>
              <div style={{ gridColumn: '1 / -1' }}>{descField}</div>
              <div style={{ gridColumn: '1 / -1' }}>{highlightsField}</div>
            </div>
          </PcPage>
        </div>
        <div style={{
          padding: '12px 24px 16px', borderTop: '1px solid var(--border)', flexShrink: 0,
          display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--bg)',
        }}>
          <PcBtn primary onClick={submit}>
            {submitting ? '提交中…' : '提交提名'}
          </PcBtn>
        </div>
        {winnerPicker}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="提交提名" onBack={() => nav.goBack()} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {activityBanner}
        {titleField}
        {winnersField}
        {descField}
        {highlightsField}
      </div>

      <div style={{ padding: '12px 20px 28px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <BtnPrimary onClick={submit}>
          {submitting ? '提交中…' : '提交提名'}
        </BtnPrimary>
      </div>

      {winnerPicker}
    </div>
  );
}

// ─── 获奖者选择弹窗（与提名人一致的通讯录选人方式）─────────────────
function WinnerPickerModal({ selected, onClose, onChange }) {
  const [search, setSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState({});
  const selIds = selected.map(s => s.id);
  const allM = allOrgMembers();

  const isSel = id => selIds.includes(id);
  const toggleMember = m => {
    onChange(isSel(m.id) ? selected.filter(x => x.id !== m.id) : [...selected, { id: m.id, name: m.name, deptName: m.deptName, title: m.title }]);
  };
  const deptAll = d => { const ids = deptMemberIds(d); return ids.length > 0 && ids.every(isSel); };
  const deptSome = d => deptMemberIds(d).some(isSel);
  const toggleDept = d => {
    const members = flattenMembers(d);
    const allIn = members.length > 0 && members.every(m => isSel(m.id));
    if (allIn) onChange(selected.filter(s => !members.some(m => m.id === s.id)));
    else {
      const add = members.filter(m => !isSel(m.id)).map(m => ({ id: m.id, name: m.name, deptName: m.deptName, title: m.title }));
      onChange([...selected, ...add]);
    }
  };

  function renderNode(node, depth) {
    const open = expanded[node.id];
    const selCnt = deptMemberIds(node).filter(isSel).length;
    return (
      <div key={node.id}>
        <div style={{ padding: '12px 0 12px ' + (depth * 18) + 'px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <div onClick={() => toggleDept(node)} style={{ cursor: 'pointer' }}><Check on={deptAll(node)} half={deptSome(node)} /></div>
          <div onClick={() => setExpanded(e => ({ ...e, [node.id]: !e[node.id] }))} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ fontSize: 16 }}>📁</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{node.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{deptMemberIds(node).length} 人{selCnt > 0 ? ' · 已选 ' + selCnt : ''}</div>
            </div>
            <svg width="11" height="11" viewBox="0 0 10 10" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M2 4L5 7L8 4" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        {open && (
          <div>
            {node.children && node.children.map(c => renderNode(c, depth + 1))}
            {node.members && node.members.map(m => (
              <div key={m.id} onClick={() => toggleMember({ ...m, deptName: node.name })} style={{ padding: '10px 0 10px ' + ((depth + 1) * 18) + 'px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                <Check on={isSel(m.id)} />
                <PAvatar name={m.name} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.title} · {m.tenure}年 · {m.jobType}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const searchRes = search ? allM.filter(m => m.name.includes(search) || m.deptName.includes(search)) : null;
  const isPc = honorIsPc();

  return (
    <HonorOverlay onClose={onClose} zIndex={200} maxWidth={640} mobileHeight="82%">
        <div style={{ padding: isPc ? '18px 22px 12px' : '14px 20px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: isPc ? 16 : 17, fontWeight: 700, color: 'var(--text)' }}>选择获奖者</span>
            <span onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }}>×</span>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="var(--text-dim)" strokeWidth="1.5"/>
              <path d="M10 10L13.5 13.5" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索姓名或部门…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font)' }}/>
            {search && <span onClick={() => setSearch('')} style={{ fontSize: 16, color: 'var(--text-dim)', cursor: 'pointer' }}>×</span>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: isPc ? '0 22px' : '0 20px' }}>
          {searchRes ? (
            <div>
              {searchRes.map((m, i, arr) => (
                <div key={m.id} onClick={() => toggleMember(m)} style={{ padding: '11px 0', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Check on={isSel(m.id)} />
                  <PAvatar name={m.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: 'var(--text)' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.deptName} · {m.title}</div>
                  </div>
                </div>
              ))}
              {searchRes.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>未找到匹配人员</div>}
            </div>
          ) : (
            <div style={{ paddingTop: 6 }}>{AppData.org.tree.map(d => renderNode(d, 0))}</div>
          )}
        </div>

        <div style={{ padding: isPc ? '12px 22px 18px' : '12px 20px 28px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
            已选 <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 16 }}>{selected.length}</span> 人
          </div>
          {isPc ? (
            <PcBtn primary onClick={onClose}>完成</PcBtn>
          ) : (
            <BtnPrimary onClick={onClose} style={{ width: 'auto', padding: '12px 32px' }}>完成</BtnPrimary>
          )}
        </div>
    </HonorOverlay>
  );
}

const nomInputStyle = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text)',
  fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box',
};

// ─── HR 提名审核 ──────────────────────────────────────────────────
function NominationReviewPage({ nav, params }) {
  const activityId = params.activityId || 1;
  const activity = AppData.activities.find(a => a.id === activityId) || AppData.activities[0];
  const [filter, setFilter] = React.useState('pending');
  const [tick, setTick] = React.useState(0);
  const [editor, setEditor] = React.useState(null); // null | { mode:'add'|'edit', ... }
  const [winnerPickerOpen, setWinnerPickerOpen] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const bump = () => setTick(t => t + 1);
  const cameWithEditRef = React.useRef(params && params.editId != null);

  void tick;
  const allNoms = AppData.nominations.filter(n => n.activityId === activityId);
  const counts = {
    all: allNoms.length,
    pending: allNoms.filter(n => (n.reviewStatus || 'approved') === 'pending').length,
    approved: allNoms.filter(n => (n.reviewStatus || 'approved') === 'approved').length,
    rejected: allNoms.filter(n => (n.reviewStatus || 'approved') === 'rejected').length,
  };
  const list = filter === 'all'
    ? allNoms
    : allNoms.filter(n => (n.reviewStatus || 'approved') === filter);

  const FILTERS = [
    { id: 'pending', label: '待审核', n: counts.pending },
    { id: 'approved', label: '已通过', n: counts.approved },
    { id: 'rejected', label: '已驳回', n: counts.rejected },
    { id: 'all', label: '全部', n: counts.all },
  ];

  function winnersFromNom(nom) {
    const org = allOrgMembers();
    const byName = name => org.find(m => m.name === name);
    const toWinner = (name, dept, job, i) => {
      const hit = byName(name);
      if (hit) return { id: hit.id, name: hit.name, deptName: hit.deptName, title: hit.title };
      return { id: 'orphan-' + i + '-' + name, name, deptName: dept || '—', title: job || '成员' };
    };
    if (nom.members && nom.members.length) {
      return nom.members.map((m, i) => toWinner(m.name, m.dept, m.job, i)).filter(w => w.name);
    }
    return parsePeopleNames(nom.nominees || '').map((name, i) => toWinner(name, '—', '成员', i));
  }

  function setStatus(id, reviewStatus) {
    HonorPersist.updateNomination(id, { reviewStatus });
    bump();
  }
  function doDelete(id) {
    HonorPersist.deleteNomination(id);
    setConfirmDel(null);
    bump();
  }

  function openAdd() {
    setWinnerPickerOpen(false);
    setEditor({
      mode: 'add',
      title: '',
      desc: '',
      highlights: ['', '', ''],
      winners: [],
      nominator: HonorPersist.meName,
      nominatorDept: HonorPersist.meDept,
      reviewStatus: 'approved',
    });
  }
  function openEdit(nom) {
    const hs = (nom.highlights || []).slice(0, 3);
    while (hs.length < 3) hs.push('');
    setWinnerPickerOpen(false);
    setEditor({
      mode: 'edit',
      id: nom.id,
      title: nom.title || '',
      desc: nom.desc || '',
      highlights: hs,
      winners: winnersFromNom(nom),
      nominator: nom.nominator || HonorPersist.meName,
      nominatorDept: nom.nominatorDept || HonorPersist.meDept,
      reviewStatus: nom.reviewStatus || 'approved',
    });
  }

  React.useEffect(() => {
    const editId = params && params.editId;
    if (editId == null) return;
    const nom = AppData.nominations.find(n => n.id === editId && n.activityId === activityId);
    if (nom) openEdit(nom);
  }, []);

  function closeEditor() {
    setWinnerPickerOpen(false);
    setEditor(null);
    if (cameWithEditRef.current) {
      cameWithEditRef.current = false;
      if (nav.goBack) nav.goBack();
    }
  }

  function saveEditor() {
    if (!editor || !editor.title.trim() || !editor.desc.trim()) return;
    const highlights = editor.highlights.map(h => h.trim()).filter(Boolean);
    const winners = editor.winners || [];
    const members = winners.map(w => ({
      name: w.name,
      dept: w.deptName || w.dept || '—',
      job: w.title || w.job || '成员',
    }));
    const nominees = members.length
      ? members.map(m => m.name).join('、')
      : editor.title.trim();
    if (editor.mode === 'add') {
      const maxId = AppData.nominations.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);
      const forAct = AppData.nominations.filter(n => n.activityId === activityId);
      HonorPersist.addNomination({
        id: maxId + 1,
        activityId,
        title: editor.title.trim(),
        nominees,
        members: members.length ? members : [{ name: nominees, dept: editor.nominatorDept, job: '成员' }],
        nominator: editor.nominator,
        nominatorDept: editor.nominatorDept,
        votes: 0,
        rank: forAct.length + 1,
        myVote: false,
        reviewStatus: editor.reviewStatus || 'approved',
        desc: editor.desc.trim(),
        highlights,
      });
    } else {
      HonorPersist.updateNomination(editor.id, {
        title: editor.title.trim(),
        desc: editor.desc.trim(),
        highlights,
        nominees,
        members: members.length ? members : [{ name: nominees, dept: editor.nominatorDept, job: '成员' }],
        reviewStatus: editor.reviewStatus,
      });
    }
    setWinnerPickerOpen(false);
    setEditor(null);
    bump();
    if (cameWithEditRef.current) {
      cameWithEditRef.current = false;
      if (nav.goBack) nav.goBack();
    }
  }

  const isPc = honorIsPc();

  const reviewModals = (
    <>
      {confirmDel && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={() => setConfirmDel(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 320, background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 18, padding: 20,
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>删除提名？</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 18 }}>
              「{confirmDel.title}」删除后不可恢复。
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <BtnGhost onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>取消</BtnGhost>
              <BtnPrimary onClick={() => doDelete(confirmDel.id)} style={{ flex: 1, background: '#E5534B' }}>删除</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 140, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={closeEditor} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'relative', background: 'var(--bg)', borderRadius: '20px 20px 0 0',
            borderTop: '1px solid var(--border)', maxHeight: '88%', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                {editor.mode === 'add' ? '新增提名' : '编辑提名'}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'none' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>提名名称 *</div>
                <input value={editor.title} onChange={e => setEditor(ed => ({ ...ed, title: e.target.value }))} style={nomInputStyle} placeholder="项目或人员名称…" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  被提名人 <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>（通讯录选人，可选）</span>
                </div>
                <div onClick={() => setWinnerPickerOpen(true)} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
                  padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>👤</div>
                  <span style={{ flex: 1, fontSize: 14, color: (editor.winners || []).length ? 'var(--text)' : 'var(--text-dim)' }}>
                    {(editor.winners || []).length ? `已选 ${editor.winners.length} 人` : '从通讯录选择获奖者'}
                  </span>
                  <span style={{ color: 'var(--accent)', fontSize: 17 }}>›</span>
                </div>
                {(editor.winners || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {editor.winners.map(w => (
                      <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 10px 5px 5px' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{(w.name || '?')[0]}</div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{w.name}</span>
                        <span onClick={(e) => {
                          e.stopPropagation();
                          setEditor(ed => ({ ...ed, winners: ed.winners.filter(x => x.id !== w.id) }));
                        }} style={{ fontSize: 15, color: 'var(--text-dim)', cursor: 'pointer' }}>×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>推荐理由 *</div>
                <textarea value={editor.desc} onChange={e => setEditor(ed => ({ ...ed, desc: e.target.value }))} rows={4} style={{ ...nomInputStyle, resize: 'none' }} placeholder="推荐理由…" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>亮点</div>
                {editor.highlights.map((h, i) => (
                  <input key={i} value={h}
                    onChange={e => setEditor(ed => ({ ...ed, highlights: ed.highlights.map((v, j) => j === i ? e.target.value : v) }))}
                    placeholder={`亮点 ${i + 1}`}
                    style={{ ...nomInputStyle, marginBottom: 8 }}
                  />
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>审核状态</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['pending', 'approved', 'rejected'].map(s => (
                    <button key={s} onClick={() => setEditor(ed => ({ ...ed, reviewStatus: s }))} style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)',
                      fontSize: 12, fontWeight: 700,
                      border: `1px solid ${editor.reviewStatus === s ? 'var(--accent-border)' : 'var(--border)'}`,
                      background: editor.reviewStatus === s ? 'var(--accent-dim)' : 'var(--bg-card)',
                      color: editor.reviewStatus === s ? 'var(--accent)' : 'var(--text-muted)',
                    }}>{HonorPersist.REVIEW[s].label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 20px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
              <BtnGhost onClick={closeEditor} style={{ flex: 1 }}>取消</BtnGhost>
              <BtnPrimary onClick={saveEditor} style={{ flex: 1.4 }}>保存</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {editor && winnerPickerOpen && (
        <WinnerPickerModal
          selected={editor.winners || []}
          onChange={ws => setEditor(ed => ({ ...ed, winners: ws }))}
          onClose={() => setWinnerPickerOpen(false)}
        />
      )}
    </>
  );

  if (isPc) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <PcPage
          title="提名审核"
          actions={(
            <>
              <PcBtn onClick={() => nav.goBack()}>返回</PcBtn>
              <PcBtn primary onClick={openAdd}>＋ 新增</PcBtn>
            </>
          )}
        >
          <div style={{
            marginBottom: 14, padding: '10px 12px', borderRadius: 12,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>{AppData.typeIcons[activity.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>共 {counts.all} 份 · 待审 {counts.pending}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {FILTERS.map(f => (
              <PcBtn key={f.id} primary={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label} {f.n}
              </PcBtn>
            ))}
          </div>

          <PcTable
            empty="暂无提名 · 可点「新增」补录名单"
            rows={list}
            columns={[
              { key: 'nominees', label: '被提名人', render: (nom) => formatPeopleNames(nom.nominees || nom.title) },
              { key: 'title', label: '标题', render: (nom) => nom.title },
              { key: 'nominator', label: '提名人', width: 140, render: (nom) => nom.nominator },
              { key: 'status', label: '状态', width: 90, render: (nom) => <ReviewStatusBadge status={nom.reviewStatus || 'approved'} /> },
              { key: 'ops', label: '操作', width: 240, stopRowClick: true, render: (nom) => {
                const rs = nom.reviewStatus || 'approved';
                return (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {rs === 'pending' && (
                      <>
                        <PcBtn primary onClick={() => setStatus(nom.id, 'approved')}>通过</PcBtn>
                        <PcBtn danger onClick={() => setStatus(nom.id, 'rejected')}>驳回</PcBtn>
                      </>
                    )}
                    {rs !== 'rejected' && (
                      <PcBtn onClick={() => openEdit(nom)}>编辑</PcBtn>
                    )}
                    <PcBtn onClick={() => setConfirmDel(nom)}>删除</PcBtn>
                  </div>
                );
              }},
            ]}
          />
        </PcPage>
        {reviewModals}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Header
        title="提名审核"
        onBack={() => nav.goBack()}
        right={
          <span onClick={openAdd} style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}>＋ 新增</span>
        }
      />

      <div style={{
        margin: '0 20px 12px', padding: '10px 12px', borderRadius: 12,
        background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>{AppData.typeIcons[activity.type]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>共 {counts.all} 份 · 待审 {counts.pending}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 20px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flexShrink: 0, border: `1px solid ${filter === f.id ? 'var(--accent-border)' : 'var(--border)'}`,
            background: filter === f.id ? 'var(--accent-dim)' : 'var(--bg-card)',
            color: filter === f.id ? 'var(--accent)' : 'var(--text-muted)',
            borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)',
          }}>
            {f.label} {f.n}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px dashed var(--border)',
            borderRadius: 16, padding: '36px 20px', textAlign: 'center', marginTop: 8,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.7 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>暂无提名</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>可点右上角「新增」补录名单</div>
          </div>
        ) : list.map(nom => {
          const rs = nom.reviewStatus || 'approved';
          return (
            <div key={nom.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 4 }}>
                    {nom.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatPeopleNames(nom.nominees || nom.title)} · 由{nom.nominator}提名
                  </div>
                </div>
                <ReviewStatusBadge status={rs} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                {(nom.desc || '').slice(0, 80)}{(nom.desc || '').length > 80 ? '…' : ''}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {rs === 'pending' && (
                  <>
                    <button onClick={() => setStatus(nom.id, 'approved')} style={revBtnStyle('#3DDC84')}>审核通过</button>
                    <button onClick={() => setStatus(nom.id, 'rejected')} style={revBtnStyle('#E5534B')}>审核驳回</button>
                  </>
                )}
                {rs !== 'rejected' && (
                  <button onClick={() => openEdit(nom)} style={revBtnStyle('var(--accent)')}>编辑</button>
                )}
                <button onClick={() => setConfirmDel(nom)} style={revBtnStyle('var(--text-muted)')}>删除</button>
              </div>
            </div>
          );
        })}
      </div>

      {reviewModals}
    </div>
  );
}

function revBtnStyle(color) {
  return {
    background: 'var(--bg-elevated)', color, border: '1px solid var(--border)',
    borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font)',
  };
}






// leaderboard.jsx — 榜单展示 + 活动列表

// ─── 电子证书：下载 PNG ───────────────────────────────────────────
function isChampionAwardee(activityId, name) {
  if (!name) return false;
  const res = AppData.results[activityId];
  if (!res || !res.winner) return false;
  const members = res.winner.members || [];
  if (members.some(function (m) { return m.name === name; })) return true;
  return String(res.winner.title || '').split(/[、,，]/).map(function (s) { return s.trim(); }).indexOf(name) >= 0;
}

function downloadHonorCertificate(cert, meta) {
  const title = (cert && (cert.title || cert.fileName)) || '荣誉证书';
  const subtitle = (cert && cert.subtitle) || '专属证书';
  const awardee = (meta && meta.awardee) || (typeof HonorPersist !== 'undefined' && HonorPersist.meName) || '获奖者';
  const activityTitle = (meta && meta.activityTitle) || '';
  const placeLabel = (meta && meta.placeLabel) || '';
  const fileBase = (title + '-' + awardee).replace(/[\\/:*?"<>|]/g, '_');

  function triggerDownload(href, filename) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (cert && cert.dataUrl && String(cert.dataUrl).indexOf('data:image') === 0) {
    const ext = cert.dataUrl.indexOf('image/png') >= 0 ? 'png'
      : (cert.dataUrl.indexOf('image/jpeg') >= 0 || cert.dataUrl.indexOf('image/jpg') >= 0) ? 'jpg' : 'png';
    triggerDownload(cert.dataUrl, fileBase + '.' + ext);
    return;
  }

  const w = 1200;
  const h = 850;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#FFF8EE');
  grad.addColorStop(0.5, '#FFFFFF');
  grad.addColorStop(1, '#FFF4E0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#F5B842';
  ctx.lineWidth = 10;
  ctx.strokeRect(36, 36, w - 72, h - 72);
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, w - 104, h - 104);

  ctx.fillStyle = '#F5B842';
  ctx.font = '700 28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦  HONOR  ✦', w / 2, 130);

  ctx.fillStyle = '#1A1A1A';
  ctx.font = '800 72px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(title, w / 2, 230);

  ctx.fillStyle = '#8A7350';
  ctx.font = '500 28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(subtitle, w / 2, 290);

  ctx.fillStyle = '#1A1A1A';
  ctx.font = '700 48px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(awardee, w / 2, 420);

  ctx.fillStyle = '#666666';
  ctx.font = '400 26px "PingFang SC", "Microsoft YaHei", sans-serif';
  const line2 = [activityTitle, placeLabel].filter(Boolean).join('  ·  ') || '评优表彰';
  ctx.fillText(line2, w / 2, 490);

  ctx.fillStyle = '#999999';
  ctx.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('兹证明上述人员在评优活动中表现卓越，特发此证。', w / 2, 580);

  const today = new Date();
  const dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';
  ctx.fillText(dateStr, w / 2, 720);

  canvas.toBlob(function (blob) {
    if (!blob) {
      try {
        triggerDownload(canvas.toDataURL('image/png'), fileBase + '.png');
      } catch (e) { /* ignore */ }
      return;
    }
    const url = URL.createObjectURL(blob);
    triggerDownload(url, fileBase + '.png');
    setTimeout(function () { URL.revokeObjectURL(url); }, 2500);
  }, 'image/png');
}

// ─── 奖励展示：积分 / 勋章 / 证书（仅员工冠军可下证书）────────────
function HonorRewards({ rewards, variant = 'card', certMeta, stopCertBubble = true, canDownloadCert = false }) {
  if (!rewards) return null;
  const hasPts = rewards.points > 0;
  const hasBadge = !!rewards.badge;
  const hasCert = !!(rewards.certificate && (rewards.certificate.dataUrl || rewards.certificate.fileName || rewards.certificate.title));
  if (!hasPts && !hasBadge && !hasCert) return null;
  const compact = variant === 'card';
  const cert = rewards.certificate;
  const certTitle = cert ? (cert.title || cert.fileName || '电子证书') : '';
  const certHint = canDownloadCert ? '点击下载证书' : ((cert && cert.subtitle) || '电子证书');
  const count = [hasPts, hasBadge, hasCert].filter(Boolean).length;

  const cell = (icon, title, sub, opts) => {
    const clickable = !!(opts && opts.onClick);
    const isCert = !!(opts && opts.isCert);
    return (
      <div
        onClick={clickable ? (e) => {
          if (stopCertBubble) e.stopPropagation();
          opts.onClick(e);
        } : undefined}
        role={clickable ? 'button' : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: compact ? 6 : 10,
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid var(--accent-border)',
          borderRadius: compact ? 12 : 14,
          padding: compact ? '10px 10px' : '12px 14px',
          minWidth: 0,
          cursor: clickable ? 'pointer' : 'default',
        }}
      >
        {typeof icon === 'string' && icon.startsWith('data:')
          ? <img src={icon} alt="" style={{ width: compact ? 18 : 24, height: compact ? 18 : 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          : <span style={{ fontSize: compact ? 18 : 24, flexShrink: 0, lineHeight: 1 }}>{icon}</span>}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: isCert ? (compact ? 12 : 15) : (compact ? 13 : 18),
            fontWeight: 800, color: 'var(--accent)',
            lineHeight: 1.25, letterSpacing: '-0.2px',
            whiteSpace: 'normal', wordBreak: 'keep-all',
          }}>{title}</div>
          <div style={{
            fontSize: compact ? 10 : 11,
            color: clickable ? 'var(--accent)' : 'var(--text-muted)',
            marginTop: 2,
            fontWeight: clickable ? 600 : 400,
            lineHeight: 1.3,
            whiteSpace: 'normal',
          }}>{sub}</div>
        </div>
        {clickable && (
          <span style={{ fontSize: compact ? 12 : 14, color: 'var(--accent)', flexShrink: 0, opacity: 0.9, lineHeight: 1 }}>↓</span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: count > 1 ? '1fr 1fr' : '1fr',
      gap: compact ? 8 : 10,
    }}>
      {hasPts && cell('🎁', `${rewards.points} 积分`, '积分奖励')}
      {hasBadge && cell(rewards.badge.icon, rewards.badge.name, '专属勋章')}
      {hasCert && cell(
        (cert.dataUrl && String(cert.dataUrl).startsWith('data:image')) ? cert.dataUrl : '📜',
        certTitle,
        certHint,
        canDownloadCert
          ? { onClick: () => downloadHonorCertificate(cert, certMeta), isCert: true }
          : { isCert: true },
      )}
    </div>
  );
}

// ─── 荣誉殿堂 (多活动 Hub) ────────────────────────────────────────
function LeaderboardPage({ nav, params, roleSwitcher }) {
  const [typeFilter, setTypeFilter] = React.useState('全部');
  const endedActs = AppData.activities
    .filter(a => HonorPersist.isPublished(a.status))
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

  const types = ['全部', '项目', '个人', '团队'];
  const filtered = typeFilter === '全部' ? endedActs : endedActs.filter(a => a.type === typeFilter);

  if (honorIsPc()) {
    return (
      <PcPage
        actions={!nav.atRoot ? <PcBtn onClick={() => nav.goBack()}>返回</PcBtn> : null}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {types.map(t => (
            <PcBtn key={t} primary={typeFilter === t} onClick={() => setTypeFilter(t)}>
              {t === '全部' ? t : `${AppData.typeIcons[t]} ${t}`}
            </PcBtn>
          ))}
        </div>
        <HallsView nav={nav} acts={filtered} />
      </PcPage>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="荣誉殿堂" onBack={nav.atRoot ? null : () => nav.goBack()} right={roleSwitcher} />

      {/* 类型分类 tab */}
      <div style={{ padding: '12px 20px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {types.map(t => (
            <div key={t} onClick={() => setTypeFilter(t)} style={{
              flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 9, cursor: 'pointer',
              fontSize: 13, fontWeight: typeFilter === t ? 700 : 500,
              color: typeFilter === t ? 'var(--accent)' : 'var(--text-muted)',
              background: typeFilter === t ? 'var(--accent-dim)' : 'var(--bg-card)',
              border: `1px solid ${typeFilter === t ? 'var(--accent-border)' : 'var(--border)'}`,
              transition: 'transform 0.15s',
            }}>{t === '全部' ? t : `${AppData.typeIcons[t]} ${t}`}</div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '8px 20px 24px' }}>
        <HallsView nav={nav} acts={filtered} />
      </div>
    </div>
  );
}

// 历届荣誉：PC 一行一活动；移动端冠军陈列卡
function HallsView({ nav, acts }) {
  const rows = acts.filter(a => AppData.results[a.id]);

  if (honorIsPc()) {
    return (
      <PcTable
        empty="暂无该类型的获奖荣誉"
        columns={[
          { key: 'title', label: '活动', render: (a) => (
            <span><span style={{ marginRight: 6 }}>{AppData.typeIcons[a.type]}</span>{a.title}</span>
          )},
          { key: 'type', label: '类型', width: 80, render: (a) => a.type },
          { key: 'winner', label: '冠军', render: (a) => {
            const w = AppData.results[a.id].winner;
            const name = formatPeopleNames(w.title);
            return w.name ? `${name} · ${w.name}` : name;
          }},
          { key: 'votes', label: '票数', width: 80, render: (a) => AppData.results[a.id].winner.votes },
          { key: 'runners', label: '亚季军', render: (a) => {
            const runners = AppData.results[a.id].runners || [];
            if (!runners.length) return '—';
            return runners.map((r, i) => `${i === 0 ? '🥈' : '🥉'}${formatPeopleNames(r.title, 2)}`).join(' ');
          }},
          { key: 'deadline', label: '时间', width: 100, render: (a) => honorDate(a.deadline) },
          { key: 'ops', label: '操作', width: 100, stopRowClick: true, render: (a) => (
            <PcBtn onClick={() => nav.navigate('activity-result', { activityId: a.id })}>查看</PcBtn>
          )},
        ]}
        rows={rows}
        onRowClick={(a) => nav.navigate('activity-result', { activityId: a.id })}
      />
    );
  }

  if (acts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: 14 }}>
        暂无该类型的获奖荣誉
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, padding: '4px 2px' }}>
        共 <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{acts.length}</span> 项已揭晓的荣誉，点击查看完整榜单
      </div>
      {acts.map(act => {
        const res = AppData.results[act.id];
        if (!res) return null;
        const w = res.winner;
        return (
          <div key={act.id} onClick={() => nav.navigate('activity-result', { activityId: act.id })}
            style={{
              background: 'linear-gradient(135deg, #FFF8EE, #FFF3DC)',
              border: '1px solid var(--accent-border)', borderRadius: 18, padding: '16px',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,184,66,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>

            {/* 活动标题行 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{AppData.typeIcons[act.type]}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{act.title}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{honorDate(act.deadline)}</span>
            </div>

            {/* 冠军 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                boxShadow: '0 4px 16px var(--accent-dim)',
              }}>🏆</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 0.5, marginBottom: 2 }}>冠军</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.35 }}>{formatPeopleNames(w.title)}</div>
                {w.name && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2, lineHeight: 1.35 }}>{w.name}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>由{w.nominator} · {w.nominatorDept}提名</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>{w.votes}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>票</div>
              </div>
            </div>

            {/* 获奖奖励（积分 / 勋章 / 双奖励） */}
            <HonorRewards rewards={act.rewards} variant="card" />

            {/* 亚季军预览 */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
              {res.runners.map((r, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                  <span>{i === 0 ? '🥈' : '🥉'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatPeopleNames(r.title, 2)}</span>
                </div>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>查看 ›</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 获奖人员列表弹层 ────────────────────────────────────────────
function WinnersListModal({ entry, rankLabel, onClose }) {
  if (!entry) return null;
  const list = (entry.members && entry.members.length)
    ? entry.members
    : parsePeopleNames(entry.title).map(name => ({
        name,
        dept: entry.nominatorDept || '—',
        job: '成员',
      }));
  if (list.length === 0 && entry.title) {
    list.push({ name: entry.title, dept: entry.nominatorDept || '—', job: '成员' });
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', animation: 'fadeIn 0.2s ease' }}/>
      <div style={{
        position: 'relative', background: 'var(--bg)', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid var(--border)', maxHeight: '78%', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 20px 10px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 12px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>获奖人员</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {rankLabel} · 共 {list.length} 人
              </div>
            </div>
            <span onClick={onClose} style={{
              width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer',
            }}>×</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '14px 14px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 8px' }}>
            {list.map((m, i) => (
              <div key={(m.name || '') + i} style={{ textAlign: 'center', minWidth: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  color: 'var(--on-accent)', fontWeight: 800, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px var(--accent-dim)',
                }}>{(m.name || '?').slice(0, 1)}</div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{m.name}</div>
                <div style={{
                  fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.35,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{m.dept}·{m.job}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '10px 20px 28px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <BtnPrimary onClick={onClose}>关闭</BtnPrimary>
        </div>
      </div>
    </div>
  );
}

// ─── 单活动结果页 (从殿堂下钻) ────────────────────────────────────
function ActivityResultPage({ nav, params }) {
  const activityId = params.activityId;
  const activity = AppData.activities.find(a => a.id === activityId) || AppData.activities[2];
  const canShow = HonorPersist.canShowResult(nav.role, activity.status);
  const res = AppData.results[activityId] || AppData.results[3];
  const winner = res.winner;
  const runners = res.runners;
  const all = [winner, ...runners];
  const totalVotes = all.reduce((s, n) => s + n.votes, 0);
  const [peopleModal, setPeopleModal] = React.useState(null); // { entry, rankLabel }
  const showRewards = !!(activity.rewards && (nav.role === 'hr' || HonorPersist.isPublished(activity.status)));
  const canDownloadCert = nav.role !== 'hr' && isChampionAwardee(activityId, HonorPersist.meName);
  const isPc = honorIsPc();
  const RANK_META = [
    { label: '冠军', icon: '🏆' },
    { label: '亚军', icon: '🥈' },
    { label: '季军', icon: '🥉' },
  ];
  const winnerRows = all.map((entry, idx) => ({
    ...entry,
    id: entry.id != null ? entry.id : `winner-${idx}`,
    _idx: idx,
    _rankLabel: RANK_META[idx] ? RANK_META[idx].label : `第${idx + 1}名`,
    _rankIcon: RANK_META[idx] ? RANK_META[idx].icon : `${idx + 1}`,
  }));

  if (!canShow) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {isPc ? (
          <PcPage title="活动榜单" actions={<PcBtn onClick={() => nav.goBack()}>返回</PcBtn>}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
              <div style={{ fontSize: 36, opacity: 0.8 }}>🔒</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>投票结果复核中</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                结果尚未公示，公示后可查看最终榜单与获奖奖励
              </div>
            </div>
          </PcPage>
        ) : (
          <>
            <Header title="活动榜单" subtitle={activity.title} onBack={() => nav.goBack()} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
              <div style={{ fontSize: 36, opacity: 0.8 }}>🔒</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>投票结果复核中</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                结果尚未公示，公示后可查看最终榜单与获奖奖励
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (isPc) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <PcPage
          title="活动榜单"
          actions={<PcBtn onClick={() => nav.goBack()}>返回</PcBtn>}
        >
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{activity.title}</div>

          {showRewards && (activity.rewards.points > 0 || activity.rewards.badge || activity.rewards.certificate) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>获奖者奖励</div>
              <HonorRewards
                rewards={activity.rewards}
                variant="detail"
                canDownloadCert={canDownloadCert}
                certMeta={{
                  awardee: HonorPersist.meName,
                  activityTitle: activity.title,
                  placeLabel: '冠军',
                }}
              />
            </div>
          )}

          <PcTable
            empty="暂无榜单"
            rows={winnerRows}
            onRowClick={(row) => setPeopleModal({ entry: row, rankLabel: row._rankLabel })}
            columns={[
              { key: 'rank', label: '名次', width: 80, render: (row) => (
                <span>{row._rankIcon} {row._rankLabel}</span>
              )},
              { key: 'people', label: '获奖者', render: (row) => formatPeopleNames(row.title) },
              { key: 'name', label: '项目', render: (row) => row.name || '—' },
              { key: 'nominator', label: '提名人', width: 160, render: (row) => `${row.nominator} · ${row.nominatorDept}` },
              { key: 'votes', label: '票数', width: 100, render: (row) => (
                <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {row.votes} · {Math.round(row.votes / totalVotes * 100)}%
                </span>
              )},
              { key: 'ops', label: '操作', width: 100, stopRowClick: true, render: (row) => (
                <PcBtn onClick={() => setPeopleModal({ entry: row, rankLabel: row._rankLabel })}>人员</PcBtn>
              )},
            ]}
          />

          <div style={{ marginTop: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>活动总结</div>
            {[
              { label: '总投票数', val: activity.totalVotes.toLocaleString() },
              { label: '参与提名数', val: activity.nominations },
              { label: '活动时长', val: '20 天' },
              { label: '员工参与率', val: '73%' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.val}</span>
              </div>
            ))}
          </div>
        </PcPage>

        {peopleModal && (
          <WinnersListModal
            entry={peopleModal.entry}
            rankLabel={peopleModal.rankLabel}
            onClose={() => setPeopleModal(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Header title="活动榜单" subtitle={activity.title} onBack={() => nav.goBack()} />

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {/* 冠军卡 */}
        <div style={{ margin: '16px 20px 0' }}>
          <div
            onClick={() => setPeopleModal({ entry: winner, rankLabel: '冠军' })}
            style={{
              background: 'linear-gradient(135deg, #FFF6E0, #FFEFC8)',
              border: '1.5px solid var(--accent)',
              borderRadius: 20, padding: '20px', position: 'relative', overflow: 'hidden',
              cursor: 'pointer',
            }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,184,66,0.2) 0%, transparent 70%)', pointerEvents: 'none' }}/>
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,140,66,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}/>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }}>🏆</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase' }}>冠军</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>查看人员 ›</span>
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 6, lineHeight: 1.35 }}>
              {formatPeopleNames(winner.title)}
            </div>
            {winner.name && (
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, lineHeight: 1.35 }}>
                {winner.name}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              由<span style={{ color: 'var(--text)', fontWeight: 600 }}>{winner.nominator} · {winner.nominatorDept}</span>提名
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {winner.highlights.map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'rgba(245,184,66,0.12)', border: '1px solid rgba(245,184,66,0.2)', padding: '4px 10px', borderRadius: 6 }}>{h}</span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: activity.rewards ? 16 : 0 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-1.5px', fontVariantNumeric: 'tabular-nums' }}>{winner.votes.toLocaleString()}</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>票</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                占比 {Math.round(winner.votes / totalVotes * 100)}%
              </span>
            </div>

            {showRewards && (activity.rewards.points > 0 || activity.rewards.badge || activity.rewards.certificate) && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>获奖者奖励</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>等额奖励</span>
                </div>
                <HonorRewards
                  rewards={activity.rewards}
                  variant="detail"
                  canDownloadCert={canDownloadCert}
                  certMeta={{
                    awardee: HonorPersist.meName,
                    activityTitle: activity.title,
                    placeLabel: '冠军',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 亚季军 */}
        <div style={{ margin: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {runners.map((nom, idx) => {
            const pct = Math.round(nom.votes / totalVotes * 100);
            const rankIcon = idx === 0 ? '🥈' : '🥉';
            const rankLabel = idx === 0 ? '亚军' : '季军';
            return (
              <div key={idx}
                onClick={() => setPeopleModal({ entry: nom, rankLabel })}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px',
                  cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{rankIcon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{formatPeopleNames(nom.title, 3)}</div>
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>人员 ›</span>
                    </div>
                    {nom.name && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.35 }}>{nom.name}</div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>由{nom.nominator} · {nom.nominatorDept}提名</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {nom.highlights.map(h => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4 }}>{h}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, opacity: 0.5 }}/>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {nom.votes} 票 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {pct}%</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 统计 */}
        <div style={{ margin: '14px 20px 0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>活动总结</div>
          {[
            { label: '总投票数', val: activity.totalVotes.toLocaleString() },
            { label: '参与提名数', val: activity.nominations },
            { label: '活动时长', val: '20 天' },
            { label: '员工参与率', val: '73%' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.val}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 24 }} />
      </div>

      {peopleModal && (
        <WinnersListModal
          entry={peopleModal.entry}
          rankLabel={peopleModal.rankLabel}
          onClose={() => setPeopleModal(null)}
        />
      )}
    </div>
  );
}

// ─── 活动列表 ─────────────────────────────────────────────────────
function ActivityListPage({ nav }) {
  const isHr = nav.role === 'hr';
  const [filter, setFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('全部');
  const [query, setQuery] = React.useState('');
  const [draftQuery, setDraftQuery] = React.useState('');
  const [draftFilter, setDraftFilter] = React.useState('all');
  const [draftType, setDraftType] = React.useState('全部');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const filters = [
    { id: 'all', label: '全部' },
    { id: 'nominating', label: '征集中' },
    { id: 'voting', label: '投票中' },
    { id: 'reviewing', label: '复核中' },
    { id: 'published', label: '已公示' },
    ...(isHr ? [{ id: 'draft', label: '草稿' }] : []),
  ];
  const typeFilters = ['全部', '项目', '个人', '团队'];

  const baseActs = isHr
    ? AppData.activities
    : AppData.activities.filter(a => a.status !== 'draft');

  const statusCount = (id) => {
    if (id === 'all') return baseActs.length;
    if (id === 'published') return baseActs.filter(a => HonorPersist.isPublished(a.status)).length;
    return baseActs.filter(a => a.status === id).length;
  };

  const filtered = baseActs
    .filter(a => {
      if (filter === 'all') return true;
      if (filter === 'published') return HonorPersist.isPublished(a.status);
      return a.status === filter;
    })
    .filter(a => typeFilter === '全部' || a.type === typeFilter)
    .filter(a => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const hay = [a.title, a.desc, a.creator, a.creatorRole, a.type].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      const pa = a.pinnedAt || 0;
      const pb = b.pinnedAt || 0;
      if (pb !== pa) return pb - pa;
      return new Date(b.deadline) - new Date(a.deadline);
    });

  const isPc = honorIsPc();
  const reviewingActCount = AppData.activities.filter(a => a.status === 'reviewing').length;
  const pendingNomCount = (AppData.nominations || []).filter(n => (n.reviewStatus || 'approved') === 'pending').length;

  const openAct = (a) => HonorPersist.isPublished(a.status)
    ? nav.navigate('activity-result', { activityId: a.id })
    : nav.navigate('activity-detail', { activityId: a.id });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (isPc && isHr) {
    return (
      <div className="ad-admin">
        <div className="ad-stack">
          <AdAlert
            type="warning"
            showIcon
            message="待办提醒"
            description={`${reviewingActCount} 个活动需要复核，${pendingNomCount} 个提名需要审核。`}
          />
          <div className="ad-card ad-query">
            <div className="ad-filter-title">活动筛选</div>
            <div className="ad-filter-grid">
              <div className="ad-field">
                <label>活动名称</label>
                <input value={draftQuery} onChange={e => setDraftQuery(e.target.value)} placeholder="请输入活动名称关键字" />
              </div>
              <div className="ad-field">
                <label>活动状态</label>
                <select value={draftFilter} onChange={e => setDraftFilter(e.target.value)}>
                  {filters.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <div className="ad-field">
                <label>评优类型</label>
                <select value={draftType} onChange={e => setDraftType(e.target.value)}>
                  {typeFilters.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="ad-filter-actions">
                <AdBtn type="primary" onClick={() => { setQuery(draftQuery); setFilter(draftFilter); setTypeFilter(draftType); setPage(1); }}>查询</AdBtn>
                <AdBtn onClick={() => {
                  setDraftQuery(''); setDraftFilter('all'); setDraftType('全部');
                  setQuery(''); setFilter('all'); setTypeFilter('全部'); setPage(1);
                }}>重置</AdBtn>
              </div>
            </div>
          </div>
          <div className="ad-card">
            <div className="ad-toolbar">
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>共 {filtered.length} 条</span>
              <AdBtn type="primary" onClick={() => nav.navigate('create-activity')}>+ 新建活动</AdBtn>
            </div>
            {pageRows.length === 0 ? (
              <div className="ad-empty">{query || filter !== 'all' || typeFilter !== '全部' ? '无匹配活动，试试调整筛选' : '暂无活动'}</div>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>活动标题</th>
                      <th>状态</th>
                      <th>类型</th>
                      <th>提名截止</th>
                      <th>活动截止</th>
                      <th>提名</th>
                      <th>待审</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(a => (
                      <tr key={a.id} className="ad-row-click" onClick={() => openAct(a)}>
                        <td>
                          <AdBtn type="link" onClick={() => openAct(a)}>{a.title}</AdBtn>
                          {HonorPersist.isPinned(a) ? <AdTag color="gold">置顶</AdTag> : null}
                        </td>
                        <td><AdStatusTag status={a.status} /></td>
                        <td>{a.type}</td>
                        <td>{honorDate(a.nominateEnd)}</td>
                        <td>{honorDate(a.deadline)}</td>
                        <td>{a.nominations}</td>
                        <td>{a.status === 'nominating' ? countPendingNoms(a.id) : '—'}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <AdBtn type="link" onClick={() => openAct(a)}>详情</AdBtn>
                          <AdBtn type="link" onClick={() => HonorPersist.setPinned(a.id, !HonorPersist.isPinned(a))}>
                            {HonorPersist.isPinned(a) ? '取消置顶' : '置顶'}
                          </AdBtn>
                          {a.status === 'draft' ? (
                            <AdBtn type="link" onClick={() => nav.navigate('edit-activity', { activityId: a.id })}>编辑</AdBtn>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AdPager
              total={filtered.length}
              page={safePage}
              pageSize={pageSize}
              onChange={setPage}
              onPageSize={(n) => { setPageSize(n); setPage(1); }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isPc) {
    return (
      <PcPage>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12,
          padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索活动名称、描述、创建人…"
              style={{
                flex: '1 1 220px', minWidth: 180, height: 36, padding: '0 12px',
                borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none',
              }}
            />
            {(query || filter !== 'all' || typeFilter !== '全部') && (
              <PcBtn onClick={() => { setQuery(''); setFilter('all'); setTypeFilter('全部'); }}>清除筛选</PcBtn>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              共 <b style={{ color: 'var(--text)' }}>{filtered.length}</b> 条
            </span>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6 }}>状态</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {filters.map(f => (
                <PcBtn key={f.id} primary={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label} · {statusCount(f.id)}
                </PcBtn>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6 }}>类型</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {typeFilters.map(t => (
                <PcBtn key={t} primary={typeFilter === t} onClick={() => setTypeFilter(t)}>
                  {t === '全部' ? t : `${AppData.typeIcons[t] || ''} ${t}`}
                </PcBtn>
              ))}
            </div>
          </div>
        </div>
        <PcTable
          empty={query || filter !== 'all' || typeFilter !== '全部' ? '无匹配活动，试试调整筛选' : '暂无活动'}
          columns={[
            { key: 'title', label: '活动', render: (a) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ marginRight: 2 }}>{AppData.typeIcons[a.type]}</span>
                {a.title}
                {HonorPersist.isPinned(a) && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#E5534B',
                    background: 'rgba(229,83,75,0.1)', border: '1px solid rgba(229,83,75,0.28)',
                    borderRadius: 4, padding: '1px 6px',
                  }}>置顶</span>
                )}
              </span>
            )},
            { key: 'status', label: '状态', width: 100, render: (a) => <StatusBadge status={a.status} /> },
            { key: 'type', label: '类型', width: 72, render: (a) => a.type },
            { key: 'nominateEnd', label: '提名截止', width: 100, render: (a) => honorDate(a.nominateEnd) },
            { key: 'deadline', label: '活动截止', width: 100, render: (a) => honorDate(a.deadline) },
            { key: 'nominations', label: '提名', width: 64, render: (a) => a.nominations },
            { key: 'ops', label: '操作', width: 120, stopRowClick: true, render: (a) => {
              const opLabel = a.status === 'nominating' ? '去提名'
                : a.status === 'voting' ? '去投票'
                  : '查看详情';
              return (
                <PcBtn
                  primary={a.status === 'nominating' || a.status === 'voting'}
                  onClick={() => openAct(a)}
                >{opLabel}</PcBtn>
              );
            }},
          ]}
          rows={filtered}
          onRowClick={openAct}
        />
      </PcPage>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Header title="全部活动" onBack={() => nav.goBack()}
        right={
          isHr && (
            <div onClick={() => nav.navigate('create-activity')} style={{ fontSize: 22, color: 'var(--accent)', cursor: 'pointer', fontWeight: 300 }}>＋</div>
          )
        }
      />

      {/* 筛选器 */}
      <div style={{ padding: '10px 20px 8px', flexShrink: 0 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索活动…"
          style={{
            width: '100%', height: 36, padding: '0 12px', marginBottom: 10, boxSizing: 'border-box',
            borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none',
          }}
        />
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 8, marginBottom: 8 }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              background: filter === f.id ? 'var(--accent)' : 'var(--bg-card)',
              color: filter === f.id ? 'var(--bg)' : 'var(--text-muted)',
              border: `1px solid ${filter === f.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: filter === f.id ? 700 : 400,
              cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap', transition: 'transform 0.15s',
              flexShrink: 0,
            }}>{f.label} {statusCount(f.id)}</button>
          ))}
        </div>
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 8 }}>
          {typeFilters.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              background: typeFilter === t ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: typeFilter === t ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${typeFilter === t ? 'var(--accent-border)' : 'var(--border)'}`,
              borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: typeFilter === t ? 700 : 400,
              cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{t === '全部' ? t : `${AppData.typeIcons[t] || ''} ${t}`}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 20px', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
            {query || filter !== 'all' || typeFilter !== '全部' ? '无匹配活动' : '暂无活动'}
          </div>
        )}
        {filtered.map(act => (
          <div key={act.id}
            onClick={() => HonorPersist.isPublished(act.status)
              ? nav.navigate('activity-result', { activityId: act.id })
              : nav.navigate('activity-detail', { activityId: act.id })
            }
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '16px', cursor: 'pointer',
              opacity: act.status === 'draft' ? 0.7 : 1, flexShrink: 0,
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{AppData.typeIcons[act.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.title}</span>
                    {HonorPersist.isPinned(act) && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#E5534B', flexShrink: 0,
                        background: 'rgba(229,83,75,0.1)', border: '1px solid rgba(229,83,75,0.28)',
                        borderRadius: 4, padding: '1px 6px',
                      }}>置顶</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{act.creatorRole} {act.creator}</div>
                </div>
              </div>
              <StatusBadge status={act.status} />
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {act.desc}
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>{act.nominations}</span> 份提名
              </span>
              {nav.role === 'hr' && act.status === 'nominating' && <PendingNomStat activityId={act.id} />}
              {act.totalVotes > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{act.totalVotes.toLocaleString()}</span> 票
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>截止 {honorDate(act.deadline)}</span>
            </div>

            {nav.role === 'hr' && (
              <ActivityActionsRow activity={act} nav={nav} onAfterDelete={() => nav.refresh()} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}






// employee.jsx — 员工「荣誉Agent」页内的顶部 Tab 视图（无独立 Header）
// 评优活动 / 我的获奖 / 我的提名 / 荣誉殿堂

// ─── 视图1：评优活动 ──────────────────────────────────────────────
function EmpActivitiesView({ nav, onGoTab }) {
  const { activities } = AppData;
  const votingActs = activities.filter(a => a.status === 'voting');
  const nominatingActs = activities.filter(a => a.status === 'nominating');
  const reviewingActs = activities.filter(a => a.status === 'reviewing');
  const endedActs = activities
    .filter(a => HonorPersist.isPublished(a.status))
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  const ongoing = HonorPersist.sortByPin([
    ...votingActs, ...nominatingActs, ...reviewingActs,
  ]);

  const greetingStrip = (votingActs.length > 0 || nominatingActs.length > 0 || reviewingActs.length > 0) && (
    <div style={{
      background: 'linear-gradient(135deg, #E8F1F8 0%, #F0F6FB 100%)',
      border: '1px solid rgba(78,203,255,0.2)', borderRadius: 14, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 20 }}>👋</span>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        你好陈志远
        {votingActs.length > 0 && <>，有 <span style={{ color: '#4ECBFF', fontWeight: 700 }}>{votingActs.length}</span> 个活动等你投票</>}
        {nominatingActs.length > 0 && <>、<span style={{ color: 'var(--accent)', fontWeight: 700 }}>{nominatingActs.length}</span> 个邀你提名</>}
        {reviewingActs.length > 0 && <>、<span style={{ color: '#9B8FFF', fontWeight: 700 }}>{reviewingActs.length}</span> 个结果复核中</>}
      </div>
    </div>
  );

  if (honorIsPc()) {
    return (
      <PcPage>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {greetingStrip}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>进行中的活动</div>
            <PcTable
              empty="暂无进行中的评优活动"
              columns={[
                { key: 'title', label: '名称', render: (a) => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>{AppData.typeIcons[a.type]}</span>
                    {a.title}
                    {HonorPersist.isPinned(a) && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#E5534B',
                        background: 'rgba(229,83,75,0.1)', border: '1px solid rgba(229,83,75,0.28)',
                        borderRadius: 4, padding: '1px 6px',
                      }}>置顶</span>
                    )}
                  </span>
                )},
                { key: 'status', label: '状态', width: 100, render: (a) => <StatusBadge status={a.status} /> },
                { key: 'deadline', label: '截止', width: 110, render: (a) => (
                  a.status === 'reviewing' ? '结果待公示'
                    : honorDate(a.status === 'voting' ? a.deadline : a.nominateEnd)
                )},
                { key: 'nominations', label: '提名', width: 80, render: (a) => a.nominations },
                { key: 'ops', label: '操作', width: 120, stopRowClick: true, render: (a) => {
                  const cta = a.status === 'voting' ? '去投票' : a.status === 'reviewing' ? '查看进度' : '去提名';
                  return <PcBtn primary onClick={() => nav.navigate('activity-detail', { activityId: a.id })}>{cta}</PcBtn>;
                }},
              ]}
              rows={ongoing}
              onRowClick={(a) => nav.navigate('activity-detail', { activityId: a.id })}
            />
          </div>
        </div>
      </PcPage>
    );
  }

  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* 待我参与提示条 */}
      {greetingStrip}

      {/* 进行中的活动 */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>进行中的活动</div>
        {ongoing.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 16, padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.7 }}>🗓️</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>暂无进行中的评优活动</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ongoing.map(act => {
              const voting = act.status === 'voting';
              const reviewing = act.status === 'reviewing';
              const accent = voting ? 'var(--accent)' : reviewing ? '#9B8FFF' : '#4ECBFF';
              const accentBg = voting ? 'rgba(245,184,66,0.08)' : reviewing ? 'rgba(155,143,255,0.08)' : 'rgba(78,203,255,0.06)';
              const accentBorder = voting ? 'var(--accent-border)' : reviewing ? 'rgba(155,143,255,0.3)' : 'rgba(78,203,255,0.22)';
              const cta = voting ? '去投票' : reviewing ? '查看进度' : '去提名';
              return (
                <div key={act.id} onClick={() => nav.navigate('activity-detail', { activityId: act.id })}
                  style={{
                    background: accentBg, border: `1px solid ${accentBorder}`,
                    borderRadius: 18, padding: '16px', cursor: 'pointer',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{AppData.typeIcons[act.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.title}</span>
                        {HonorPersist.isPinned(act) && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: '#E5534B', flexShrink: 0,
                            background: 'rgba(229,83,75,0.1)', border: '1px solid rgba(229,83,75,0.28)',
                            borderRadius: 4, padding: '1px 6px',
                          }}>置顶</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{act.creatorRole} {act.creator} · {act.type}评优</div>
                    </div>
                    <StatusBadge status={act.status} />
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {act.desc}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 700 }}>{act.nominations}</span> 份提名
                    </span>
                    {(voting || reviewing) && act.totalVotes > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--text)', fontWeight: 700 }}>{act.totalVotes.toLocaleString()}</span> 票
                      </span>
                    )}
                    {!reviewing && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>截止 {honorDate(voting ? act.deadline : act.nominateEnd)}</span>
                    )}
                    {reviewing && (
                      <span style={{ fontSize: 12, color: '#9B8FFF', fontWeight: 600 }}>结果待公示</span>
                    )}
                    <div style={{
                      marginLeft: 'auto', background: accent, color: voting ? 'var(--bg)' : '#fff',
                      fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10, flexShrink: 0, whiteSpace: 'nowrap',
                    }}>{cta}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 荣誉殿堂 */}
      {endedActs.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>荣誉殿堂</span>
            <span onClick={() => nav.navigate('leaderboard')} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>查看全部 ›</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {endedActs.map(act => {
              const res = AppData.results[act.id];
              return (
                <div key={act.id} onClick={() => nav.navigate('activity-result', { activityId: act.id })}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
                    padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{AppData.typeIcons[act.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {res ? <>🏆 {formatPeopleNames(res.winner.title)}</> : '已结束'}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{honorDate(act.deadline)}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 16, flexShrink: 0 }}>›</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 视图2：荣誉殿堂 ──────────────────────────────────────────────
function EmpHallView({ nav }) {
  const [typeFilter, setTypeFilter] = React.useState('全部');
  const endedActs = AppData.activities
    .filter(a => HonorPersist.isPublished(a.status))
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  const types = ['全部', '项目', '个人', '团队'];
  const filtered = typeFilter === '全部' ? endedActs : endedActs.filter(a => a.type === typeFilter);

  if (honorIsPc()) {
    return (
      <PcPage>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {types.map(ty => (
            <PcBtn key={ty} primary={typeFilter === ty} onClick={() => setTypeFilter(ty)}>
              {ty === '全部' ? ty : `${AppData.typeIcons[ty]} ${ty}`}
            </PcBtn>
          ))}
        </div>
        <HallsView nav={nav} acts={filtered} />
      </PcPage>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '14px 20px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {types.map(ty => (
            <div key={ty} onClick={() => setTypeFilter(ty)} style={{
              flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 9, cursor: 'pointer',
              fontSize: 13, fontWeight: typeFilter === ty ? 700 : 500,
              color: typeFilter === ty ? 'var(--accent)' : 'var(--text-muted)',
              background: typeFilter === ty ? 'var(--accent-dim)' : 'var(--bg-card)',
              border: `1px solid ${typeFilter === ty ? 'var(--accent-border)' : 'var(--border)'}`,
              whiteSpace: 'nowrap',
            }}>{ty === '全部' ? ty : `${AppData.typeIcons[ty]} ${ty}`}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: '8px 20px 24px' }}>
        <HallsView nav={nav} acts={filtered} />
      </div>
    </div>
  );
}

// ─── 视图3：我的获奖 ──────────────────────────────────────────────
function collectMyAwards(meName) {
  const PLACE = ['冠军', '亚军', '季军'];
  const out = [];
  AppData.activities
    .filter(a => HonorPersist.isPublished(a.status))
    .forEach(act => {
      const res = AppData.results[act.id];
      if (!res) return;
      const slots = [
        { place: 1, entry: res.winner },
        ...((res.runners || []).map((r, i) => ({ place: i + 2, entry: r }))),
      ];
      slots.forEach(({ place, entry }) => {
        if (!entry) return;
        const members = entry.members || [];
        const inMembers = members.some(m => m.name === meName);
        const inTitle = String(entry.title || '').split(/[、,，]/).map(s => s.trim()).includes(meName);
        if (!inMembers && !inTitle) return;
        out.push({
          activityId: act.id,
          activityTitle: act.title,
          place,
          placeLabel: PLACE[place - 1] || `第${place}名`,
          medal: place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `#${place}`,
          projectName: entry.name || entry.title,
          votes: entry.votes || 0,
          rewards: act.rewards,
          highlights: entry.highlights || [],
          deadline: act.deadline,
        });
      });
    });
  out.sort((a, b) => a.place - b.place || String(b.deadline).localeCompare(String(a.deadline)));
  return out;
}

function EmpAwardsView({ nav, onGoTab }) {
  const ME = HonorPersist.meName || '陈志远';
  const awards = collectMyAwards(ME);

  if (honorIsPc()) {
    return (
      <PcPage>
        <PcTable
          empty="暂无获奖记录"
          columns={[
            { key: 'activityTitle', label: '活动' },
            { key: 'placeLabel', label: '奖项', width: 100 },
            { key: 'projectName', label: '项目/对象' },
            { key: 'votes', label: '票数', width: 80 },
            { key: 'ops', label: '操作', width: 100, stopRowClick: true, render: (aw) => (
              <PcBtn onClick={() => nav.navigate('activity-result', { activityId: aw.activityId })}>查看</PcBtn>
            )},
          ]}
          rows={awards}
          onRowClick={(aw) => nav.navigate('activity-result', { activityId: aw.activityId })}
        />
      </PcPage>
    );
  }

  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>获奖记录</div>
        {awards.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 16, padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 10, opacity: 0.7 }}>🏆</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>暂无获奖记录</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              公示后的获奖会出现在这里
            </div>
            <div onClick={() => onGoTab && onGoTab('acts')} style={{
              display: 'inline-block', background: 'var(--accent)', color: 'var(--on-accent)',
              fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            }}>去看看活动</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {awards.map((aw, i) => (
              <div key={aw.activityId + '-' + aw.place + '-' + i}
                onClick={() => nav.navigate('activity-result', { activityId: aw.activityId })}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{aw.medal}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {aw.activityTitle}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {aw.projectName}
                    </div>
                  </div>
                  <div style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                    background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                    padding: '4px 8px', borderRadius: 8,
                  }}>{aw.placeLabel}</div>
                </div>
                {aw.highlights.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {aw.highlights.map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 4 }}>{h}</span>
                    ))}
                  </div>
                )}
                {aw.rewards && (
                  <div style={{ marginBottom: 12 }}>
                    <HonorRewards
                      rewards={aw.rewards}
                      variant="card"
                      canDownloadCert={aw.place === 1}
                      certMeta={{
                        awardee: ME,
                        activityTitle: aw.activityTitle,
                        placeLabel: aw.placeLabel,
                      }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    获 <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{aw.votes}</span> 票
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>查看详情 ›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 视图4：我的提名 ──────────────────────────────────────────────
function EmpMineView({ nav, onGoTab }) {
  const ME = HonorPersist.meName || '陈志远';
  const myNoms = AppData.nominations.filter(n => n.nominator === ME);

  if (honorIsPc()) {
    return (
      <PcPage>
        <PcTable
          empty="还没有提名记录"
          columns={[
            { key: 'activity', label: '活动', render: (nom) => {
              const act = AppData.activities.find(a => a.id === nom.activityId);
              return act ? act.title : '未知活动';
            }},
            { key: 'title', label: '标题' },
            { key: 'review', label: '审核状态', width: 110, render: (nom) => (
              <ReviewStatusBadge status={nom.reviewStatus || 'approved'} />
            )},
            { key: 'rank', label: '排名', width: 80, render: (nom) => `第${nom.rank}名` },
            { key: 'votes', label: '票数', width: 80 },
            { key: 'ops', label: '操作', width: 100, stopRowClick: true, render: (nom) => (
              <PcBtn onClick={() => nav.navigate('activity-detail', { activityId: nom.activityId })}>查看</PcBtn>
            )},
          ]}
          rows={myNoms}
          onRowClick={(nom) => nav.navigate('activity-detail', { activityId: nom.activityId })}
        />
      </PcPage>
    );
  }

  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* 提名记录 */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>提名记录</div>
        {myNoms.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 16, padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 10, opacity: 0.7 }}>📝</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>还没有提名记录</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>在「评优活动」中参与征集，<br/>展示你的优秀项目与成果</div>
            <div onClick={() => onGoTab && onGoTab('acts')} style={{
              display: 'inline-block', background: 'var(--accent)', color: 'var(--on-accent)',
              fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            }}>去看看活动</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myNoms.map(nom => {
              const act = AppData.activities.find(a => a.id === nom.activityId);
              const medal = nom.rank === 1 ? '🥇' : nom.rank === 2 ? '🥈' : nom.rank === 3 ? '🥉' : `#${nom.rank}`;
              const rs = nom.reviewStatus || 'approved';
              return (
                <div key={nom.id} onClick={() => nav.navigate('activity-detail', { activityId: nom.activityId })}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{medal}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {act ? act.title : '未知活动'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom.title}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <ReviewStatusBadge status={rs} />
                      {act && <StatusBadge status={act.status} />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {nom.highlights.map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 4 }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>当前排名 <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 14 }}>第{nom.rank}名</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>获 <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{nom.votes}</span> 票</div>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>查看详情 ›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}






// edit.jsx — HR 活动管理：编辑/删除辅助 + 内联操作按钮 + 删除确认
// 编辑复用「创建活动」向导（见 create.jsx 的 edit 模式）

// ─── 数据变更 ─────────────────────────────────────────────────────
function applyFormToActivity(act, form) {
  act.title = form.title.trim() || act.title;
  act.type = form.type;
  act.desc = form.desc;
  act.deadline = form.deadline;
  act.nominateEnd = form.nominateEnd;
  act.criteria = form.criteria.map(c => c.trim()).filter(Boolean);
  const rewards = {};
  rewards.points = form.rewardPoints ? Number(form.customPoints || form.points) || 0 : 0;
  if (form.rewardBadge) {
    const b = AppData.badges.find(x => x.id === form.badgeId);
    if (b) rewards.badge = { icon: b.icon, name: b.name };
  }
  if (form.rewardCert && form.certDataUrl) {
    rewards.certificate = {
      fileName: form.certFileName || '电子证书',
      dataUrl: form.certDataUrl,
    };
  }
  act.rewards = rewards;
}

function activityToCreateForm(act) {
  const base = {
    title: '', type: '团队', desc: '', deadline: '2026-07-01', nominateEnd: '2026-06-20',
    criteria: [''], rewardPoints: true, rewardBadge: false, rewardCert: false, points: 50, customPoints: '',
    badgeId: null, creatingBadge: false, newBadgeName: '', newBadgeIcon: '💡', newBadgeImg: null,
    certFileName: '', certDataUrl: '',
    audience: { all: false, deptIds: [], memberIds: [], rules: { gender: '不限', tenure: 'any', jobTypes: [] } },
  };
  if (!act) return base;
  const r = act.rewards || {};
  let badgeId = null;
  if (r.badge) { const f = AppData.badges.find(b => b.name === r.badge.name); if (f) badgeId = f.id; }
  return {
    ...base,
    title: act.title || '', type: act.type || '团队', desc: act.desc || '',
    deadline: act.deadline || base.deadline, nominateEnd: act.nominateEnd || base.nominateEnd,
    criteria: (act.criteria && act.criteria.length) ? act.criteria.slice(0, 3) : [''],
    rewardPoints: !!(r.points > 0), rewardBadge: !!r.badge, rewardCert: !!r.certificate,
    points: r.points > 0 ? r.points : 50, badgeId,
    certFileName: (r.certificate && r.certificate.fileName) || '',
    certDataUrl: (r.certificate && r.certificate.dataUrl) || '',
  };
}

function deleteActivityById(id) {
  if (HonorPersist && HonorPersist.deleteActivity) {
    HonorPersist.deleteActivity(id);
    return;
  }
  const i = AppData.activities.findIndex(a => a.id === id);
  if (i >= 0) AppData.activities.splice(i, 1);
  AppData.nominations = AppData.nominations.filter(n => n.activityId !== id);
}

// ─── 删除确认弹窗（共享）──────────────────────────────────────────
function DeleteConfirm({ activity, deleting, onCancel, onConfirm }) {
  const isPc = honorIsPc();
  return (
    <div onClick={(e) => { e.stopPropagation(); onCancel(); }} style={{
      position: isPc ? 'fixed' : 'absolute', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease' }}/>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', width: 'calc(100% - 56px)', maxWidth: 320,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20,
        padding: '22px 20px 18px', animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(229,83,75,0.12)', border: '1px solid rgba(229,83,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>🗑️</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: 8 }}>删除该活动？</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
          「{activity.title}」将被永久删除，<br/>相关提名与投票数据无法恢复。
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <BtnGhost onClick={onCancel} style={{ flex: 1 }}>取消</BtnGhost>
          <button onClick={onConfirm} style={{
            flex: 1, background: '#E5534B', color: '#fff', fontWeight: 700, fontSize: 15,
            border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer', fontFamily: 'var(--font)',
            opacity: deleting ? 0.7 : 1,
          }}>{deleting ? '删除中…' : '确认删除'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── 列表卡片底部：编辑 / 删除 按钮（HR）──────────────────────────
function ActivityActionsRow({ activity, nav, onAfterDelete }) {
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  function doDelete() {
    setDeleting(true);
    setTimeout(() => {
      deleteActivityById(activity.id);
      setDeleting(false);
      setConfirming(false);
      if (onAfterDelete) onAfterDelete();
    }, 500);
  }

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font)', background: 'var(--bg-elevated)', whiteSpace: 'nowrap',
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button onClick={(e) => {
          e.stopPropagation();
          HonorPersist.setPinned(activity.id, !HonorPersist.isPinned(activity));
          if (onAfterDelete) onAfterDelete();
        }}
          style={{ ...btnBase, color: HonorPersist.isPinned(activity) ? '#E5534B' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
          {HonorPersist.isPinned(activity) ? '📌 取消置顶' : '📌 置顶'}
        </button>
        <button onClick={(e) => { e.stopPropagation(); nav.navigate('edit-activity', { editId: activity.id }); }}
          style={{ ...btnBase, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>✏️ 编辑</button>
        <button onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
          style={{ ...btnBase, color: '#E5534B', border: '1px solid rgba(229,83,75,0.28)', background: 'rgba(229,83,75,0.06)' }}>🗑️ 删除</button>
      </div>
      {confirming && (
        <DeleteConfirm activity={activity} deleting={deleting}
          onCancel={() => { if (!deleting) setConfirming(false); }} onConfirm={doDelete} />
      )}
    </>
  );
}

// ─── 详情页顶栏：⋯ 菜单（编辑 / 删除）─────────────────────────────
function ActivityMenu({ activity, nav, onAfterDelete, dark }) {
  const [open, setOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  function doDelete() {
    setDeleting(true);
    setTimeout(() => {
      deleteActivityById(activity.id);
      setDeleting(false);
      setConfirming(false);
      setOpen(false);
      if (onAfterDelete) onAfterDelete();
    }, 500);
  }

  return (
    <>
      <div onClick={(e) => { e.stopPropagation(); setOpen(true); }} style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: dark ? 'var(--bg-card)' : 'var(--bg-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: 17, lineHeight: 1, letterSpacing: 1,
      }}>⋯</div>

      {open && (
        <>
          <HonorOverlay
            onClose={() => { if (!confirming) setOpen(false); }}
            zIndex={120}
            maxWidth={420}
            fitContent
            bg="var(--bg-elevated)"
            mobileMaxHeight="82%"
          >
            <div style={{ padding: honorIsPc() ? '16px 18px 20px' : '10px 16px 28px' }}>
              <HonorSheetHandle style={{ margin: '4px auto 12px' }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</div>

              {activity.status === 'reviewing' && (
                <div onClick={() => {
                  if (!window.confirm('确认公示结果？公示后全体员工可查看最终榜单与获奖奖励，此操作不可撤销。')) return;
                  HonorPersist.publishResult(activity.id);
                  setOpen(false);
                  if (nav.refresh) nav.refresh();
                }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 14px', borderRadius: 12, cursor: 'pointer', background: 'var(--bg-card)', marginBottom: 8 }}>
                  <span style={{ fontSize: 19, width: 24, textAlign: 'center' }}>📢</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>公示结果</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 18 }}>›</span>
                </div>
              )}

              <div onClick={() => { setOpen(false); nav.navigate('edit-activity', { editId: activity.id }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 14px', borderRadius: 12, cursor: 'pointer', background: 'var(--bg-card)', marginBottom: 8 }}>
                <span style={{ fontSize: 19, width: 24, textAlign: 'center' }}>✏️</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>编辑活动</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 18 }}>›</span>
              </div>

              <div onClick={() => setConfirming(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 14px', borderRadius: 12, cursor: 'pointer', background: 'var(--bg-card)' }}>
                <span style={{ fontSize: 19, width: 24, textAlign: 'center' }}>🗑️</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#E5534B' }}>删除活动</span>
              </div>

              <div onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: '14px', marginTop: 8, fontSize: 15, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--bg-card)', borderRadius: 12, fontWeight: 600 }}>取消</div>
            </div>
          </HonorOverlay>
          {confirming && (
            <DeleteConfirm activity={activity} deleting={deleting}
              onCancel={() => { if (!deleting) setConfirming(false); }} onConfirm={doDelete} />
          )}
        </>
      )}
    </>
  );
}





export function HonorEmbedApp({ initialRole = 'employee' } = {}) {
  const [role, setRole] = React.useState(initialRole);
  const [stack, setStack] = React.useState([['home']]);
  const [paramsMap, setParamsMap] = React.useState({});
  const [screenKey, setScreenKey] = React.useState(0);
  const [dataTick, setDataTick] = React.useState(0);
  const stackRef = React.useRef(stack);
  stackRef.current = stack;
  void dataTick;

  React.useEffect(() => {
    function onHonorData() {
      setDataTick((n) => n + 1);
    }
    window.addEventListener('honor-data', onHonorData);
    return () => window.removeEventListener('honor-data', onHonorData);
  }, []);

  const currentStack = stack[stack.length - 1];
  const screen = currentStack[currentStack.length - 1];
  const params = paramsMap[screen] || {};

  function navigate(s, p = {}) {
    setStack((prev) => {
      const cur = prev[prev.length - 1];
      return [...prev.slice(0, -1), [...cur, s]];
    });
    if (p && Object.keys(p).length > 0) {
      setParamsMap((pm) => ({ ...pm, [s]: p }));
    }
    setScreenKey((k) => k + 1);
  }

  function navigateAsRole(roleNeeded, s, p = {}) {
    if (role === roleNeeded) {
      navigate(s, p);
      return;
    }
    setRole(roleNeeded);
    setStack([['home', s]]);
    if (p && Object.keys(p).length > 0) {
      setParamsMap((pm) => ({ ...pm, [s]: p }));
    }
    setScreenKey((k) => k + 1);
  }

  function goBack() {
    setStack((prev) => {
      const cur = prev[prev.length - 1];
      if (cur.length <= 1) return prev;
      return [...prev.slice(0, -1), cur.slice(0, -1)];
    });
    setScreenKey((k) => k + 1);
  }

  function switchRole() {
    const r = role === 'hr' ? 'employee' : 'hr';
    setRole(r);
    setStack([['home']]);
    setScreenKey((k) => k + 1);
  }

  function goHonorHome() {
    setStack([['home']]);
    setScreenKey((k) => k + 1);
  }

  const nav = {
    navigate,
    goBack,
    role,
    switchRole,
    navigateAsRole,
    atRoot: currentStack.length === 1,
    refresh: () => setScreenKey((k) => k + 1),
  };
  const roleSwitcher = null;

  function renderScreen() {
    switch (screen) {
      case 'home':
        return <AgentHomePage nav={nav} roleSwitcher={roleSwitcher} />;
      case 'im-list':
        return <IMListPage nav={nav} roleSwitcher={roleSwitcher} />;
      case 'im-honor':
        return <HonorChatPage nav={nav} />;
      case 'notifications':
        return <NotificationsPage nav={nav} />;
      case 'create-activity':
        return <CreateActivityPage nav={nav} params={params} />;
      case 'edit-activity':
        return <CreateActivityPage nav={nav} params={params} />;
      case 'activity-detail':
        return <ActivityDetailPage nav={nav} params={params} />;
      case 'nomination-form':
        return <NominationFormPage nav={nav} params={params} />;
      case 'nomination-review':
        return <NominationReviewPage nav={nav} params={params} />;
      case 'leaderboard':
        return <LeaderboardPage nav={nav} params={params} roleSwitcher={roleSwitcher} />;
      case 'activity-result':
        return <ActivityResultPage nav={nav} params={params} />;
      case 'activity-list':
        return <ActivityListPage nav={nav} />;
      default:
        return <AgentHomePage nav={nav} roleSwitcher={roleSwitcher} />;
    }
  }

  return (
    <div className="c-honor-h5-stage">
      <div key={screenKey} className="c-honor-h5-screen">
        {renderScreen()}
      </div>
      <HonorNavFab
        atRoot={currentStack.length === 1}
        onBack={goBack}
        onHome={currentStack.length === 1 ? goCEndPortal : goHonorHome}
      />
    </div>
  );
}
