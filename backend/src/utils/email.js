const sendEmail = async (to, code) => {
  if (process.env.TEST_MODE === "true") {
    console.log(`[TEST MODE] OTP: ${code} → ${to}`);
    return { success: true, test: true };
  }

  // Bird.com API
  if (process.env.BIRD_ACCESS_KEY && process.env.BIRD_WORKSPACE_ID && process.env.BIRD_CHANNEL_ID) {
    const url = `https://api.bird.com/workspaces/${process.env.BIRD_WORKSPACE_ID}/channels/${process.env.BIRD_CHANNEL_ID}/messages`;
    const payload = {
      receiver: {
        contacts: [{
          identifierKey: "emailaddress",
          identifierValue: to,
        }],
      },
      body: {
        type: "email",
        email: {
          from: {
            displayName: "QurbanEt",
            address: process.env.BIRD_SENDER_EMAIL || "no-reply@mail.qurbanet.az",
          },
          subject: "QurbanEt - Doğrulama kodu",
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
          text: `QurbanEt giriş kodunuz: ${code}\n\nBu kod 5 dəqiqə ərzində etibarlıdır.`,
        },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `AccessKey ${process.env.BIRD_ACCESS_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log(`[Bird API] status=${res.status} body=${responseText}`);

    if (!res.ok) {
      throw new Error(`Bird API xətası: ${res.status} — ${responseText}`);
    }
    return { success: true };
  }

  // Fallback: nodemailer SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"QurbanEt" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: "QurbanEt - Doğrulama kodu",
      text: `Doğrulama kodunuz: ${code}\n\n5 dəqiqə ərzində istifadə edin.`,
    });
    return { success: true };
  }

  throw new Error("Email konfiqurasiyası tapılmadı (BIRD_ACCESS_KEY və ya SMTP_HOST tələb olunur)");
};

module.exports = { sendEmail };
