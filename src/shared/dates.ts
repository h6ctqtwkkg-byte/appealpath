// Reads a date that is printed in a deadline sentence ("received by April 19, 2027"). It never works one out:
// "within 180 days of receiving this notice" has no printed date, so it returns null.

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export interface PrintedDate {
  year: number;
  month: number;
  day: number;
}

function valid(year: number, month: number, day: number): PrintedDate | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day && year >= 2000 && year < 2100
    ? { year, month, day }
    : null;
}

export function printedDate(text: string | null): PrintedDate | null {
  if (!text) return null;
  const named = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (named) return valid(Number(named[3]), MONTHS.indexOf(named[1]!.toLowerCase()) + 1, Number(named[2]));
  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (numeric) return valid(Number(numeric[3]), Number(numeric[1]), Number(numeric[2]));
  return null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: PrintedDate) => `${d.year}${pad(d.month)}${pad(d.day)}`;
const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** An all-day calendar event on the printed date, with a reminder a week before. */
export function deadlineEvent(date: PrintedDate, summary: string, description: string, alarm: string, now = new Date()): string {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
  const end = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AppealPath//Prototype//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:appealpath-${ymd(date)}-${now.getTime()}@appealpath`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(date)}`,
    `DTEND;VALUE=DATE:${ymd(end)}`,
    `SUMMARY:${escape(summary)}`,
    `DESCRIPTION:${escape(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(alarm)}`,
    "TRIGGER:-P7D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
