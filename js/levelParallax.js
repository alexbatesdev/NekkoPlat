const DEFAULT_Z_SENSITIVITY = 0.1;
const MIN_DEPTH = 0;
const MAX_DEPTH = 2;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function parseNumericValue(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function resolveBaseTransform(element) {
    if (element.style.transform) {
        return element.style.transform;
    }

    const computedTransform = window.getComputedStyle(element).transform;
    return computedTransform && computedTransform !== 'none' ? computedTransform : '';
}

function resolveZIndex(element) {
    const zClass = Array.from(element.classList).find(className => className.startsWith('z'));
    if (zClass) {
        const parsedClassZ = parseInt(zClass.substring(1), 10);
        if (Number.isFinite(parsedClassZ)) {
            return parsedClassZ;
        }
    }

    const computedZIndex = window.getComputedStyle(element).zIndex;
    const parsedComputedZ = parseInt(computedZIndex, 10);
    if (Number.isFinite(parsedComputedZ)) {
        return parsedComputedZ;
    }

    return 0;
}

function resolveDepthFromZIndex(zIndex, sensitivity) {
    return clamp(1 + zIndex * sensitivity, MIN_DEPTH, MAX_DEPTH);
}

export default class LevelParallaxLayer {
    constructor(element) {
        this.element = element;
        this.sensitivity = parseNumericValue(this.element.dataset.plaxSensitivity) ?? DEFAULT_Z_SENSITIVITY;
        this.scale = parseNumericValue(this.element.dataset.plaxScale) ?? 1;
        this.offsetX = parseNumericValue(this.element.dataset.plaxOffsetX) ?? 0;
        this.offsetY = parseNumericValue(this.element.dataset.plaxOffsetY) ?? 0;
        this.zIndex = resolveZIndex(this.element);
        this.depth = parseNumericValue(this.element.dataset.plaxDepth) ?? resolveDepthFromZIndex(this.zIndex, this.sensitivity);
        this.depthX = parseNumericValue(this.element.dataset.plaxDepthX) ?? this.depth;
        this.depthY = parseNumericValue(this.element.dataset.plaxDepthY) ?? this.depth;
        this.lockX = this.element.classList.contains('noplax-x');
        this.lockY = this.element.classList.contains('noplax-y');
        this.baseTransform = resolveBaseTransform(this.element);

        this.initStyles();
    }

    initStyles() {
        this.element.classList.add('level-parallax-layer');
        this.element.style.zIndex = String(this.zIndex);
    }

    update(scrollLeft, scrollTop) {
        const translateX = this.lockX
            ? this.offsetX
            : scrollLeft * (1 - this.depthX) + this.offsetX;
        const translateY = this.lockY
            ? this.offsetY
            : scrollTop * (1 - this.depthY) + this.offsetY;
        const transformParts = [
            `translate(${translateX}px, ${translateY}px)`
        ];

        if (this.scale !== 1) {
            transformParts.push(`scale(${this.scale})`);
        }

        if (this.baseTransform) {
            transformParts.push(this.baseTransform);
        }

        this.element.style.transform = transformParts.join(' ');
    }
}