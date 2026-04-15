import { format } from "date-fns";
import { jsPDF } from "jspdf";
import type { IOrder } from "../types";

const formatMoney = (value: number) => `Rs. ${Number(value ?? 0).toFixed(2)}`;

const safeDate = (value: Date | string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : format(date, "dd MMM yyyy, hh:mm a");
};

export const downloadOrderInvoice = (order: IOrder) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 6;

  let y = 16;

  doc.setFillColor(239, 68, 68);
  doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SNAP EATS", margin + 8, y + 11);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Tax Invoice / Receipt", margin + 8, y + 20);
  doc.text(`Order #${order._id.slice(-8)}`, pageWidth - margin - 8, y + 11, { align: "right" });
  doc.text(`Generated ${format(new Date(), "dd MMM yyyy")}`, pageWidth - margin - 8, y + 20, {
    align: "right",
  });

  doc.setTextColor(31, 41, 55);
  y += 40;

  const infoRows: Array<[string, string]> = [
    ["Order ID", order._id],
    ["Restaurant", order.restaurantName],
    ["Order Date", safeDate(order.createdAt)],
    ["Status", order.status],
    ["Payment Method", order.paymentMethod],
    ["Payment Status", order.paymentStatus],
    ["Delivery Address", order.deliveryAddress.fromattedAddress],
    ["Customer Mobile", String(order.deliveryAddress.mobile)],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Order Details", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  infoRows.forEach(([label, value]) => {
    const wrappedValue = doc.splitTextToSize(value || "Unavailable", contentWidth - 42);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(wrappedValue, margin + 38, y);
    y += Math.max(wrappedValue.length * lineHeight, lineHeight);
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Items", margin, y);
  y += 5;

  const columns = [
    { label: "Item", width: 84 },
    { label: "Qty", width: 18 },
    { label: "Rate", width: 28 },
    { label: "Amount", width: 28 },
  ];

  const tableX = margin;
  const rowHeight = 8;

  const drawTableHeader = () => {
    let x = tableX;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(tableX, y, contentWidth, rowHeight, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    columns.forEach((column) => {
      doc.text(column.label, x + 2, y + 5.5);
      x += column.width;
    });
    y += rowHeight;
  };

  const drawTableRow = (itemName: string, quantity: number, price: number, amount: number) => {
    const requiredHeight = 10;
    if (y + requiredHeight > pageHeight - 18) {
      doc.addPage();
      y = 16;
      doc.setFont("helvetica", "bold");
      doc.text("Items (continued)", margin, y);
      y += 5;
      drawTableHeader();
    }

    let x = tableX;
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(226, 232, 240);
    doc.rect(tableX, y, contentWidth, requiredHeight, "S");
    const itemText = doc.splitTextToSize(itemName, columns[0].width - 4);
    doc.text(itemText, x + 2, y + 5);
    x += columns[0].width;
    doc.text(String(quantity), x + 2, y + 5);
    x += columns[1].width;
    doc.text(formatMoney(price), x + 2, y + 5);
    x += columns[2].width;
    doc.text(formatMoney(amount), x + 2, y + 5);
    y += requiredHeight;
  };

  drawTableHeader();
  order.items.forEach((item) => {
    drawTableRow(item.name, item.quantity, item.price, item.price * item.quantity);
  });

  y += 6;
  if (y + 36 > pageHeight - 18) {
    doc.addPage();
    y = 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment Summary", margin, y);
  y += 6;

  const summaryRows: Array<[string, number]> = [
    ["Subtotal", order.subTotal],
    ["Delivery Charge", order.deliveryCharge],
    ["Platform Charge", order.platformCharge],
    ["Total", order.totalAmount],
  ];

  summaryRows.forEach(([label, value], index) => {
    doc.setFont("helvetica", index === summaryRows.length - 1 ? "bold" : "normal");
    doc.text(label, margin, y);
    doc.text(formatMoney(value), pageWidth - margin, y, { align: "right" });
    y += 6;
  });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    "This receipt was generated electronically and is valid without a signature.",
    margin,
    pageHeight - 14,
  );

  doc.save(`snap-eats-invoice-${order._id.slice(-6)}.pdf`);
};