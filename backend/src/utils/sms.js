const SMSPLUS_API_URL = "https://smsplus.az/api/sms/send";

const generateOTP = () => {
  if (process.env.TEST_MODE === "true") {
    return "123456";
  }
  return String(Math.floor(100000 + Math.random() * 900000));
};

const sendSMS = async (phone, code) => {
  if (process.env.TEST_MODE === "true") {
    console.log("=".repeat(50));
    console.log(`SMS TEST REJİMİ | Nömrə: ${phone} | Kod: ${code}`);
    console.log("=".repeat(50));
    return { success: true, test: true };
  }

  // Strip everything except digits (+, spaces, dashes removed)
  let mobileNumber = phone.replace(/\D/g, "");
  if (mobileNumber.startsWith("994")) {
    // already correct: 994773027515
  } else if (mobileNumber.startsWith("0")) {
    mobileNumber = "994" + mobileNumber.slice(1); // 0773027515 → 994773027515
  } else {
    mobileNumber = "994" + mobileNumber; // 773027515 → 994773027515
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

  console.log("[SMS PLUS] ENV yoxla:");
  console.log("  TOKEN:", token ? token.slice(0, 10) + "..." : "YOX!");
  console.log("  TEMPLATE_ID:", templateId);
  console.log("  SENDER_NAME:", senderName || "(boş)");
  console.log("[SMS PLUS] Sorğu body:", JSON.stringify(body));

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
    console.error("[SMS PLUS] Bağlantı xətası:", fetchErr.message);
    throw new Error(`SMS PLUS bağlantı xətası: ${fetchErr.message}`);
  }

  console.log("[SMS PLUS] HTTP status:", response.status, "| Cavab:", rawText);

  if (!response.ok) {
    throw new Error(`SMS PLUS xətası [HTTP ${response.status}]: ${rawText}`);
  }

  console.log("[SMS PLUS] SMS uğurla göndərildi:", mobileNumber);
  return { success: true };
};

module.exports = { generateOTP, sendSMS };
