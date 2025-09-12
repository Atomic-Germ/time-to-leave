'use strict';

import { applyTheme } from '../renderer/themes.js';
import i18nTranslator from '../renderer/i18n-translator.js';

// Global values for preferences page
let preferences;

function populateLanguages()
{
    if (!window.preferencesApi || !window.preferencesApi.getLanguageMap)
    {
        return;
    }

    const languageOpts = $('#language');
    languageOpts.empty();
    $.each(window.preferencesApi.getLanguageMap(), (key, value) =>
    {
        languageOpts.append(
            $('<option />')
                .val(key)
                .text(value)
        );
    });
    // Select current display language
    /* istanbul ignore else */
    if ('language' in preferences)
    {
        $('#language').val(preferences['language']);
    }
}

function listenerLanguage()
{
    $('#language').on('change', function()
    {
        preferences['language'] = this.value;
        window.preferencesApi.changeLanguagePromise(this.value).then((languageData) =>
        {
            i18nTranslator.translatePage(this.value, languageData, 'Preferences');
            window.preferencesApi.notifyNewPreferences(preferences);
        });
    });
}

function setupLanguages()
{
    populateLanguages();
    listenerLanguage();
    window.rendererApi.getLanguageDataPromise().then(languageData =>
    {
        i18nTranslator.translatePage(preferences['language'], languageData.data, 'Preferences');
    });
}

function resetContent()
{
    preferences = window.preferencesApi.getDefaultPreferences();
    renderPreferencesWindow();
    window.preferencesApi.notifyNewPreferences(preferences);
}

function changeValue(type, newVal)
{
    preferences[type] = newVal;
    window.preferencesApi.notifyNewPreferences(preferences);
}

function convertTimeFormat(entry)
{
    const colonIdx = entry.indexOf(':');
    const containsColon = colonIdx !== -1;
    const periodIdx = entry.indexOf('.');
    const containsPeriod = periodIdx !== -1;
    const singleStartDigit = (containsColon && colonIdx <= 1) || (containsPeriod && periodIdx <= 1);
    if (containsColon)
    {
        /* istanbul ignore else */
        if (singleStartDigit)
        {
            entry = '0'.concat(entry);
        }
    }
    else if (containsPeriod)
    {
        let minutes = parseFloat('0'.concat(entry.substring(periodIdx)));
        minutes *= 60;
        minutes = Math.floor(minutes).toString();
        minutes = minutes.length < 2 ? '0'.concat(minutes) : minutes.substring(0, 2);
        entry = entry.substring(0, periodIdx).concat(':').concat(minutes);
        /* istanbul ignore else */
        if (singleStartDigit)
        {
            entry = '0'.concat(entry);
        }
    }
    else
    {
        /* istanbul ignore else */
        if (entry.length < 2)
        {
            entry = '0'.concat(entry);
        }
        entry = entry.concat(':00');
    }
    return entry;
}

function renderWindowTheme()
{
    // Theme-handling should be towards the top. Applies theme early so it's more natural.
    const theme = 'theme';

    // Check for saved theme data
    if (theme in preferences)
    {
        $('#' + theme).val(preferences[theme]);
    }

    const selectedThemeOption = $('#' + theme).children('option:selected').val();
    preferences[theme] = selectedThemeOption;
    applyTheme(selectedThemeOption);
}

function renderPreferencesWindow()
{
    /* istanbul ignore else */
    if ('view' in preferences)
    {
        $('#view').val(preferences['view']);
    }

    $('input').each(function()
    {
        const input = $(this);
        const name = input.attr('name');
        /* istanbul ignore else */
        if (input.attr('type') === 'checkbox')
        {
            /* istanbul ignore else */
            if (name in preferences)
            {
                input.prop('checked', preferences[name]);
            }
            preferences[name] = input.prop('checked');
        }
        else if (
            ['text', 'number', 'date'].indexOf(input.attr('type')) > -1
        )
        {
            /* istanbul ignore else */
            if (name in preferences)
            {
                input.val(preferences[name]);
            }
            preferences[name] = input.val();
        }
    });

    const prefillBreak = $('#enable-prefill-break-time');
    const breakInterval = $('#break-time-interval');

    breakInterval.prop('disabled', !prefillBreak.is(':checked'));

    const notification = $('#notification');
    const repetition = $('#repetition');
    const notificationsInterval = $('#notifications-interval');

    repetition.prop('disabled', !notification.is(':checked'));
    repetition.prop(
        'checked',
        notification.is(':checked') && preferences['repetition']
    );
    notificationsInterval.prop('disabled', !repetition.is(':checked'));
}

