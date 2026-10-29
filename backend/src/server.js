require("dotenv").config();
const app = require("./app");
const cron = require("node-cron");
const { runAppointmentReminders } = require("./jobs/reminder");
const PORT = process.env.PORT || 5000;

// Schedule appointment reminders (every 5 minutes)
cron.schedule("*/5 * * * *", () => {
  runAppointmentReminders().catch((err) => {
    console.error("Scheduled appointment reminder error:", err.message);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
