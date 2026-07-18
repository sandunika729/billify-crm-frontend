/**
 * Global Alert Service
 * Bypasses the need for React Context to trigger alerts from anywhere.
 */

let listeners = [];

export const subscribeToAlerts = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

const dispatch = (payload) => {
  listeners.forEach((listener) => listener(payload));
};

/**
 * Show a custom alert box.
 * @param {string} message - The message to display.
 * @param {string} [title="Alert"] - The title of the modal.
 */
export const alert = (message, title = 'Alert') => {
  return new Promise((resolve) => {
    dispatch({
      type: 'alert',
      message,
      title,
      onConfirm: resolve,
    });
  });
};

/**
 * Show a custom confirm box.
 * @param {string} message - The message to display.
 * @param {string} [title="Confirm"] - The title of the modal.
 * @returns {Promise<boolean>} True if confirmed, false if cancelled.
 */
export const confirm = (message, title = 'Confirm') => {
  return new Promise((resolve) => {
    dispatch({
      type: 'confirm',
      message,
      title,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};
