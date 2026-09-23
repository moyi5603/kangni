(function (global) {
  const ACTIVITY_CATALOG = [
    {
        id: "act-1",
        title: "春季员工开放日",
        source: "活动",
        category: "文化",
        startAt: "2026-04-12 09:00",
        endAt: "2026-04-12 17:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-2",
        title: "新员工入职训练营",
        source: "活动",
        category: "培训",
        startAt: "2026-08-31 09:30",
        endAt: "2026-09-02 17:30",
        status: "on",
        life: "未结束",
        pub: "已发布"
    },
    {
        id: "act-3",
        title: "线上公益讲座",
        source: "活动",
        category: "公益",
        startAt: "2026-09-06 19:00",
        endAt: "2026-09-06 21:00",
        status: "off",
        life: "未结束",
        pub: "未发布"
    },
    {
        id: "act-4",
        title: "部门篮球联赛",
        source: "活动",
        category: "体育",
        startAt: "2026-09-12 13:00",
        endAt: "2026-09-13 18:00",
        status: "off",
        life: "未结束",
        pub: "未发布"
    },
    {
        id: "act-5",
        title: "产品知识分享会",
        source: "活动",
        category: "培训",
        startAt: "2026-07-02 14:00",
        endAt: "2026-07-02 16:00",
        status: "off",
        life: "已结束",
        pub: "未发布"
    },
    {
        id: "act-6",
        title: "年度体检安排",
        source: "活动",
        category: "公益",
        startAt: "2026-10-18 08:30",
        endAt: "2026-10-25 12:00",
        status: "on",
        life: "未结束",
        pub: "已发布"
    },
    {
        id: "act-7",
        title: "骨干人才交流会",
        source: "活动",
        category: "培训",
        startAt: "2026-09-22 14:00",
        endAt: "2026-09-22 17:00",
        status: "off",
        life: "未结束",
        pub: "未发布"
    },
    {
        id: "act-8",
        title: "安全专项培训",
        source: "活动",
        category: "培训",
        startAt: "2026-10-02 09:00",
        endAt: "2026-10-30 12:00",
        status: "off",
        life: "未结束",
        pub: "未发布"
    },
    {
        id: "act-9",
        title: "中秋员工晚会",
        source: "活动",
        category: "文化",
        startAt: "2026-09-25 18:00",
        endAt: "2026-09-25 22:00",
        status: "on",
        life: "未结束",
        pub: "已发布"
    },
    {
        id: "act-10",
        title: "公益植树日",
        source: "活动",
        category: "公益",
        startAt: "2026-09-03 08:30",
        endAt: "2026-09-03 16:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-11",
        title: "司庆展览周",
        source: "活动",
        category: "文化",
        startAt: "2026-07-08 09:00",
        endAt: "2026-07-12 17:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-12",
        title: "秋季消防演练",
        source: "活动",
        category: "培训",
        startAt: "2026-09-18 14:00",
        endAt: "2026-09-18 16:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-13",
        title: "数字化转型工作坊",
        source: "活动",
        category: "培训",
        startAt: "2026-08-26 09:00",
        endAt: "2026-08-26 17:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-14",
        title: "质量改进项目启动",
        source: "活动",
        category: "培训",
        startAt: "2026-07-10 09:00",
        endAt: "2026-07-10 12:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-15",
        title: "客户成功项目复盘",
        source: "活动",
        category: "培训",
        startAt: "2026-09-16 14:00",
        endAt: "2026-09-16 17:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-16",
        title: "供应链协同攻关",
        source: "活动",
        category: "培训",
        startAt: "2026-07-22 09:00",
        endAt: "2026-07-24 17:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-17",
        title: "入职体检专场",
        source: "活动",
        category: "公益",
        startAt: "2026-08-28 08:00",
        endAt: "2026-08-28 11:30",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-18",
        title: "职业健康复查",
        source: "活动",
        category: "公益",
        startAt: "2026-07-06 08:30",
        endAt: "2026-07-06 12:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-19",
        title: "女工专项体检",
        source: "活动",
        category: "公益",
        startAt: "2026-09-20 08:00",
        endAt: "2026-09-20 12:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-20",
        title: "高管体检预约",
        source: "活动",
        category: "公益",
        startAt: "2026-07-18 08:00",
        endAt: "2026-07-18 12:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-21",
        title: "黄山两日游",
        source: "活动",
        category: "文化",
        startAt: "2026-09-19 07:00",
        endAt: "2026-09-20 20:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-22",
        title: "海边团建疗休养",
        source: "活动",
        category: "文化",
        startAt: "2026-09-26 08:00",
        endAt: "2026-09-27 19:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-23",
        title: "温泉康养营",
        source: "活动",
        category: "文化",
        startAt: "2026-07-04 08:00",
        endAt: "2026-07-05 18:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-24",
        title: "秋季登山活动",
        source: "活动",
        category: "体育",
        startAt: "2026-09-27 07:30",
        endAt: "2026-09-27 16:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-25",
        title: "家庭日郊游",
        source: "活动",
        category: "文化",
        startAt: "2026-07-19 09:00",
        endAt: "2026-07-19 16:00",
        status: "on",
        life: "已结束",
        pub: "已发布"
    },
    {
        id: "act-26",
        title: "周四篮球夜",
        source: "活动",
        category: "体育",
        startAt: "2026-08-27 14:00",
        endAt: "2026-12-31 23:00",
        status: "on",
        life: "未结束",
        pub: "已发布"
    },
    {
        id: "act-27",
        title: "新人导师工作坊",
        source: "活动",
        category: "培训",
        startAt: "2026-09-05 09:00",
        endAt: "2026-09-05 12:00",
        status: "on",
        life: "未结束",
        pub: "已发布"
    },
    {
        id: "ig-101",
        title: "滨江 8K 夜跑 · 江风配速团",
        source: "兴趣圈活动",
        category: "运动健身",
        categoryKey: "sport",
        groupName: "城市夜跑团",
        startAt: "2026-06-04 19:30",
        endAt: "2026-09-24 21:00",
        status: "on",
        life: "未结束",
        pub: "已发布",
        timeText: "2026-06-04 19:30 ~ 2026-09-24 21:00 · 共 17 场"
    },
    {
        id: "ig-102",
        title: "初夏城市漫步",
        source: "兴趣圈活动",
        category: "运动健身",
        categoryKey: "sport",
        groupName: "城市夜跑团",
        startAt: "2026-06-01 17:00",
        endAt: "2026-06-01 19:00",
        status: "on",
        life: "已结束",
        pub: "已发布",
        timeText: "2026-06-01 17:00 ~ 2026-06-01 19:00"
    },
    {
        id: "ig-201",
        title: "周末连营徒步",
        source: "兴趣圈活动",
        category: "运动健身",
        categoryKey: "sport",
        groupName: "周末徒步野行",
        startAt: "2026-08-31 09:00",
        endAt: "2026-09-10 16:00",
        status: "on",
        life: "未结束",
        pub: "已发布",
        timeText: "2026-08-31 09:00 ~ 2026-09-10 16:00 · 共 2 场"
    },
    {
        id: "ig-301",
        title: "周一晚共读 · 固定围读局",
        source: "兴趣圈活动",
        category: "学习充电",
        categoryKey: "learning",
        groupName: "深夜读书会",
        startAt: "2026-09-14 19:00",
        endAt: "2026-09-14 20:00",
        status: "off",
        life: "未结束",
        pub: "未发布",
        timeText: "2026-09-14 19:00 ~ 2026-09-14 20:00"
    },
    {
        id: "ig-401",
        title: "周五狼人杀局",
        source: "兴趣圈活动",
        category: "桌游电竞",
        categoryKey: "game",
        groupName: "桌游电竞局",
        startAt: "2026-06-06 19:30",
        endAt: "2026-06-06 22:00",
        status: "off",
        life: "已结束",
        pub: "未发布",
        timeText: "2026-06-06 19:30 ~ 2026-06-06 22:00"
    },
    {
        id: "ig-501",
        title: "夏季共读三期",
        source: "兴趣圈活动",
        category: "学习充电",
        categoryKey: "learning",
        groupName: "深夜读书会",
        startAt: "2026-06-20 19:00",
        endAt: "2026-07-04 21:00",
        status: "on",
        life: "已结束",
        pub: "已发布",
        timeText: " ~  · 共 3 场"
    },
    {
        id: "ig-601",
        title: "午间拉伸十分钟",
        source: "兴趣圈活动",
        category: "运动健身",
        categoryKey: "sport",
        groupName: "午间拉伸站",
        startAt: "2026-09-15 12:10",
        endAt: "2026-09-15 12:20",
        status: "on",
        life: "未结束",
        pub: "已发布",
        timeText: "2026-09-15 12:10 ~ 2026-09-15 12:20"
    },
    {
        id: "ig-602",
        title: "周末胶片冲洗局",
        source: "兴趣圈活动",
        category: "其他",
        categoryKey: "other",
        groupName: "周末胶片社",
        startAt: "2026-09-19 14:00",
        endAt: "2026-09-19 17:00",
        status: "on",
        life: "未结束",
        pub: "已发布",
        timeText: "2026-09-19 14:00 ~ 2026-09-19 17:00"
    },
    {
        id: "ig-603",
        title: "周五开黑体验局",
        source: "兴趣圈活动",
        category: "桌游电竞",
        categoryKey: "game",
        groupName: "桌游电竞局",
        startAt: "2026-09-04 19:30",
        endAt: "2026-09-04 22:00",
        status: "on",
        life: "未结束",
        pub: "已发布",
        timeText: "2026-09-04 19:30 ~ 2026-09-04 22:00"
    },
    {
        id: "ig-604",
        title: "午间拉伸跟练三期",
        source: "兴趣圈活动",
        category: "运动健身",
        categoryKey: "sport",
        groupName: "午间拉伸站",
        startAt: "2026-09-08 12:10",
        endAt: "2026-09-22 12:20",
        status: "on",
        life: "未结束",
        pub: "已发布",
        timeText: "2026-09-08 12:10 ~ 2026-09-22 12:20 · 共 3 场"
    }
];

  const MOMENT_CATALOG = [
    { id: "act-m-1", title: "开场致辞很有感染力，全家都来了。", source: "活动", category: "文化", categoryKey: "", groupName: "春季员工开放日", startAt: "2026-04-12 09:00", endAt: "2026-04-12 17:00", status: "on", life: "已通过", pub: "已发布" },
    { id: "act-m-2", title: "互动问答回放，给没赶上的同事。", source: "活动", category: "文化", categoryKey: "", groupName: "春季员工开放日", startAt: "2026-04-12 09:00", endAt: "2026-04-12 17:00", status: "on", life: "已通过", pub: "已发布" },
    { id: "act-m-3", title: "产线参观这一段想发到部门群。", source: "活动", category: "文化", categoryKey: "", groupName: "春季员工开放日", startAt: "2026-04-12 09:00", endAt: "2026-04-12 17:00", status: "on", life: "已通过", pub: "已发布" },
    { id: "act-m-4", title: "午餐交流拍糊了，再补一张。", source: "活动", category: "文化", categoryKey: "", groupName: "春季员工开放日", startAt: "2026-04-12 09:00", endAt: "2026-04-12 17:00", status: "on", life: "已通过", pub: "已发布" },
    { id: "act-m-6", title: "展厅合影补一张。", source: "活动", category: "文化", categoryKey: "", groupName: "春季员工开放日", startAt: "2026-04-12 09:00", endAt: "2026-04-12 17:00", status: "on", life: "已通过", pub: "已发布" },
    { id: "act-m-5", title: "小组讨论花絮，导师点评很到位。", source: "活动", category: "培训", categoryKey: "", groupName: "新员工入职训练营", startAt: "2026-08-31 09:30", endAt: "2026-09-02 17:30", status: "on", life: "已通过", pub: "已发布" },
    { id: "ig-m-1", title: "初夏漫步打卡，夕阳刚好。", source: "兴趣圈活动", category: "运动健身", categoryKey: "sport", groupName: "城市夜跑团", startAt: "2026-06-01 17:00", endAt: "2026-06-01 19:00", timeText: "2026-06-01 17:00 ~ 2026-06-01 19:00", status: "on", life: "已通过", pub: "已发布" },
    { id: "ig-m-2", title: "营地日出，值回早起。", source: "兴趣圈活动", category: "运动健身", categoryKey: "sport", groupName: "周末徒步野行", startAt: "2026-08-31 09:00", endAt: "2026-09-10 16:00", timeText: "2026-08-31 09:00 ~ 2026-09-10 16:00 · 共 2 场", status: "off", life: "待审核", pub: "未发布" },
    { id: "ig-m-3", title: "昨晚狼人杀高光局。", source: "兴趣圈活动", category: "桌游电竞", categoryKey: "game", groupName: "桌游电竞局", startAt: "2026-06-06 19:30", endAt: "2026-06-06 22:00", timeText: "2026-06-06 19:30 ~ 2026-06-06 22:00", status: "off", life: "已驳回", pub: "未发布" },
    { id: "ig-m-4", title: "夜跑收工，江风把汗吹干。", source: "兴趣圈活动", category: "运动健身", categoryKey: "sport", groupName: "城市夜跑团", startAt: "2026-06-04 19:30", endAt: "2026-09-24 21:00", timeText: "2026-06-04 19:30 ~ 2026-09-24 21:00 · 共 17 场", status: "on", life: "已通过", pub: "已发布" },
    { id: "ig-m-5", title: "连营第二天，溪边煮面最香。", source: "兴趣圈活动", category: "运动健身", categoryKey: "sport", groupName: "周末徒步野行", startAt: "2026-08-31 09:00", endAt: "2026-09-10 16:00", timeText: "2026-08-31 09:00 ~ 2026-09-10 16:00 · 共 2 场", status: "on", life: "已通过", pub: "已发布" },
    { id: "ig-m-6", title: "书吧灯还亮着，围读散场合影。", source: "兴趣圈活动", category: "学习充电", categoryKey: "learning", groupName: "深夜读书会", startAt: "2026-06-20 19:00", endAt: "2026-07-04 21:00", timeText: "2026-06-20 19:00 ~ 2026-07-04 21:00 · 共 3 场", status: "on", life: "已通过", pub: "已发布" },
    { id: "ig-m-7", title: "五黑翻盘，这把要回看十遍。", source: "兴趣圈活动", category: "桌游电竞", categoryKey: "game", groupName: "桌游电竞局", startAt: "2026-06-06 19:30", endAt: "2026-06-06 22:00", timeText: "2026-06-06 19:30 ~ 2026-06-06 22:00", status: "on", life: "已通过", pub: "已发布" },
    { id: "ig-m-8", title: "配速组第一次破五，全员击掌。", source: "兴趣圈活动", category: "运动健身", categoryKey: "sport", groupName: "城市夜跑团", startAt: "2026-06-04 19:30", endAt: "2026-09-24 21:00", timeText: "2026-06-04 19:30 ~ 2026-09-24 21:00 · 共 17 场", status: "on", life: "已通过", pub: "已发布" }
  ];

  const VOTE_CATALOG = [
    { id: "vote-1", title: "部门十佳员工评选", startAt: "2026-09-01 09:00", endAt: "2026-09-15 18:00", status: "进行中" },
    { id: "vote-2", title: "车间安全之星", startAt: "2026-09-01 09:00", endAt: "2026-09-30 18:00", status: "进行中" },
    { id: "vote-3", title: "年度优秀作品展", startAt: "2026-10-01 09:00", endAt: "2026-10-15 18:00", status: "未开始" },
    { id: "vote-4", title: "食堂本周菜品", startAt: "2026-08-31 09:00", endAt: "2026-09-06 18:00", status: "已结束" },
    { id: "vote-5", title: "班组擂台赛", startAt: "2026-09-07 09:00", endAt: "2026-09-20 18:00", status: "进行中" },
    { id: "vote-6", title: "一线匠心人物", startAt: "2026-09-08 09:00", endAt: "2026-09-16 18:00", status: "进行中" },
    { id: "vote-7", title: "新员工风采", startAt: "2026-09-20 09:00", endAt: "2026-09-30 18:00", status: "未开始" }
  ];

  const ACT_TREE = [
    { id: "all", name: "全部" },
    { id: "1", name: "文化" },
    { id: "2", name: "体育" },
    { id: "3", name: "培训" },
    { id: "4", name: "公益" },
    { id: "5", name: "团建" },
    { id: "6", name: "公司活动" },
    { id: "7", name: "项目活动" },
    { id: "8", name: "疗休养活动" },
    { id: "9", name: "体检活动" }
  ];
  const IG_TREE = [
    { id: "all", name: "全部" },
    { id: "sport", name: "运动健身" },
    { id: "learning", name: "学习充电" },
    { id: "career", name: "职场成长" },
    { id: "volunteer", name: "公益志愿" },
    { id: "game", name: "桌游电竞" },
    { id: "movie", name: "电影音乐" },
    { id: "other", name: "其他" }
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function defaultToast(msg) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.id = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function timeRange(r) {
    if (r.timeText) return r.timeText;
    if (r.startAt && r.endAt) return r.startAt + " — " + r.endAt;
    return r.startAt || r.endAt || "";
  }

  function mountActivityPicker({ kind = "activity", isCustom, getSource, getPicked, setPicked, onChange, toast }) {
    const isMoments = kind === "moments";
    const CATALOG = isMoments ? MOMENT_CATALOG : ACTIVITY_CATALOG;
    const showToast = toast || defaultToast;
    let draft = [];
    let cat = "all";
    let keyword = "";
    let status = "all";
    let life = "all";
    let page = 1;
    const pageSize = 6;
    let full = false;
    const q = (sel) => mask.querySelector(sel);
    const noun = isMoments ? "精彩瞬间" : "活动";
    const kwLabel = isMoments ? "内容" : "标题";
    const belongLabel = () => (typeof getSource === "function" && getSource() === "ig" ? "所属小组" : isMoments ? "所属活动" : "所属小组");
    function showBelongCol() {
      if (isMoments) return true;
      return typeof getSource === "function" && getSource() === "ig";
    }
    const timeLabel = "活动时间";
    const lifeOpts = isMoments
      ? `<option value="all">全部</option><option value="已通过">已通过</option><option value="待审核">待审核</option><option value="已驳回">已驳回</option>`
      : `<option value="all">全部</option><option value="未结束">未结束</option><option value="已结束">已结束</option>`;
    const pubFilter = `<label class="fl">发布状态
                <select data-el="status">
                  <option value="all">全部</option>
                  <option value="on">已发布</option>
                  <option value="off">未发布</option>
                </select>
              </label>`;
    const pubCol = "<th>发布状态</th>";

    const mask = document.createElement("div");
    mask.className = "pick-mask";
    mask.innerHTML = `
      <div class="pick-modal" role="dialog" aria-labelledby="apickTitle">
        <div class="pick-hd">
          <h3 id="apickTitle">选择${noun}</h3>
          <div class="pick-hd-ops">
            <button type="button" class="pick-ico" data-act="full" aria-label="全屏">⛶</button>
            <button type="button" class="pick-ico" data-act="close" aria-label="关闭">×</button>
          </div>
        </div>
        <div class="pick-body">
          <aside class="pick-side">
            <div class="pick-side-search">
              <input data-el="treeQ" placeholder="搜索分类" />
              <button type="button" data-el="treeSearch">搜索</button>
            </div>
            <div class="pick-tree" data-el="tree"></div>
          </aside>
          <div class="pick-main">
            <div class="pick-filters">
              <label class="fl">${kwLabel} <input data-el="kw" placeholder="请输入${kwLabel}" /></label>
              ${pubFilter}
              <label class="fl">状态
                <select data-el="life">
                  ${lifeOpts}
                </select>
              </label>
              <button type="button" class="btn-pri" data-el="query">查询</button>
              <button type="button" class="btn-ghost" data-el="reset">重置</button>
            </div>
            <div class="pick-table-wrap">
              <table class="pick-table">
                <thead>
                  <tr>
                    <th>${isMoments ? "内容" : "标题"}</th>
                    <th data-el="belongH">${isMoments ? "所属活动" : "所属小组"}</th>
                    <th>${timeLabel}</th>
                    ${pubCol}
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody data-el="tbody"></tbody>
              </table>
              <div class="pick-empty" data-el="empty" hidden>暂无${noun}</div>
            </div>
            <div class="pick-pager" data-el="pager"></div>
          </div>
          <aside class="pick-sel">
            <div class="pick-sel-h">已选 <span data-el="selCount">0</span><button type="button" data-el="clear">清空</button></div>
            <div class="pick-sel-list" data-el="selList"></div>
          </aside>
        </div>
        <div class="pick-ft">
          <button type="button" class="btn-ghost" data-act="close">取消</button>
          <button type="button" class="btn-pri" data-el="ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const modal = mask.querySelector(".pick-modal");

    function currentTree() {
      return typeof getSource === "function" && getSource() === "ig" ? IG_TREE : ACT_TREE;
    }

    function catName(id) {
      return (currentTree().find((n) => n.id === id) || {}).name || "";
    }

    function filteredRows() {
      let rows = CATALOG.slice();
      const src = typeof getSource === "function" ? getSource() : "";
      if (src === "ig") rows = rows.filter((r) => r.source === "兴趣圈活动");
      else if (src === "activity") rows = rows.filter((r) => r.source === "活动");
      if (cat && cat !== "all") {
        if (src === "ig") rows = rows.filter((r) => r.categoryKey === cat);
        else rows = rows.filter((r) => r.category === catName(cat));
      }
      if (status !== "all") rows = rows.filter((r) => r.status === status);
      if (life !== "all") rows = rows.filter((r) => r.life === life);
      if (keyword) {
        const k = keyword.toLowerCase();
        rows = rows.filter((r) => r.title.toLowerCase().includes(k));
      }
      rows.sort((a, b) => String(b.startAt).localeCompare(String(a.startAt)));
      return rows;
    }

    function renderTree() {
      const treeQ = (q('[data-el="treeQ"]').value || "").trim();
      const root = q('[data-el="tree"]');
      root.innerHTML = "";
      currentTree().filter((n) => !treeQ || n.name.includes(treeQ)).forEach((n) => {
        const wrap = document.createElement("div");
        const row = document.createElement("div");
        row.className = "tree-row";
        const caret = document.createElement("button");
        caret.type = "button";
        caret.className = "tree-caret";
        const item = document.createElement("button");
        item.type = "button";
        item.className = "tree-item" + (cat === n.id ? " on" : "");
        item.textContent = n.name;
        item.addEventListener("click", () => {
          cat = n.id;
          page = 1;
          renderTree();
          renderTable();
        });
        row.append(caret, item);
        wrap.appendChild(row);
        root.appendChild(wrap);
      });
    }

    function renderTable() {
      const rows = filteredRows();
      const start = (page - 1) * pageSize;
      const slice = rows.slice(start, start + pageSize);
      const tbody = q('[data-el="tbody"]');
      const empty = q('[data-el="empty"]');
      tbody.innerHTML = "";
      empty.hidden = slice.length > 0;
      slice.forEach((r) => {
        const tr = document.createElement("tr");
        const added = draft.some((x) => x.id === r.id);
        tr.innerHTML = `
          <td class="ttl" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</td>
          ${showBelongCol() ? `<td>${escapeHtml(r.groupName || "—")}</td>` : ""}
          <td>${escapeHtml(timeRange(r))}</td>
          <td><span class="st-dot ${r.status === "off" ? "off" : ""}"><i></i>${escapeHtml(r.pub)}</span></td>
          <td>${escapeHtml(r.life)}</td>
          <td><button type="button" class="link-add" ${added ? "disabled" : ""} data-id="${r.id}">${added ? "已添加" : "添加"}</button></td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll(".link-add").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = CATALOG.find((x) => x.id === btn.dataset.id);
          if (!row || draft.some((x) => x.id === row.id)) return;
          draft.push(row);
          renderTable();
          renderSel();
        });
      });
      const pager = q('[data-el="pager"]');
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (page > pages) page = pages;
      pager.innerHTML = `<span>共 ${total} 条</span>
        <button type="button" class="btn-ghost" data-el="prev" ${page <= 1 ? "disabled" : ""}>上一页</button>
        <span>${page}/${pages}</span>
        <button type="button" class="btn-ghost" data-el="next" ${page >= pages ? "disabled" : ""}>下一页</button>`;
      q('[data-el="prev"]').onclick = () => {
        if (page > 1) {
          page -= 1;
          renderTable();
        }
      };
      q('[data-el="next"]').onclick = () => {
        if (page < pages) {
          page += 1;
          renderTable();
        }
      };
    }

    function renderSel() {
      const list = q('[data-el="selList"]');
      q('[data-el="selCount"]').textContent = String(draft.length);
      if (!draft.length) {
        list.innerHTML = `<div class="pick-sel-empty">尚未选择${noun}</div>`;
        return;
      }
      list.innerHTML = draft
        .map(
          (r) => `<div class="pick-sel-item">
            <div class="meta"><div class="t">${escapeHtml(r.title)}</div><div class="s">${showBelongCol() ? escapeHtml(r.groupName || "") + " " : ""}${escapeHtml(timeRange(r))}</div></div>
            <button type="button" class="x" data-id="${r.id}">×</button>
          </div>`,
        )
        .join("");
      list.querySelectorAll(".x").forEach((btn) => {
        btn.addEventListener("click", () => {
          draft = draft.filter((x) => x.id !== btn.dataset.id);
          renderTable();
          renderSel();
        });
      });
    }

    function open() {
      if (typeof isCustom === "function" && !isCustom()) {
        showToast("请先选择自定义");
        return;
      }
      cat = "all";
      draft = (typeof getPicked === "function" ? getPicked() : []).slice();
      const belong = q('[data-el="belongH"]');
      if (belong) {
        belong.textContent = belongLabel();
        belong.hidden = !showBelongCol();
      }
      mask.classList.add("show");
      renderTree();
      renderTable();
      renderSel();
    }

    function close() {
      mask.classList.remove("show");
      modal.classList.remove("full");
      full = false;
    }

    mask.addEventListener("click", (e) => {
      if (e.target === mask) close();
    });
    mask.querySelectorAll("[data-act=close]").forEach((b) => b.addEventListener("click", close));
    mask.querySelector("[data-act=full]").addEventListener("click", () => {
      full = !full;
      modal.classList.toggle("full", full);
    });
    q('[data-el="query"]').addEventListener("click", () => {
      keyword = q('[data-el="kw"]').value.trim();
      const statusEl = q('[data-el="status"]');
      if (statusEl) status = statusEl.value;
      life = q('[data-el="life"]').value;
      page = 1;
      renderTable();
    });
    q('[data-el="reset"]').addEventListener("click", () => {
      q('[data-el="kw"]').value = "";
      const statusEl = q('[data-el="status"]');
      if (statusEl) statusEl.value = "all";
      q('[data-el="life"]').value = "all";
      keyword = "";
      status = "all";
      life = "all";
      page = 1;
      renderTable();
    });
    q('[data-el="treeSearch"]').addEventListener("click", renderTree);
    q('[data-el="clear"]').addEventListener("click", () => {
      draft = [];
      renderTable();
      renderSel();
    });
    q('[data-el="ok"]').addEventListener("click", () => {
      if (typeof setPicked === "function") setPicked(draft.slice());
      if (typeof onChange === "function") onChange();
      close();
    });

    return { open, close };
  }

  function mountVotePicker({ isCustom, getPicked, setPicked, onChange, toast }) {
    const showToast = toast || defaultToast;
    let draft = [];
    let keyword = "";
    let status = "all";
    let page = 1;
    const pageSize = 6;
    let full = false;
    const q = (sel) => mask.querySelector(sel);

    const mask = document.createElement("div");
    mask.className = "pick-mask";
    mask.innerHTML = `
      <div class="pick-modal" role="dialog" aria-labelledby="vpickTitle">
        <div class="pick-hd">
          <h3 id="vpickTitle">选择投票</h3>
          <div class="pick-hd-ops">
            <button type="button" class="pick-ico" data-act="full" aria-label="全屏">⛶</button>
            <button type="button" class="pick-ico" data-act="close" aria-label="关闭">×</button>
          </div>
        </div>
        <div class="pick-body is-flat">
          <div class="pick-main">
            <div class="pick-filters">
              <label class="fl">标题 <input data-el="kw" placeholder="请输入标题" /></label>
              <label class="fl">状态
                <select data-el="status">
                  <option value="all">全部</option>
                  <option value="进行中">进行中</option>
                  <option value="未开始">未开始</option>
                  <option value="已结束">已结束</option>
                </select>
              </label>
              <button type="button" class="btn-pri" data-el="query">查询</button>
              <button type="button" class="btn-ghost" data-el="reset">重置</button>
            </div>
            <div class="pick-table-wrap">
              <table class="pick-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>投票时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody data-el="tbody"></tbody>
              </table>
              <div class="pick-empty" data-el="empty" hidden>暂无投票</div>
            </div>
            <div class="pick-pager" data-el="pager"></div>
          </div>
          <aside class="pick-sel">
            <div class="pick-sel-h">已选 <span data-el="selCount">0</span><button type="button" data-el="clear">清空</button></div>
            <div class="pick-sel-list" data-el="selList"></div>
          </aside>
        </div>
        <div class="pick-ft">
          <button type="button" class="btn-ghost" data-act="close">取消</button>
          <button type="button" class="btn-pri" data-el="ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const modal = mask.querySelector(".pick-modal");

    function filteredRows() {
      let rows = VOTE_CATALOG.slice();
      if (status !== "all") rows = rows.filter((r) => r.status === status);
      if (keyword) rows = rows.filter((r) => r.title.includes(keyword));
      rows.sort((a, b) => String(b.startAt).localeCompare(String(a.startAt)));
      return rows;
    }

    function renderTable() {
      const rows = filteredRows();
      const start = (page - 1) * pageSize;
      const slice = rows.slice(start, start + pageSize);
      const tbody = q('[data-el="tbody"]');
      const empty = q('[data-el="empty"]');
      tbody.innerHTML = "";
      empty.hidden = slice.length > 0;
      slice.forEach((r) => {
        const tr = document.createElement("tr");
        const added = draft.some((x) => x.id === r.id);
        tr.innerHTML = `
          <td class="ttl" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</td>
          <td>${escapeHtml(timeRange(r))}</td>
          <td>${escapeHtml(r.status)}</td>
          <td><button type="button" class="link-add" ${added ? "disabled" : ""} data-id="${r.id}">${added ? "已添加" : "添加"}</button></td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll(".link-add").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = VOTE_CATALOG.find((x) => x.id === btn.dataset.id);
          if (!row || draft.some((x) => x.id === row.id)) return;
          draft.push(row);
          renderTable();
          renderSel();
        });
      });
      const pager = q('[data-el="pager"]');
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (page > pages) page = pages;
      pager.innerHTML = `<span>共 ${total} 条</span>
        <button type="button" class="btn-ghost" data-el="prev" ${page <= 1 ? "disabled" : ""}>上一页</button>
        <span>${page}/${pages}</span>
        <button type="button" class="btn-ghost" data-el="next" ${page >= pages ? "disabled" : ""}>下一页</button>`;
      q('[data-el="prev"]').onclick = () => {
        if (page > 1) {
          page -= 1;
          renderTable();
        }
      };
      q('[data-el="next"]').onclick = () => {
        if (page < pages) {
          page += 1;
          renderTable();
        }
      };
    }

    function renderSel() {
      const list = q('[data-el="selList"]');
      q('[data-el="selCount"]').textContent = String(draft.length);
      if (!draft.length) {
        list.innerHTML = `<div class="pick-sel-empty">尚未选择投票</div>`;
        return;
      }
      list.innerHTML = draft
        .map(
          (r) => `<div class="pick-sel-item">
            <div class="meta"><div class="t">${escapeHtml(r.title)}</div><div class="s">${escapeHtml(timeRange(r))}</div></div>
            <button type="button" class="x" data-id="${r.id}">×</button>
          </div>`,
        )
        .join("");
      list.querySelectorAll(".x").forEach((btn) => {
        btn.addEventListener("click", () => {
          draft = draft.filter((x) => x.id !== btn.dataset.id);
          renderTable();
          renderSel();
        });
      });
    }

    function open() {
      if (typeof isCustom === "function" && !isCustom()) {
        showToast("请先选择自定义");
        return;
      }
      draft = (typeof getPicked === "function" ? getPicked() : []).slice();
      page = 1;
      mask.classList.add("show");
      renderTable();
      renderSel();
    }

    function close() {
      mask.classList.remove("show");
      modal.classList.remove("full");
      full = false;
    }

    mask.addEventListener("click", (e) => {
      if (e.target === mask) close();
    });
    mask.querySelectorAll("[data-act=close]").forEach((b) => b.addEventListener("click", close));
    mask.querySelector("[data-act=full]").addEventListener("click", () => {
      full = !full;
      modal.classList.toggle("full", full);
    });
    q('[data-el="query"]').addEventListener("click", () => {
      keyword = q('[data-el="kw"]').value.trim();
      status = q('[data-el="status"]').value;
      page = 1;
      renderTable();
    });
    q('[data-el="reset"]').addEventListener("click", () => {
      q('[data-el="kw"]').value = "";
      q('[data-el="status"]').value = "all";
      keyword = "";
      status = "all";
      page = 1;
      renderTable();
    });
    q('[data-el="clear"]').addEventListener("click", () => {
      draft = [];
      renderTable();
      renderSel();
    });
    q('[data-el="ok"]').addEventListener("click", () => {
      if (typeof setPicked === "function") setPicked(draft.slice());
      if (typeof onChange === "function") onChange();
      close();
    });

    return { open, close };
  }

  const GROUP_CATALOG = [
    { id: "g-1", name: "城市夜跑团", categoryKey: "sport", members: 128, status: "已发布" },
    { id: "g-2", name: "周末徒步野行", categoryKey: "sport", members: 96, status: "已发布" },
    { id: "g-3", name: "深夜读书会", categoryKey: "learning", members: 65, status: "已发布" },
    { id: "g-4", name: "桌游电竞局", categoryKey: "game", members: 143, status: "已发布" },
    { id: "g-5", name: "午休飞盘局", categoryKey: "sport", members: 1, status: "未发布" },
    { id: "g-6", name: "午间拉伸站", categoryKey: "sport", members: 8, status: "已发布" },
    { id: "g-7", name: "周末胶片社", categoryKey: "other", members: 11, status: "已发布" }
  ];

  function mountGroupPicker({ isCustom, getPicked, setPicked, onChange, toast }) {
    const showToast = toast || defaultToast;
    let draft = [];
    let keyword = "";
    let category = "all";
    let page = 1;
    const pageSize = 6;
    let full = false;
    const q = (sel) => mask.querySelector(sel);
    const catName = (key) => (IG_TREE.find((n) => n.id === key) || {}).name || "其他";

    const mask = document.createElement("div");
    mask.className = "pick-mask";
    mask.innerHTML = `
      <div class="pick-modal" role="dialog" aria-labelledby="gpickTitle">
        <div class="pick-hd">
          <h3 id="gpickTitle">选择兴趣圈</h3>
          <div class="pick-hd-ops">
            <button type="button" class="pick-ico" data-act="full" aria-label="全屏">⛶</button>
            <button type="button" class="pick-ico" data-act="close" aria-label="关闭">×</button>
          </div>
        </div>
        <div class="pick-body is-flat">
          <div class="pick-main">
            <div class="pick-filters">
              <label class="fl">名称 <input data-el="kw" placeholder="请输入兴趣圈名称" /></label>
              <label class="fl">分类
                <select data-el="cat">${IG_TREE.map((o) => `<option value="${o.id}">${o.name}</option>`).join("")}</select>
              </label>
              <button type="button" class="btn-pri" data-el="query">查询</button>
              <button type="button" class="btn-ghost" data-el="reset">重置</button>
            </div>
            <div class="pick-table-wrap">
              <table class="pick-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>分类</th>
                    <th>成员</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody data-el="tbody"></tbody>
              </table>
              <div class="pick-empty" data-el="empty" hidden>暂无兴趣圈</div>
            </div>
            <div class="pick-pager" data-el="pager"></div>
          </div>
          <aside class="pick-sel">
            <div class="pick-sel-h">已选 <span data-el="selCount">0</span><button type="button" data-el="clear">清空</button></div>
            <div class="pick-sel-list" data-el="selList"></div>
          </aside>
        </div>
        <div class="pick-ft">
          <button type="button" class="btn-ghost" data-act="close">取消</button>
          <button type="button" class="btn-pri" data-el="ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const modal = mask.querySelector(".pick-modal");

    function filteredRows() {
      let rows = GROUP_CATALOG.slice();
      if (category !== "all") rows = rows.filter((r) => r.categoryKey === category);
      if (keyword) rows = rows.filter((r) => r.name.includes(keyword));
      rows.sort((a, b) => b.members - a.members);
      return rows;
    }

    function renderTable() {
      const rows = filteredRows();
      const start = (page - 1) * pageSize;
      const slice = rows.slice(start, start + pageSize);
      const tbody = q('[data-el="tbody"]');
      const empty = q('[data-el="empty"]');
      tbody.innerHTML = "";
      empty.hidden = slice.length > 0;
      slice.forEach((r) => {
        const tr = document.createElement("tr");
        const added = draft.some((x) => x.id === r.id);
        tr.innerHTML = `
          <td class="ttl" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</td>
          <td>${escapeHtml(catName(r.categoryKey))}</td>
          <td>${r.members} 人</td>
          <td>${escapeHtml(r.status)}</td>
          <td><button type="button" class="link-add" ${added ? "disabled" : ""} data-id="${r.id}">${added ? "已添加" : "添加"}</button></td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll(".link-add").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = GROUP_CATALOG.find((x) => x.id === btn.dataset.id);
          if (!row || draft.some((x) => x.id === row.id)) return;
          draft.push(row);
          renderTable();
          renderSel();
        });
      });
      const pager = q('[data-el="pager"]');
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (page > pages) page = pages;
      pager.innerHTML = `<span>共 ${total} 条</span>
        <button type="button" class="btn-ghost" data-el="prev" ${page <= 1 ? "disabled" : ""}>上一页</button>
        <span>${page}/${pages}</span>
        <button type="button" class="btn-ghost" data-el="next" ${page >= pages ? "disabled" : ""}>下一页</button>`;
      q('[data-el="prev"]').onclick = () => {
        if (page > 1) {
          page -= 1;
          renderTable();
        }
      };
      q('[data-el="next"]').onclick = () => {
        if (page < pages) {
          page += 1;
          renderTable();
        }
      };
    }

    function renderSel() {
      const list = q('[data-el="selList"]');
      q('[data-el="selCount"]').textContent = String(draft.length);
      if (!draft.length) {
        list.innerHTML = `<div class="pick-sel-empty">尚未选择兴趣圈</div>`;
        return;
      }
      list.innerHTML = draft
        .map(
          (r) => `<div class="pick-sel-item">
            <div class="meta"><div class="t">${escapeHtml(r.name)}</div><div class="s">${escapeHtml(catName(r.categoryKey))} · ${r.members} 人</div></div>
            <button type="button" class="x" data-id="${r.id}">×</button>
          </div>`,
        )
        .join("");
      list.querySelectorAll(".x").forEach((btn) => {
        btn.addEventListener("click", () => {
          draft = draft.filter((x) => x.id !== btn.dataset.id);
          renderTable();
          renderSel();
        });
      });
    }

    function open() {
      if (typeof isCustom === "function" && !isCustom()) {
        showToast("请先选择自定义");
        return;
      }
      draft = (typeof getPicked === "function" ? getPicked() : []).slice();
      page = 1;
      mask.classList.add("show");
      renderTable();
      renderSel();
    }

    function close() {
      mask.classList.remove("show");
      modal.classList.remove("full");
      full = false;
    }

    mask.addEventListener("click", (e) => {
      if (e.target === mask) close();
    });
    mask.querySelectorAll("[data-act=close]").forEach((b) => b.addEventListener("click", close));
    mask.querySelector("[data-act=full]").addEventListener("click", () => {
      full = !full;
      modal.classList.toggle("full", full);
    });
    q('[data-el="query"]').addEventListener("click", () => {
      keyword = q('[data-el="kw"]').value.trim();
      category = q('[data-el="cat"]').value;
      page = 1;
      renderTable();
    });
    q('[data-el="reset"]').addEventListener("click", () => {
      q('[data-el="kw"]').value = "";
      q('[data-el="cat"]').value = "all";
      keyword = "";
      category = "all";
      page = 1;
      renderTable();
    });
    q('[data-el="clear"]').addEventListener("click", () => {
      draft = [];
      renderTable();
      renderSel();
    });
    q('[data-el="ok"]').addEventListener("click", () => {
      if (typeof setPicked === "function") setPicked(draft.slice());
      if (typeof onChange === "function") onChange();
      close();
    });

    return { open, close };
  }

  global.mountActivityPicker = mountActivityPicker;
  global.mountVotePicker = mountVotePicker;
  global.mountGroupPicker = mountGroupPicker;
})(window);
