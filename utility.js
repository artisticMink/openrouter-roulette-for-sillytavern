'use strict';

export function getDomElement(id) {
    return document.getElementById(id);
}

export function clearDomElement(element) {
    element.innerText = '';
}

export function addChildrenToLocalElement(localElement, children) {
    localElement.append(...children);
}

export function cloneWithoutFirstChild(node) {
    const clonedChildNodes = Array.from(node.childNodes).map(child => child.cloneNode(true));
    clonedChildNodes.shift();
    return clonedChildNodes;
}

/**
 * Creates a DOM element with the given name, attributes, and optional callback function.
 * Adds an event listener for the specified event type if a callback is provided.
 *
 * @param {string} name - The name of the DOM element to create.
 * @param content
 * @param {Object} [attributes={}] - The attributes to set for the DOM element (key-value pairs).
 * @param {Function|null} [callback=null] - The callback function to be invoked when the event occurs.
 * @param {string} [eventType='click'] - The type of event to listen for (default: 'click').
 * @return {Element} The newly created DOM element.
 */
export function createDomElement(name,
                                 content,
                                 attributes = {},
                                 callback = null,
                                 eventType = 'click') {
    const domElement = document.createElement(name);

    if (content instanceof HTMLElement) {
        domElement.append(content);
    } else {
        domElement.innerText = content;
    }

    if (callback) {
        domElement.addEventListener(eventType, callback);
    }

    Object.entries(attributes).forEach(([key, value]) => domElement.setAttribute(String(key), String(value)));

    return domElement;
}
