const SMSPLUS_API_URL = "https://smsplus.az/api/sms/send";

const generateOTP = () => {
  if (process.env.TEST_MODE === "true") return "1234";
  return String(Math.floor(1000 + Math.random() * 9000));
};

// ─── SMS Plus ────────────────────────────────────────────────────────────────
const sendSMS = async (phone, code) => {
  if (process.env.TEST_MODE === "true") {
    console.log("=".repeat(50));
    console.log(`SMS TEST | Nömrə: ${phone} | Kod: ${code}`);
    console.log("=".repeat(50));
    return { success: true, test: true };
  }

  let mobileNumber = phone.replace(/\D/g, "");
  if (mobileNumber.startsWith("994")) {
    // ok
  } else if (mobileNumber.startsWith("0")) {
    mobileNumber = "994" + mobileNumber.slice(1);
  } else {
    mobileNumber = "994" + mobileNumber;
  }

  const senderName = (process.env.SMSPLUS_SENDER_NAME || "").trim();
  const templateId = Number(process.env.SMSPLUS_OTP_TEMPLATE_ID);
  const token = process.env.SMSPLUS_TOKEN;

  const body = {
    message_template_id: templateId,
    mobile_numbers: [mobileNumber],
    first_parameters: [code],
  };
  if (senderName) body.sender_name = senderName;

  console.log("[SMS PLUS] Göndərilir:", mobileNumber, "| Kod:", code);

  let response, rawText;
  try {
    response = await fetch(SMSPLUS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    rawText = await response.text();
  } catch (fetchErr) {
    throw new Error(`SMS PLUS bağlantı xətası: ${fetchErr.message}`);
  }

  console.log("[SMS PLUS] HTTP:", response.status, "| Cavab:", rawText);
  if (!response.ok)
    throw new Error(`SMS PLUS xətası [${response.status}]: ${rawText}`);
  return { success: true };
};

// ─── WhatsApp ────────────────────────────────────────────────────────────────
const sendWhatsApp = async (phone, code) => {
  if (process.env.TEST_MODE === "true") {
    console.log(`WHATSAPP TEST | Nömrə: ${phone} | Kod: ${code}`);
    return { success: true, test: true };
  }

  let to = phone.replace(/\D/g, "");
  if (!to.startsWith("994")) {
    to = to.startsWith("0") ? "994" + to.slice(1) : "994" + to;
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE || "otp_code";
  const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG || "az";
  const hasVar = process.env.WHATSAPP_OTP_TEMPLATE_HAS_VAR !== "false";

  if (!phoneNumberId || !accessToken)
    throw new Error("WhatsApp env vars eksikdir.");

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      ...(hasVar && {
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
        ],
      }),
    },
  };

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
  let response, rawText;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    rawText = await response.text();
  } catch (fetchErr) {
    throw new Error(`WhatsApp bağlantı xətası: ${fetchErr.message}`);
  }

  if (!response.ok)
    throw new Error(`WhatsApp xətası [${response.status}]: ${rawText}`);
  return { success: true };
};

