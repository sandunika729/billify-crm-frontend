
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
