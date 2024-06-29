const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 3001; // Use a different port than your React app

app.use(cors());

app.get('/api/printers', (req, res) => {
  const platform = os.platform();
  let command;

  if (platform === 'win32') {
    // Command for Windows to list printers using PowerShell
    command = 'powershell -command "Get-Printer | Select-Object -ExpandProperty Name"';
  } else if (platform === 'linux' || platform === 'darwin') {
    // Command for Unix-based systems to list printers
    command = 'lpstat -p';
  } else {
    console.error('Unsupported platform:', platform);
    res.status(500).json({ error: 'Unsupported platform.' });
    return;
  }

  console.log('Executing command:', command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      res.status(500).json({ error: 'Error fetching printers.' });
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      res.status(500).json({ error: 'Error fetching printers.' });
      return;
    }

    console.log('Command output:', stdout);

    let printers;
    if (platform === 'win32') {
      printers = stdout.trim().split('\n').map(line => line.trim()).filter(Boolean);
    } else {
      printers = stdout.trim().split('\n').map(line => {
        const match = line.match(/^printer\s+(\S+)/);
        return match ? match[1] : null;
      }).filter(Boolean);
    }

    console.log('Printers found:', printers);
    res.json(printers);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
