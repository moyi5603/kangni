import { useEffect, useState } from 'react';
import { CERTIFICATE_MOCK_VERSION, initialCertificates, type CertificateRecord } from './certificate';

let mockVersion = CERTIFICATE_MOCK_VERSION;
let certificates = initialCertificates.map((item) => ({ ...item }));
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

export function __resetCertificateStoreForTests() {
  mockVersion = CERTIFICATE_MOCK_VERSION;
  certificates = initialCertificates.map((item) => ({ ...item }));
  emit();
}

export function useCertificates() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return certificates;
}

export function getCertificate(id: number) {
  return certificates.find((item) => item.id === id);
}

export function upsertCertificate(record: CertificateRecord) {
  const current = certificates.find((item) => item.id === record.id);
  certificates = current
    ? certificates.map((item) => (item.id === record.id ? record : item))
    : [record, ...certificates];
  emit();
}

export function removeCertificate(id: number): boolean {
  if (!certificates.some((item) => item.id === id)) return false;
  certificates = certificates.filter((item) => item.id !== id);
  emit();
  return true;
}

export function getCertificateOptions() {
  return certificates.map((item) => ({ id: item.id, name: item.name }));
}
