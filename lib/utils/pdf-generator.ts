import { jsPDF } from "jspdf";

export const generatePolicyPDF = (title: string, content: string, orgName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(title.toUpperCase(), 20, 30);
  
  // Metadata line
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 35, pageWidth - 20, 35);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Organization: ${orgName}`, 20, 42);
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 42, { align: 'right' });

  // Content (HTML to Text parsing)
  // We use a simple regex to strip basic HTML tags from Tiptap for the PDF
  const cleanContent = content
    .replace(/<\/p>/g, '\n\n')
    .replace(/<[^>]*>/g, '');

  doc.setFontSize(12);
  doc.setTextColor(0);
  const splitText = doc.splitTextToSize(cleanContent, pageWidth - 40);
  doc.text(splitText, 20, 60);

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`FormaOS Compliance Engine - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`${title.replace(/\s+/g, '_')}_v1.pdf`);
};