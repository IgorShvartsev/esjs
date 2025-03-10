
export default (() => {
    const buildInMouseEventTypes = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup'];
    const buildInEventTypes = ['abort', 'afterprint', 'beforeprint', 'beforeunload', 'canplay', 'canplaythrough', 'change', 'ended', 'error', 'fullscreenchange', 'fullscreenerror', 'input', 'invalid', 'load', 'loadeddata', 'loadedmetadata', 'message', 'offline', 'online', 'open', 'pause', 'play', 'playing', 'progress', 'ratechange', 'resize', 'reset', 'scroll', 'search', 'seeked', 'seeking', 'select', 'show', 'stalled', 'submit', 'suspend', 'timeupdate', 'toggle', 'unload', 'waiting', 'volumechange'];
    const buildInFocusEventTypes = ['onblur', 'onfocus', 'onfocusin', 'onfocusout'];
    const buildInDragEventTypes = ['ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop'];
    const buildInInputEventTypes = ['oninput'];
    const buildInKeyboardEventTypes = ['onkeydown', 'onkeypress', 'onkeyup'];
    const buildInAnimationEventTypes = ['animationend', 'animationiteration', 'animationstart'];

    const create = (tag) => {
        return new ElementCollection(document.createElement(tag));
    };

    const q = (selector) => new ElementCollection(
        selector instanceof Element ? selector : [...document.querySelectorAll(selector)]
    );

    class ElementCollection {
        #el = [];
        
        constructor(el) {
            this.#el = Array.isArray(el) ? el : [el];
        }

        get el() {
            return this.#el;
        }

        length() {
            return this.#el.length;
        }

        addAttr(attr, v) {
            this.#handleCollection((el) => {
                attr = this.#makeAssoc(attr, v)
                for (const [key, v] of Object.entries(attr)) {
                    el.setAttribute(key, v);
                }
            })
            return this;
        }

        removeAttr (attr) {
            this.#handleCollection((el) => {
                el.removeAttribute(attr);
            });
            return this;
        }

        addClass(...className) {
            this.#handleCollection((el) => {
                el.classList.add(...className);
            });
            return this;
        }

        removeClass(...className) {
            this.#handleCollection((el) => {
                el.classList.remove(...className);
            });
            return this;
        }

        hasClass(className) {
            let result = false;
            this.#handleCollection((el) => {
                if (result) {
                    return;
                }
                result = el.classList.contains(className);
            });
            return result;
        }

        css(name, v) {
            this.#handleCollection((el) => {
                name = this.#makeAssoc(name, v)
                for (const [key, v] of Object.entries(name)) {
                    el.style.setProperty(key, v);
                }
            });
            return this;
        }

        append(element) {
            this.#attachCommand('append', element);
            return this;
        }

        prepend(element) {
            this.#attachCommand('prepend', element);
            return this;
        }

        before(element) {
            this.#attachCommand('before', element);
            return this;
        }

        after(element) {
            this.#attachCommand('after', element);
            return this;
        }

        closest(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let closestEl = el.closest(selector);
                if (closestEl) {
                    collection.push(closestEl);
                }
            });
            return new ElementCollection(collection);
        }

        siblings(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let siblings = Array.prototype.slice.call(el.parentNode.children);
                for (let i = siblings.length; i--;) {
                    if (siblings[i] === el) {
                        siblings.splice(i, 1);
                        if (!selector) {
                            break;
                        }
                    } else if (!siblings[i].matches(selector)) {
                        siblings.splice(i, 1);
                    }
                }
                if (siblings.length) {
                    collection.push(...siblings);
                }
            });
            return new ElementCollection(collection);
        }

        match(selector) {
            let result = false;
            this.#handleCollection((el) => {
                result = el.matches(selector);
            });
            return result;
        }

        isVisible() {
            let result = false;
            this.#handleCollection((el) => {
                result = el.checkVisibility({
                    opacityProperty: true,
                    visibilityProperty: true,
                });
            });
            return result;
        }

        first() {
            return new ElementCollection(this.#el.length >= 1 ? this.#el[0] : []);
        }

        last() {
            return new ElementCollection(this.#el.length >= 1 ? this.#el[this.#el.length - 1] : []);
        }

        find(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let foundEls = [...el.querySelectorAll(selector)];
                if (foundEls.length) {
                    collection.push(...foundEls);
                }
            });
            return new ElementCollection(collection);
        }

        filter(cb) {
            let collection = [];
            if (typeof cb === 'function') {
                collection = this.#el.filter(cb);
            } 
            return new ElementCollection(collection);
        }

        html(content) {
            let result;
            this.#handleCollection((el) => {
                if (typeof content === 'undefined') {
                    result = !result ? el.innerHTML : result;
                } else {    
                    el.innerHTML = content;
                    result = this;
                }
            });
            return result;
        }

        text(content) {
            this.#handleCollection((el) => {
                el.appendChild(document.createTextNode(content));
            });
            return this;
        }

        data(name, value) {
            let result = this;
            let isRead = false;
            this.#handleCollection((el) => {
                if (isRead) {
                    return;
                }
                if (typeof value === 'undefined') {
                    try {
                        result = JSON.parse(el.dataset[name]);
                    } catch(error) {
                        result = el.dataset[name];
                    }
                    isRead = true;
                } else {
                    if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    el.dataset[name] = value;
                }
            });
            return result;
        }

        clear() {
            this.#handleCollection((el) => {
                el.remove();
            });
            return this;
        }

        empty () {
            this.#handleCollection((el) => {
                el.replaceChildren();
            });
            return this;
        }

        hide() {
            this.#handleCollection((el) => {
                el.style.display = 'none';
            });
            return this;
        }

        show() {
            this.#handleCollection((el) => {
                el.style.display = '';
            });
            return this;
        }

        event(type, cb) {
            this.#handleCollection((el) => {
                if (typeof cb === 'function') {
                    el.addEventListener(type, cb);
                }
            });
            return this;
        }

        on(type, selector, cb) {
            this.#handleCollection((el) => {
                if (typeof cb === 'function') {
                    let target = selector;
                    el.addEventListener(type, (e) => {
                        if (el.querySelector(target) === e.target) {
                            cb.call(e.target, e);
                        }
                    });
                }
            });
            return this;
        }

        trigger(type, options) {
            this.#handleCollection((el) => {
                let event;
                let defaultOptions = {bubbles: true};
                if (typeof options !== 'object') {
                    options = {};
                }
                options = {...defaultOptions, ...options};
                if (buildInMouseEventTypes.includes(type)) {
                    event = new MouseEvent(type, options);
                } else if (buildInEventTypes.includes(type)) {
                    event= new Event(type, options);
                } else if (buildInFocusEventTypes.includes(type)) {
                    event= new FocusEvent(type, options);
                } else if (buildInDragEventTypes.includes(type)) {
                    event= new DragEvent(type, options);
                } else if (buildInInputEventTypes.includes(type)) {
                    event= new InputEvent(type, options);
                } else if (buildInKeyboardEventTypes.includes(type)) {
                    event= new KeyboardEvent(type, options);
                } else if (buildInAnimationEventTypes.includes(type)) {
                    event= new AnimationEvent(type, options);
                } else {
                    event= new CustomEvent(type, options);
                }
                el.dispatchEvent(event);
            });
            return this;
        }

        shadowView(htmlContent) {
            let initialized = false;
            this.#handleCollection((el) => {
                if (initialized) {
                    return;
                }
                el.attachShadow({mode: 'open'});
                el.shadowRoot.innerHTML = htmlContent;
                initialized = true;
            });
        }

        #makeAssoc(key, v) {
            let temp;
            if (typeof key !== 'object') {
                temp = key;
                key = {};
                key[temp] = v;
            }
            return key;
        }

        #handleCollection(cb) {
            [].forEach.call(this.#el, cb);
        }

        #attachCommand(command, element) {
            this.#handleCollection((el) => {
                element = element instanceof ElementCollection ? element.el : [element];
                element.forEach((item) => el[command](item));
            });
        }
    }

    return {create, q};
})();
