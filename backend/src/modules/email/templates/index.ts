const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f7fb; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 42, 82, 0.08); }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
  .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
  .content { padding: 32px; color: #334155; line-height: 1.6; }
  .card { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb; }
  .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
  .value { font-size: 16px; font-weight: 600; color: #1e293b; }
  .footer { padding: 24px 32px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; }
  .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
`;

function wrap(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body><div style="padding: 24px;"><div class="container"><div class="header"><h1>DentalFlow</h1><p>Modern Dental Practice Management</p></div><div class="content">${content}</div><div class="footer"><p>DentalFlow Clinic &bull; Questions? Call us or reply to this email.</p></div></div></div></body></html>`;
}

export function appointmentConfirmationTemplate(data: {
  patientName: string;
  dentistName: string;
  date: string;
  time: string;
  duration: number;
  operatory?: string;
}) {
  return wrap(`
    <h2 style="margin-top:0;color:#1e293b;">Appointment Confirmed</h2>
    <p>Hi ${data.patientName}, your appointment has been confirmed.</p>
    <div class="card">
      <div style="margin-bottom:12px;"><div class="label">Dentist</div><div class="value">${data.dentistName}</div></div>
      <div style="margin-bottom:12px;"><div class="label">Date</div><div class="value">${data.date}</div></div>
      <div style="margin-bottom:12px;"><div class="label">Time</div><div class="value">${data.time}</div></div>
      <div style="margin-bottom:12px;"><div class="label">Duration</div><div class="value">${data.duration} minutes</div></div>
      ${data.operatory ? `<div><div class="label">Room</div><div class="value">${data.operatory}</div></div>` : ''}
    </div>
    <p>Please arrive 10 minutes early. If you need to reschedule, contact our office.</p>
  `);
}

export function appointmentReminderTemplate(data: {
  patientName: string;
  dentistName: string;
  date: string;
  time: string;
}) {
  return wrap(`
    <h2 style="margin-top:0;color:#1e293b;">Appointment Reminder</h2>
    <p>Hi ${data.patientName}, this is a friendly reminder about your upcoming appointment.</p>
    <div class="card">
      <div style="margin-bottom:12px;"><div class="label">Dentist</div><div class="value">${data.dentistName}</div></div>
      <div style="margin-bottom:12px;"><div class="label">Date</div><div class="value">${data.date}</div></div>
      <div><div class="label">Time</div><div class="value">${data.time}</div></div>
    </div>
    <p>We look forward to seeing you tomorrow!</p>
  `);
}

export function recallReminderTemplate(data: {
  patientName: string;
  recallDate: string;
}) {
  return wrap(`
    <h2 style="margin-top:0;color:#1e293b;">Time for Your Dental Checkup</h2>
    <p>Hi ${data.patientName}, it's time to schedule your routine dental visit.</p>
    <div class="card">
      <div><div class="label">Recommended Recall Date</div><div class="value">${data.recallDate}</div></div>
    </div>
    <p>Regular checkups help maintain your oral health. Please call us or book online to schedule your appointment.</p>
    <a href="#" class="btn">Schedule Appointment</a>
  `);
}
