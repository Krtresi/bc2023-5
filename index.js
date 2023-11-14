const express = require('express');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch((error) => {
  console.error('Error creating upload directory:', error);
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const notesFile = path.join(__dirname, 'notes.json');

app.get('/', (req, res) => {
  res.send('The server started successfully...');
});

app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'UploadForm.html'));
});

app.get('/notes', async (req, res) => {
  try {
    const data = await fs.readFile(notesFile, 'utf-8');
    const notes = JSON.parse(data);
    res.json(notes);
  } catch (error) {
    console.error('Error reading notes file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/notes/:note_name', async (req, res) => {
  try {
    const note_name = req.params.note_name;
    const data = await fs.readFile(notesFile, 'utf-8');
    const notes = JSON.parse(data);
    const findnote = notes.find((note) => note.note_name === note_name);

    if (findnote) {
      res.send({ note_name: note_name, note: findnote.note });
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Error reading note:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/upload', upload.single('note'), async (req, res) => {
  try {
    const { note_name, note } = req.body;

    const data = await fs.readFile(notesFile, 'utf-8');
    const notes = JSON.parse(data);

    const existing = notes.find((note) => note.note_name === note_name);

    if (existing) {
      res.status(400).send('Bad Request');
    } else {
      notes.push({ note_name: note_name, note: note });
      await fs.writeFile(notesFile, JSON.stringify(notes));
      res.status(201).send('Fine!');
    }
  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/notes/:note_name', async (req, res) => {
  try {
    const note_name = req.params.note_name;
    const note = req.body.note;

    const data = await fs.readFile(notesFile, 'utf-8');
    const notes = JSON.parse(data);

    const noteIndex = notes.findIndex((note) => note.note_name === note_name);

    if (noteIndex !== -1) {
      notes[noteIndex].note = note;
      await fs.writeFile(notesFile, JSON.stringify(notes));
      res.status(200).send('OK');
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/notes/:note_name', async (req, res) => {
  try {
    const note_name = req.params.note_name;

    const data = await fs.readFile(notesFile, 'utf-8');
    const notes = JSON.parse(data);

    const noteIndex = notes.findIndex((note) => note.note_name === note_name);

    if (noteIndex !== -1) {
      notes.splice(noteIndex, 1);
      await fs.writeFile(notesFile, JSON.stringify(notes));
      res.status(200).send('OK');
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`The server is running on the port ${port}`);
});
