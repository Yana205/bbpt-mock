module.exports = { testDir: './tests', timeout: 20000, use: { headless: true, launchOptions: process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : {} } };
