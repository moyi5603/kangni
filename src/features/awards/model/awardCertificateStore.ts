import { useEffect, useState } from 'react';
import { AWARD_CERTIFICATE_MOCK_VERSION, initialAwardCertificates, type AwardCertificateRecord } from './awardCertificate';

let mockVersion = AWARD_CERTIFICATE_MOCK_VERSION;
let certificates = [...initialAwardCertificates];
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

export function __resetAwardCertificateStoreForTests() {
  mockVersion = AWARD_CERTIFICATE_MOCK_VERSION;
  certificates = [...initialAwardCertificates];
  emit();
}

export function useAwardCertificates() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return certificates;
}

export function getAwardCertificates() {
  return certificates;
}

export function getAwardCertificate(id: number) {
  return certificates.find((item) => item.id === id);
}

export function upsertAwardCertificate(record: AwardCertificateRecord) {
  const current = certificates.find((item) => item.id === record.id);
  certificates = current
    ? certificates.map((item) => (item.id === record.id ? record : item))
    : [record, ...certificates];
  emit();
}

export function removeAwardCertificate(id: number): boolean {
  const exists = certificates.some((item) => item.id === id);
  if (!exists) return false;
  certificates = certificates.filter((item) => item.id !== id);
  emit();
  return true;
}

void mockVersion;
