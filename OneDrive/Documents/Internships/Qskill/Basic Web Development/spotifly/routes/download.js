const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');

// Middleware to check auth
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
}

router.post('/fetch', requireAuth, downloadController.fetchTrack);
router.get('/file/:trackId', requireAuth, downloadController.downloadFile);

module.exports = router;
