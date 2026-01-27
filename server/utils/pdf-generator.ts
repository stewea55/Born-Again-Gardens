import PDFDocument from "pdfkit";
import type { Donation, User } from "@shared/schema";

interface TaxDocumentData {
  user: User;
  donations: Donation[];
  taxYear: number;
  organizationName: string;
  organizationEIN: string;
  organizationAddress: string;
}

export function generateTaxDocument(data: TaxDocumentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "LETTER" });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("DONATION RECEIPT", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).font("Helvetica").text("501(c)(3) Tax-Exempt Organization", { align: "center" });
      doc.moveDown(2);

      // Organization Information
      doc.fontSize(14).font("Helvetica-Bold").text("Organization Information:");
      doc.fontSize(11).font("Helvetica");
      doc.text(`Name: ${data.organizationName}`);
      doc.text(`EIN: ${data.organizationEIN}`);
      doc.text(`Address: ${data.organizationAddress}`);
      doc.moveDown();

      // Donor Information
      doc.fontSize(14).font("Helvetica-Bold").text("Donor Information:");
      doc.fontSize(11).font("Helvetica");
      doc.text(`Name: ${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || "N/A");
      doc.text(`Email: ${data.user.email || "N/A"}`);
      doc.moveDown();

      // Tax Year Summary
      doc.fontSize(14).font("Helvetica-Bold").text(`Tax Year ${data.taxYear} Summary:`);
      doc.moveDown(0.5);

      const yearDonations = data.donations.filter((d) => d.taxYear === data.taxYear);
      const totalAmount = yearDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

      doc.fontSize(12).font("Helvetica-Bold").text(`Total Donations: $${totalAmount.toFixed(2)}`);
      doc.moveDown();

      // Donation Details Table
      if (yearDonations.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("Donation Details:");
        doc.moveDown(0.5);

        // Table header
        const tableTop = doc.y;
        const itemHeight = 20;
        const col1 = 50;
        const col2 = 200;
        const col3 = 350;
        const col4 = 450;

        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Date", col1, tableTop);
        doc.text("Amount", col2, tableTop);
        doc.text("Payment Method", col3, tableTop);
        doc.text("Transaction ID", col4, tableTop);

        // Draw line under header
        doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table rows
        doc.fontSize(9).font("Helvetica");
        let yPos = tableTop + 25;
        yearDonations.forEach((donation) => {
          if (yPos > 700) {
            // New page if needed
            doc.addPage();
            yPos = 50;
          }

          const date = donation.createdAt
            ? new Date(donation.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A";

          doc.text(date, col1, yPos);
          doc.text(`$${parseFloat(donation.amount).toFixed(2)}`, col2, yPos);
          doc.text(donation.paymentMethod || "N/A", col3, yPos);
          doc.text(donation.transactionId || "N/A", col4, yPos);

          yPos += itemHeight;
        });
      }

      doc.moveDown(2);

      // Footer Notice
      doc.fontSize(9).font("Helvetica").fillColor("gray");
      doc.text(
        "This receipt is provided for your records. No goods or services were provided in exchange for this donation.",
        { align: "center" }
      );
      doc.moveDown(0.5);
      doc.text(
        "This organization is a 501(c)(3) tax-exempt organization. Your donation may be tax-deductible to the extent allowed by law.",
        { align: "center" }
      );
      doc.moveDown(0.5);
      doc.text(
        "Please consult with a tax professional regarding the deductibility of your donation.",
        { align: "center" }
      );
      doc.moveDown();
      doc.text(`Generated on: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
