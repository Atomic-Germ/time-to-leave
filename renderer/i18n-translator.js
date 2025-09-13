'use strict';

function getDataRecursive(data, keyList)
{
    if (keyList.length === 0)
    {
        throw new Error('Empty key list');
    }

    // Safety check for undefined data
    if (!data || typeof data !== 'object')
    {
        return undefined;
    }

    if (keyList.length === 1)
    {
        return data[keyList[0]];
    }
    else
    {
        const remainingKeys = keyList.slice(1); // Use slice instead of splice to avoid mutation
        return getDataRecursive(data[keyList[0]], remainingKeys);
    }
}

class i18nTranslator
{
    static getTranslationInLanguageData(languageData, key)
    {
        // Safety check for undefined languageData
        if (!languageData || !languageData.translation)
        {
            console.warn(`Missing language data or translation section for key: ${key}`);
            return key; // Return the key itself as fallback
        }

        const keyList = key.split('.');
        const result = getDataRecursive(languageData['translation'], keyList);

        // Return the key as fallback if translation is not found
        return result !== undefined ? result : key;
    }

    static translatePage(language, languageData, windowName)
    {
        $('html').attr('lang', language);

        function translateElement(element)
        {
            const attr = $(element).attr('data-i18n');
            if (typeof attr !== 'undefined' && attr !== false && attr.length > 0)
            {
                $(element).html(i18nTranslator.getTranslationInLanguageData(languageData, attr));
            }
        }

        const callback = (key, value) => { translateElement(value); };
        $('title').each(callback);
        $('body').each(callback);
        $('p').each(callback);
        $('label').each(callback);
        $('div').each(callback);
        $('span').each(callback);
        $('option').each(callback);
        $('th').each(callback);
        $('a').each(callback);
        $('button').each(callback);

        const titleAttr = `$${windowName}.title`;
        $(document).attr('title', `Time to Leave - ${i18nTranslator.getTranslationInLanguageData(languageData, titleAttr)}`);
    }
}

export default i18nTranslator;
