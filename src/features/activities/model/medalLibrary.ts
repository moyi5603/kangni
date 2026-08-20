import { useEffect, useState } from 'react';

export type Medal = {
  id: string;
  name: string;
  imageUrl: string;
};

function badgeUri(fill: string, ring: string, mark: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="${fill}" stroke="${ring}" stroke-width="6"/><text x="40" y="48" text-anchor="middle" font-size="24" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-weight="700" fill="${ring}">${mark}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const initialMedals: Medal[] = [
  { id: 'join', name: '活动参与勋章', imageUrl: badgeUri('#ffe58f', '#d48806', '参') },
  { id: 'star', name: '优秀表现勋章', imageUrl: badgeUri('#ffd8bf', '#d4380d', '优') },
  { id: 'done', name: '结业纪念勋章', imageUrl: badgeUri('#d6e4ff', '#1d39c4', '业') },
  { id: 'volunteer', name: '志愿者勋章', imageUrl: badgeUri('#d9f7be', '#389e0d', '志') },
  { id: 'safety', name: '安全之星', imageUrl: badgeUri('#fff1b8', '#ad6800', '安') },
  { id: 'collab', name: '最佳协作', imageUrl: badgeUri('#efdbff', '#531dab', '协') },
  { id: 'innovate', name: '创新提案', imageUrl: badgeUri('#bae0ff', '#0958d9', '创') },
  { id: 'attend', name: '满勤打卡', imageUrl: badgeUri('#ffd6e7', '#c41d7f', '勤') },
  { id: 'speak', name: '演讲达人', imageUrl: badgeUri('#ffe7ba', '#d46b08', '讲') },
  { id: 'lead', name: '组织先锋', imageUrl: badgeUri('#b5f5ec', '#08979c', '组') },
  { id: 'newbie', name: '新人成长', imageUrl: badgeUri('#d6e4ff', '#2f54eb', '新') },
  { id: 'quality', name: '质量标兵', imageUrl: badgeUri('#eaff8f', '#7cb305', '质') },
  { id: 'service', name: '服务之星', imageUrl: badgeUri('#ffccc7', '#cf1322', '服') },
  { id: 'learn', name: '学习之星', imageUrl: badgeUri('#d3adf7', '#531dab', '学') },
  { id: 'green', name: '环保先锋', imageUrl: badgeUri('#b7eb8f', '#237804', '环') },
];

let medals = [...initialMedals];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getMedal(id: string): Medal | undefined {
  return medals.find((item) => item.id === id);
}

export function addMedal(name: string, imageUrl: string): Medal {
  const medal: Medal = { id: `m-${Date.now()}`, name: name.trim(), imageUrl };
  medals = [medal, ...medals];
  emit();
  return medal;
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
