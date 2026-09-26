import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log(`\n[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    console.log(`[CONTENT]:\n${html.replace(/<[^>]*>?/gm, '')}\n`);
    return { simulated: true, to, subject };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'SIMASPRAS Poltekimipas'}" <${user}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email via SMTP:', error);
    return { success: false, error };
  }
}
