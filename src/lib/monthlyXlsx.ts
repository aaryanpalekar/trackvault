import ExcelJS from "exceljs";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Expense, Income, PAYMENT_METHODS } from "@/lib/types";
import { Currency } from "@/lib/currencies";

interface XlsxInput {
  month: Date;
  currency: Currency;
  username?: string;
  expenses: Expense[];
  incomes: Income[];
}

// Brand palette (ARGB, no `#`)
const BRAND_GREEN = "FF16A34A";
const BRAND_GREEN_DARK = "FF15803D";
const MINT = "FFEFFBF3";
const CREAM = "FFFDFBF4";
const RED_SOFT = "FFDC2626";
const GREEN_SOFT = "FF15803D";
const INK = "FF111827";
const MUTED = "FF6B7280";
const HAIR = "FFE5E7EB";

const CATEGORY_COLORS: Record<string, string> = {
  "Tea/Coffee": "FFB45309",
  "Snacks":     "FFD97706",
  "Auto/Cab":   "FF2563EB",
  "Food":       "FFDC2626",
  "Shopping":   "FF7C3AED",
  "Other":      "FF6B7280",
};

const INCOME_COLOR = "FF15803D";

function colorFor(cat: string, type: "spent" | "received") {
  if (type === "received") return INCOME_COLOR;
  return CATEGORY_COLORS[cat] ?? "FF334155";
}

