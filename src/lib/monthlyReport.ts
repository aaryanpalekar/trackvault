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
  const fmt = (n: number) =>
    `${currency.code} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 48;

  // ===== HEADER =====
  // Small label
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Monthly Report", M, 64);

  // Big month/year title
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(format(month, "MMMM yyyy"), M, 100);

  // Divider
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.6);
  doc.line(M, 124, pageW - M, 124);

  // ===== TRANSACTIONS TABLE =====
  if (monthExpenses.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("No transactions recorded this month.", M, 160);
  } else {
    autoTable(doc, {
      startY: 144,
      head: [["Date", "Item", "Category", "Payment", "Amount"]],
      body: monthExpenses.map(e => {
        const pm = PAYMENT_METHODS.find(p => p.value === e.paymentMethod);
        // For "Other" category, show the custom name/reason instead of "Other"
        const isOther = e.category === "Other";
        const itemName = e.customName || e.note || (isOther ? "—" : e.category);
        const categoryLabel = isOther ? (e.customName || e.note || "—") : e.category;
        return [
          format(new Date(e.timestamp), "dd MMM yyyy"),
          itemName,
          categoryLabel,
          pm?.label ?? e.paymentMethod,
          fmt(e.amount),
        ];
      }),
      foot: [["", "", "", "Total", fmt(totalSpent)]],
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 8,
        textColor: INK,
        lineColor: HAIR,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: INK,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        cellPadding: 9,
      },
      footStyles: {
        fillColor: [245, 247, 248],
        textColor: INK,
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 90 },
        4: { halign: "right", font: "courier", fontStyle: "bold" },
      },
      margin: { left: M, right: M },
      didDrawPage: () => drawFooter(doc, pageW, pageH, M),
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
