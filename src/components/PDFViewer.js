import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import axios from 'axios';

// Set the PDF.js worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PORT = 3001; // Port where your server is running

const PDFViewer = ({ pdfData, password }) => {
  const canvasRef = useRef(null);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [noOfPages, setNoOfPages] = useState(0);
 // const [permissionDenied, setPermissionDenied] = useState(false); // State to track permission denial

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

    // Enumerate devices to find printers
    // navigator.permissions.query({ name: 'midi', sysex: false }).then(permissionStatus => {
    //   console.log('Permission status:', permissionStatus.state);
    //   if (permissionStatus.state === 'granted') {
    //     if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    //       navigator.mediaDevices.enumerateDevices()
    //         .then(devices => {
    //           // Filter for potential printer devices
    //           const potentialPrinters = devices.filter(device =>
    //             device.kind === 'printer' && !device.label.toLowerCase().includes('default')
    //           );
    //           setPrinters(potentialPrinters);
    //         })
    //         .catch(error => console.error('Error enumerating devices:', error));
    //     }
    //   } else {
    //     console.log('Permission denied');
    //     setPermissionDenied(true); // Set state to true when permission is denied
    //   }
    // });

   
      const fetchPrinters = async () => {
        try {
          const response = await axios.get(`http://localhost:${PORT}/api/printers`);
          const printers = response.data;
          setPrinters(printers);
        } catch (error) {
          console.error('Error fetching printers:', error);
          // Handle error state or retry logic if needed
        }
      };
        fetchPrinters();
   // Empty dependency array ensures this effect runs only once
  }, [pdfData, password]);

  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const confirmPrint = async () => {
    if (selectedPrinter) {
      if (!isVirtualPrinter(selectedPrinter)) {
        try {
          const pdfBytes = await pdfDocument.getData();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);

          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = blobUrl;

          document.body.appendChild(iframe);
          iframe.contentWindow.print();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
          }, 1000);
        } catch (error) {
          console.error('Error printing:', error);
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

      {/* Alert when permission is denied */}
      {/* {permissionDenied && (
        <div className="permission-alert">
          <p>Permission to enumerate devices was denied. Printing functionality may be limited.</p>
        </div>
      )} */}

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
        .permission-alert {
          background-color: #ffc107;
          color: #856404;
          border: 1px solid #ffeeba;
          padding: 10px;
          margin: 10px;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
};

export default PDFViewer;
