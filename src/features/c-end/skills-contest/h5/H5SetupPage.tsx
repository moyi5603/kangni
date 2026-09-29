import { useState } from 'react';
import { goH5Back } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';

const LANGUAGES = ['中文(简体)', '中文(繁體)', 'English'] as const;

const ROWS = ['账号与安全', '系统权限管理', '隐私协议', '个人信息收集清单', '第三方共享个人信息清单'] as const;

function Chevron() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden>
      <path d="M4.2 2.2 8 6 4.2 9.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function H5SetupPage() {
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>('中文(简体)');
  const [languageOpen, setLanguageOpen] = useState(false);

  return (
    <H5ActivityShell className="is-setup" title="设置" onBack={goH5Back}>
      <div className="c-setup">
        <ul>
          <li>
            <button type="button">
              <span>账号与安全</span>
              <Chevron />
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setLanguageOpen(true)}>
              <span>多语言</span>
              <em>{language}</em>
              <Chevron />
            </button>
          </li>
          {ROWS.slice(1).map((label) => (
            <li key={label}>
              <button type="button">
                <span>{label}</span>
                <Chevron />
              </button>
            </li>
          ))}
        </ul>
        <button className="c-setup-logout" type="button">
          退出登录
        </button>
      </div>
      {languageOpen ? (
        <div className="c-setup-sheet" role="dialog" aria-label="多语言">
          <button className="c-setup-sheet-mask" type="button" aria-label="关闭" onClick={() => setLanguageOpen(false)} />
          <div className="c-setup-sheet-panel">
            {LANGUAGES.map((item) => (
              <button
                key={item}
                type="button"
                className={item === language ? 'is-on' : undefined}
                onClick={() => {
                  setLanguage(item);
                  setLanguageOpen(false);
                }}
              >
                {item}
              </button>
            ))}
            <button type="button" onClick={() => setLanguageOpen(false)}>
              取消
            </button>
          </div>
        </div>
      ) : null}
    </H5ActivityShell>
  );
}
