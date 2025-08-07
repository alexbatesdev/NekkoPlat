export default class PlayerConfig {
    constructor(element) {
        this.configElement = element.querySelector('.config');
        if (!this.configElement) {
            console.warn("No player config element found in the document, using default values");
        }
        this.gravity = this.getConfig('gravity', 0.9);
        this.maxVelocity = this.getConfig('maxVelocity', 10);
        this.sprintMaxVelocity = this.getConfig('sprintMaxVelocity', 18);
        this.acceleration = this.getConfig('acceleration', 0.7);
        this.sprintAcceleration = this.getConfig('sprintAcceleration', 2);
        this.fallingGravity = this.getConfig('fallingGravity', 1.5);
        this.jumpForce = this.getConfig('jumpForce', 25);
        this.coyoteTime = this.getConfig('coyoteTime', 100);
        this.preJumpAllowance = this.getConfig('preJumpAllowance', 10);
        this.maxAirJumps = this.getConfig('maxAirJumps', 1);
    }

    getConfig(configItem, defaultValue) {
        if (!this.configElement) {
            console.warn(`No player config element found for ${configItem}, using default value: ${defaultValue}`);
            return defaultValue;
        }
        const itemElement = this.configElement.querySelector(`.${configItem}`);
        if (itemElement) {
            return Number(itemElement.innerHTML);
        } else {
            console.warn(`No config element found for ${configItem}, using default value: ${defaultValue}`);
            return defaultValue;
        }
    }
}