// ─── Bird.com Email ──────────────────────────────────────────────────────────
const sendEmail = async (toEmail, code, lang = "az") => {
  if (process.env.TEST_MODE === "true") {
    console.log("=".repeat(50));
    console.log(`EMAIL TEST | To: ${toEmail} | Kod: ${code} | Lang: ${lang}`);
    console.log("=".repeat(50));
    return { success: true, test: true };
  }

  const workspaceId = process.env.BIRD_WORKSPACE_ID;
  const channelId = process.env.BIRD_CHANNEL_ID;
  const accessKey = process.env.BIRD_ACCESS_KEY;
  const senderEmail =
    process.env.BIRD_SENDER_EMAIL || "no-reply@mail.qurbanet.az";

  console.log(
    "[Bird Email] ENV check — workspaceId:",
    workspaceId ? "OK" : "YOX",
    "| channelId:",
    channelId ? "OK" : "YOX",
    "| accessKey:",
    accessKey ? "OK" : "YOX",
    "| senderEmail:",
    senderEmail,
  );

  if (!workspaceId || !channelId || !accessKey) {
    throw new Error(
      "Bird email env vars (BIRD_WORKSPACE_ID, BIRD_CHANNEL_ID, BIRD_ACCESS_KEY) eksikdir.",
    );
  }

  const isAz = lang === "az";

  const subject = isAz
    ? "QurbanEt — Təsdiqləmə Kodu"
    : "QurbanEt — Verification Code";

  const logoUrl = "https://qurbanet.az/logo.png";
  const green = "#1B6B35";
  const greenBg = "#F0F7F2";

  const html = `<!DOCTYPE html>
<html lang="${isAz ? "az" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${isAz ? "QurbanEt — Təsdiqləmə Kodu" : "QurbanEt — Verification Code"}</title>
  <style>
    body { margin:0; padding:0; background:#F4F6FA; font-family:'Segoe UI',Arial,sans-serif; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; }
    img { border:0; display:block; }
    .wrapper { width:100%; background:#F4F6FA; padding:32px 16px; box-sizing:border-box; }
    .container { width:100%; max-width:600px; margin:0 auto; }
    .header-td { background:${green}; border-radius:16px 16px 0 0; padding:36px 40px 28px; text-align:center; }
    .logo-img { width:80px; height:80px; border-radius:14px; object-fit:contain; }
    .brand-name { margin:0; font-size:32px; font-weight:900; color:#fff; letter-spacing:0.5px; line-height:1.1; }
    .brand-tagline { margin:4px 0 0; font-size:13px; color:rgba(255,255,255,0.65); font-weight:400; letter-spacing:0.3px; }
    .header-link { margin:14px 0 0; font-size:13px; }
    .header-link a { color:rgba(255,255,255,0.80); text-decoration:underline; letter-spacing:0.5px; }
    .body-td { background:#ffffff; padding:40px 48px 32px; }
    .greeting { margin:0 0 20px; font-size:16px; color:#374151; line-height:1.7; }
    .instruction { margin:0 0 28px; font-size:15px; color:#6B7280; line-height:1.7; }
    .code-box-td { background:${greenBg}; border-radius:16px; padding:32px 24px; text-align:center; }
    .code-label { margin:0 0 18px; font-size:12px; color:#6B7280; text-transform:uppercase; letter-spacing:2px; font-weight:700; }
    .code-inner { display:inline-block; background:#ffffff; border:2.5px solid ${green}; border-radius:14px; padding:20px 48px; box-shadow:0 4px 20px rgba(27,107,53,0.13); }
    .code-digits { font-size:48px; font-weight:900; color:${green}; letter-spacing:18px; font-family:'Courier New',Courier,monospace; line-height:1; }
    .code-valid { margin:18px 0 0; font-size:13px; color:#9CA3AF; }
    .notice { margin:28px 0 0; font-size:14px; color:#6B7280; line-height:1.7; background:#FFFBEB; border-left:4px solid #F59E0B; border-radius:0 10px 10px 0; padding:14px 18px; }
    .divider-td { background:#ffffff; padding:0 48px; }
    .footer-td { background:#ffffff; border-radius:0 0 16px 16px; padding:24px 40px 32px; text-align:center; }
    .footer-contact { margin:0 0 6px; font-size:13px; color:#6B7280; }
    .footer-info { margin:0 0 16px; font-size:13px; color:#374151; }
    .footer-copy { margin:0; font-size:12px; color:#9CA3AF; }
    .footer-copy a { color:${green}; text-decoration:none; }

    /* ── Tablet (max-width: 600px) ── */
    @media only screen and (max-width:600px) {
      .wrapper { padding:16px 8px !important; }
      .header-td { padding:28px 20px 22px !important; border-radius:12px 12px 0 0 !important; }
      .logo-img { width:64px !important; height:64px !important; border-radius:10px !important; }
      .brand-name { font-size:26px !important; }
      .body-td { padding:28px 24px 24px !important; }
      .code-box-td { padding:24px 16px !important; border-radius:12px !important; }
      .code-inner { padding:16px 32px !important; border-radius:12px !important; }
      .code-digits { font-size:40px !important; letter-spacing:14px !important; }
      .divider-td { padding:0 24px !important; }
      .footer-td { padding:20px 24px 24px !important; border-radius:0 0 12px 12px !important; }
    }

    /* ── Mobile (max-width: 400px) ── */
    @media only screen and (max-width:400px) {
      .wrapper { padding:12px 4px !important; }
      .header-td { padding:22px 16px 18px !important; }
      .logo-img { width:56px !important; height:56px !important; }
      .brand-name { font-size:22px !important; }
      .brand-tagline { font-size:11px !important; }
      .body-td { padding:22px 16px 18px !important; }
      .greeting { font-size:15px !important; }
      .instruction { font-size:14px !important; }
      .code-inner { padding:14px 20px !important; }
      .code-digits { font-size:34px !important; letter-spacing:10px !important; }
      .notice { font-size:13px !important; padding:12px 14px !important; }
      .footer-td { padding:16px 16px 20px !important; }
      .footer-info { font-size:12px !important; }
    }
  </style>
</head>
<body>
<div class="wrapper">
  <table class="container" cellpadding="0" cellspacing="0" role="presentation">

    <!-- HEADER -->
    <tr>
      <td class="header-td">
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td valign="middle" style="padding-right:16px;">
              <img src="${logoUrl}" alt="QurbanEt" class="logo-img" width="80" height="80">
            </td>
            <td valign="middle" align="left">
              <p class="brand-name">QurbanEt</p>
              <p class="brand-tagline">ETİBARLI · HALAL · SÜRƏTLİ</p>
            </td>
          </tr>
        </table>
        <p class="header-link">
          <a href="https://qurbanet.az">qurbanet.az</a>
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td class="body-td">
        <p class="greeting">${isAz ? "Hörmətli istifadəçi," : "Dear user,"}</p>
        <p class="instruction">${isAz ? "Hesabınıza daxil olmaq üçün aşağıdakı təsdiqləmə kodundan istifadə edin:" : "Use the verification code below to access your account:"}</p>

        <!-- CODE BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td class="code-box-td">
              <p class="code-label">${isAz ? "Təsdiqləmə Kodu" : "Verification Code"}</p>
              <div class="code-inner">
                <span class="code-digits">${code}</span>
              </div>
              <p class="code-valid">
                ${isAz ? 'Bu kod <b style="color:#374151;">5 dəqiqə</b> ərzində etibarlıdır' : 'This code is valid for <b style="color:#374151;">5 minutes</b>'}
              </p>
            </td>
          </tr>
        </table>

        <p class="notice">
          <b style="color:#92400E;">${isAz ? "Diqqət:" : "Notice:"}</b>
          ${isAz ? " Bu email sistem tərəfindən avtomatik göndərilib. Əgər siz bu sorğunu göndərməmisinizsə, bu emaili nəzərə almayın." : " This email was sent automatically. If you did not request this code, please ignore this email."}
        </p>
      </td>
    </tr>

    <!-- DIVIDER -->
    <tr>
      <td class="divider-td">
        <hr style="border:0;border-top:1px solid #F3F4F6;margin:0;">
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td class="footer-td">
        <p class="footer-contact">${isAz ? "Hər hansı sualınız üçün bizimlə əlaqə saxlayın:" : "For any questions, contact us:"}</p>
        <p class="footer-info">
          <b>${isAz ? "Dəstək:" : "Support:"}</b> +994 10 399 02 22
          &nbsp;|&nbsp;
          <b>E-mail:</b> <a href="mailto:info@qurbanet.az" style="color:${green};text-decoration:none;">info@qurbanet.az</a>
        </p>
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 16px;">
          <tr>
            <!-- Instagram -->
            <td style="padding:0 8px;">
              <a href="https://www.instagram.com/qurbanet.az/" target="_blank" style="display:inline-block;text-decoration:none;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="background:linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);border-radius:999px;padding:10px 20px;">
                      <table cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding-right:7px;vertical-align:middle;">
                            <img src="https://qurbanet.az/instagram-icon.svg" alt="Instagram" width="16" height="16" style="display:block;vertical-align:middle;">
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="color:#fff;font-size:13px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;white-space:nowrap;line-height:1;">Instagram</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
            <!-- Facebook -->
            <td style="padding:0 8px;">
              <a href="https://www.facebook.com/profile.php?id=61589737567463" target="_blank" style="display:inline-block;text-decoration:none;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="background:#1877F2;border-radius:999px;padding:10px 20px;">
                      <table cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding-right:7px;vertical-align:middle;">
                            <img src="https://qurbanet.az/facebook-icon.svg" alt="Facebook" width="16" height="16" style="display:block;vertical-align:middle;">
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="color:#fff;font-size:13px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;white-space:nowrap;line-height:1;">Facebook</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
        </table>
        <p class="footer-copy">
          &copy; 2026 <b style="color:#6B7280;">QurbanEt</b> &nbsp;&middot;&nbsp;
          ${isAz ? "Bakı şəhəri, Azərbaycan" : "Baku, Azerbaijan"}
          &nbsp;&middot;&nbsp;
          <a href="https://qurbanet.az">www.qurbanet.az</a>
        </p>
      </td>
    </tr>

  </table>
</div>
</body>
</html>`;

  const text = isAz
    ? `QurbanEt — Təsdiqləmə Kodu\n\nHörmətli istifadəçi,\n\nHesabınıza giriş üçün kodunuz: ${code}\n\nKod 5 dəqiqə ərzində etibarlıdır.\n\nDiqqət: Bu sorğunu siz göndərməmisinizsə, bu emaili nəzərə almayın.\n\nQurbanEt | qurbanet.az`
    : `QurbanEt — Verification Code\n\nDear user,\n\nYour verification code: ${code}\n\nThis code is valid for 5 minutes.\n\nNotice: If you did not request this, please ignore this email.\n\nQurbanEt | qurbanet.az`;

  const url = `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`;

  const payload = {
    receiver: {
      contacts: [{ identifierValue: toEmail }],
    },
    sender: {
      connector: {
        identifierValue: senderEmail,
        annotations: { name: "QurbanEt.az" },
      },
    },
    body: {
      type: "html",
      html: {
        metadata: { subject },
        html,
        text,
      },
    },
  };

  console.log(
    "[Bird Email] Göndərilir:",
    toEmail,
    "| Lang:",
    lang,
    "| URL:",
    url,
  );
  console.log(
    "[Bird Email] Payload:",
    JSON.stringify({
      ...payload,
      body: {
        type: "email",
        email: { subject, html: "[HTML]", text: "[TEXT]" },
      },
    }),
  );

  let response, rawText;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `AccessKey ${accessKey}`,
      },
      body: JSON.stringify(payload),
    });
    rawText = await response.text();
  } catch (fetchErr) {
    console.error("[Bird Email] Bağlantı xətası:", fetchErr.message);
    throw new Error(`Bird Email bağlantı xətası: ${fetchErr.message}`);
  }

  console.log("[Bird Email] HTTP status:", response.status, "| To:", toEmail);
  console.log("[Bird Email] Response body:", rawText);

  if (!response.ok)
    throw new Error(`Bird Email xətası [${response.status}]: ${rawText}`);
  return { success: true };
};

module.exports = { generateOTP, sendSMS, sendWhatsApp, sendEmail };
