// Phone numbers worth a warning before anyone dials them. A number can be printed on the page and still be the wrong
// one to call: a letter can carry a planted instruction, and the second reader only proves a number is printed.

/** A pay-per-call number: the 900 area code, or a 976 exchange. Digits after the first 10 (an extension) don't hide it. */
export function payPerCall(number: string | null): boolean {
  const d = (number ?? "").replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
  return d.length === 10 && (d.startsWith("900") || d.slice(3, 6) === "976");
}
