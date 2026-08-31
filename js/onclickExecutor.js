const hasOwn = Object.prototype.hasOwnProperty;

function injectHelpers(target, helpers = {}) {
  const helperKeys = Object.keys(helpers);
  const previousValues = new Map();

  helperKeys.forEach((key) => {
    if (hasOwn.call(target, key)) {
      previousValues.set(key, target[key]);
    }
    target[key] = helpers[key];
  });

  return { helperKeys, previousValues };
}

function restoreHelpers(target, helperKeys, previousValues) {
  helperKeys.forEach((key) => {
    if (previousValues.has(key)) {
      target[key] = previousValues.get(key);
    } else {
      delete target[key];
    }
  });
}

export function parseOnclickBody(onclickSource) {
  if (typeof onclickSource !== "string") return "";

  const trimmed = onclickSource.trim();
  if (!trimmed) return "";

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return trimmed.substring(start + 1, end).trim();
  }

  return trimmed;
}

export function getOnclickHandlerFromElement(element) {
  if (!element) return null;
  if (typeof element.onclick === "function") return element.onclick;

  const onclickAttribute = element.getAttribute?.("onclick");
  if (typeof onclickAttribute === "string" && onclickAttribute.trim()) {
    return onclickAttribute;
  }

  return null;
}

/**
 * Execute an onclick source with an explicit `this` context and temporary helpers.
 * Browser globals (window/document/globalThis/location/etc.) remain available
 * because execution still happens in the page JS environment.
 */
export function executeOnclickWithContext({
  onclick,
  event,
  thisArg,
  helpers = {},
  errorLabel = "onclick",
}) {
  if (!onclick) return false;

  const contextTarget = thisArg ?? {};
  const { helperKeys, previousValues } = injectHelpers(contextTarget, helpers);

  try {
    if (typeof onclick === "function") {
      onclick.call(contextTarget, event);
      return true;
    }

    if (typeof onclick === "string") {
      const body = parseOnclickBody(onclick);
      if (!body) return false;
      const func = new Function("event", body);
      func.call(contextTarget, event);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error executing ${errorLabel}:`, error);
    return false;
  } finally {
    restoreHelpers(contextTarget, helperKeys, previousValues);
  }
}
