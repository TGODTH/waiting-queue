const path = require('path');
const fs = require("fs");

const output = "../pid2"
const defaultSettings = {
    user: 'mso',
    password: '123',
    server: 'localhost',
    database: 'mso',
    port: 3000,
    query_delay: 5000,
    clinic_prefix: 'clinic_'
};

class CreateSettingsFilePlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tap('CreateSettingsFilePlugin', (compilation) => {
            const settingsFilePath = path.resolve(__dirname, output + "/settings.txt");
            const settingsContent = Object.entries(defaultSettings).map(([key, value]) => `${key}=${value}`).join('\n');
            fs.writeFileSync(settingsFilePath, settingsContent);
        });
    }
}

module.exports = {
    target: 'node',
    entry: './server.js',
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname, output),
    }, plugins: [
        new CreateSettingsFilePlugin(),
    ],
};