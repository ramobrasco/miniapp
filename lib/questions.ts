const OPEN_HOURS = 24;

export function isQuestionOpen(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created < OPEN_HOURS * 60 * 60 * 1000;
}

export function closesAt(createdAt: string): Date {
  const created = new Date(createdAt).getTime();
  return new Date(created + OPEN_HOURS * 60 * 60 * 1000);
}
