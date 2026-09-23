(function (global) {
  const CATALOG = [
    { id: "a1", title: "关于开展2026年度员工健康体检的通知", source: "通知公告", time: "2026-08-12 09:20", status: "on", views: 1280 },
    { id: "a2", title: "航天科技集团企业文化宣贯要点", source: "企业文化", time: "2026-08-08 14:05", status: "on", views: 860 },
    { id: "a3", title: "劳动模范风采｜一线工匠的一天", source: "劳模风采", time: "2026-07-29 11:40", status: "on", views: 2406 },
    { id: "a4", title: "制度解读：差旅报销常见问题", source: "制度流程", time: "2026-07-21 16:12", status: "on", views: 533 },
    { id: "a5", title: "产品手册更新：新一代对接机构", source: "业务知识", time: "2026-07-18 10:01", status: "off", views: 190 },
    { id: "a6", title: "紧急通知：园区临时交通管制", source: "紧急通知", time: "2026-07-15 08:30", status: "on", views: 3211 },
    { id: "a7", title: "节日活动｜中秋员工亲子日报名", source: "节日活动", time: "2026-07-10 15:44", status: "on", views: 977 },
    { id: "a8", title: "政策文件：年度绩效考核办法", source: "政策文件", time: "2026-06-28 09:00", status: "on", views: 1544 },
  ];

  const TREE = [
    { id: "all", name: "全部文章", children: [] },
    { id: "dyn", name: "企业动态", children: [{ id: "notice", name: "通知公告" }, { id: "culture", name: "企业文化" }] },
    { id: "kb", name: "知识库", children: [{ id: "rules", name: "制度流程" }, { id: "biz", name: "业务知识" }] },
    { id: "model", name: "劳模风采", children: [{ id: "story", name: "劳模事迹" }] },
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

  function mountArticlePicker({ addBtn, pickedBox, isCustom, toast }) {
    const showToast = toast || defaultToast;
    const picked = [];
    let draft = [];
    let cat = "all";
    let keyword = "";
    let sort = "time";
    let status = "all";
    let page = 1;
    const pageSize = 6;
    let full = false;

    const mask = document.createElement("div");
    mask.className = "pick-mask";
    mask.innerHTML = `
      <div class="pick-modal" role="dialog" aria-labelledby="pickTitle">
        <div class="pick-hd">
          <h3 id="pickTitle">选择文章</h3>
          <div class="pick-hd-ops">
            <button type="button" class="pick-ico" data-act="full" aria-label="全屏">⛶</button>
            <button type="button" class="pick-ico" data-act="close" aria-label="关闭">×</button>
          </div>
        </div>
        <div class="pick-body">
          <aside class="pick-side">
            <div class="pick-side-search">
              <input id="pickTreeQ" placeholder="搜索分类" />
              <button type="button" id="pickTreeSearch">搜索</button>
            </div>
            <div class="pick-tree" id="pickTree"></div>
          </aside>
          <div class="pick-main">
            <div class="pick-filters">
              <label class="fl">标题 <input id="pickKw" placeholder="请输入标题" /></label>
              <label class="fl">状态
                <select id="pickStatus">
                  <option value="all">全部</option>
                  <option value="on">已发布</option>
                  <option value="off">未发布</option>
                </select>
              </label>
              <button type="button" class="btn-pri" id="pickQuery">查询</button>
              <button type="button" class="btn-ghost" id="pickReset">重置</button>
            </div>
            <div class="sort-pills">
              <button type="button" class="sort-pill on" data-sort="time">最新</button>
              <button type="button" class="sort-pill" data-sort="views">阅读量</button>
            </div>
            <div class="pick-table-wrap">
              <table class="pick-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>来源</th>
                    <th>发布时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="pickTbody"></tbody>
              </table>
              <div class="pick-empty" id="pickEmpty" hidden>暂无文章</div>
            </div>
            <div class="pick-pager" id="pickPager"></div>
          </div>
          <aside class="pick-sel">
            <div class="pick-sel-h">已选 <span id="pickSelCount">0</span><button type="button" id="pickClear">清空</button></div>
            <div class="pick-sel-list" id="pickSelList"></div>
          </aside>
        </div>
        <div class="pick-ft">
          <button type="button" class="btn-ghost" data-act="close">取消</button>
          <button type="button" class="btn-pri" id="pickOk">确定</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const modal = mask.querySelector(".pick-modal");

    function filteredRows() {
      let rows = CATALOG.slice();
      if (status !== "all") rows = rows.filter((r) => r.status === status);
      if (keyword) {
        const q = keyword.toLowerCase();
        rows = rows.filter((r) => r.title.toLowerCase().includes(q) || r.source.includes(keyword));
      }
      if (cat !== "all") {
        const node = TREE.flatMap((n) => [n, ...n.children]).find((n) => n.id === cat);
        if (node && node.id !== "all") {
          rows = rows.filter((r) => r.source.includes(node.name) || node.name.includes(r.source));
        }
      }
      rows.sort((a, b) => (sort === "views" ? b.views - a.views : String(b.time).localeCompare(String(a.time))));
      return rows;
    }

    function renderTree() {
      const q = (document.getElementById("pickTreeQ").value || "").trim();
      const root = document.getElementById("pickTree");
      root.innerHTML = "";
      TREE.filter((n) => !q || n.name.includes(q) || n.children.some((c) => c.name.includes(q))).forEach((n) => {
        const wrap = document.createElement("div");
        const row = document.createElement("div");
        row.className = "tree-row";
        const caret = document.createElement("button");
        caret.type = "button";
        caret.className = "tree-caret";
        caret.textContent = n.children.length ? "▶" : "";
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
        const kids = document.createElement("div");
        kids.className = "tree-children" + (n.children.length ? " open" : "");
        n.children.filter((c) => !q || c.name.includes(q) || n.name.includes(q)).forEach((c) => {
          const child = document.createElement("button");
          child.type = "button";
          child.className = "tree-item child" + (cat === c.id ? " on" : "");
          child.textContent = c.name;
          child.addEventListener("click", () => {
            cat = c.id;
            page = 1;
            renderTree();
            renderTable();
          });
          kids.appendChild(child);
        });
        caret.addEventListener("click", () => kids.classList.toggle("open"));
        wrap.appendChild(kids);
        root.appendChild(wrap);
      });
    }

    function renderTable() {
      const rows = filteredRows();
      const start = (page - 1) * pageSize;
      const slice = rows.slice(start, start + pageSize);
      const tbody = document.getElementById("pickTbody");
      const empty = document.getElementById("pickEmpty");
      tbody.innerHTML = "";
      empty.hidden = slice.length > 0;
      slice.forEach((r) => {
        const tr = document.createElement("tr");
        const added = draft.some((x) => x.id === r.id);
        tr.innerHTML = `
          <td class="ttl" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</td>
          <td>${escapeHtml(r.source)}</td>
          <td>${escapeHtml(r.time)}</td>
          <td><span class="st-dot ${r.status === "off" ? "off" : ""}"><i></i>${r.status === "on" ? "已发布" : "未发布"}</span></td>
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
      const pager = document.getElementById("pickPager");
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (page > pages) page = pages;
      pager.innerHTML = `<span>共 ${total} 条</span>
        <button type="button" class="btn-ghost" id="pickPrev" ${page <= 1 ? "disabled" : ""}>上一页</button>
        <span>${page}/${pages}</span>
        <button type="button" class="btn-ghost" id="pickNext" ${page >= pages ? "disabled" : ""}>下一页</button>`;
      document.getElementById("pickPrev").onclick = () => {
        if (page > 1) {
          page -= 1;
          renderTable();
        }
      };
      document.getElementById("pickNext").onclick = () => {
        if (page < pages) {
          page += 1;
          renderTable();
        }
      };
    }

    function renderSel() {
      const list = document.getElementById("pickSelList");
      document.getElementById("pickSelCount").textContent = String(draft.length);
      if (!draft.length) {
        list.innerHTML = `<div class="pick-sel-empty">尚未选择文章</div>`;
        return;
      }
      list.innerHTML = draft
        .map(
          (r) => `<div class="pick-sel-item">
            <div class="meta"><div class="t">${escapeHtml(r.title)}</div><div class="s">${escapeHtml(r.source)}</div></div>
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

    function renderPicked() {
      const custom = typeof isCustom === "function" ? isCustom() : true;
      if (addBtn) addBtn.hidden = !custom;
      if (!pickedBox) return;
      if (!custom || !picked.length) {
        pickedBox.hidden = true;
        pickedBox.innerHTML = "";
        return;
      }
      pickedBox.hidden = false;
      pickedBox.innerHTML = picked
        .map(
          (r) => `<div class="picked-card">
            <div class="ttl">${escapeHtml(r.title)}</div>
            <button type="button" class="del" data-id="${r.id}">删除</button>
          </div>`,
        )
        .join("");
      pickedBox.querySelectorAll(".del").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = picked.findIndex((x) => x.id === btn.dataset.id);
          if (idx >= 0) picked.splice(idx, 1);
          renderPicked();
        });
      });
    }

    function open() {
      if (typeof isCustom === "function" && !isCustom()) {
        showToast("请先选择自定义");
        return;
      }
      draft = picked.slice();
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

    addBtn?.addEventListener("click", open);
    mask.addEventListener("click", (e) => {
      if (e.target === mask) close();
    });
    mask.querySelectorAll("[data-act=close]").forEach((b) => b.addEventListener("click", close));
    mask.querySelector("[data-act=full]").addEventListener("click", () => {
      full = !full;
      modal.classList.toggle("full", full);
    });
    document.getElementById("pickQuery").addEventListener("click", () => {
      keyword = document.getElementById("pickKw").value.trim();
      status = document.getElementById("pickStatus").value;
      page = 1;
      renderTable();
    });
    document.getElementById("pickReset").addEventListener("click", () => {
      document.getElementById("pickKw").value = "";
      document.getElementById("pickStatus").value = "all";
      keyword = "";
      status = "all";
      page = 1;
      renderTable();
    });
    document.getElementById("pickTreeSearch").addEventListener("click", renderTree);
    mask.querySelectorAll(".sort-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        sort = pill.dataset.sort;
        mask.querySelectorAll(".sort-pill").forEach((x) => x.classList.toggle("on", x === pill));
        renderTable();
      });
    });
    document.getElementById("pickClear").addEventListener("click", () => {
      draft = [];
      renderTable();
      renderSel();
    });
    document.getElementById("pickOk").addEventListener("click", () => {
      picked.splice(0, picked.length, ...draft);
      renderPicked();
      close();
    });

    renderPicked();
    return { renderPicked, open, close };
  }

  global.mountArticlePicker = mountArticlePicker;
})(window);
