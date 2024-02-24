import { extension_settings, getContext } from '../../../extensions.js';

const extensionName = 'anlatan-nai-extras';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const appContext = getContext();

loadSettings();
let extensionSettings = extension_settings[extensionName];


/**
 * Populate extension settings
 */
function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    const extensionKeys = Object.keys(extension_settings[extensionName]);
    const defaultKeys = Object.keys(defaultSettings);

    for (const key of defaultKeys) {
        if (!extensionKeys.includes(key)) {
            extension_settings[extensionName][key] = defaultSettings[key];
        }
    }
}

async function init() {
    const response = await fetch((`${extensionFolderPath}/ExtensionSettings.html`));
    const settingsHtml = await response.text();

    const container = document.getElementById('extensions_settings2');
    container.insertAdjacentHTML('beforeend', settingsHtml);
}

let naiExtrasInitialized = false;

/**
 * Entry point for extension
 */
(async function () {
    await init();
})();
