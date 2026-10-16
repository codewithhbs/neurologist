require("dotenv").config();
const app = require("./app");
const cron = require("node-cron");
const { runAppointmentReminders } = require("./jobs/reminder");
const PORT = process.env.PORT || 5680;

// Schedule appointment reminders
cron.schedule("*/5 * * * *", runAppointmentReminders); // Run every 5 minutes
app.listen(PORT, () => {
  console.log(`🦷 DHIC Backend running on http://localhost:${PORT}`);
});
