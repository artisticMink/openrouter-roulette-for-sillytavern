'use strict';

import { extension_settings } from '../../../extensions.js';
import { createDomElement, getDomElement } from './utility.js';
import {
    callPopup,
    characters,
    event_types,
    eventSource,
    saveSettingsDebounced,
    this_chid,
} from '../../../../script.js';
import { uuidv4 } from '../../../utils.js';

// Extension setup
const extensionName = 'openrouter-roulette-for-sillytavern';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
    models: [],
    characters: {},
};

loadSettings();
let extensionSettings = extension_settings[extensionName];

// 'Extensions' container on the sidebar
const sidebar = getDomElement('ai_response_configuration');
const extensionContainerIdentifier = 'ai_response_configuration_extensions';
let extensionContainer = getDomElement(extensionContainerIdentifier);

// Global references for send-button and send-button overlay
let sendButton = null;
let fakeButton = null;

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Saves the current settings to the selected character.
 *
 * This method displays a confirmation popup to confirm if the user wants to bind
 * the current settings to the selected character. The settings are copied to the
 * character settings, then the settings source is swapped to the selected character
 * and the settings are saved.
 *
 * @return {void}
 */
function onSaveToCharacterClick() {
    if (!this_chid) return;

    const popupMessage = `<br><p><b>Bind the current settings to the selected character?</b></p>
        <p>Your settings are copied to this character and loaded whenever this character is selected. If you change the character name, your settings will be lost.</p>`;

    callPopup(popupMessage, 'confirm').then(accept => {
        if (true !== accept) return;

        copySettingsToCharacterSettings(this_chid);
        swapSettingsSource(this_chid);

        saveSettingsDebounced();
    });
}

/**
 * Copy settings to character settings.
 *
 * @param {string} characterId - The ID of the character.
 * @return {void}
 */
function copySettingsToCharacterSettings(characterId) {
    const name = characters[characterId].data.name;
    const characterSettings = structuredClone(extensionSettings);

    delete characterSettings.characters;

    extension_settings[extensionName].characters[name] = characterSettings;
}

/**
 * Swaps the settings configuration object.
 *
 * If a character ID is provided, the settings are swapped to the settings specific to that character.
 * If no character ID is provided, the settings are swapped to the default settings.
 *
 * @param {string} [characterId] - The ID of the character to swap the settings to.
 */
function swapSettingsSource(characterId = null) {
    swapToDefaultSettings();

    if (characterId) {
        const characterName = characters[characterId].data.name;
        if (Object.prototype.hasOwnProperty.call(extensionSettings.characters, characterName)) {
            extensionSettings = extensionSettings.characters[characterName];
            document.getElementById('openrouter-roulette-characterSelected').textContent = characterName;
        }
    }

    updateModelList();
}

/**
 * Swaps to the default settings object.
 *
 * @returns {void}
 */
function swapToDefaultSettings() {
    extensionSettings = extension_settings[extensionName];
    document.getElementById('openrouter-roulette-characterSelected').textContent = 'Default';
}

/**
 * Adds a model to the extension settings.
 *
 * @param {object} options - The options for the model.
 * @param {string} options.uuid - The UUID of the model.
 * @param {string} options.modelName - The name of the model.
 * @param {string} options.preset - The preset of the model.
 * @param {number} options.probability - The probability of the model being selected.
 *
 * @return {void}
 */
function addModelToExtensionSettings({ uuid, modelName, preset, probability } = {}) {
    extensionSettings.models.push(
        {
            uuid,
            modelName,
            preset,
            probability,
        },
    );
}

/**
 * Removes a model with the specified UUID from the extension settings.
 *
 * @param {string} uuid - The UUID of the model to be removed.
 */
function removeModelFromExtensionSettings(uuid) {
    extensionSettings.models = extensionSettings.models.filter(model => model.uuid !== uuid);
}

/**
 * Updates the model with the specified UUID.
 *
 * @param {string} uuid - The UUID of the model to be updated.
 * @param {object} update - The updated values for the model.
 * @returns {Promise<object|null>} - A Promise that resolves to the updated model object if it exists, or null if it doesn't.
 */
