require('dotenv').config({ path: require('path').join(__dirname, '.env'), quiet: true });

module.exports = {
  port: process.env.PORT || 3000,
  finnhubKey: process.env.FINNHUB_KEY || null,
  tiingoKey: process.env.TIINGO_KEY || null,
};
