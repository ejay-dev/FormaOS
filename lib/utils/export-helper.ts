import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exports Policies to PDF
 */
export const exportPoliciesToPDF = (policies: any[], orgName: string) => {
  const doc = new jsPDF();

  // Header Section
  doc.setFontSize(20);
  doc.text("Compliance Policy Report", 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Organization: ${orgName}`, 14, 30);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);

  const tableColumn = ["Policy Name", "Code", "Status", "Created Date"];
  const tableRows = policies.map(policy => [
    policy.name || policy.title || "Untitled",
    policy.code || "N/A",
    "Active",
    policy.created_at ? new Date(policy.created_at).toLocaleDateString() : "N/A"
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
  });

  doc.save(`FormaOS_Policies_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Exports Assets/Registers to PDF
 */
export const exportRegistersToPDF = (assets: any[], orgName: string) => {
  const doc = new jsPDF();
  
  // Header Section
  doc.setFontSize(20);
  doc.text("Asset Inventory Report", 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Organization: ${orgName}`, 14, 30);
  doc.text(`Report Type: Full Asset Disclosure`, 14, 35);

  const tableColumn = ["Asset Name", "Category", "Status", "ID Reference"];
  const tableRows = assets.map(asset => [
    asset.name || "Unnamed Asset",
    asset.category || asset.type || "Uncategorized",
    "Active",
    asset.id?.slice(0, 8).toUpperCase() || "N/A"
  ]);

  // Using the correct autoTable call structure to satisfy TS
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'grid',
    headStyles: { fillColor: [126, 34, 206], textColor: [255, 255, 255] }, // Purple theme for Assets
    styles: { fontSize: 9 },
  });

  doc.save(`FormaOS_Assets_${new Date().toISOString().slice(0, 10)}.pdf`);
};