import PDFDocument from 'pdfkit';

// Pawtimation brand colors
const COLORS = {
  green: '#0FAE7B',
  darkGreen: '#0B7A57',
  lightMint: '#E8FFF7',
  charcoal: '#222222',
  softGrey: '#F7F7F7',
  white: '#FFFFFF',
  accentOrange: '#F5A623',
  borderGrey: '#DDDDDD'
};

export async function generateInvoicePDF(invoiceData, businessData, clientData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // HEADER
      drawHeader(doc, invoiceData);

      // Green separator bar
      doc.fillColor(COLORS.green)
         .rect(36, doc.y, doc.page.width - 72, 4)
         .fill();
      
      doc.moveDown(2);

      // BUSINESS DETAILS
      drawBusinessDetails(doc, businessData);
      doc.moveDown(1.5);

      // CLIENT DETAILS
      drawClientDetails(doc, clientData);
      doc.moveDown(2);

      // SERVICE TABLE
      drawServiceTable(doc, invoiceData);
      doc.moveDown(2);

      // TOTAL SECTION
      drawTotalSection(doc, invoiceData);
      doc.moveDown(2);

      // PAYMENT INFO
      drawPaymentInfo(doc, invoiceData);

      // FOOTER
      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawHeader(doc, invoiceData) {
  const startY = doc.y;

  // Left side - Pawtimation branding
  doc.fontSize(24)
     .fillColor(COLORS.green)
     .font('Helvetica-Bold')
     .text('Pawtimation', 36, startY);
  
  doc.fontSize(10)
     .fillColor(COLORS.charcoal)
     .font('Helvetica')
     .text('Trusted Pet Care', 36, doc.y);

  // Right side - Invoice info
  const rightX = doc.page.width - 200;
  doc.fontSize(20)
     .fillColor(COLORS.charcoal)
     .font('Helvetica-Bold')
     .text('INVOICE', rightX, startY, { align: 'right', width: 164 });
  
  doc.fontSize(10)
     .fillColor(COLORS.charcoal)
     .font('Helvetica')
     .text(`#${invoiceData.invoiceNumber || invoiceData.invoiceId}`, rightX, doc.y, { align: 'right', width: 164 });
  
  const formattedDate = new Date(invoiceData.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Date issued: ${formattedDate}`, rightX, doc.y, { align: 'right', width: 164 });

  doc.moveDown(2);
}

function drawBusinessDetails(doc, businessData) {
  doc.fontSize(10)
     .fillColor(COLORS.charcoal)
     .font('Helvetica-Bold')
     .text(businessData.name || 'Pawtimation');
  
  doc.font('Helvetica');
  
  if (businessData.address) {
    doc.text(businessData.address);
  }
  if (businessData.phone) {
    doc.text(businessData.phone);
  }
  if (businessData.email) {
    doc.text(businessData.email);
  }
}

function drawClientDetails(doc, clientData) {
  doc.fontSize(11)
     .fillColor(COLORS.green)
     .font('Helvetica-Bold')
     .text('Bill To:');
  
  doc.fontSize(10)
     .fillColor(COLORS.charcoal)
     .font('Helvetica')
     .text(clientData.name || 'Client');
  
  if (clientData.email) {
    doc.text(clientData.email);
  }
  if (clientData.phone) {
    doc.text(clientData.phone);
  }
  if (clientData.address) {
    doc.text(clientData.address);
  }
}

function drawServiceTable(doc, invoiceData) {
  const tableTop = doc.y;
  const tableLeft = 36;
  const tableWidth = doc.page.width - 72;
  
  const colWidths = {
    description: tableWidth * 0.6,
    qty: tableWidth * 0.15,
    price: tableWidth * 0.25
  };

  // Header row background
  doc.fillColor(COLORS.green)
     .rect(tableLeft, tableTop, tableWidth, 30)
     .fill();

  // Header text
  doc.fontSize(10)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('Description', tableLeft + 10, tableTop + 10, { width: colWidths.description, continued: false })
     .text('Qty', tableLeft + colWidths.description + 10, tableTop + 10, { width: colWidths.qty, continued: false })
     .text('Price', tableLeft + colWidths.description + colWidths.qty + 10, tableTop + 10, { width: colWidths.price, continued: false });

  let rowY = tableTop + 30;

  // Data rows
  const items = invoiceData.items || [{ description: 'Service', quantity: 1, amount: invoiceData.total }];
  
  items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.fillColor(COLORS.white)
         .rect(tableLeft, rowY, tableWidth, 25)
         .fill();
    } else {
      doc.fillColor(COLORS.softGrey)
         .rect(tableLeft, rowY, tableWidth, 25)
         .fill();
    }

    // Border
    doc.strokeColor(COLORS.borderGrey)
       .lineWidth(0.5)
       .rect(tableLeft, rowY, tableWidth, 25)
       .stroke();

    // Row text  - item.amount is already the line total
    const quantity = item.quantity || 1;
    const amount = typeof item.amount === 'number' ? item.amount : invoiceData.total;
    doc.fontSize(9)
       .fillColor(COLORS.charcoal)
       .font('Helvetica')
       .text(item.description || 'Service', tableLeft + 10, rowY + 8, { width: colWidths.description - 20 })
       .text(String(quantity), tableLeft + colWidths.description + 10, rowY + 8, { width: colWidths.qty - 20 })
       .text(`£${(amount / 100).toFixed(2)}`, tableLeft + colWidths.description + colWidths.qty + 10, rowY + 8, { width: colWidths.price - 20 });

    rowY += 25;
  });

  // Table border
  doc.strokeColor(COLORS.borderGrey)
     .lineWidth(1)
     .rect(tableLeft, tableTop, tableWidth, rowY - tableTop)
     .stroke();

  doc.y = rowY;
}

function drawTotalSection(doc, invoiceData) {
  const rightX = doc.page.width - 200;
  
  // Calculate subtotal from items - item.amount is already a line total, so just sum them
  const items = invoiceData.items || [];
  const calculatedSubtotal = items.length > 0 
    ? items.reduce((sum, item) => sum + (item.amount || 0), 0)
    : invoiceData.total;
  
  const subtotalAmount = (calculatedSubtotal / 100).toFixed(2);
  const totalAmount = (calculatedSubtotal / 100).toFixed(2);

  doc.fontSize(10)
     .fillColor(COLORS.charcoal)
     .font('Helvetica')
     .text('Subtotal:', rightX, doc.y, { align: 'right', width: 100 })
     .text(`£${subtotalAmount}`, rightX + 110, doc.y - 12, { align: 'right', width: 54 });

  doc.moveDown(0.5);

  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('Total:', rightX, doc.y, { align: 'right', width: 100 })
     .text(`£${totalAmount}`, rightX + 110, doc.y - 18, { align: 'right', width: 54 });
}

function drawPaymentInfo(doc, invoiceData) {
  const boxLeft = 36;
  const boxWidth = doc.page.width - 72;
  const boxHeight = invoiceData.paymentUrl ? 80 : 50;

  // Green payment info box
  doc.fillColor(COLORS.green)
     .rect(boxLeft, doc.y, boxWidth, boxHeight)
     .fill();

  const textY = doc.y + 15;

  doc.fontSize(10)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('Payment is required within 14 days.', boxLeft + 15, textY, { width: boxWidth - 30 });

  if (invoiceData.paymentUrl) {
    doc.moveDown(0.5);
    doc.font('Helvetica')
       .text('Payment Link:', boxLeft + 15, doc.y, { width: boxWidth - 30 })
       .text(invoiceData.paymentUrl, boxLeft + 15, doc.y, { width: boxWidth - 30, link: invoiceData.paymentUrl });
  }

  doc.y += boxHeight;
}

function drawFooter(doc) {
  const footerY = doc.page.height - 50;
  
  doc.fontSize(9)
     .fillColor('#999999')
     .font('Helvetica')
     .text('Powered by Pawtimation', 36, footerY, { 
       align: 'center', 
       width: doc.page.width - 72 
     });
}
