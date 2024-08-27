const express = require('express');
const {sendEmail,getStatusLog} = require('../controllers/emailcontroller');

const router = express.Router();

router.post('/send', sendEmail);
router.get('/status-log', getStatusLog);

module.exports = router;
