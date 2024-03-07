# OpenRouter Roulette for SillyTavern
Like Buckshot Roulette, but with LLMs.

This extension allows you to define a number of different OpenRouter models and/or presets. When you generate a new message, one of these models is selected at random. A list can be defined globally or per character. [Example Screenshot](example.png).

## Installation

Via the SillyTavern Extension installer. Open your SillyTavern installation. Select the 'Extensions' Tab and click on 'Install Extension', now paste the repository URL into the input field and click save.

## How to use

After Installation, select OpenRouter as chat completion source, then select a character. At the very end of the 'Ai Response Configuration' sidebar, open the OpenRouter Roulette drawer and click 'Add Model'. The currently selected model will be added to the list.

You can do this for as many models as you like, even add the same model twice with different presets. Though preset swapping takes some time so use it sparingly. 

The probabilities are weighted, so you can go to values above 100.

Clicking the 'Save' button will copy the current settings to the selected character. These settings will be autoloaded the next time this character is selected. Setting changes are life, it is not necessary to click the save button after every change.

## Swiping 

A swipe will re-generate using the last successfully selected model. 

## Known Issues

Preset changing on-the-fly boils down to switching the preset and hoping for the best. In rare cases the generation might not be triggered after a preset change.
