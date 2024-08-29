// Import the EmailService
const EmailService = require('../services/emailService');

// Initialize the email service
const emailService = new EmailService();

exports.sendEmail = async (req, res) => {
  const email = req.body;
  console.log(`Received email request: ${JSON.stringify(email)}`);

  try {
      const result = await emailService.sendEmail(email);
      console.log(`Email sent successfully: ${JSON.stringify(result)}`);
      res.status(200).json(result);
  } catch (error) {
      if (error.status === 'duplicate') {
        console.log(`Failed to send email: ${JSON.stringify(error)}`);
          res.status(409).json(error);
      } else if (error.status === 'error') {
          res.status(500).json(error);
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.' });
      }
  }
};
exports.getStatusLog = (req, res) => {
  const statusLog = emailService.getStatusLog();
  res.status(200).json(statusLog);
};

