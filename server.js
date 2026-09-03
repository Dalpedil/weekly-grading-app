require('dotenv').config();
const express = require('express');
const brevo = require('@getbrevo/brevo');
const cors = require('cors');
const path = require('path');

const app = express();

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/submit', async (req, res) => {
  const { supervisor, weekProgress, evaluations } = req.body;

  if (!supervisor || !evaluations || !evaluations.length) {
    return res.status(400).json({ error: 'Missing required grading data.' });
  }

  const tableRows = evaluations.map((item) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.indexNo}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
      <td style="border: 1px solid #ddd; padding: 8px;"><strong>${item.grade}</strong></td>
    </tr>
  `).join('');

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `Weekly Progress Grades: ${supervisor}`;
  sendSmtpEmail.htmlContent = `
    <h3>Weekly Progress Assessment</h3>
    <p><strong>Supervisor:</strong> ${supervisor}</p>
    <p><strong>Milestone:</strong> ${weekProgress}</p>
    <p><strong>Submitted Date:</strong> ${new Date().toLocaleString()}</p>

    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; margin-top: 15px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Index No</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student Name</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Assigned Grade</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
  sendSmtpEmail.sender = { 
    name: 'Grading Portal', 
    email: process.env.BREVO_SENDER_EMAIL || 'diland@gmail.com' 
  };
  sendSmtpEmail.to = [{ email: process.env.RECIPIENT_EMAIL || 'emejayani@gmail.com' }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.status(200).json({ message: 'Grades successfully emailed!' });
  } catch (error) {
    console.error('Brevo API error:', error.response ? error.response.body : error);
    res.status(500).json({ error: 'Failed to send the email.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
