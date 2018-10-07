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

export function defineConstants(target, constantMap) {
  const propDefinitions = Object.entries(constantMap).reduce((map, [ key, value ]) => {
    map[key] = { value, writable: false };
    return map;
  }, {});
  Object.defineProperties(target, propDefinitions);
}

export function matchKey(keyEvent, keyMap) {
  for (const [ command, keys ] of Object.entries(keyMap)) {
    for (const keyDef of keys) {
      const { key, altKey = false, ctrlKey = false, metaKey = false, shiftKey = false } = keyDef;
      const normalizedKeyDef = { key, altKey, ctrlKey, metaKey, shiftKey };
      if (Object.entries(normalizedKeyDef).every(([ prop, value ]) => keyEvent[prop] === value)) {
        return command;
      }
    }
  }
  return null;
}
