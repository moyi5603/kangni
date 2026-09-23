import { useEffect, useState } from 'react';
import {
  initialLiveComments,
  initialLiveViewers,
  initialLives,
  type LiveComment,
  type LiveRecord,
  type LiveViewer,
} from './live';

let lives = [...initialLives];
let comments = [...initialLiveComments];
let viewers = [...initialLiveViewers];
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

export function __resetLiveStoreForTests() {
  lives = [...initialLives];
  comments = [...initialLiveComments];
  viewers = [...initialLiveViewers];
  emit();
}

export function useLives() {
  useStoreTick();
  return lives;
}

export function getLive(id: number) {
  return lives.find((item) => item.id === id);
}

export function saveLive(record: LiveRecord): LiveRecord {
  const current = lives.find((item) => item.id === record.id);
  lives = current ? lives.map((item) => (item.id === record.id ? record : item)) : [record, ...lives];
  emit();
  return record;
}

export function nextLiveId(): number {
  return Math.max(0, ...lives.map((item) => item.id)) + 1;
}

export function removeLive(id: number): boolean {
  const exists = lives.some((item) => item.id === id);
  if (!exists) return false;
  lives = lives.filter((item) => item.id !== id);
  comments = comments.filter((item) => item.liveId !== id);
  viewers = viewers.filter((item) => item.liveId !== id);
  emit();
  return true;
}

export function getLiveComments(liveId: number) {
  return comments.filter((item) => item.liveId === liveId);
}

export function useLiveComments(liveId: number) {
  useStoreTick();
  return getLiveComments(liveId);
}

export function removeLiveComment(id: number) {
  comments = comments.filter((item) => item.id !== id);
  emit();
}

export function getLiveViewers(liveId: number) {
  return viewers.filter((item) => item.liveId === liveId);
}

export function useLiveViewers(liveId: number) {
  useStoreTick();
  return getLiveViewers(liveId);
}