async function updateModel(uuid, update) {
    const model = extensionSettings?.models?.find(model => model.uuid === uuid);

    if (model instanceof Object) {
        Object.assign(model, update);
        saveSettingsDebounced();
        await updateModelList();
        return model;
    } else {
        return null;
    }
}

/**
 * Removes a model from the extension settings and updates the model list.
 *
 * @param {Event} event - The event object that triggered the model removal.
 * @returns {Promise<void>} - A promise that resolves when the model is successfully removed and the settings are saved.
 */
async function removeModel(event) {
    const uuid = event.target.dataset.orrUuid;

    await removeModelFromExtensionSettings(uuid);
    await updateModelList();

    await saveSettingsDebounced();
}

/**
 * Adds a model to the extension settings with the provided model name and preset.
 * Updates the model list and saves the settings.
 *
 * @returns {Promise<void>} - A Promise that resolves when the model is successfully added and the settings are updated.
 */
async function addModel() {
    const modelName = getDomElement('model_openrouter_select').value;
    const preset = getDomElement('settings_preset_openai').selectedOptions[0].text;

    addModelToExtensionSettings({
        uuid: uuidv4(),
        modelName,
        preset,
        probability: 0,
    });

    await updateModelList();
    await saveSettingsDebounced();
}

/**
 * Updates the model list in the DOM.
 *
 * @returns {Promise<void>} - A promise that resolves when the model list is updated.
 */
async function updateModelList() {
    const modelTable = getDomElement('openrouter-roulette-models');
    const tableBody = modelTable.querySelector('tbody');

    // Reset model table
    tableBody.innerHTML = '<tr><td colspan="4"><hr/></td></tr>';

    // Add two rows for each model to the model table
    extensionSettings.models.forEach((model, index) =>  {
        // First row
        const nameRow = createDomElement('tr', '');
        const nameColumn = createDomElement('td', model.modelName,{ style:'font-weight: bold;', colspan: 3 });
        const actionColumn = createDomElement('td', '');
        const actionButton = createDomElement('button', 'Remove', {
            'data-orr-uuid': model.uuid,
            class: 'menu_button openrouter-roulette-removeModel openrouter-roulette-selfAlignRight',
        }, removeModel);

        nameRow.append(nameColumn);

        actionColumn.append(actionButton);
        nameRow.append(actionColumn);

        // Second row
        const modelRow = createDomElement('tr', '');
        const presetColumn = createDomElement('td', model.preset ?? '-');

        const rangeInput = createDomElement(
            'input',
            '',
            { type: 'range', step: 10, min: 0, max: 100 , value: model.probability },
            event => updateModel(model.uuid, { probability: event.target.value }),
            'mouseup');
        const rangeColumn = createDomElement('td', rangeInput, { colspan: 2, class: 'openrouter-roulette-textAlignCenter' });

        const probabilityInput = createDomElement(
            'input',
            '',
            { type: 'text', disabled: true, value: model.probability + ' %' });
        const probabilityColumn = createDomElement('td', probabilityInput, { class: 'openrouter-roulette-textAlignCenter' });

        modelRow.append(presetColumn);
        modelRow.append(rangeColumn);
        modelRow.append(probabilityColumn);
        tableBody.append(nameRow, modelRow);
    });
}

/**
 * Retrieves the content of a template file.
 *
 * @param {string} templateName - The name of the template file without the file extension.
 * @returns {Promise<string>} - A Promise that resolves with the content of the template file as a string.
 */
async function getTemplate(templateName) {
    const response = await fetch((`${extensionFolderPath}/${templateName}.html`));
    return await response.text();
}

/**
 * Chooses a model based on their probabilities.
 *
 * @param {Array} modelSelection - An array of model objects.
 * @param {number} modelSelection[].probability - The probability of selecting the model.
 * @returns {*} - The chosen model object.
 */
function chooseModel(modelSelection) {
    let models = structuredClone(modelSelection);

    let cumulativeProbability = 0;
    const thresholds = models.map(model => {
        cumulativeProbability += Number(model.probability);
        return cumulativeProbability;
    });

    const random = Math.random() * cumulativeProbability;
    for (let i = 0; i < thresholds.length; i++) {
        if (random <= thresholds[i]) return models[i];
    }
}

/**
 * Switches the preset value in the settings dropdown.
 *
 * @param {string} preset - The value of the preset to switch to.
 *
 * @return {void}
 */
