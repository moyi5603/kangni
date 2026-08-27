#!/usr/bin/env python3
"""Extract Kangni honor prototype into a React H5 runtime."""
from __future__ import annotations

import re
from pathlib import Path

SRC = Path("/Users/edy/Documents/需求/康尼2/.tmp-honor-index.html")
OUT_DIR = Path("/Users/edy/Documents/需求/康尼2/src/features/c-end/honor")

APP_TAIL = r'''
export function HonorEmbedApp() {
  const [role, setRole] = React.useState('employee');
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

  const nav = {
    navigate,
    goBack,
    role,
    switchRole,
    navigateAsRole,
    atRoot: currentStack.length === 1,
    refresh: () => setScreenKey((k) => k + 1),
  };
  const roleSwitcher = (
    <HeaderRoleRight nav={nav} roleSwitcher={<RoleSwitcher role={role} onSwitch={switchRole} />} />
  );

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
    </div>
  );
}
'''


def transform_js(src: str) -> str:
    src = src.replace("window.AppData =", "const AppData =")
    src = src.replace("window.HonorPersist =", "HonorPersist =")
    src = src.replace("window.HonorPersist && HonorPersist", "HonorPersist && HonorPersist")
    src = src.replace("if (window.HonorPersist)", "if (HonorPersist)")
    src = src.replace("if (window.HonorPersist && HonorPersist.deleteActivity)", "if (HonorPersist && HonorPersist.deleteActivity)")
    src = re.sub(
        r"function honorIsPc\(\) \{\n  return document\.documentElement\.classList\.contains\('embed-pc'\);\n\}",
        "function honorIsPc() {\n  return false;\n}",
        src,
    )
    src = re.sub(r"Object\.assign\(window,\s*\{[^}]*\}\);", "", src)
    # HonorPersist is assigned inside IIFE; declare it first
    if "HonorPersist =" in src and "let HonorPersist" not in src:
        src = src.replace(
            "/** 提名 / 活动 localStorage 持久化 + 双 iframe 联动（演示） */",
            "let HonorPersist;\n/** 提名 / 活动 localStorage 持久化 + 双 iframe 联动（演示） */",
        )
    return src


def main() -> None:
    text = SRC.read_text()
    data_scripts = re.findall(r"<script>(.*?)</script>", text, re.S)
    data = next(s for s in data_scripts if "app-data.js" in s or "window.AppData" in s)
    babel = re.findall(r'<script type="text/babel"[^>]*>(.*?)</script>', text, re.S)
    # 0 shell, 1 home, 2 im, 3 create, 4 activity, 5 leaderboard, 6 employee, 7 edit
    # skip 8 tweaks, 9 app bootstrap
    body = "\n\n".join([data, *babel[:8]])
    body = transform_js(body)

    header = """// @ts-nocheck
/* Pixel-faithful port of 康尼 honor/index.html embed=mobile. */
import React from 'react';

"""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "HonorRuntime.tsx").write_text(header + body + "\n" + APP_TAIL)
    print("wrote", OUT_DIR / "HonorRuntime.tsx", "bytes", (OUT_DIR / "HonorRuntime.tsx").stat().st_size)


if __name__ == "__main__":
    main()
