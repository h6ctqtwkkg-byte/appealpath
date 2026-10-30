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

  it("doesn't take the start of a counted period for the deadline", () => {
    expect(printedDate("You may appeal within 180 days of November 1, 2026.")).toBeNull();
    expect(printedDate("You have 60 days from the date of this notice (10/21/2026) to appeal.")).toBeNull();
    expect(printedDate("Appeals must be filed within sixty days after October 21, 2026.")).toBeNull();
    expect(printedDate("Send your appeal within one month of March 3, 2027.")).toBeNull();
  });

  it("gives no date when the sentence prints more than one", () => {
    expect(printedDate("This notice is dated October 21, 2026; your appeal must be received by April 19, 2027.")).toBeNull();
  });

  it("only reads a date that the words before it call the deadline", () => {
    expect(printedDate("The appeal period begins November 1, 2026.")).toBeNull();
    expect(printedDate("Deadline: April 19, 2027")).toEqual({ year: 2027, month: 4, day: 19 });
    expect(printedDate("File your appeal no later than April 19, 2027.")).toEqual({ year: 2027, month: 4, day: 19 });
    expect(printedDate("Send it on or before 4/19/2027.")).toEqual({ year: 2027, month: 4, day: 19 });
  });

  it("still reads the held-out letter's postmark date", () => {
    expect(printedDate("Your appeal must be postmarked by March 31, 2027.")).toEqual({ year: 2027, month: 3, day: 31 });
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
