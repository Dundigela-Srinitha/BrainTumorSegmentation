import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name using ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Use memory storage for multer (no disk storage)
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/segment', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Get the uploaded image buffer
  const imageBuffer = req.file.buffer;

  // Create a temporary input file path (in memory)
  const inputPath = path.join(__dirname, 'temp_input_image.png');
  fs.writeFileSync(inputPath, imageBuffer);

  // Create a temporary output file path (in memory)
  const outputPath = path.join(__dirname, 'temp_output_image.png');

  // Run Python script
  const pythonProcess = spawn('python3', ['segment.py', inputPath, outputPath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python script stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python script stderr: ${data}`);
  });

  pythonProcess.on('exit', (code) => {
    if (code === 0) {
      // Read the segmented image from memory
      const segmentedImageBuffer = fs.readFileSync(outputPath);

      // Delete temporary files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      // Send the segmented image as a response
      res.set('Content-Type', 'image/png');
      res.send(segmentedImageBuffer);
    } else {
      // Delete temporary files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      res.status(500).json({ error: 'Segmentation failed' });
    }
  });

  pythonProcess.on('error', (err) => {
    console.error('Python script error:', err);
    res.status(500).json({ error: 'Python script execution failed' });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});