const express = require('express');
const router = express.Router();
const multer = require('multer');
const { evaluatePitch } = require('../controllers/pitchController');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('audio'), evaluatePitch);

module.exports = router;
