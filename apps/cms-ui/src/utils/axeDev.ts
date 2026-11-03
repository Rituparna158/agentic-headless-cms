export const initAxeDev = () => {
  if (import.meta.env.MODE === 'development' && typeof window !== 'undefined') {
    Promise.all([
      import('react'),
      import('react-dom'),
      import('@axe-core/react'),
    ])
      .then(([React, ReactDOM, { default: axe }]) => {
        axe(React, ReactDOM, 1000);
      })
      .catch((error) => {
        // Silently skip if axe fails in headless or non-standard dev environments
        console.warn('Axe a11y dev watcher skipped:', error);
      });
  }
};
