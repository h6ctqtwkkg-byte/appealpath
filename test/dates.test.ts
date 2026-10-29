import { describe, expect, it } from "vitest";
import { deadlineEvent, printedDate } from "../src/shared/dates";

describe("printedDate", () => {
  it("reads a date that is printed", () => {
    expect(printedDate("Your appeal must be received by April 19, 2027.")).toEqual({ year: 2027, month: 4, day: 19 });
    expect(printedDate("Appeal by 04/19/2027 at the latest.")).toEqual({ year: 2027, month: 4, day: 19 });
  });

  it("never works one out from a number of days", () => {
    expect(printedDate("You have 180 days from the date you receive this notice to file an appeal.")).toBeNull();
    expect(printedDate(null)).toBeNull();
  });

  it("rejects dates that don't exist", () => {
    expect(printedDate("by February 30, 2027")).toBeNull();
  });
});

describe("deadlineEvent", () => {
  const ics = deadlineEvent({ year: 2027, month: 12, day: 31 }, "Appeal deadline", 'Says: "by December 31, 2027"; check it', "In 7 days", new Date("2026-10-28T12:00:00Z"));

  it("is an all-day event on the printed date, ending the next day", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20271231");
    expect(ics).toContain("DTEND;VALUE=DATE:20280101");
  });

  it("reminds a week before and escapes text", () => {
    expect(ics).toContain("TRIGGER:-P7D");
    expect(ics).toContain('DESCRIPTION:Says: "by December 31\\, 2027"\\; check it');
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});
