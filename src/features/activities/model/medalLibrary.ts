import { useEffect, useState } from 'react';

export type MedalScope = '通用' | '文化打卡' | '技能大赛';

export type Medal = {
  id: string;
  name: string;
  imageUrl: string;
  scope: MedalScope;
  description?: string;
};

function badgeUri(fill: string, ring: string, mark: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="${fill}" stroke="${ring}" stroke-width="6"/><text x="40" y="48" text-anchor="middle" font-size="24" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-weight="700" fill="${ring}">${mark}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function medal(id: string, name: string, fill: string, ring: string, mark: string, scope: MedalScope = '通用'): Medal {
  return { id, name, imageUrl: badgeUri(fill, ring, mark), scope };
}

export const initialMedals: Medal[] = [
  medal('star-staff', '明星员工', '#ffe58f', '#d48806', '星'),
  medal('service-flag', '服务标兵', '#ffd8bf', '#d4380d', '服'),
  medal('value-model', '价值观典范', '#ffccc7', '#cf1322', '值'),
  medal('craft', '匠心品质', '#ffe7ba', '#d46b08', '匠'),
  medal('growth-star', '成长之星', '#d9f7be', '#389e0d', '长'),
  medal('excel', '卓越贡献', '#bae0ff', '#0958d9', '卓'),
  medal('launch', '成长启航', '#d6e4ff', '#2f54eb', '航'),
  medal('win-together', '协作共赢', '#efdbff', '#531dab', '协', '文化打卡'),
  medal('innovate-go', '创新进取', '#b5f5ec', '#08979c', '创', '文化打卡'),
  medal('join', '活动参与勋章', '#ffe58f', '#d48806', '参'),
  medal('star', '优秀表现勋章', '#ffd8bf', '#d4380d', '优'),
  medal('done', '结业纪念勋章', '#d6e4ff', '#1d39c4', '业'),
  medal('volunteer', '志愿者勋章', '#d9f7be', '#389e0d', '志'),
  medal('safety', '安全之星', '#fff1b8', '#ad6800', '安'),
  medal('collab', '最佳协作', '#efdbff', '#531dab', '协', '文化打卡'),
  medal('innovate', '创新提案', '#bae0ff', '#0958d9', '创', '文化打卡'),
  medal('attend', '满勤打卡', '#ffd6e7', '#c41d7f', '勤', '文化打卡'),
  medal('speak', '演讲达人', '#ffe7ba', '#d46b08', '讲'),
  medal('lead', '组织先锋', '#b5f5ec', '#08979c', '组'),
  medal('newbie', '新人成长', '#d6e4ff', '#2f54eb', '新'),
  medal('quality', '质量标兵', '#eaff8f', '#7cb305', '质'),
  medal('service', '服务之星', '#ffccc7', '#cf1322', '服'),
  medal('learn', '学习之星', '#d3adf7', '#531dab', '学'),
  medal('green', '环保先锋', '#b7eb8f', '#237804', '环'),
];

let medals = [...initialMedals];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getMedal(id: string): Medal | undefined {
  return medals.find((item) => item.id === id);
}

export function addMedal(
  name: string,
  imageUrl: string,
  extra?: { scope?: MedalScope; description?: string },
): Medal {
  const medalItem: Medal = {
    id: `m-${Date.now()}`,
    name: name.trim(),
    imageUrl,
    scope: extra?.scope ?? '通用',
    description: extra?.description?.trim() || undefined,
  };
  medals = [medalItem, ...medals];
  emit();
  return medalItem;
}

export function useMedals(): Medal[] {
  const [list, setList] = useState(medals);
  useEffect(() => {
    const onChange = () => setList([...medals]);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}

export function __resetMedalLibraryForTests() {
  medals = [...initialMedals];
  emit();
}
