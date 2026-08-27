// Manual trigger for the Phase 9 daily DCA job, so it can be verified
// without waiting for the 22:00 America/New_York cron schedule.
// Safe to re-run same-day: the job dedupes on (source, security, date).

const { runDailyDca } = require('../lib/dailyDca');

runDailyDca()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((err) => {
    console.error('Daily DCA run failed:', err);
    process.exitCode = 1;
  });
