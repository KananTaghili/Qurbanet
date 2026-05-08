/**
 * SMS Servisi
 * TEST_MODE=true olduqda OTP həmişə 123456 olur və SMS göndərilmir.
 * Production-da real SMS API (Twilio, ESKIZ, InfoBip, vs.) inteqrasiya edilir.
 */

const generateOTP = () => {
  if (process.env.TEST_MODE === "true") {
    return "123456";
  }
  // 6 rəqəmli random OTP
  return String(Math.floor(100000 + Math.random() * 900000));
};

const sendSMS = async (phone, code) => {
  if (process.env.TEST_MODE === "true") {
    // Test rejimində konsola yaz, SMS göndərmə
    console.log("\n" + "=".repeat(50));
    console.log(`📱 SMS TEST REJİMİ`);
    console.log(`📞 Nömrə: ${phone}`);
    console.log(`🔑 OTP Kodu: ${code}`);
    console.log("=".repeat(50) + "\n");
    return { success: true, test: true };
  }

  // ────────────────────────────────────────────────────────────────
  // PRODUCTION: Buraya real SMS provider inteqrasiyası əlavə edin.
  // Misal: Twilio, ESKIZ.uz, InfoBip, Vonage
  //
  // const twilio = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
  // await twilio.messages.create({
  //   body: `Qurban.az - Doğrulama kodunuz: ${code}. 5 dəqiqə ərzində istifadə edin.`,
  //   from: '+1234567890',
  //   to: phone,
  // });
  // ────────────────────────────────────────────────────────────────

  throw new Error("SMS provaydera qoşulmayıb. TEST_MODE=true edin.");
};

module.exports = { generateOTP, sendSMS };
