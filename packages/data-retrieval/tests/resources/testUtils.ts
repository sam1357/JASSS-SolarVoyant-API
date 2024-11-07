import { utcToZonedTime, format } from "date-fns-tz";
import { CUR_TIMEZONE } from "../../src/constants";

export function dateToStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function addNDaysToDay(days: number, date = new Date()): Date {
  date.setDate(date.getDate() + days);

  return utcToZonedTime(date, CUR_TIMEZONE);
}
