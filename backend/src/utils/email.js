/**
 * Email Servisi
 * TEST_MODE=true olduqda OTP həmişə 123456 olur və email göndərilmir.
 * Production-da SMTP konfiqurasiyası .env-dən oxunur.
 */

const sendEmail = async (email, code) => {
  if (process.env.TEST_MODE === "true") {
    console.log("\n" + "=".repeat(50));
    console.log(`📧 EMAIL TEST REJİMİ`);
    console.log(`📨 Email: ${email}`);
    console.log(`🔑 OTP Kodu: ${code}`);
    console.log("=".repeat(50) + "\n");
    return { success: true, test: true };
  }

  // Production: nodemailer ilə göndər
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"QurbanEt" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "QurbanEt - Doğrulama kodu",
    text: `Doğrulama kodunuz: ${code}\n\n5 dəqiqə ərzində istifadə edin.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#f4f6fa;border-radius:16px;">
        <h2 style="color:#1B5E20;margin:0 0 8px;">QurbanEt</h2>
        <p style="color:#6B7280;margin:0 0 24px;font-size:14px;">Doğrulama kodu</p>
        <div style="background:#fff;border-radius:12px;padding:24px;text-align:center;border:1px solid #eaecf0;">
          <p style="color:#6B7280;font-size:13px;margin:0 0 8px;">Giriş kodunuz:</p>
          <div style="font-size:36px;font-weight:800;color:#1B5E20;letter-spacing:8px;">${code}</div>
          <p style="color:#9CA3AF;font-size:12px;margin:16px 0 0;">Bu kod 5 dəqiqə ərzində etibarlıdır.</p>
        </div>
      </div>
    `,
  });

  return { success: true };
};

module.exports = { sendEmail };
