import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { Expense, Income, Borrowing, CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { Currency } from "@/lib/currencies";

interface ReportInput {
  month: Date;
  username: string;
  currency: Currency;
  expenses: Expense[];
  incomes: Income[];
  borrowings: Borrowing[];
}

// Brand palette (matches app)
const INK = [18, 24, 27] as [number, number, number];
const MUTED = [115, 124, 130] as [number, number, number];
const PRIMARY = [16, 185, 129] as [number, number, number]; // emerald
const ACCENT = [245, 158, 11] as [number, number, number];
const DANGER = [239, 68, 68] as [number, number, number];
const SOFT = [244, 246, 247] as [number, number, number];
const HAIR = [228, 232, 234] as [number, number, number];

export function generateMonthlyReport({
  month, username, currency, expenses, incomes, borrowings,
}: ReportInput) {
  const start = startOfMonth(month).getTime();
  const end = endOfMonth(month).getTime();

  const monthExpenses = expenses
    .filter(e => e.timestamp >= start && e.timestamp <= end)
    .sort((a, b) => b.timestamp - a.timestamp);
  const monthIncomes = incomes
    .filter(i => i.receivedOn >= start && i.receivedOn <= end)
    .sort((a, b) => b.receivedOn - a.receivedOn);
  const monthBorrowings = borrowings.filter(b => b.borrowedOn >= start && b.borrowedOn <= end);

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);
  const net = totalIncome - totalSpent;
  const txCount = monthExpenses.length;
  const days = getDaysInMonth(month);
  const avgDaily = totalSpent / days;

  const fmt = (n: number) => `${currency.symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  // Category breakdown
  const catMap: Record<string, { total: number; count: number }> = {};
  monthExpenses.forEach(e => {
    if (!catMap[e.category]) catMap[e.category] = { total: 0, count: 0 };
    catMap[e.category].total += e.amount;
    catMap[e.category].count += 1;
  });
  const categories = Object.entries(catMap)
    .map(([name, v]) => ({ name, ...v, pct: totalSpent > 0 ? (v.total / totalSpent) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  // Payment breakdown
  const payMap: Record<string, number> = {};
  monthExpenses.forEach(e => { payMap[e.paymentMethod] = (payMap[e.paymentMethod] || 0) + e.amount; });

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 40; // margin

  // ===== HEADER BAND =====
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageW, 130, "F");

  // Accent stripe
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 130, pageW, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MONTHLY REPORT", M, 50);

  doc.setFontSize(28);
  doc.text(format(month, "MMMM yyyy"), M, 82);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(180, 190, 195);
  doc.text(`Prepared for ${username || "You"}  ·  Generated ${format(new Date(), "dd MMM yyyy, HH:mm")}`, M, 102);

  // Currency badge (top right)
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(pageW - M - 70, 36, 70, 26, 13, 13, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${currency.symbol} ${currency.code}`, pageW - M - 35, 53, { align: "center" });

  // ===== SUMMARY CARDS =====
  let y = 160;
  const cardW = (pageW - M * 2 - 24) / 3;
  const cardH = 78;

  const drawCard = (x: number, label: string, value: string, color: [number, number, number]) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, cardW, cardH, 10, 10, "FD");
    // accent dot
    doc.setFillColor(...color);
    doc.circle(x + 14, y + 18, 4, "F");
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(label.toUpperCase(), x + 14, y + 36);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(value, x + 14, y + 60);
  };

  drawCard(M, "Total Spent", fmt(totalSpent), DANGER);
  drawCard(M + cardW + 12, "Total Income", fmt(totalIncome), PRIMARY);
  drawCard(M + (cardW + 12) * 2, net >= 0 ? "Net Saved" : "Net Loss", fmt(Math.abs(net)),
    net >= 0 ? PRIMARY : DANGER);

  y += cardH + 14;

  // mini stats row
  doc.setFillColor(...SOFT);
  doc.roundedRect(M, y, pageW - M * 2, 36, 8, 8, "F");
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const slot = (pageW - M * 2) / 4;
  const stat = (i: number, label: string, value: string) => {
    const x = M + slot * i + 14;
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x, y + 14);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(value, x, y + 28);
    doc.setFont("helvetica", "normal");
  };
  stat(0, "Transactions", String(txCount));
  stat(1, "Avg / day", fmt(avgDaily));
  stat(2, "Categories", String(categories.length));
  stat(3, "Days in month", String(days));

  y += 36 + 24;

  // ===== CATEGORY BREAKDOWN =====
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Category Breakdown", M, y);
  y += 14;

  if (categories.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No expenses recorded this month.", M, y + 14);
    y += 30;
  } else {
    const palette: [number, number, number][] = [
      PRIMARY, ACCENT, [99, 102, 241], [236, 72, 153], [14, 165, 233],
      [168, 85, 247], [234, 88, 12], [20, 184, 166],
    ];
    categories.slice(0, 8).forEach((c, i) => {
      const color = palette[i % palette.length];
      const rowY = y + 8;
      // Label
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const emoji = CATEGORIES.find(x => x.label === c.name)?.emoji ?? "";
      doc.text(`${emoji} ${c.name}`, M, rowY);
      // Amount
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.setFontSize(9);
      doc.text(`${c.count} txn${c.count > 1 ? "s" : ""}`, M + 180, rowY);
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.text(fmt(c.total), pageW - M - 70, rowY);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(`${c.pct.toFixed(1)}%`, pageW - M, rowY, { align: "right" });
      // Bar
      const barY = rowY + 6;
      const barW = pageW - M * 2;
      doc.setFillColor(...HAIR);
      doc.roundedRect(M, barY, barW, 6, 3, 3, "F");
      doc.setFillColor(...color);
      doc.roundedRect(M, barY, Math.max((barW * c.pct) / 100, 2), 6, 3, 3, "F");
      y += 26;
    });
    y += 8;
  }

  // ===== TRANSACTIONS TABLE =====
  if (monthExpenses.length > 0) {
    if (y > pageH - 200) { doc.addPage(); y = 50; }
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("All Transactions", M, y);
    y += 8;

    autoTable(doc, {
      startY: y + 4,
      head: [["Date", "Item", "Category", "Payment", "Amount"]],
      body: monthExpenses.map(e => {
        const cat = CATEGORIES.find(c => c.label === e.category);
        const pm = PAYMENT_METHODS.find(p => p.value === e.paymentMethod);
        return [
          format(new Date(e.timestamp), "dd MMM, HH:mm"),
          e.customName || e.category,
          `${cat?.emoji ?? ""} ${e.category}`,
          `${pm?.icon ?? ""} ${pm?.label ?? e.paymentMethod}`,
          fmt(e.amount),
        ];
      }),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 7, textColor: INK, lineColor: HAIR, lineWidth: 0.3 },
      headStyles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, cellPadding: 8 },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 90 },
        4: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: M, right: M },
      didDrawPage: () => drawFooter(doc, pageW, pageH, M),
    });
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  // ===== INCOME TABLE =====
  if (monthIncomes.length > 0) {
    if (y > pageH - 160) { doc.addPage(); y = 50; }
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Income", M, y);
    autoTable(doc, {
      startY: y + 12,
      head: [["Date", "Source", "Note", "Amount"]],
      body: monthIncomes.map(i => [
        format(new Date(i.receivedOn), "dd MMM, HH:mm"),
        i.source,
        i.note || "—",
        fmt(i.amount),
      ]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 7, textColor: INK, lineColor: HAIR, lineWidth: 0.3 },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, cellPadding: 8 },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: { 0: { cellWidth: 90 }, 3: { halign: "right", fontStyle: "bold" } },
      margin: { left: M, right: M },
      didDrawPage: () => drawFooter(doc, pageW, pageH, M),
    });
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  // ===== DUES =====
  if (monthBorrowings.length > 0) {
    if (y > pageH - 140) { doc.addPage(); y = 50; }
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Dues This Month", M, y);
    autoTable(doc, {
      startY: y + 12,
      head: [["Date", "Person", "Type", "Status", "Amount"]],
      body: monthBorrowings.map(b => [
        format(new Date(b.borrowedOn), "dd MMM"),
        b.personName,
        b.type === "lent" ? "They owe me" : "I owe them",
        b.settled ? "Settled" : "Pending",
        fmt(b.amount),
      ]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 7, textColor: INK, lineColor: HAIR, lineWidth: 0.3 },
      headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, cellPadding: 8 },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
      margin: { left: M, right: M },
      didDrawPage: () => drawFooter(doc, pageW, pageH, M),
    });
  }

  // Footer on first page (in case no tables triggered didDrawPage)
  drawFooter(doc, pageW, pageH, M);

  doc.save(`Expense-Report-${format(month, "yyyy-MM")}.pdf`);
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, M: number) {
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.5);
  doc.line(M, pageH - 36, pageW - M, pageH - 36);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Generated by your expense tracker", M, pageH - 20);
  doc.text(`Page ${pageNum}`, pageW - M, pageH - 20, { align: "right" });
}
