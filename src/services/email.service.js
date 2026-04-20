const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Email server connection failed:", error);
  } else {
    console.log("Email server is ready");
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Pnote" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent:", info.messageId);
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const sendOTPEmail = async (toEmail, otp) => {
  const subject = "Verify your email - OTP";
  const text = `Your OTP is: ${otp}. It expires in 10 minutes.`;
  const html = `
    <h2>Email Verification</h2>
    <p>Your OTP is:</p>
    <h1 style="letter-spacing: 8px;">${otp}</h1>
    <p>This OTP expires in <b>10 minutes</b>.</p>
  `;
  await sendEmail(toEmail, subject, text, html);
};

const sendWelcomeEmail = async (userEmail, name) => {
  const subject = "Welcome to Pnote!";
  const text = `Hello ${name},\n\nThank you for registering at Pnote. We're excited to have you on board!\n\nBest regards,\nThe Pnote Team`;
  const html = `
    <h2>Hello ${name},</h2>
    <p>Thank you for registering at Pnote.</p>
    <p>We're excited to have you on board!</p>
    <p>Best regards,<br>The Pnote Team</p>
  `;
  await sendEmail(userEmail, subject, text, html);
};

module.exports = { sendOTPEmail, sendWelcomeEmail };