function switchPreset(preset) {
    const presetSelect = getDomElement('settings_preset_openai');
    presetSelect.selectedIndex = [...presetSelect.options].findIndex (option => option.text === preset);
    presetSelect.dispatchEvent(new Event('change'));
}

/**
 * Sets the value of the model select element with the given name and triggers a change event.
 *
 * @param {string} name - The name of the model to switch to.
 * @return {void}
 */
function switchOpenRouterModel(name) {
    const modelSelect = getDomElement('model_openrouter_select');
    modelSelect.value = name;
    modelSelect.dispatchEvent(new Event('change'));
}

/**
 * This method is called when pressing the send button.
 * It prevents the default behavior and stops the event propagation.
 * Triggers the send button manually after model and/or preset are changed.
 *
 * @param {Event} event - The event object triggered when sending the message.
 *
 * @return {void}
 */
function beforeSendMessage(event) {
    event.preventDefault();
    event.stopPropagation();

    const presetSelect = getDomElement('settings_preset_openai');
    const model = chooseModel(extensionSettings.models);

    if (presetSelect.value !== model.preset) {
        switchPreset(model.preset);

        // This will probably maybe eventually work most of the time.
        sleep(3000).then(() => {
            switchOpenRouterModel(model.modelName);
            sleep(100).then(() => sendButton.dispatchEvent(new Event('click')));
        });
    } else {
        switchOpenRouterModel(model.modelName);

        sleep(100).then(() => sendButton.dispatchEvent(new Event('click')));
    }
}

/**
 * Retrieves the name of a chatcompletion preset given its index.
 *
 * @param {number} presetIndex - The index of the preset.
 * @returns {string} - The name of the preset, or null if the preset is not found.
 */
function getPresetName(presetIndex) {
    return document.querySelector(`#settings_preset_openai option[value="${presetIndex}"]`)?.text;
}

const swapSettingsSourceHandle = () => swapSettingsSource(this_chid);

/**
 * Initializes the extension
 *
 * @returns {Promise<void>} A promise that resolves when the extension and its settings are loaded successfully.
 */
async function loadExtension() {
    if (!extensionContainer) {
        // Add extension container if no other extension has already done it
        const extensionContainerHtml = await getTemplate('ExtensionContainer');
        sidebar.insertAdjacentHTML('beforeend', extensionContainerHtml);
        extensionContainer = getDomElement(extensionContainerIdentifier);
    }

    const containerHtml = await getTemplate('ExtensionSettings');
    extensionContainer.insertAdjacentHTML('beforeend', containerHtml);

    getDomElement('openrouter-roulette-saveToCharacter').addEventListener('click', onSaveToCharacterClick);
    getDomElement('openrouter-roulette-addModel').addEventListener('click', addModel);

    eventSource.on(event_types.CHAT_CHANGED, swapSettingsSourceHandle);

    // Put an overlay over the send button to capture any click events
    sendButton = getDomElement('send_but');
    sendButton.style.position = 'relative';

    fakeButton = createDomElement('button', '', { id: 'openrouter-roulette-sendbut-overlay' });
    fakeButton.addEventListener('click', beforeSendMessage);
    sendButton.append(fakeButton);

    if (this_chid) swapSettingsSource(this_chid);
    await updateModelList();
}

/**
 * Unloads the extension by removing its elements, removing event listeners, and cleaning up variables.
 *
 * @function unloadExtension
 * @return {void}
 */
function unloadExtension() {
    extensionContainer.querySelector('#openrouter-roulette-container').remove();
    eventSource.removeListener(event_types.CHAT_CHANGED, swapSettingsSourceHandle);
    fakeButton.remove();
    fakeButton = null;
    sendButton = null;
}

/**
 * Checks whether openrouter is main api
 *
 * @returns {boolean}
 */
function isOpenRouter() {
    return getDomElement('chat_completion_source').value === 'openrouter';
}

/**
 * Entry point for extension
 */
(async function () {
    if (isOpenRouter()) await loadExtension();
    getDomElement('chat_completion_source')
        .addEventListener('change', async (event) => {
            if (isOpenRouter()) await loadExtension();
            else await unloadExtension();
        });
})();
