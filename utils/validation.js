// utils/validation.js

/**
 * Checks if the email format is valid.
 * @param {string} email - The email to check.
 * @returns {boolean} - True if the email is valid, otherwise false.
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Checks if the date format is valid (YYYY-MM-DD).
 * @param {string} date - The date to check.
 * @returns {boolean} - True if the date is valid, otherwise false.
 */
function isValidDate(date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
}

module.exports = { isValidEmail, isValidDate };
