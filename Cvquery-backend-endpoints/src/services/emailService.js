const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, token) {
  const url = `${process.env.FRONTEND_URL}/verify?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "nunitacuvinha@gmail.com",
    to: email,
    subject: "Verifica a tua conta CVQuery",
    html: `
      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;background:#fafaf8;border:1px solid #e2e0d8;border-radius:8px;">
        <h2 style="font-size:20px;color:#1a1916;margin-bottom:8px;">CVQuery Platform</h2>
        <p style="color:#5c5a52;font-size:14px;margin-bottom:24px;">Clica no botão abaixo para verificar a tua conta.</p>
        <a href="${url}" style="display:inline-block;padding:10px 24px;background:#2563a8;color:white;border-radius:6px;text-decoration:none;font-size:14px;font-family:sans-serif;">Verificar conta</a>
        <p style="color:#9c9a92;font-size:12px;margin-top:24px;">O link expira em 24 horas. Se não criaste uma conta, ignora este email.</p>
        <p style="color:#9c9a92;font-size:11px;margin-top:8px;">${url}</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, token) {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "nunitacuvinha@gmail.com",
    to: email,
    subject: "Repõe a tua password CVQuery",
    html: `
      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;background:#fafaf8;border:1px solid #e2e0d8;border-radius:8px;">
        <h2 style="font-size:20px;color:#1a1916;margin-bottom:8px;">CVQuery Platform</h2>
        <p style="color:#5c5a52;font-size:14px;margin-bottom:24px;">Clica no botão abaixo para repor a tua password.</p>
        <a href="${url}" style="display:inline-block;padding:10px 24px;background:#2563a8;color:white;border-radius:6px;text-decoration:none;font-size:14px;font-family:sans-serif;">Repor password</a>
        <p style="color:#9c9a92;font-size:12px;margin-top:24px;">O link expira em 1 hora. Se não pediste a reposição, ignora este email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
