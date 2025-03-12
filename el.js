
export default (() => {
    const buildInMouseEventTypes = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup'];
    const buildInEventTypes = ['abort', 'afterprint', 'beforeprint', 'beforeunload', 'canplay', 'canplaythrough', 'change', 'ended', 'error', 'fullscreenchange', 'fullscreenerror', 'input', 'invalid', 'load', 'loadeddata', 'loadedmetadata', 'message', 'offline', 'online', 'open', 'pause', 'play', 'playing', 'progress', 'ratechange', 'resize', 'reset', 'scroll', 'search', 'seeked', 'seeking', 'select', 'show', 'stalled', 'submit', 'suspend', 'timeupdate', 'toggle', 'unload', 'waiting', 'volumechange'];
    const buildInFocusEventTypes = ['onblur', 'onfocus', 'onfocusin', 'onfocusout'];
    const buildInDragEventTypes = ['ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop'];
    const buildInInputEventTypes = ['oninput'];
    const buildInKeyboardEventTypes = ['onkeydown', 'onkeypress', 'onkeyup'];
    const buildInAnimationEventTypes = ['animationend', 'animationiteration', 'animationstart'];

    const create = (tag) => new ElementCollection(document.createElement(tag));

    const q = (selector) => new ElementCollection(
        selector instanceof Element 
            ? selector 
            : (selector instanceof HTMLCollection ? [...selector] : [...document.querySelectorAll(selector)])
    );

    class ElementCollection {
        #el = [];
        
        constructor(el) {
            this.#el = Array.isArray(el) ? el : [el];
        }

        get el() {
            return this.#el;
        }

        get(index = 0) {
            return this.#el[index] ?? null;
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
            this.#handleCollection((el) => el.removeAttribute(attr));
            return this;
        }

        addClass(...className) {
            this.#handleCollection((el) => el.classList.add(...className));
            return this;
        }

        removeClass(...className) {
            this.#handleCollection((el) => el.classList.remove(...className));
            return this;
        }

        hasClass(className) {
            return this.#el.length ? this.#el[0].classList.contains(className) : false;
        }

        css(name, v) {
            if (typeof v === 'undefined' && typeof name === 'string') {
                let result = '';
                if (this.#el.length) {
                    let compStyle = window.getComputedStyle(this.#el[0]);
                    result = compStyle.getPropertyValue(name);
                }
                return result;
            }
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

        appendTo(element) {
            this.#attachToCommand('append', element);
            return this;
        }

        prepend(element) {
            this.#attachCommand('prepend', element);
            return this;
        }

        prependTo(element) {
            this.#attachToCommand('prepend', element);
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

        parent() {
            const collection = this.#el.map(el => el.parentElement);
            return new ElementCollection([...new Set(collection)]);
        }

        closest(selector) {
            const collection = this.#el.map(el => el.closest(selector));
            return new ElementCollection([...new Set(collection)]);
        }

        siblings(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let siblings = [...el.parentNode.children].filter(sibling => sibling !== el && (!selector || sibling.matches(selector)));
                if (siblings.length) {
                    collection.push(...siblings);
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        children(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let children = [...el.children].filter(child => !selector || child.matches(selector));
                if (children.length) {
                    collection.push(...children);
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        each(cb) {
            if (typeof cb === 'function') {
                this.#el.forEach((el, index) => cb.call(el, el, index));
            }
            return this;
        }

        match(selector) {
            let result = false;
            this.#handleCollection((el) => {
                if (result) {
                    return;
                }
                result = el.matches(selector)
            });
            return result;
        }

        isVisible() {
            return this.#el.length 
                ? this.#el[0].checkVisibility({
                    opacityProperty: true,
                    visibilityProperty: true,
                })
                : false;
        }

        first() {
            return new ElementCollection(this.#el.length ? this.#el[0] : []);
        }

        last() {
            return new ElementCollection(this.#el.length ? this.#el[this.#el.length - 1] : []);
        }

        find(selector) {
            let collection = [];
            this.#handleCollection((el) => {
                let foundEls = [...el.querySelectorAll(selector)];
                if (foundEls.length) {
                    collection.push(...foundEls);
                }
            });
            return new ElementCollection([...new Set(collection)]);
        }

        filter(cb) {
            return new ElementCollection(typeof cb === 'function' ? this.#el.filter(cb) : []);
        }

        html(content) {
            if (typeof content === 'undefined') {
                return this.#el.length ? this.#el[0].innerHTML : '';
            }
            this.#handleCollection((el) => el.innerHTML = content);
            return this;
        }

        text(content) {
            if (content) {            
                this.#handleCollection((el) => el.appendChild(document.createTextNode(content)));
            }
            return this;
        }

        data(name, value) {
            if (typeof value === 'undefined') {
                let result = '';
                if (this.#el.length) {
                    try {
                        result = JSON.parse(this.#el[0].dataset[name]);
                    } catch(error) {
                        result = this.#el[0].dataset[name];
                    }
                }
                return result;
            }
            this.#handleCollection((el) => {
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                el.dataset[name] = value;
            });
            return this;
        }

        clear() {
            this.#handleCollection((el) => el.remove());
            return this;
        }

        empty () {
            this.#handleCollection((el) => el.replaceChildren());
            return this;
        }

        hide() {
            this.#handleCollection((el) => el.style.display = 'none');
            return this;
        }

        show() {
            this.#handleCollection((el) => el.style.display = '');
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
            if (this.#el.length) {
                this.#el[0].attachShadow({mode: 'open'});
                this.#el[0].shadowRoot.innerHTML = htmlContent;
            } 
            return this;
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

        #attachToCommand(command, element) {
            this.#handleCollection((el) => {
                element = element instanceof ElementCollection ? element.el : [element];
                element.forEach((item) => item[command](el));
            });
        }
    }

    return {create, q};
})();
