const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const aiController = require('../controllers/aiController');
const jwtAuth = require('../middleware/auth'); // Uses the optimized JWT auth

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/faces/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fs = require('fs');
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const { optionalAuth } = require('../middleware/auth');
router.post('/suggest', optionalAuth, upload.single('image'), aiController.getAISuggestions);

module.exports = router;
