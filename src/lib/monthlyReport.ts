import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Expense, Income, Borrowing, PAYMENT_METHODS } from "@/lib/types";
import { Currency } from "@/lib/currencies";

interface ReportInput {
  month: Date;
  username: string;
  currency: Currency;
  expenses: Expense[];
  incomes: Income[];
  borrowings: Borrowing[];
}

const INK = [18, 24, 27] as [number, number, number];
const MUTED = [115, 124, 130] as [number, number, number];
const HAIR = [228, 232, 234] as [number, number, number];

export function generateMonthlyReport({
  month, username, currency, expenses,
}: ReportInput) {
  const start = startOfMonth(month).getTime();
  const end = endOfMonth(month).getTime();

  const monthExpenses = expenses
    .filter(e => e.timestamp >= start && e.timestamp <= end)
    .sort((a, b) => a.timestamp - b.timestamp);

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Use ISO currency code instead of symbol — jsPDF's built-in fonts don't
  // include glyphs for many currency symbols (e.g. ₹) and render them as
  // a small "1" superscript artifact.
  // Plain numeric amount — currency is shown once in the column header so
  // every row stays clean and aligned (no awkward symbol/code prefix).
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 48;

  // ===== HEADER =====
  // Soft tinted band for a more polished look
  doc.setFillColor(248, 250, 251);
  doc.rect(0, 0, pageW, 140, "F");

  // Small label
  doc.setTextColor(...MUTED);
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.text("Monthly Expenses", M, 60);

  // Big month/year title
  doc.setTextColor(...INK);
  doc.setFont("times", "bold");
  doc.setFontSize(34);
  doc.text(format(month, "MMMM yyyy"), M, 100);

  // Accent underline
  doc.setDrawColor(...INK);
  doc.setLineWidth(2);
  doc.line(M, 112, M + 60, 112);

  // ===== TRANSACTIONS TABLE =====
  if (monthExpenses.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.text("No transactions recorded this month.", M, 180);
  } else {
    const amountHeader = `Amount (${currency.code})`;
    autoTable(doc, {
      startY: 160,
      head: [["Date", "Paid For", "Category", "Payment", amountHeader]],
      body: monthExpenses.map(e => {
        const pm = PAYMENT_METHODS.find(p => p.value === e.paymentMethod);
        // Item shows the user's reason / custom name; Category stays as-is
        // (so "Other" remains "Other").
        const item =
          e.customName?.trim() ||
          e.note?.trim() ||
          e.category;
        return [
          format(new Date(e.timestamp), "dd MMM yyyy"),
          item,
          e.category,
          pm?.label ?? e.paymentMethod,
          fmt(e.amount),
        ];
      }),
      foot: [["", "", "", "Total", fmt(totalSpent)]],
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: { top: 9, right: 10, bottom: 9, left: 10 },
        textColor: INK,
        lineColor: HAIR,
        lineWidth: 0.3,
        valign: "middle",
      },
      headStyles: {
        fillColor: INK,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        cellPadding: { top: 11, right: 10, bottom: 11, left: 10 },
        halign: "left",
      },
      footStyles: {
        fillColor: [245, 247, 248],
        textColor: INK,
        fontStyle: "bold",
        fontSize: 11,
        halign: "left",
      },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 88, halign: "left" },
        1: { halign: "left" },
        2: { cellWidth: 80, halign: "left" },
        3: { cellWidth: 80, halign: "left" },
        4: { cellWidth: 90, halign: "right", font: "courier", fontStyle: "bold" },
      },
      margin: { left: M, right: M },
      didDrawPage: () => drawFooter(doc, pageW, pageH, M),
      didParseCell: (data) => {
        // Right-align the "Total" label in the footer to sit next to the amount.
        if (data.section === "foot" && data.column.index === 3) {
          data.cell.styles.halign = "right";
        }
      },
    });
  }

  drawFooter(doc, pageW, pageH, M);
  doc.save(`Expense-Report-${format(month, "yyyy-MM")}.pdf`);
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, M: number) {
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.5);
  doc.line(M, pageH - 36, pageW - M, pageH - 36);
  doc.setTextColor(115, 124, 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated ${format(new Date(), "dd MMM yyyy")}`, M, pageH - 20);
  doc.text(`Page ${pageNum}`, pageW - M, pageH - 20, { align: "right" });
}
