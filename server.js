const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { PDFDocument } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');
const { print } = require('pdf-to-printer');

const app = express();
const PORT = 3001;

// Promisify fs functions
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const execAsync = promisify(exec);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Utility function to get printers
async function getPrinters() {
  const platform = os.platform();
  let command;

  if (platform === 'win32') {
    command = 'powershell -command "Get-Printer | Select-Object -ExpandProperty Name"';
  } else if (platform === 'linux' || platform === 'darwin') {
    command = 'lpstat -p | awk \'{print $2}\'';
  } else {
    throw new Error('Unsupported platform');
  }

  const { stdout } = await execAsync(command);
  return stdout
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

// API endpoint to get printers
app.get('/api/printers', async (req, res) => {
  try {
    const printers = await getPrinters();
    res.json(printers);
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({ error: 'Error fetching printers' });
  }
});

// API endpoint to print PDF
app.post('/api/print', async (req, res) => {
  const { printerName, pdfData, password } = req.body;
  let tempFilePath, decryptedTempFilePath;

  try {
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    tempFilePath = path.join(__dirname, `temp_encrypted_${Date.now()}.pdf`);
    decryptedTempFilePath = path.join(__dirname, `temp_decrypted_${Date.now()}.pdf`);

    await writeFileAsync(tempFilePath, pdfBuffer);

    const loadingTask = pdfjsLib.getDocument({ url: tempFilePath, password });
    const pdfDocument = await loadingTask.promise;

    const newPdfDoc = await PDFDocument.create();

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      await page.render({ canvasContext: context, viewport }).promise;

      const pngImage = await newPdfDoc.embedPng(canvas.toBuffer());
      const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
      newPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });
    }

    const pdfBytes = await newPdfDoc.save();
    await writeFileAsync(decryptedTempFilePath, pdfBytes);

    await print(decryptedTempFilePath, { printer: printerName });

    res.json({ success: true, message: 'Printing successful' });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ error: 'Error printing: ' + error.message });
  } finally {
    // Clean up temporary files
    for (const file of [tempFilePath, decryptedTempFilePath]) {
      if (file) {
        try {
          await unlinkAsync(file);
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      }
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});