function showError(inputElement, message)
{
    const errorId = inputElement.getAttribute('aria-describedby');
    if (errorId)
    {
        const errorElement = document.getElementById(errorId);
        if (errorElement)
        {
            errorElement.textContent = message;
            inputElement.setAttribute('aria-invalid', 'true');
        }
    }
}

function clearError(inputElement)
{
    const errorId = inputElement.getAttribute('aria-describedby');
    if (errorId)
    {
        const errorElement = document.getElementById(errorId);
        if (errorElement)
        {
            errorElement.textContent = '';
            inputElement.setAttribute('aria-invalid', 'false');
        }
    }
}

function showSuccess(message)
{
    const successAlert = document.createElement('div');
    successAlert.className = 'success-message';
    successAlert.setAttribute('role', 'status');
    successAlert.setAttribute('aria-live', 'polite');
    successAlert.textContent = message;

    document.body.appendChild(successAlert);
    setTimeout(() =>
    {
        successAlert.classList.add('fade-out');
        setTimeout(() => successAlert.remove(), 1000);
    }, 3000);
}

function setupFocusTrap(element)
{
    if (!element || !document)
    {
        return;
    }

    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e)
    {
        if (e.key === 'Tab')
        {
            if (e.shiftKey)
            {
                if (document.activeElement === firstFocusable)
                {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            }
            else
                if (document.activeElement === lastFocusable)
                {
                    firstFocusable.focus();
                    e.preventDefault();
                }
        }
    });
}

function handleKeyboardShortcuts(event)
{
    // Check if document is available (for test environment compatibility)
    if (typeof document === 'undefined')
    {
        return;
    }

    // Show keyboard shortcuts dialog
    if (event.key === '?')
    {
        const dialog = document.getElementById('keyboard-shortcuts');
        dialog.showModal();
        return;
    }

    // Handle other shortcuts
    if (event.altKey)
    {
        switch (event.key.toLowerCase())
        {
        case 'r':
            document.getElementById('reset-button').click();
            break;
        case 't':
            document.getElementById('theme').focus();
            break;
        }
    }
    else if (event.ctrlKey && event.key.toLowerCase() === 's')
    {
        event.preventDefault();
        window.preferencesApi.notifyNewPreferences(preferences);
    }
}

function setupRTL()
{
    // Check if document is available (for test environment compatibility)
    if (typeof document === 'undefined')
    {
        return;
    }

    const isRTL = document.documentElement.dir === 'rtl';
    document.body.classList.toggle('rtl', isRTL);

    // Adjust layouts for RTL
    const flexBoxes = document.querySelectorAll('.flex-box');
    flexBoxes.forEach(box =>
    {
        box.style.flexDirection = isRTL ? 'row-reverse' : 'row';
    });
}

function handleDialogClose(dialog)
{
    if (dialog)
    {
        const closeButton = dialog.querySelector('.dialog-close');
        if (closeButton)
        {
            closeButton.addEventListener('click', () =>
            {
                dialog.close();
            });
        }

        dialog.addEventListener('keydown', (e) =>
        {
            if (e.key === 'Escape')
            {
                dialog.close();
            }
        });
    }
}

