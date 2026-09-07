require('dotenv').config();
const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');
const path = require('path');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

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
      <td style="border: 1px solid #ddd; padding: 8px;">${item.remarks}</td>
    </tr>
  `).join('');

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grading Portal <onboarding@resend.dev>',
      to: ['diland@gmail.com'],
      subject: `Weekly Progress Grades: ${supervisor}`,
      html: `
        <h3>Bi — Weekly Progress Assessment</h3>
        <p><strong>Supervisor:</strong> ${supervisor}</p>
        <p><strong>Milestone:</strong> ${weekProgress}</p>
        <p><strong>Submitted Date:</strong> ${new Date().toLocaleString()}</p>

        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Index No</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student Name</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Assigned Grade</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'Grades successfully emailed!' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to send the email.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
