import React, { useState } from 'react';
import PDFViewer from './components/PDFViewer';

const App = () => {

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const pdfData = '';
  // password = '67891982';


  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would verify the password here
    // For this example, we'll just set it to authenticated
    setIsAuthenticated(true);
  };

//   const handlePrint = () => {
//     const printerName = prompt("Enter printer name:");
//     if (printerName) {
//       // In a real application, you would send a request to your server here
//       alert(`Print request sent for printer: ${printerName}`);
//     }
//   };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <h1>Secure PDF Viewer</h1>
        <form onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter PDF password"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }


  return (
    <div className="App">
      <h1>Secure PDF Viewer</h1>
      <PDFViewer pdfData={pdfData} password={password} />
      {/* <button onClick={handlePrint}>Print Document</button> */}
    </div>
  );
};

export default App;