function setupListeners()
{
    // Check if document is available (for test environment compatibility)
    if (typeof document === 'undefined')
    {
        return;
    }

    // Set up keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Set up RTL support
    setupRTL();

    // Set up dialog close handlers and focus trap for accessibility
    const keyboardDialog = document.getElementById('keyboard-shortcuts');
    handleDialogClose(keyboardDialog);
    setupFocusTrap(keyboardDialog);

    // Handle form validation
    document.querySelectorAll('input[type="number"]').forEach(input =>
    {
        input.addEventListener('input', function()
        {
            if (this.validity.rangeOverflow)
            {
                showError(this, `Value must be less than or equal to ${this.max}`);
            }
            else if (this.validity.rangeUnderflow)
            {
                showError(this, `Value must be greater than or equal to ${this.min}`);
            }
            else if (this.validity.valueMissing)
            {
                showError(this, 'This field is required');
            }
            else
            {
                clearError(this);
            }
        });
    });

    $('input[type="checkbox"]').on('change', function()
    {
        changeValue(this.name, this.checked);
    });

    $('#hours-per-day, #break-time-interval').on('change', function()
    {
        /* istanbul ignore else */
        if (this.checkValidity() === true)
        {
            const entry = convertTimeFormat(this.value);
            this.value = entry;
            changeValue(this.name, entry);
        }
    });

    $('input[type="number"], input[type="date"]').on('change', function()
    {
        changeValue(this.name, this.value);
    });

    $('#theme').on('change', function()
    {
        changeValue('theme', this.value);
        applyTheme(this.value);
    });

    $('#view').on('change', function()
    {
        changeValue('view', this.value);
    });

    $('#save').on('click', function(event)
    {
        // Save preferences
        window.rendererApi.setOriginalUserPreferences(preferences);
        window.preferencesApi.notifyNewPreferences(preferences);
        showSuccess('Preferences saved successfully');
        event.preventDefault();
        $('#close').trigger('click');
    });

    $('#reset-button').on('click', function()
    {
        window.rendererApi.getLanguageDataPromise().then(languageData =>
        {
            const options = {
                type: 'question',
                buttons: [i18nTranslator.getTranslationInLanguageData(languageData.data, '$Preferences.yes'), i18nTranslator.getTranslationInLanguageData(languageData.data, '$Preferences.no')],
                defaultId: 1,
                cancelId: 1,
                message: i18nTranslator.getTranslationInLanguageData(languageData.data, '$Preferences.reset-preferences'),
                detail: i18nTranslator.getTranslationInLanguageData(languageData.data, '$Preferences.confirm-reset-preferences'),
            };
            window.rendererApi.showDialog(options).then((result) =>
            {
                if (result.response === 0 /*Yes*/)
                {
                    resetContent();
                    const optionsReset = {
                        type: 'info',
                        message: i18nTranslator.getTranslationInLanguageData(languageData.data, '$Preferences.reset-preferences'),
                        detail: i18nTranslator.getTranslationInLanguageData(languageData.data, '$Preferences.reset-success'),
                    };
                    window.rendererApi.showDialog(optionsReset);
                }
            });
        });
    });

    const prefillBreak = $('#enable-prefill-break-time');
    const breakInterval = $('#break-time-interval');

    prefillBreak.on('change', function()
    {
        breakInterval.prop('disabled', !prefillBreak.is(':checked'));
    });

    const notification = $('#notification');
    const repetition = $('#repetition');
    const notificationsInterval = $('#notifications-interval');

    notification.on('change', function()
    {
        repetition.prop('disabled', !notification.is(':checked'));
        repetition.prop(
            'checked',
            notification.is(':checked') && preferences['repetition']
        );
        notificationsInterval.prop('disabled', !repetition.is(':checked'));
    });

    repetition.on('change', function()
    {
        notificationsInterval.prop('disabled', !repetition.is(':checked'));
    });
}

/* istanbul ignore next */
$(() =>
{
    try
    {
        if (window.rendererApi && window.rendererApi.getOriginalUserPreferences)
        {
            preferences = window.rendererApi.getOriginalUserPreferences();

            renderWindowTheme();
            renderPreferencesWindow();
            setupListeners();

            // Notify when window is ready
            if (window.rendererApi.notifyWindowReadyToShow)
            {
                window.rendererApi.notifyWindowReadyToShow();
            }
        }
    }
    catch (error)
    {
        console.error('Error initializing preferences:', error);
    }
    setupLanguages();
});

export {
    convertTimeFormat,
    resetContent,
    populateLanguages,
    listenerLanguage,
    setupListeners,
    renderPreferencesWindow,
    showSuccess,
    setupFocusTrap,
    showError,
    clearError,
    handleKeyboardShortcuts,
    setupRTL,
    handleDialogClose,
    renderWindowTheme,
};
