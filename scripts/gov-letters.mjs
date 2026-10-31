// Builds three fictional test letters, G01–G03, on the U.S. government's own layout: the "Model Notice of Final
// Internal Adverse Benefit Determination" (CMS, revised 11/21/2025; https://www.cms.gov/cciio/resources/files/downloads/final_iabd_model_notice_1.pdf).
// The notice's wording is kept; a health plan fills in the brackets, so the fills are fictional. Unlike L01–L18, the
// layout and most of the wording come from someone other than AppealPath's author. Each letter is three pages, the
// way the model notice is, and each page is rendered as a clean image and as a simulated phone photo:
//   node scripts/gov-letters.mjs   → test-letters/gov-letters.html, test-letters/gov-renders/G01-p1.jpg …,
//                                    test-letters/gov-phone-like/G01-p1.jpg …
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const LETTERS = [
  {
    id: "G01",
    color: "#1f4e79",
    plan: "Example Valley Health Plan",
    sub: "Group coverage · Example Manufacturing Co.",
    tel: "(479) 555-0230",
    fax: "(479) 555-0231",
    address: "PO Box 0230, Example City, AR 00000",
    web: "www.examplevalleyhealth.example",
    date: "October 20, 2026",
    patient: "Casey Example",
    idNumber: "EVH-4410-2271",
    patientAddress: "12 Example Lane, Benton County, AR 72712",
    claim: "26-7731-0042",
    dos: "08/14/2026",
    provider: "Example Imaging Center",
    reason: "Not medically necessary (Clinical Policy IMG-114)",
    amounts: ["$1,840.00", "$0.00", "$0.00", "$0.00", "$0.00", "$0.00", "$0.00", "$1,840.00", "$0.00"],
    ytd: ["$450.00", "$610.00"],
    service: "MRI of the right knee without contrast",
    codes: "MN-02: Not medically necessary under the plan's clinical policy.",
    background:
      "On September 8, 2026, you filed an internal appeal of our August 21, 2026 decision to deny coverage for an MRI of the right knee. This was a standard (not urgent) appeal.",
    determination:
      "We have upheld our denial. To make this decision, we reviewed your appeal letter dated September 6, 2026, office notes from Dr. Jamie Example dated July 30 and August 9, 2026, and Clinical Policy IMG-114, Knee Imaging.",
    findings:
      "The MRI is not medically necessary under Clinical Policy IMG-114, because the records do not show at least six weeks of physical therapy or other conservative treatment before imaging. A board-certified orthopedic surgeon reviewed the records.",
    languageLine: "1-800-555-0233",
    externalContact: "the Example Valley Health Plan External Review Unit at (479) 555-0236",
    insured: true,
    fileTo: "Example Valley Health Plan, External Review Unit, PO Box 0236, Example City, AR 00000. You must file your request for external review within four months after you receive this notice.",
    urgent: "calling (479) 555-0237 or faxing (479) 555-0231",
    group: true,
    stateDoi: "the Example State Department of Insurance, Consumer Services, at (501) 555-0290",
    cap: "the Example State Consumer Health Assistance Program, (501) 555-0295",
  },
  {
    id: "G02",
    color: "#5b3a7a",
    plan: "Example Prairie Insurance Company",
    sub: "Individual & Family Plans · Marketplace coverage",
    tel: "(870) 555-0240",
    fax: "(870) 555-0241",
    address: "PO Box 0240, Example City, AR 00000",
    web: "www.exampleprairie.example",
    date: "October 27, 2026",
    patient: "Robin Example",
    idNumber: "EPI-2207-8135",
    patientAddress: "48 Example Road, Craighead County, AR 72401",
    claim: "Prior authorization PA-26-00915",
    dos: "Requested for November 2026",
    provider: "Example Neurology Clinic",
    reason: "Experimental or investigational (Medical Policy NEU-031)",
    amounts: ["—", "—", "—", "—", "—", "—", "—", "—", "—"],
    ytd: ["$1,200.00", "$1,385.00"],
    service: "Transcranial magnetic stimulation (TMS), 36 sessions, for chronic migraine",
    codes: "EI-07: Experimental or investigational for this condition.",
    background:
      "On October 1, 2026, you filed an internal appeal of our September 22, 2026 decision to deny prior authorization for transcranial magnetic stimulation. This was a standard (not urgent) appeal, made before the service.",
    determination:
      "We have upheld our denial. To make this decision, we reviewed your appeal request, a letter of support from Dr. Morgan Example dated September 29, 2026, and Medical Policy NEU-031, Neuromodulation.",
    findings:
      "Transcranial magnetic stimulation is experimental or investigational for chronic migraine under Medical Policy NEU-031, because published evidence has not shown that it improves health outcomes for this condition.",
    languageLine: "1-888-555-0243",
    externalContact: "our Appeals Department at (870) 555-0246",
    insured: true,
    fileTo: "Example Prairie Insurance Company, Appeals Department, PO Box 0246, Example City, AR 00000.",
    urgent: "calling (870) 555-0247",
    group: false,
    stateDoi: "the Example State Department of Insurance, Consumer Services, at (501) 555-0290",
    cap: "the Example State Consumer Health Assistance Program, (501) 555-0295",
  },
  {
    id: "G03",
    color: "#2f6b4f",
    plan: "Example Lakeshore Health Insurance",
    sub: "Group coverage · Example County Schools",
    tel: "(501) 555-0250",
    fax: "(501) 555-0251",
    address: "PO Box 0250, Example City, AR 00000",
    web: "www.examplelakeshore.example",
    date: "October 23, 2026",
    patient: "Jordan Example",
    idNumber: "ELH-5530-1964",
    patientAddress: "7 Example Court, Pulaski County, AR 72201",
    claim: "26-4420-1187",
    dos: "08/30/2026",
    provider: "Example Hearing Center",
    reason: "Not a covered benefit (Certificate of Coverage, Section 7: Exclusions)",
    amounts: ["$4,200.00", "$0.00", "$0.00", "$0.00", "$0.00", "$0.00", "$0.00", "$4,200.00", "$0.00"],
    ytd: ["$900.00", "$1,140.00"],
    service: "Hearing aids, both ears (pair)",
    codes: "EX-11: Excluded service.",
    background:
      "On September 22, 2026, you filed an internal appeal of our September 9, 2026 decision to deny coverage for a pair of hearing aids. This was a standard (not urgent) appeal.",
    determination:
      "We have upheld our denial. To make this decision, we reviewed your appeal letter, an audiology report from Example Hearing Center dated August 30, 2026, and your Certificate of Coverage.",
    findings:
      "Hearing aids are excluded from coverage under Section 7 of your Certificate of Coverage. The plan does not cover hearing aids for adults, whatever the medical need.",
    languageLine: "1-866-555-0253",
    externalContact: "our Member Appeals Unit at (501) 555-0256",
    insured: true,
    fileTo: "Example Lakeshore Health Insurance, Member Appeals Unit, PO Box 0256, Example City, AR 00000. Requests for external review must be filed within 4 months of the date of this notice.",
    urgent: "calling (501) 555-0257",
    group: true,
    stateDoi: "the Example State Department of Insurance, Consumer Services, at (501) 555-0290",
    cap: "the Example State Consumer Health Assistance Program, (501) 555-0295",
  },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const FOOT = (l, n) =>
  `<div class="foot">FICTIONAL SAMPLE for testing AppealPath, on the layout of the U.S. government's Model Notice of Final Internal Adverse Benefit Determination (revised 11/21/2025). ${esc(l.plan)} is not a real company; every name, number and code is made up except the Employee Benefits Security Administration line the model notice prints. Page ${n} of 3.</div>`;
const HEAD = (l) => `<div class="head" style="background:${l.color}"><div class="nm">${esc(l.plan)}</div><div class="sb">${esc(l.sub)}</div></div>`;

function page1(l) {
  const [charged, allowed, other, deductible, copay, coins, otherAmts, notCovered, paid] = l.amounts;
  return `<section class="page" data-id="${l.id}-p1"><div class="wm">SAMPLE · NOT A REAL LETTER</div><div class="tag">${l.id} · 1</div><div class="content">
  ${HEAD(l)}
  <div class="title">Notice of Final Internal Adverse Benefit Determination</div>
  <table class="grid"><tr><td><span class="lbl">Date of Notice</span>${l.date}</td><td><span class="lbl">Name of Plan</span>${esc(l.plan)}</td><td><span class="lbl">Telephone/Fax</span>${l.tel} / Fax ${l.fax}</td></tr>
  <tr><td colspan="2"><span class="lbl">Address</span>${l.address}</td><td><span class="lbl">Website/Email Address</span>${l.web}</td></tr></table>
  <p class="small"><strong>This document contains important information that you should retain for your records.</strong></p>
  <p class="small">This document serves as notice of a final internal adverse benefit determination. We have declined to provide benefits, in whole or in part, for the requested treatment or service described below. If you think this determination was made in error, you may have the right to appeal (see the back of this page for information about your appeal rights).</p>
  <div class="bt">Internal Appeal Case Details:</div>
  <table class="grid"><tr><td><span class="lbl">Patient Name</span>${l.patient}</td><td><span class="lbl">ID Number</span>${l.idNumber}</td></tr>
  <tr><td colspan="2"><span class="lbl">Address</span>${l.patientAddress}</td></tr>
  <tr><td><span class="lbl">Claim #</span>${l.claim}</td><td><span class="lbl">Date of Service</span>${l.dos}</td></tr>
  <tr><td colspan="2"><span class="lbl">Provider</span>${l.provider}</td></tr>
  <tr><td colspan="2"><span class="lbl">Reason for Upholding Denial (in whole or in part)</span>${esc(l.reason)}</td></tr></table>
  <table class="amt"><tr><th>Amt. Charged</th><th>Allowed Amt.</th><th>Other Insurance</th><th>Deductible</th><th>Co-pay</th><th>Coinsurance</th><th>Other Amts.</th><th>Not Covered</th><th>Amt. Paid</th></tr>
  <tr><td>${charged}</td><td>${allowed}</td><td>${other}</td><td>${deductible}</td><td>${copay}</td><td>${coins}</td><td>${otherAmts}</td><td>${notCovered}</td><td>${paid}</td></tr></table>
  <table class="grid"><tr><td><span class="lbl">YTD Credit toward Deductible</span>${l.ytd[0]}</td><td><span class="lbl">YTD Credit toward Out-of-Pocket Maximum</span>${l.ytd[1]}</td></tr>
  <tr><td><span class="lbl">Description of Service</span>${esc(l.service)}</td><td><span class="lbl">Denial Codes</span>${esc(l.codes)}</td></tr></table>
  <p class="small"><strong>Background Information:</strong> ${esc(l.background)}</p>
  <p class="small"><strong>Final Internal Adverse Benefit Determination:</strong> ${esc(l.determination)}</p>
  <p class="small"><strong>Findings:</strong> ${esc(l.findings)}</p>
  </div>${FOOT(l, 1)}</section>`;
}

function page2(l) {
  const n = l.languageLine;
  const lines = [
    `Spanish (Español): Para obtener asistencia en Español, llame al ${n}.`,
    `Tagalog (Tagalog): Kung kailangan ninyo ang tulong sa Tagalog tumawag sa ${n}.`,
    `Chinese (中文): 如果需要中文的帮助, 请拨打这个号码 ${n}.`,
    `Navajo (Dine): Dinek'ehgo shika at'ohwol ninisingo, kwiijigo holne' ${n}.`,
    `Pennsylvania Dutch (Deitsch): Fer Hilf griege in Deitsch, ruf ${n} uff.`,
    `Samoan (Gagana Samoa): Mo se fesoasoani i le Gagana Samoa, vala'au mai i le numera telefoni ${n}.`,
    `Carolinian (Kapasal Falawasch): ngere aukke ghut alillis reel kapasal Falawasch au fafaingi tilifon ye ${n}.`,
    `Chamorro (Chamoru): Para un ma ayuda gi finu Chamoru, å'gang ${n}.`,
  ];
  return `<section class="page" data-id="${l.id}-p2"><div class="wm">SAMPLE · NOT A REAL LETTER</div><div class="tag">${l.id} · 2</div><div class="content">
  ${HEAD(l)}
  <h3>Language assistance</h3>
  ${lines.map((x) => `<p class="small">${esc(x)}</p>`).join("\n  ")}
  <h3>Questions about this notice</h3>
  <p class="small">Member Services: ${l.tel}, Monday through Friday, 8 a.m. to 6 p.m. Fax: ${l.fax}. TTY: 711.</p>
  <p class="small">Claim #: ${l.claim} · ID Number: ${l.idNumber} · Date of Notice: ${l.date}</p>
  </div>${FOOT(l, 2)}</section>`;
}

function page3(l) {
  const other = l.group ? `the Employee Benefits Security Administration at 1-866-444-EBSA (3272) and ${l.stateDoi}` : l.stateDoi;
  return `<section class="page" data-id="${l.id}-p3"><div class="wm">SAMPLE · NOT A REAL LETTER</div><div class="tag">${l.id} · 3</div><div class="content">
  ${HEAD(l)}
  <div class="title">Important Information about Your Rights to External Review</div>
  <div class="cols">
  <p><strong>What if I need help understanding this denial?</strong> Contact us at ${l.tel} if you need assistance understanding this notice or our decision to deny you a service or coverage.</p>
  <p><strong>What if I don't agree with this decision?</strong> For certain types of claims, you are entitled to request an independent, external review of our decision. Contact ${l.externalContact} with any questions on your rights to external review.${l.insured ? " If your claim is not eligible for independent external review but you still disagree with the denial, your state insurance regulator may be able to help to resolve the dispute." : ""} See the "Other resources" section of this form for help filing a request for external review.</p>
  <p><strong>How do I file a request for external review?</strong> Complete the bottom of this page, make a copy, and send this document to ${esc(l.fileTo)} See also the "Other resources to help you" section of this form for assistance filing a request for external review.</p>
  <p><strong>What if my situation is urgent?</strong> If your situation meets the definition of urgent under the law, the external review of your claim will be conducted as expeditiously as possible. Generally, an urgent situation is one in which your health may be in serious jeopardy or, in the opinion of your physician, you may experience pain that cannot be adequately controlled while you wait for a decision on the external review of your claim. If you believe your situation is urgent, you may request an expedited external review by ${l.urgent}.</p>
  <p><strong>Who may file a request for external review?</strong> You or someone you name to act for you (your authorized representative) may file a request for external review. To name a representative, send us the Authorized Representative form from ${l.web}.</p>
  <p><strong>Can I provide additional information about my claim?</strong> Yes, once your external review is initiated, you will receive instructions on how to supply additional information.</p>
  <p><strong>Can I request copies of information relevant to my claim?</strong> Yes, you may request copies (free of charge) by contacting us at ${l.tel}.</p>
  <p><strong>What happens next?</strong> If you request an external review, an independent organization will review our decision and provide you with a written determination. If this organization decides to overturn our decision, we will provide coverage or payment for your health care item or service.</p>
  <p><strong>Other resources to help you:</strong> For questions about your rights, this notice, or for assistance, you can contact: ${other}. Additionally, a consumer assistance program can help you file your appeal. Contact: ${l.cap}.</p>
  </div>
  <div class="formbox"><p><strong>NAME OF PERSON FILING REQUEST FOR EXTERNAL REVIEW:</strong> ______________________</p>
  <p>Circle one: ☐ Covered person ☐ Patient ☐ Authorized Representative</p>
  <p>Contact information of person filing request for external review (if different from patient) · Address: __________ Daytime phone: __________ Email: __________</p>
  <p>Are you requesting an urgent review? ☐ Yes ☐ No</p>
  <p>Briefly describe why you disagree with this decision: ____________________________________________</p>
  <p>Send this form and your denial notice to: ${esc(l.fileTo.split(". ")[0])}.</p>
  <p>Be certain to keep copies of this form, your denial notice, and all documents and correspondence related to this claim.</p></div>
  </div>${FOOT(l, 3)}</section>`;
}

const css = `
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #d9d9d9; color: #111; font: 10.5pt/1.4 Arial, Helvetica, sans-serif; }
  .page { position: relative; width: 8.5in; height: 11in; margin: 0.3in auto; padding: 0.55in 0.7in 0.9in; background: #fff; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,.25); }
  .wm { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-32deg); font: 700 50px/1 Arial, Helvetica, sans-serif; color: rgba(190, 0, 0, .09); white-space: nowrap; z-index: 0; }
  .content { position: relative; z-index: 1; }
  .tag { position: absolute; top: 0.25in; right: 0.7in; z-index: 1; font: 700 8pt Arial; color: #999; letter-spacing: 1px; }
  .foot { position: absolute; left: 0.7in; right: 0.7in; bottom: 0.35in; z-index: 1; border-top: 1px solid #bbb; padding-top: 5px; font: 7.5pt/1.35 Arial; color: #555; }
  .head { color: #fff; padding: 9px 13px; margin-bottom: 10px; } .head .nm { font: 700 15pt Arial; } .head .sb { font: 8.5pt Arial; opacity: .92; }
  .title { font: 700 12.5pt Arial; text-align: center; margin: 4px 0 10px; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 8px; }
  table.grid td { border: 1px solid #777; padding: 4px 7px; vertical-align: top; }
  .lbl { display: block; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .4px; color: #555; }
  table.amt { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px; text-align: center; }
  table.amt th, table.amt td { border: 1px solid #777; padding: 3px 2px; } table.amt th { background: #eee; }
  .bt { font: 700 10pt Arial; margin: 6px 0 4px; }
  p { margin: 0 0 7px; } .small { font-size: 9.5pt; } h3 { font: 700 11pt Arial; margin: 10px 0 6px; }
  .cols { column-count: 2; column-gap: 0.3in; font-size: 8.8pt; line-height: 1.38; }
  .cols p { break-inside: avoid; }
  .formbox { border: 1.5px solid #333; padding: 7px 10px; margin-top: 8px; font-size: 8.5pt; } .formbox p { margin: 0 0 4px; }`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AppealPath government-layout test letters G01–G03</title><style>${css}</style></head><body>
${LETTERS.map((l) => page1(l) + page2(l) + page3(l)).join("\n")}
</body></html>`;
await writeFile("test-letters/gov-letters.html", html);

// Render each page: a clean 1224×1584 image (render-letters.sh), and a phone-like one (phone-like.sh's settings).
const browser = await chromium.launch({ channel: "chrome" });
const clean = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1.5 });
const phone = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1.25 });
await mkdir("test-letters/gov-renders", { recursive: true });
await mkdir("test-letters/gov-phone-like", { recursive: true });
const ids = LETTERS.flatMap((l) => [1, 2, 3].map((n) => `${l.id}-p${n}`));
for (const [i, id] of ids.entries()) {
  const only = `section.page{display:none}section.page[data-id="${id}"]{display:block;margin:0;box-shadow:none}`;
  await clean.setContent(html.replace("</style>", `body{background:#fff}${only}</style>`));
  await clean.screenshot({ path: `test-letters/gov-renders/${id}.jpg`, type: "jpeg", quality: 85 });
  const rx = 5 + (i % 4);
  const rz = (i % 2 ? 1 : -1) * (1.5 + (i % 3));
  const blur = 0.5 + (i % 4) / 10;
  const stage = `body{margin:0;background:#4a463f;width:900px;height:1200px;overflow:hidden;display:flex;align-items:center;justify-content:center}${only}.stage{transform:perspective(1400px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(.92);filter:blur(${blur}px) contrast(.9) brightness(.95) sepia(.08)}.shade{position:fixed;inset:0;z-index:5;background:linear-gradient(115deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.22) 78%)}`;
  await phone.setContent(html.replace("</style>", `${stage}</style>`).replace("<body>", '<body><div class="shade"></div><div class="stage">').replace("</body>", "</div></body>"));
  await phone.screenshot({ path: `test-letters/gov-phone-like/${id}.jpg`, type: "jpeg", quality: 55 });
}
await browser.close();
console.log(`test-letters/gov-letters.html · ${ids.length} pages, clean and phone-like`);
