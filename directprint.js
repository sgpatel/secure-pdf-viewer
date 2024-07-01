const { print } = require('pdf-to-printer');

// Function to print PDF
async function printPDF(filePath, printerName) {
  try {
    const options = { printer: printerName };
    await print(filePath, options);
    console.log(`PDF sent to printer: ${printerName}`);
  } catch (err) {
    console.error(`Failed to print: ${err}`);
  }
}

// Specify the path to the PDF file and the printer name
const filePath = './language-models.pdf';
const printerName = '\\\\http://[fe80::202b:563b:8824:6af6]:3000\\ipp-printer';

// Call the function to print the PDF
printPDF(filePath, printerName);
