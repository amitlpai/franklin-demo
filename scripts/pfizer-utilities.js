export function isPreview(hostname) {
    return false;
  }
  
  export function isNonProduction(hostname) {
    return false;
  }
  
  // Function to wait for video.js library to load
  export function waitForVideoJS(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const checkInterval = 100; // Interval in milliseconds
      const startTime = Date.now();
  
      function checkVideoJS() {
        if (window.videojs) {
          resolve(window.videojs);
        } else if (Date.now() - startTime >= timeout) {
          resolve(null);
        } else {
          setTimeout(checkVideoJS, checkInterval);
        }
      }
  
      checkVideoJS();
    });
  }
  
  // Function to wait for elements to appear in the DOM
  export function waitForElements(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const observer = new MutationObserver((_, observerInstance) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          observerInstance.disconnect();
          resolve(Array.from(elements));
        }
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
  
      setTimeout(() => {
        observer.disconnect();
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          resolve(Array.from(elements));
        } else {
          resolve([]);
        }
      }, timeout);
    });
  }
  