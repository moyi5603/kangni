import { useMemo, useState } from 'react';
import { goH5Back } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { useCEndToast } from '../../activities/components/CEndToast';
import {
  CHECKIN_MOOD_COLOR,
  CHECKIN_MOODS,
  calendarDayKey,
  checkinRewardLines,
  checkinStatusOf,
  nextStreak,
  shanghaiYmd,
  uniqueUserDays,
  type CheckinMood,
} from '../../../checkin/model/checkin';
import { setCheckinMood, submitUserCheckin, useCheckinLogs, useCheckinThemes } from '../../../checkin/model/checkinStore';
import { getMedal } from '../../../activities/model/medalLibrary';
import { usePreviewList } from '../../portal/emptyPreview';
import './styles.css';

const VIEWER = { userId: 'u1', user: '周洁', department: '品牌文化部', account: 'zhoujie' };
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function shanghaiDateTime(ms = Date.now()) {
  const shifted = new Date(ms + 8 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function weekdaySun0(ymd: string) {
  return new Date(`${ymd}T12:00:00+08:00`).getUTCDay();
}

function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

function monthCells(year: number, month: number) {
  const lead = weekdaySun0(`${year}-${pad(month)}-01`);
  const dim = daysInMonth(year, month);
  const cells: Array<{ ymd?: string; day?: number }> = Array.from({ length: lead }, () => ({}));
  for (let day = 1; day <= dim; day += 1) {
    cells.push({ ymd: `${year}-${pad(month)}-${pad(day)}`, day });
  }
  while (cells.length % 7 !== 0) cells.push({});
  return cells;
}

function streakAsOf(days: string[], today: string) {
  if (days.includes(today)) return nextStreak(days.filter((item) => item !== today), today);
  const yesterday = shanghaiYmd(Date.parse(`${today}T00:00:00+08:00`) - 24 * 60 * 60 * 1000);
  if (days.includes(yesterday)) return nextStreak(days.filter((item) => item !== yesterday), yesterday);
  return 0;
}

function MoodFace({ mood }: { mood: CheckinMood }) {
  const color = CHECKIN_MOOD_COLOR[mood];
  if (mood === '平静') {
    return (
      <svg viewBox="0 0 48 48" className="c-mood-face" aria-hidden>
        <circle cx="24" cy="24" r="22" fill={color} />
        <circle cx="17" cy="20" r="2.2" fill="#fff" />
        <circle cx="31" cy="20" r="2.2" fill="#fff" />
        <path d="M16 30h16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (mood === '惊喜') {
    return (
      <svg viewBox="0 0 48 48" className="c-mood-face" aria-hidden>
        <circle cx="24" cy="24" r="22" fill={color} />
        <circle cx="17" cy="19" r="2.6" fill="#fff" />
        <circle cx="31" cy="19" r="2.6" fill="#fff" />
        <ellipse cx="24" cy="32" rx="5" ry="6" fill="#fff" />
      </svg>
    );
  }
  if (mood === '幸福') {
    return (
      <svg viewBox="0 0 48 48" className="c-mood-face" aria-hidden>
        <circle cx="24" cy="24" r="22" fill={color} />
        <path d="M14 21c1.4-3 4-4.5 6.5-3.2M28 17.8c2.5-1.3 5.1.2 6.5 3.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M15 28c2.6 5 15.4 5 18 0" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (mood === '担忧') {
    return (
      <svg viewBox="0 0 48 48" className="c-mood-face" aria-hidden>
        <circle cx="24" cy="24" r="22" fill={color} />
        <path d="M14 18h7M27 18h7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="17.5" cy="22" r="2.1" fill="#fff" />
        <circle cx="30.5" cy="22" r="2.1" fill="#fff" />
        <path d="M18 33c2.4-3 9.6-3 12 0" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (mood === '愤怒') {
    return (
      <svg viewBox="0 0 48 48" className="c-mood-face" aria-hidden>
        <circle cx="24" cy="24" r="22" fill={color} />
        <path d="M13 16l8 3M35 16l-8 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="17" cy="22" r="2.2" fill="#fff" />
        <circle cx="31" cy="22" r="2.2" fill="#fff" />
        <path d="M17 34c3-4 11-4 14 0" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="c-mood-face" aria-hidden>
      <circle cx="24" cy="24" r="22" fill={color} />
      <circle cx="17" cy="20" r="2.2" fill="#fff" />
      <circle cx="31" cy="20" r="2.2" fill="#fff" />
      <path d="M17 34c3-5 11-5 14 0" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M28 27c1.4 2.2 3.6 3.4 6 3.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function CheckinRewardSheet({ lines, onClose }: { lines: string[]; onClose: () => void }) {
  return (
    <div className="c-mood-sheet is-reward" role="dialog" aria-label="获得奖励">
      <button className="c-mood-mask" type="button" aria-label="关闭" onClick={onClose} />
      <div className="c-reward-panel">
        <p className="c-mood-sheet-kicker">打卡成功</p>
        <h2 className="c-mood-sheet-title">恭喜获得</h2>
        <ul className="c-reward-list">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <button className="c-btn c-btn-primary c-reward-ok" type="button" onClick={onClose}>
          知道了
        </button>
      </div>
    </div>
  );
}

export function H5DailyCheckinPage() {
  const toast = useCEndToast();
  const themes = useCheckinThemes();
  const theme = themes.find((item) => item.id === 1) ?? themes[0];
  const logs = usePreviewList(useCheckinLogs(theme?.id ?? 0));
  const mine = logs.filter((item) => item.userId === VIEWER.userId);
  const today = shanghaiYmd();
  const todayLog = mine.find((item) => calendarDayKey(item.checkedAt) === today);
  const status = theme ? checkinStatusOf(theme) : '已结束';
  const days = theme ? uniqueUserDays(mine, theme.id, VIEWER.userId) : [];
  const todayParts = today.split('-').map(Number);
  const [cursor, setCursor] = useState({ year: todayParts[0] ?? 2026, month: todayParts[1] ?? 9 });
  const [sheetLogId, setSheetLogId] = useState<number>();
  const [rewardLines, setRewardLines] = useState<string[]>();
  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor.year, cursor.month]);
  const byDay = new Map(mine.map((item) => [calendarDayKey(item.checkedAt), item]));

  const ctaLabel = !theme || status !== '进行中' ? (status === '未开始' ? '尚未开始' : '打卡已结束') : todayLog ? '今日已打卡' : '签到打卡';
  const ctaDisabled = !theme || status !== '进行中';

  function openMood(logId: number) {
    setSheetLogId(logId);
  }

  function checkInToday() {
    if (!theme) return;
    if (todayLog) {
      toast.show('今日已打卡');
      return;
    }
    const result = submitUserCheckin({ themeId: theme.id, ...VIEWER, at: shanghaiDateTime() });
    if (!result.ok) {
      toast.show(result.reason);
      return;
    }
    const lines = checkinRewardLines(result.grants, {
      medalName: (id) => getMedal(id)?.name ?? id,
      lotteryChance: result.lotteryChance,
    });
    setSheetLogId(result.log.id);
    if (lines.length) {
      setRewardLines(lines);
    }
  }

  function onDay(ymd?: string) {
    if (!ymd || !theme) return;
    if (ymd > today) {
      toast.show('还没到这一天');
      return;
    }
    const log = byDay.get(ymd);
    if (log) {
      openMood(log.id);
      return;
    }
    if (ymd === today) {
      checkInToday();
      return;
    }
    toast.show('当天未打卡，无法记心情');
  }

  function pickMood(mood: CheckinMood) {
    if (sheetLogId == null) return;
    setCheckinMood(sheetLogId, mood);
    setSheetLogId(undefined);
    toast.show(`已记录「${mood}」`);
  }

  const sheetLog = mine.find((item) => item.id === sheetLogId);

  return (
    <H5ActivityShell
      className="is-daily-checkin"
      title="签到打卡"
      onBack={goH5Back}
      overlay={
        rewardLines?.length ? (
          <CheckinRewardSheet lines={rewardLines} onClose={() => setRewardLines(undefined)} />
        ) : sheetLog ? (
          <div className="c-mood-sheet" role="dialog" aria-label="记录心情">
            <button className="c-mood-mask" type="button" aria-label="关闭" onClick={() => setSheetLogId(undefined)} />
            <div className="c-mood-panel">
              <p className="c-mood-sheet-kicker">{calendarDayKey(sheetLog.checkedAt)}</p>
              <h2 className="c-mood-sheet-title">今天心情怎么样？</h2>
              <div className="c-mood-grid">
                {CHECKIN_MOODS.map((mood) => (
                  <button
                    key={mood}
                    className={`c-mood-pick${sheetLog.mood === mood ? ' is-on' : ''}`}
                    type="button"
                    onClick={() => pickMood(mood)}
                  >
                    <MoodFace mood={mood} />
                    <span>{mood}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null
      }
    >
      <div className="c-daily-checkin">
        <section className="c-daily-hero">
          <p className="c-daily-kicker">{theme?.title ?? '打卡'}</p>
          <h2 className="c-daily-hello">嗨，{VIEWER.user}</h2>
          <p className="c-daily-sub">点一下完成今日打卡。有奖励会立刻弹出。</p>
          <button
            className={`c-daily-stamp${todayLog ? ' is-done' : ''}`}
            type="button"
            disabled={ctaDisabled && !todayLog}
            onClick={checkInToday}
          >
            <span className="c-daily-stamp-label">{ctaLabel}</span>
            <span className="c-daily-stamp-hint">{todayLog?.mood ? `今日心情 · ${todayLog.mood}` : todayLog ? '今日已打卡' : '每日一次'}</span>
          </button>
          <div className="c-daily-stats">
            <div>
              <strong>{streakAsOf(days, today)}</strong>
              <span>连续天数</span>
            </div>
            <div>
              <strong>{days.length}</strong>
              <span>累计次数</span>
            </div>
          </div>
        </section>

        <section className="c-daily-cal">
          <div className="c-daily-cal-head">
            <button
              className="c-icon-btn"
              type="button"
              aria-label="上个月"
              onClick={() => setCursor((cur) => shiftMonth(cur.year, cur.month, -1))}
            >
              ‹
            </button>
            <h3>
              打卡日历 · {cursor.year}年{cursor.month}月
            </h3>
            <button
              className="c-icon-btn"
              type="button"
              aria-label="下个月"
              onClick={() => setCursor((cur) => shiftMonth(cur.year, cur.month, 1))}
            >
              ›
            </button>
          </div>
          <div className="c-daily-week">
            {WEEK.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="c-daily-grid">
            {cells.map((cell, index) => {
              if (!cell.ymd) return <span key={`e-${index}`} className="c-daily-cell is-empty" />;
              const log = byDay.get(cell.ymd);
              const isToday = cell.ymd === today;
              return (
                <button
                  key={cell.ymd}
                  className={`c-daily-cell${isToday ? ' is-today' : ''}${log ? ' is-checked' : ''}`}
                  type="button"
                  onClick={() => onDay(cell.ymd)}
                  aria-label={`${cell.ymd}${log ? ` 已打卡${log.mood ? ` ${log.mood}` : ''}` : ''}`}
                >
                  <span>{cell.day}</span>
                  {log?.mood ? (
                    <span className="c-daily-mood">
                      <MoodFace mood={log.mood} />
                    </span>
                  ) : log ? (
                    <i className="c-daily-dot is-plain" />
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="c-daily-cal-hint">点已打卡的日期，可以记录心情</p>
          <ul className="c-daily-legend">
            {CHECKIN_MOODS.map((mood) => (
              <li key={mood}>
                <MoodFace mood={mood} />
                {mood}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </H5ActivityShell>
  );
}
