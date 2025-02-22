'use strict';

import { CalendarFactory } from '../renderer/classes/CalendarFactory.js';
import { applyTheme } from '../renderer/themes.js';
import { searchLeaveByElement } from '../renderer/notification-channel.js';

// Global values for calendar
let calendar = undefined;

function setupCalendar(preferences)
{
    window.rendererApi.getLanguageDataPromise().then(async languageData =>
    {
        calendar = await CalendarFactory.getInstance(preferences, languageData, calendar);
        applyTheme(preferences.theme);
    });
}

/*
 * Reload the calendar upon request from main
 */
window.calendarApi.handleCalendarReload(async() =>
{
    await calendar.reload();
});

/*
 * Update the calendar after a day has passed
 */
window.calendarApi.handleRefreshOnDayChange((event, oldDate, oldMonth, oldYear) =>
{
    calendar.refreshOnDayChange(oldDate, oldMonth, oldYear);
});

/*
 * Get notified when preferences has been updated.
 */
window.calendarApi.handlePreferencesSaved((event, prefs) =>
{
    setupCalendar(prefs);
});

/*
 * Get notified when waivers get updated.
 */
window.calendarApi.handleWaiverSaved(async() =>
{
    await calendar.loadInternalWaiveStore();
    calendar.redraw();
});

/*
 * Punch the date and time as requested by user.
 */
window.calendarApi.handlePunchDate(() =>
{
    calendar.punchDate();
});

/*
 * Reload theme.
 */
window.calendarApi.handleThemeChange(async(event, theme) =>
{
    applyTheme(theme);
});

/*
 * Returns value of "leave by" for notifications.
 */
window.calendarApi.handleLeaveBy(searchLeaveByElement);

// On page load, create the calendar and setup notification
$(() =>
{
    const preferences = window.rendererApi.getOriginalUserPreferences();
    requestAnimationFrame(() =>
    {
        setupCalendar(preferences);
        requestAnimationFrame(() =>
        {
            setTimeout(() =>
            {
                window.rendererApi.notifyWindowReadyToShow();
            }, 100);
        });
    });
});

/*
 * Utility function to format time based on preference
 */
function formatTime(date, preferences) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    if (preferences["time-24"]) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
}
