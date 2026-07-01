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
    ? "MeatBox — Təsdiqləmə Kodu"
    : "MeatBox — Verification Code";

  const logoUrl = "https://meatbox.az/meatbox_icon.png";

  const html = `<!DOCTYPE html>
<html lang="${isAz ? "az" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${isAz ? "MeatBox — Təsdiqləmə Kodu" : "MeatBox — Verification Code"}</title>
  <style>
    body{margin:0;padding:0;background:#E8E8E8;font-family:'Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%;}
    table{border-collapse:collapse;}
    img{border:0;display:block;}
    @media only screen and (max-width:600px){
      .wr{padding:12px 8px!important;}
      .hd{padding:22px 20px 18px!important;border-radius:14px 14px 0 0!important;}
      .logo{width:44px!important;height:44px!important;}
      .bn{font-size:22px!important;}
      .bd{padding:22px 18px 18px!important;}
      .cb{padding:20px 12px!important;border-radius:12px!important;}
      .ci{padding:12px 24px!important;}
      .cd{font-size:36px!important;letter-spacing:10px!important;}
      .sv{padding:18px 14px 22px!important;}
      .ft{padding:16px 18px 22px!important;border-radius:0 0 14px 14px!important;}
    }
  </style>
</head>
<body>
<div class="wr" style="width:100%;background:#E8E8E8;padding:28px 16px;box-sizing:border-box;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;">

  <!-- ══ HEADER ══ -->
  <tr>
    <td class="hd" style="background:linear-gradient(140deg,#B91C1C 0%,#7F1D1D 100%);border-radius:18px 18px 0 0;padding:28px 36px 22px;text-align:center;">
      <img src="${logoUrl}" class="logo" alt="MeatBox" width="72" height="72"
        style="width:72px;height:72px;border-radius:16px;background:#fff;padding:6px;object-fit:contain;display:inline-block;">
    </td>
  </tr>

  <!-- ══ BODY ══ -->
  <tr>
    <td class="bd" style="background:#ffffff;padding:34px 40px 26px;">
      <p style="margin:0 0 6px;font-size:15px;color:#1F2937;line-height:1.7;font-weight:600;">${isAz ? "Hörmətli istifadəçi," : "Dear user,"}</p>
      <p style="margin:0 0 24px;font-size:13.5px;color:#6B7280;line-height:1.75;">${isAz ? "Hesabınıza daxil olmaq üçün aşağıdakı təsdiqləmə kodundan istifadə edin:" : "Use the verification code below to access your account:"}</p>

      <!-- OTP -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td class="cb" style="background:#FFF5F5;border-radius:16px;padding:28px 16px;text-align:center;">
            <p style="margin:0 0 14px;font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:3.5px;font-weight:700;">${isAz ? "Təsdiqləmə Kodu" : "Verification Code"}</p>
            <div class="ci" style="display:inline-block;background:#fff;border:2px solid #B91C1C;border-radius:14px;padding:16px 40px;box-shadow:0 6px 24px rgba(185,28,28,0.13);">
              <span class="cd" style="font-size:44px;font-weight:900;color:#B91C1C;letter-spacing:14px;font-family:'Courier New',Courier,monospace;line-height:1;">${code}</span>
            </div>
            <p style="margin:14px 0 0;font-size:12px;color:#9CA3AF;">
              ${isAz ? 'Bu kod <strong style="color:#374151;">5 dəqiqə</strong> ərzində etibarlıdır' : 'Valid for <strong style="color:#374151;">5 minutes</strong>'}
            </p>
          </td>
        </tr>
      </table>

      <!-- NOTICE -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:20px;">
        <tr>
          <td style="background:#FFFBEB;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;padding:11px 15px;">
            <p style="margin:0;font-size:12.5px;color:#6B7280;line-height:1.65;">
              <strong style="color:#92400E;">${isAz ? "Diqqət:" : "Notice:"}</strong>
              ${isAz ? " Bu email avtomatik göndərilib. Sorğunu siz göndərməmisinizsə, nəzərə almayın." : " This email was sent automatically. Ignore it if you didn't request a code."}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ SERVICES ══ -->
  <tr>
    <td class="sv" style="background:#F5F3F1;padding:22px 32px 26px;border-top:1px solid #EAE5E0;">
      <p style="margin:0 0 14px;font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:2.5px;font-weight:700;text-align:center;">${isAz ? "Xidmətlərimiz" : "Our Services"}</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>

          <!-- Qurbanlıq -->
          <td width="33%" valign="top" style="padding:0 3px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#ffffff;border-radius:12px;border:1px solid #EAE5E0;padding:14px 8px;text-align:center;">
                  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 8px;">
                    <tr><td width="36" height="36" bgcolor="#0B6C24" style="border-radius:9px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:18px;line-height:36px;">🐑</td></tr>
                  </table>
                  <p style="margin:0;font-size:11px;font-weight:800;color:#0B6C24;line-height:1.3;">${isAz ? "Qurbanlıq" : "Qurban"}</p>
                  <p style="margin:3px 0 0;font-size:10px;color:#9CA3AF;line-height:1.3;">${isAz ? "Onlayn sifariş" : "Online order"}</p>
                </td>
              </tr>
            </table>
          </td>

          <!-- Kollektiv -->
          <td width="33%" valign="top" style="padding:0 3px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#ffffff;border-radius:12px;border:1px solid #EAE5E0;padding:14px 8px;text-align:center;">
                  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 8px;">
                    <tr><td width="36" height="36" bgcolor="#6820A3" style="border-radius:9px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:18px;line-height:36px;">👥</td></tr>
                  </table>
                  <p style="margin:0;font-size:11px;font-weight:800;color:#6820A3;line-height:1.3;">${isAz ? "Kollektiv" : "Collective"}</p>
                  <p style="margin:3px 0 0;font-size:10px;color:#9CA3AF;line-height:1.3;">${isAz ? "Birlikdə qurban" : "Group qurban"}</p>
                </td>
              </tr>
            </table>
          </td>

          <!-- Ət Satışı -->
          <td width="33%" valign="top" style="padding:0 3px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#ffffff;border-radius:12px;border:1px solid #EAE5E0;padding:14px 8px;text-align:center;">
                  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 8px;">
                    <tr><td width="36" height="36" bgcolor="#C85A13" style="border-radius:9px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:18px;line-height:36px;">🥩</td></tr>
                  </table>
                  <p style="margin:0;font-size:11px;font-weight:800;color:#C85A13;line-height:1.3;">${isAz ? "Ət Satışı" : "Meat Sales"}</p>
                  <p style="margin:3px 0 0;font-size:10px;color:#9CA3AF;line-height:1.3;">${isAz ? "Evə çatdırılma" : "Home delivery"}</p>
                </td>
              </tr>
            </table>
          </td>

        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ FOOTER ══ -->
  <tr>
    <td class="ft" style="background:#ffffff;border-radius:0 0 18px 18px;border-top:1px solid #F0EEEC;padding:18px 36px 24px;text-align:center;">
      <p style="margin:0 0 12px;font-size:12px;color:#6B7280;">
        <b>E-mail:</b>&nbsp;<a href="mailto:info@meatbox.az" style="color:#B91C1C;text-decoration:none;font-weight:600;">info@meatbox.az</a>
      </p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 14px;">
        <tr>
          <td style="padding:0 4px;">
            <a href="https://www.instagram.com/meatbox.az/" target="_blank">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);border-radius:999px;padding:7px 16px;">
                    <span style="color:#fff;font-size:11.5px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;white-space:nowrap;">Instagram</span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
          <td style="padding:0 4px;">
            <a href="https://www.facebook.com/meatbox.az" target="_blank">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:#1877F2;border-radius:999px;padding:7px 16px;">
                    <span style="color:#fff;font-size:11.5px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;white-space:nowrap;">Facebook</span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:11px;color:#9CA3AF;">
        &copy; 2026 <b style="color:#6B7280;">MeatBox</b> &nbsp;&middot;&nbsp; ${isAz ? "Bakı, Azərbaycan" : "Baku, Azerbaijan"}
      </p>
    </td>
  </tr>

</table>
</div>
</body>
</html>`;

  const text = isAz
    ? `MeatBox — Təsdiqləmə Kodu\n\nHörmətli istifadəçi,\n\nHesabınıza giriş üçün kodunuz: ${code}\n\nKod 5 dəqiqə ərzində etibarlıdır.\n\nDiqqət: Bu sorğunu siz göndərməmisinizsə, bu emaili nəzərə almayın.\n\nMeatBox | meatbox.az`
    : `MeatBox — Verification Code\n\nDear user,\n\nYour verification code: ${code}\n\nThis code is valid for 5 minutes.\n\nNotice: If you did not request this, please ignore this email.\n\nMeatBox | meatbox.az`;

  const url = `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`;

  const payload = {
    receiver: {
      contacts: [{ identifierValue: toEmail }],
    },
    sender: {
      connector: {
        identifierValue: senderEmail,
        annotations: { name: "MeatBox.az" },
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
