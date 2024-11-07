export function dateToStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addNDaysToToday(days: number): Date {
  const result = new Date();
  result.setDate(result.getDate() + days);

  return result;
}
