const requiringStyles = {};
const requiredStyles = {};

function makeStyle(cssText, root) {
  const styleEl = document.createElement('style');
  styleEl.textContent = cssText;
  root.appendChild(styleEl);
  return styleEl;
}

export function attachStyle(url, root) {
  if (url in requiredStyles) {
    return Promise.resolve(makeStyle(requiredStyles[url], root));
  }
  return new Promise(async (resolve, reject) => {
    if (url in requiringStyles) {
      requiringStyles[url].push({ resolve, reject, root });
    } else {
      requiringStyles[url] = [{ resolve, reject, root }];
      try {
        const response = await fetch(url);
        const cssText = await response.text();
        requiredStyles[url] = cssText;
        for (const request of requiringStyles[url]) {
          request.resolve(makeStyle(cssText, request.root));
        }
      } catch (error) {
        for (const request of requiringStyles[url]) {
          request.reject(error);
        }
      }
      delete requiringStyles[url];
    }
  });
}
