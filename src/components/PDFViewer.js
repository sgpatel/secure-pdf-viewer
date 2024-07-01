import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib'; // Import PDFDocument from pdf-lib for server-side PDF processing
import { Buffer } from 'buffer';


const PORT = 3001; // Port where your server is running

const PDFViewer = ({ pdfData, password }) => {
  const canvasRef = useRef(null);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [noOfPages, setNoOfPages] = useState(0);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({
          data: atob(pdfData), // Decode base64 encoded PDF data
          password: password,
        });

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNoOfPages(pdf.numPages);

        // Render the first page
        const page = await pdf.getPage(1);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Example: Blackout 5 lines of text
        const lineHeight = 20; // Approximate height of a line
        const startY = 225; // Y coordinate of the first line to blackout
        const blackoutHeight = lineHeight * 5;

        context.fillStyle = 'grey'; // 'GREY' corrected to 'grey'
        context.fillRect(80, startY, 732, blackoutHeight);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();

    const fetchPrinters = async () => {
      try {
        const response = await axios.get(`http://localhost:${PORT}/api/printers`);
        const printers = response.data;
        setPrinters(printers);
      } catch (error) {
        console.error('Error fetching printers:', error);
      }
    };
    
    fetchPrinters();
  }, [pdfData, password]);

  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const confirmPrint = async () => {
    if (selectedPrinter) {
      if (!isVirtualPrinter(selectedPrinter)) {
        try {
          // Check if pdfDocument is loaded and not null
          if (pdfDocument) {
            // Get PDF bytes
            const pdfBytes = await pdfDocument.getData();
            const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
            console.log('Printing PDF to printer:', selectedPrinter);
            console.log('PDF Data:', pdfBase64);
    
            const response = await axios.post(`http://localhost:${PORT}/api/print`, {
              printerName: selectedPrinter,
              pdfData: pdfBase64,
              password: password || '', 
            });
    
            console.log('Server response:', response.data);
            alert('Printing initiated successfully.');
          } else {
            alert('PDF document is not loaded.');
          }
        } catch (error) {
          console.error('Error printing:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
          }
          alert('An error occurred while printing. Please try again.');
        }
      } else {
        alert('Please select a physical printer, not a virtual one.');
      }
    } else {
      alert('Please select a printer.');
    }
    setShowPrintDialog(false);
  };
  
  const isVirtualPrinter = (printerName) => {
    const virtualPrinterKeywords = ['pdf', 'xps', 'onenote', 'onedrive', 'cloud', 'fax', 'microsoft print to pdf'];
    return virtualPrinterKeywords.some(keyword =>
      printerName.toLowerCase().includes(keyword)
    );
  };

  return (
    <div className="pdf-viewer">
      <canvas ref={canvasRef} />
      <label>Total No of Pages: {noOfPages}</label>
      <br />
      <button className="print-button" onClick={handlePrint}>Print</button>

      {showPrintDialog && (
        <div className="print-dialog">
          <div className="dialog-content">
            <h2>Select Printer</h2>
            <select value={selectedPrinter} onChange={(e) => setSelectedPrinter(e.target.value)}>
              <option value="">Select a printer</option>
              {printers.map((printer, index) => (
                <option key={index} value={printer}>{printer}</option>
              ))}
            </select>
            <div className="dialog-buttons">
              <button className="confirm-button" onClick={confirmPrint}>Print</button>
              <button className="cancel-button" onClick={() => setShowPrintDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pdf-viewer {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .print-button {
          margin: 20px 0;
          padding: 10px 20px;
          font-size: 16px;
          color: white;
          background-color: #007bff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .print-button:hover {
          background-color: #0056b3;
        }
        .print-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }
        .dialog-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .dialog-buttons {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        .confirm-button,
        .cancel-button {
          margin: 10px;
          padding: 10px 20px;
          font-size: 16px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .confirm-button {
          color: white;
          background-color: #28a745;
        }
        .confirm-button:hover {
          background-color: #218838;
        }
        .cancel-button {
          color: white;
          background-color: #dc3545;
        }
        .cancel-button:hover {
          background-color: #c82333;
        }
      `}</style>
    </div>
  );
};

export default PDFViewer;