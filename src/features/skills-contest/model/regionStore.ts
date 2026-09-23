import { useEffect, useState } from 'react';
import { canDeleteRegion, enabledRegions, isRegionNameTaken, regionLevelOf, type Region } from './contest';
import { getAllSignups } from './contestStore';

const initialRegions: Region[] = [
  { id: 1, name: '江苏省', parentId: null, sort: 1, enabled: true },
  { id: 2, name: '广东省', parentId: null, sort: 2, enabled: true },
  { id: 3, name: '山东省', parentId: null, sort: 3, enabled: true },
  { id: 4, name: '南京市', parentId: 1, sort: 1, enabled: true },
  { id: 5, name: '苏州市', parentId: 1, sort: 2, enabled: true },
  { id: 6, name: '深圳市', parentId: 2, sort: 1, enabled: true },
  { id: 7, name: '济南市', parentId: 3, sort: 1, enabled: true },
  { id: 8, name: '鼓楼区', parentId: 4, sort: 1, enabled: true },
  { id: 9, name: '玄武区', parentId: 4, sort: 2, enabled: true },
  { id: 10, name: '姑苏区', parentId: 5, sort: 1, enabled: true },
  { id: 11, name: '南山区', parentId: 6, sort: 1, enabled: true },
];

let regions = initialRegions.map((item) => ({ ...item }));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useStoreTick() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
}

export function __resetRegionStoreForTests() {
  regions = initialRegions.map((item) => ({ ...item }));
  emit();
}

export function useRegions() {
  useStoreTick();
  return regions;
}

export function getRegions() {
  return regions;
}

export function enabledRegionOptions() {
  return enabledRegions(regions);
}

export function nextRegionSort(parentId: number | null) {
  const siblings = regions.filter((item) => item.parentId === parentId);
  return Math.max(0, ...siblings.map((item) => item.sort), 0) + 1;
}

export function saveRegion(region: Region): { ok: true; region: Region } | { ok: false; reason: string } {
  if (!region.name.trim()) return { ok: false, reason: '请输入区域名称' };
  if (region.name.trim().length > 20) return { ok: false, reason: '区域名称不超过 20 字' };
  if (isRegionNameTaken(regions, region.name, region.parentId, region.id || undefined)) {
    return { ok: false, reason: '同一层级下名称不能重复' };
  }
  if (region.parentId != null && !regions.some((item) => item.id === region.parentId)) {
    return { ok: false, reason: '请选择上级区域' };
  }
  if (region.parentId != null && regionLevelOf(regions, region.parentId) === 'district') {
    return { ok: false, reason: '区下面不能再添加下级' };
  }
  if (region.id) {
    regions = regions.map((item) => (item.id === region.id ? { ...region, name: region.name.trim() } : item));
    emit();
    return { ok: true, region };
  }
  const created: Region = {
    ...region,
    id: Math.max(0, ...regions.map((item) => item.id)) + 1,
    name: region.name.trim(),
    sort: region.sort || nextRegionSort(region.parentId),
  };
  regions = [...regions, created];
  emit();
  return { ok: true, region: created };
}

export function removeRegion(id: number): { ok: true } | { ok: false; reason: string } {
  if (!canDeleteRegion(id, getAllSignups(), regions)) {
    if (regions.some((item) => item.parentId === id)) {
      return { ok: false, reason: '请先删除下级区域' };
    }
    return { ok: false, reason: '已有报名使用该区域，请改为停用' };
  }
  regions = regions.filter((item) => item.id !== id);
  emit();
  return { ok: true };
}
