'use strict';

let express = require('express');
let fs = require('fs');
let path = require('path');
let multer = require('multer');
let router = express.Router();

const FILES_DIR = path.join(__dirname, 'files');
// configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, FILES_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // keep original filename
  }
});

const upload = multer({ storage: storage });

/* *
 *  wopi CheckFileInfo endpoint
 *
 *  Returns info about the file with the given document id.
 *  Now it checks if the file exists in FILES_DIR.
 */
router.get('/files/:fileId', function(req, res) {
    const fileId = req.params.fileId;
    const filePath = path.join(FILES_DIR, fileId);

    console.log('CheckFileInfo for file id: ' + fileId);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(filePath);

    res.json({
        BaseFileName: fileId,
        Size: stats.size,
        UserId: 1,
        UserCanWrite: true
    });
});

/* *
 *  wopi GetFile endpoint
 *
 *  Sends back the real contents of the file if it exists.
 */
router.get('/files/:fileId/contents', function(req, res) {
    const fileId = req.params.fileId;
    const filePath = path.join(FILES_DIR, fileId);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    res.sendFile(filePath);
});

/* *
 *  wopi PutFile endpoint
 *
 *  Overwrites the existing file with the request body.
 */
router.post('/files/:fileId/contents', function(req, res) {
    const fileId = req.params.fileId;
    const filePath = path.join(FILES_DIR, fileId);

    console.log('wopi PutFile endpoint triggered for:', fileId);

    let data = [];
    req.on('data', chunk => {
        data.push(chunk);
    });

    req.on('end', () => {
        const buffer = Buffer.concat(data);
        fs.writeFileSync(filePath, buffer);
        console.log('File saved:', filePath);
        res.sendStatus(200);
    });

    req.on('error', err => {
        console.error('Error writing file:', err);
        res.sendStatus(500);
    });
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    message: 'File uploaded successfully',
    fileName: req.file.originalname,
    path: req.file.path
  });
});

module.exports = router;
