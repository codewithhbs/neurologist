const axios = require("axios");

const WAPP_API_URL = process.env.WAPP_API_URL;
const WAPP_API_TOKEN = process.env.WAPP_API_TOKEN;
const WAPP_ADMIN_PHONE_NUMBER = process.env.WAPP_ADMIN_PHONE_NUMBER;
const WAPP_COUNTRY = process.env.WAPP_COUNTRY || "IN";
const BRAND_NAME = process.env.BRAND_NAME || "Dr Neeraj Kumar Neurologist";

const AUTO_REPLY_NOTE = "_This is an automated message. Please do not reply._";

const normalizeMobile = (mobile) => {
  if (!mobile) throw new Error("Mobile number is required");

  let number = String(mobile).replace(/\D/g, "");

  if (number.startsWith("91") && number.length === 12) {
    number = number.substring(2);
  }

  if (number.length !== 10) {
    throw new Error(`Invalid mobile number: ${mobile}`);
  }

  return number;
};

const sendWhatsappMessage = async (to, message, options = {}) => {
  try {
    if (!WAPP_API_URL || !WAPP_API_TOKEN) {
      console.warn(`[WhatsApp] Skipped: WAPP_API_URL or WAPP_API_TOKEN not set (recipient: ${to})`);
      return { success: false, skipped: true };
    }

    if (!to) {
      console.warn("[WhatsApp] Skipped: missing recipient phone number");
      return { success: false, skipped: true };
    }

    if (!message || !message.trim()) {
      throw new Error("WhatsApp message cannot be blank");
    }

    const mobile = normalizeMobile(to);

    const params = {
      apikey: WAPP_API_TOKEN,
      mobile,
      msg: message,
      country: WAPP_COUNTRY,
    };

    if (options.pdf) params.pdf = options.pdf;
    if (options.img1) params.img1 = options.img1;
    if (options.img2) params.img2 = options.img2;
    if (options.scheduleon) params.scheduleon = options.scheduleon;

    const response = await axios.get(WAPP_API_URL, { params, timeout: 15000 });
    const data = response.data;

    if (data?.statuscode !== 200) {
      throw new Error(
        data?.errormsg ||
          data?.msg ||
          `WhatsApp API failed with status ${data?.statuscode}`,
      );
    }

    console.log(`[WhatsApp] Message successfully sent to ${mobile}`);
    return data;
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", {
      to,
      message: error.message,
      response: error.response?.data,
    });
    return { success: false, error: error.message };
  }
};

const sendOtpWhatsapp = async (mobile, otp) => {
  const message =
    `*${BRAND_NAME}*\n\n` +
    `Your OTP is *${otp}*.\n` +
    `Valid for 10 minutes. Do not share this OTP with anyone.\n\n` +
    `${AUTO_REPLY_NOTE}`;

  return sendWhatsappMessage(mobile, message);
};

const sendBookingSuccessWhatsapp = async ({
  mobile,
  customerName,
  bookingId,
  doctorName,
  date,
  time,
}) => {
  const message =
    `*${BRAND_NAME}*\n\n` +
    `Hi ${customerName}, your appointment is confirmed ✅\n\n` +
    `Booking ID: ${bookingId}\n` +
    `Doctor: ${doctorName}\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n\n` +
    `Please arrive 10 minutes early.\n\n` +
    `Thank you for choosing ${BRAND_NAME}.\n\n` +
    `${AUTO_REPLY_NOTE}`;

  return sendWhatsappMessage(mobile, message);
};

const sendBookingCancelledWhatsapp = async ({
  mobile,
  customerName,
  bookingId,
  doctorName,
  date,
  time,
}) => {
  const message =
    `*${BRAND_NAME}*\n\n` +
    `Hi ${customerName}, your appointment has been cancelled ❌\n\n` +
    `Booking ID: ${bookingId}\n` +
    `Doctor: ${doctorName}\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n\n` +
    `If this was a mistake, please contact us to rebook.\n\n` +
    `${AUTO_REPLY_NOTE}`;

  return sendWhatsappMessage(mobile, message);
};

const sendBookingReminderWhatsapp = async ({
  mobile,
  customerName,
  bookingId,
  doctorName,
  date,
  time,
}) => {
  const message =
    `*${BRAND_NAME}*\n\n` +
    `Hi ${customerName}, this is a reminder for your upcoming appointment ⏰\n\n` +
    `Booking ID: ${bookingId}\n` +
    `Doctor: ${doctorName}\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n\n` +
    `Please arrive 10 minutes early.\n\n` +
    `${AUTO_REPLY_NOTE}`;

  return sendWhatsappMessage(mobile, message);
};

const sendNewBookingAdminWhatsapp = async ({
  customerName,
  customerMobile,
  bookingId,
  doctorName,
  date,
  time,
}) => {
  if (!WAPP_ADMIN_PHONE_NUMBER) {
    return { success: false, skipped: true };
  }
  const message =
    `🔔 *New Appointment Booking*\n\n` +
    `Customer: ${customerName}\n` +
    `Mobile: ${customerMobile}\n` +
    `Booking ID: ${bookingId}\n` +
    `Doctor: ${doctorName}\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n\n` +
    `Check the admin panel for full details.\n\n` +
    `${AUTO_REPLY_NOTE}`;

  return sendWhatsappMessage(WAPP_ADMIN_PHONE_NUMBER, message);
};

const sendContactFormAdminWhatsapp = async ({
  name,
  mobile,
  email,
  subject,
  message: contactMessage,
}) => {
  if (!WAPP_ADMIN_PHONE_NUMBER) {
    return { success: false, skipped: true };
  }
  const message =
    `📩 *New Contact Form Submission*\n\n` +
    `Name: ${name}\n` +
    `Mobile: ${mobile}\n` +
    `Email: ${email}\n` +
    `Subject: ${subject || "N/A"}\n\n` +
    `Message:\n${contactMessage}\n\n` +
    `Check the admin panel for full details.\n\n` +
    `${AUTO_REPLY_NOTE}`;

  return sendWhatsappMessage(WAPP_ADMIN_PHONE_NUMBER, message);
};

module.exports = {
  sendWhatsappMessage,
  sendOtpWhatsapp,
  sendBookingSuccessWhatsapp,
  sendBookingCancelledWhatsapp,
  sendBookingReminderWhatsapp,
  sendNewBookingAdminWhatsapp,
  sendContactFormAdminWhatsapp,
};
