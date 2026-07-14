const MB = 1024 * 1024;
const KB = 1024;

export type CompressTarget = { label: string; bytes: number };

export const COMPRESS_TARGETS: CompressTarget[] = [
  { label: "25 MB", bytes: 25 * MB },
  { label: "20 MB", bytes: 20 * MB },
  { label: "15 MB", bytes: 15 * MB },
  { label: "10 MB", bytes: 10 * MB },
  { label: "5 MB", bytes: 5 * MB },
  { label: "1000 kB", bytes: 1000 * KB },
  { label: "500 kB", bytes: 500 * KB },
  { label: "200 kB", bytes: 200 * KB },
  { label: "100 kB", bytes: 100 * KB },
  { label: "50 kB", bytes: 50 * KB },
  { label: "20 kB", bytes: 20 * KB },
];