export async function generateMonthlyXlsx({
  month, currency, username, expenses, incomes,
}: XlsxInput) {
  const start = startOfMonth(month).getTime();
  const end = endOfMonth(month).getTime();

  const monthExpenses = expenses
    .filter(e => e.timestamp >= start && e.timestamp <= end);
  const monthIncomes = incomes
    .filter(i => i.receivedOn >= start && i.receivedOn <= end);

  type Row = {
    date: Date;
    category: string;
    description: string;
    amount: number;
    type: "spent" | "received";
    wallet: string;
  };

  const rows: Row[] = [
    ...monthExpenses.map<Row>(e => {
      const pm = PAYMENT_METHODS.find(p => p.value === e.paymentMethod);
      return {
        date: new Date(e.timestamp),
        category: e.category,
        description: e.customName?.trim() || e.note?.trim() || e.category,
        amount: e.amount,
        type: "spent",
        wallet: pm?.label ?? e.paymentMethod,
      };
    }),
    ...monthIncomes.map<Row>(i => ({
      date: new Date(i.receivedOn),
      category: i.source,
      description: i.note?.trim() || i.source,
      amount: i.amount,
      type: "received",
      wallet: "—",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()); // most recent first

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalReceived = monthIncomes.reduce((s, i) => s + i.amount, 0);
  const net = totalReceived - totalSpent;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const avgPerDay = totalSpent / daysInMonth;

  // Top 3 categories
  const catTotals = new Map<string, number>();
  monthExpenses.forEach(e => catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount));
  const topCats = [...catTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const wb = new ExcelJS.Workbook();
  wb.creator = "TrackVault";
  wb.created = new Date();

  // ================= SUMMARY SHEET =================
  const s = wb.addWorksheet("Summary", {
    views: [{ showGridLines: false }],
  });
  s.columns = [
    { width: 4 }, { width: 26 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 4 },
  ];

  // Title band
  s.mergeCells("B2:E2");
  const title = s.getCell("B2");
  title.value = "TrackVault";
  title.font = { name: "Calibri", size: 11, bold: true, color: { argb: BRAND_GREEN_DARK } };

  s.mergeCells("B3:E3");
  const period = s.getCell("B3");
  period.value = format(month, "MMMM yyyy");
  period.font = { name: "Calibri", size: 28, bold: true, color: { argb: INK } };

  s.mergeCells("B4:E4");
  const subtitle = s.getCell("B4");
  subtitle.value = `Monthly report${username ? ` · ${username}` : ""} · Generated ${format(new Date(), "dd MMM yyyy, HH:mm")}`;
  subtitle.font = { name: "Calibri", size: 10, italic: true, color: { argb: MUTED } };

  s.getRow(2).height = 18;
  s.getRow(3).height = 38;
  s.getRow(4).height = 16;

  // KPI cards row (B6:E7)
  const kpis: { label: string; value: string; color: string }[] = [
    { label: "Total Spent",     value: `${currency.symbol}${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: RED_SOFT },
    { label: "Total Received",  value: `${currency.symbol}${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: GREEN_SOFT },
    { label: "Net Balance",     value: `${net >= 0 ? "+" : "-"}${currency.symbol}${Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: net >= 0 ? GREEN_SOFT : RED_SOFT },
    { label: "Transactions",    value: `${monthExpenses.length + monthIncomes.length}`, color: INK },
  ];

  kpis.forEach((k, idx) => {
    const col = 2 + idx; // B..E
    const labelCell = s.getCell(6, col);
    labelCell.value = k.label.toUpperCase();
    labelCell.font = { name: "Calibri", size: 9, bold: true, color: { argb: MUTED } };
    labelCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MINT } };
    labelCell.border = topLeftBorders();

    const valCell = s.getCell(7, col);
    valCell.value = k.value;
    valCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: k.color } };
    valCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MINT } };
    valCell.border = bottomBorders();
  });
  s.getRow(6).height = 22;
  s.getRow(7).height = 32;

  // Avg / day + txns split
  s.getCell("B9").value = "AVG SPEND / DAY";
  s.getCell("B9").font = { name: "Calibri", size: 9, bold: true, color: { argb: MUTED } };
  s.getCell("B10").value = `${currency.symbol}${avgPerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  s.getCell("B10").font = { name: "Calibri", size: 14, bold: true, color: { argb: INK } };

  s.getCell("D9").value = "PERIOD";
  s.getCell("D9").font = { name: "Calibri", size: 9, bold: true, color: { argb: MUTED } };
  s.getCell("D10").value = `${format(startOfMonth(month), "dd MMM")} – ${format(endOfMonth(month), "dd MMM yyyy")}`;
  s.getCell("D10").font = { name: "Calibri", size: 12, bold: true, color: { argb: INK } };

  // Top categories block
  s.mergeCells("B12:E12");
  s.getCell("B12").value = "Top spending categories";
  s.getCell("B12").font = { name: "Calibri", size: 12, bold: true, color: { argb: INK } };

  const headerRow = s.getRow(13);
  headerRow.values = [null, "Category", "Amount", "Share", ""];
  ["B13", "C13", "D13"].forEach(addr => {
    const c = s.getCell(addr);
    c.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
    c.alignment = { vertical: "middle", horizontal: addr === "B13" ? "left" : "right", indent: 1 };
  });
  headerRow.height = 20;

  topCats.forEach(([cat, amt], i) => {
    const r = 14 + i;
    const share = totalSpent > 0 ? amt / totalSpent : 0;
    const catCell = s.getCell(`B${r}`);
    catCell.value = cat;
    catCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: colorFor(cat, "spent") } };
    catCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const amtCell = s.getCell(`C${r}`);
    amtCell.value = amt;
    amtCell.numFmt = `"${currency.symbol}"#,##0.00`;
    amtCell.font = { name: "Calibri", size: 11, color: { argb: INK } };
    amtCell.alignment = { horizontal: "right", vertical: "middle", indent: 1 };

    const pctCell = s.getCell(`D${r}`);
    pctCell.value = share;
    pctCell.numFmt = "0.0%";
    pctCell.font = { name: "Calibri", size: 11, color: { argb: MUTED } };
    pctCell.alignment = { horizontal: "right", vertical: "middle", indent: 1 };

    const fill = i % 2 === 0 ? CREAM : "FFFFFFFF";
    ["B", "C", "D"].forEach(col => {
      s.getCell(`${col}${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    });
    s.getRow(r).height = 20;
  });

  if (topCats.length === 0) {
    s.getCell("B14").value = "No spending recorded this month.";
    s.getCell("B14").font = { name: "Calibri", size: 11, italic: true, color: { argb: MUTED } };
  }

  // Footer note
  const footerRow = 14 + Math.max(topCats.length, 1) + 2;
  s.mergeCells(footerRow, 2, footerRow, 5);
  const foot = s.getCell(footerRow, 2);
  foot.value = "See the 'Transactions' sheet for the full detail.";
  foot.font = { name: "Calibri", size: 10, italic: true, color: { argb: MUTED } };

  // ================= TRANSACTIONS SHEET =================
  const t = wb.addWorksheet("Transactions", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 1 }],
  });

  const headers = ["Date", "Category", "Description", "Amount", "Type", "Currency", "Wallet / Account"];
  t.columns = [
    { header: headers[0], key: "date",        width: 14 },
    { header: headers[1], key: "category",    width: 16 },
    { header: headers[2], key: "description", width: 38 },
    { header: headers[3], key: "amount",      width: 16 },
    { header: headers[4], key: "type",        width: 12 },
    { header: headers[5], key: "currency",    width: 10 },
    { header: headers[6], key: "wallet",      width: 18 },
  ];

  const head = t.getRow(1);
  head.height = 24;
  head.eachCell(cell => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    cell.border = {
      bottom: { style: "thin", color: { argb: BRAND_GREEN_DARK } },
    };
  });
  t.getCell(1, 4).alignment = { vertical: "middle", horizontal: "right", indent: 1 };

  rows.forEach((row, idx) => {
    const r = t.addRow({
      date: row.date,
      category: row.category,
      description: row.description,
      amount: row.type === "received" ? row.amount : -row.amount,
      type: row.type === "received" ? "Received" : "Spent",
      currency: currency.code,
      wallet: row.wallet,
    });

    const stripe = idx % 2 === 0 ? "FFFFFFFF" : MINT;
    r.eachCell({ includeEmpty: true }, cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: stripe } };
      cell.font = { name: "Calibri", size: 11, color: { argb: INK } };
      cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    });

    // Date — force display format so it never appears as a serial number
    const dateCell = r.getCell(1);
    dateCell.numFmt = "dd mmm yyyy";
    dateCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    // Category — colored tag text
    const catCell = r.getCell(2);
    catCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: colorFor(row.category, row.type) } };

    // Amount — right-aligned, currency format, colored
    const amtCell = r.getCell(4);
    amtCell.numFmt = `"${currency.symbol}"#,##0.00;[Red]-"${currency.symbol}"#,##0.00`;
    amtCell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    amtCell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: row.type === "received" ? GREEN_SOFT : RED_SOFT },
    };

    // Type badge
    const typeCell = r.getCell(5);
    typeCell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: row.type === "received" ? GREEN_SOFT : RED_SOFT },
    };

    r.height = 20;
  });

  // Totals row
  if (rows.length > 0) {
    const totalRowIdx = t.rowCount + 1;
    const tr = t.getRow(totalRowIdx);
    tr.getCell(1).value = "Totals";
    tr.getCell(3).value = `${rows.length} transactions`;
    tr.getCell(4).value = totalReceived - totalSpent;

    tr.eachCell({ includeEmpty: false }, cell => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: INK } };
      cell.border = { top: { style: "medium", color: { argb: BRAND_GREEN_DARK } } };
      cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    });

    const totalAmt = tr.getCell(4);
    totalAmt.numFmt = `"${currency.symbol}"#,##0.00;[Red]-"${currency.symbol}"#,##0.00`;
    totalAmt.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    totalAmt.font = {
      name: "Calibri",
      size: 12,
      bold: true,
      color: { argb: (totalReceived - totalSpent) >= 0 ? GREEN_SOFT : RED_SOFT },
    };

    tr.getCell(5).value = "Net";
    tr.getCell(6).value = currency.code;
    tr.height = 24;
  } else {
    const tr = t.addRow(["No transactions this month."]);
    tr.getCell(1).font = { name: "Calibri", size: 11, italic: true, color: { argb: MUTED } };
  }

  // AutoFilter over header
  t.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: 1, column: 7 },
  };

  // Save
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TrackVault-${format(month, "yyyy-MM")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function topLeftBorders(): Partial<ExcelJS.Borders> {
  return {
    top: { style: "thin", color: { argb: HAIR } },
    left: { style: "thin", color: { argb: HAIR } },
    right: { style: "thin", color: { argb: HAIR } },
  };
}
function bottomBorders(): Partial<ExcelJS.Borders> {
  return {
    bottom: { style: "thin", color: { argb: HAIR } },
    left: { style: "thin", color: { argb: HAIR } },
    right: { style: "thin", color: { argb: HAIR } },
  };
}
