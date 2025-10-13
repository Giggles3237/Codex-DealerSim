"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHiring = exports.validateInventoryPurchase = exports.isFeatureUnlocked = exports.getMaxMarketingSpend = exports.hasPremiumAccess = exports.hasIncreasedMarketing = exports.canBuyBulk = exports.getMaxSpeed = exports.canOptimizeMarketing = exports.canAutoPricer = exports.canAutoBuy = exports.canAutoAdvance = exports.hasServiceAccess = exports.getMaxInventorySlots = exports.getMaxTechnicians = exports.getMaxAdvisors = void 0;
const unlockDefinitions_1 = require("./unlockDefinitions");
/**
 * Feature flags system - determines what player can access
 * based on purchased upgrades
 */
/**
 * Get maximum number of advisors based on purchased upgrades
 */
function getMaxAdvisors(state) {
    let max = unlockDefinitions_1.BASE_CAPABILITIES.maxAdvisors; // Start with 1
    // Check each upgrade that increases advisor count
    if (state.purchasedUpgrades.includes('second_advisor'))
        max = Math.max(max, 2);
    if (state.purchasedUpgrades.includes('third_advisor'))
        max = Math.max(max, 3);
    if (state.purchasedUpgrades.includes('fourth_advisor'))
        max = Math.max(max, 4);
    if (state.purchasedUpgrades.includes('fifth_advisor'))
        max = Math.max(max, 5);
    if (state.purchasedUpgrades.includes('sixth_advisor'))
        max = Math.max(max, 6);
    if (state.purchasedUpgrades.includes('elite_team'))
        max = Math.max(max, 8);
    return max;
}
exports.getMaxAdvisors = getMaxAdvisors;
/**
 * Get maximum number of technicians based on purchased upgrades
 */
function getMaxTechnicians(state) {
    let max = unlockDefinitions_1.BASE_CAPABILITIES.maxTechnicians; // Start with 0 (no service)
    if (state.purchasedUpgrades.includes('service_department'))
        max = Math.max(max, 2);
    if (state.purchasedUpgrades.includes('additional_techs_1'))
        max = Math.max(max, 4);
    if (state.purchasedUpgrades.includes('additional_techs_2'))
        max = Math.max(max, 6);
    if (state.purchasedUpgrades.includes('service_empire'))
        max = Math.max(max, 10);
    return max;
}
exports.getMaxTechnicians = getMaxTechnicians;
/**
 * Get maximum inventory slots based on purchased upgrades
 */
function getMaxInventorySlots(state) {
    let max = unlockDefinitions_1.BASE_CAPABILITIES.maxInventorySlots; // Start with 15
    if (state.purchasedUpgrades.includes('inventory_expansion_1'))
        max = Math.max(max, 30);
    if (state.purchasedUpgrades.includes('inventory_expansion_2'))
        max = Math.max(max, 60);
    if (state.purchasedUpgrades.includes('inventory_expansion_3'))
        max = Math.max(max, 100);
    if (state.purchasedUpgrades.includes('inventory_expansion_4'))
        max = Math.max(max, 200);
    return max;
}
exports.getMaxInventorySlots = getMaxInventorySlots;
/**
 * Check if player has access to service department
 */
function hasServiceAccess(state) {
    return state.purchasedUpgrades.includes('service_department');
}
exports.hasServiceAccess = hasServiceAccess;
/**
 * Check if player can use auto-advance
 */
function canAutoAdvance(state) {
    return state.purchasedUpgrades.includes('sales_manager') || state.salesManager !== null;
}
exports.canAutoAdvance = canAutoAdvance;
/**
 * Check if player can use auto-buyer
 */
function canAutoBuy(state) {
    return state.purchasedUpgrades.includes('auto_buyer');
}
exports.canAutoBuy = canAutoBuy;
/**
 * Check if player can use auto-pricer
 */
function canAutoPricer(state) {
    return state.purchasedUpgrades.includes('auto_pricer');
}
exports.canAutoPricer = canAutoPricer;
/**
 * Check if player can use marketing optimizer
 */
function canOptimizeMarketing(state) {
    return state.purchasedUpgrades.includes('marketing_optimizer');
}
exports.canOptimizeMarketing = canOptimizeMarketing;
/**
 * Get maximum speed multiplier available
 */
function getMaxSpeed(state) {
    if (state.purchasedUpgrades.includes('speed_boost_30x'))
        return 30;
    if (state.purchasedUpgrades.includes('speed_boost_5x'))
        return 5;
    return 1;
}
exports.getMaxSpeed = getMaxSpeed;
/**
 * Check if player can buy bulk inventory (5+ at once)
 */
function canBuyBulk(state) {
    return state.purchasedUpgrades.includes('bulk_inventory');
}
exports.canBuyBulk = canBuyBulk;
/**
 * Check if player has increased marketing capacity
 */
function hasIncreasedMarketing(state) {
    return state.purchasedUpgrades.includes('marketing_boost');
}
exports.hasIncreasedMarketing = hasIncreasedMarketing;
/**
 * Check if player has access to premium vehicles
 */
function hasPremiumAccess(state) {
    return state.purchasedUpgrades.includes('premium_inventory');
}
exports.hasPremiumAccess = hasPremiumAccess;
/**
 * Get maximum marketing spend per day based on upgrades
 */
function getMaxMarketingSpend(state) {
    if (hasIncreasedMarketing(state)) {
        return 5000; // Higher cap with marketing boost
    }
    return 1000; // Initial cap
}
exports.getMaxMarketingSpend = getMaxMarketingSpend;
/**
 * Check if a specific feature is unlocked
 */
function isFeatureUnlocked(state, feature) {
    switch (feature) {
        case 'service':
            return hasServiceAccess(state);
        case 'auto_advance':
            return canAutoAdvance(state);
        case 'auto_buyer':
            return canAutoBuy(state);
        case 'auto_pricer':
            return canAutoPricer(state);
        case 'marketing_optimizer':
            return canOptimizeMarketing(state);
        case 'bulk_buying':
            return canBuyBulk(state);
        case 'premium_vehicles':
            return hasPremiumAccess(state);
        case 'increased_marketing':
            return hasIncreasedMarketing(state);
        default:
            return false;
    }
}
exports.isFeatureUnlocked = isFeatureUnlocked;
/**
 * Validate that a purchase doesn't exceed limits
 */
function validateInventoryPurchase(state, quantity) {
    const maxSlots = getMaxInventorySlots(state);
    const currentSlots = state.inventory.filter(v => v.status === 'inStock').length;
    const availableSlots = maxSlots - currentSlots;
    if (quantity > availableSlots) {
        return {
            valid: false,
            error: `Not enough lot space. Available: ${availableSlots} slots. Max: ${maxSlots} slots.`,
            maxAllowed: availableSlots,
        };
    }
    // Check bulk buying restrictions
    if (quantity > 5 && !canBuyBulk(state)) {
        return {
            valid: false,
            error: 'Bulk buying (5+) requires the "Bulk Inventory Purchase" upgrade.',
            maxAllowed: 5,
        };
    }
    return { valid: true };
}
exports.validateInventoryPurchase = validateInventoryPurchase;
/**
 * Validate that hiring doesn't exceed limits
 */
function validateHiring(state, role) {
    if (role === 'advisor') {
        const maxAdvisors = getMaxAdvisors(state);
        const currentAdvisors = state.advisors.filter(a => a.active).length;
        if (currentAdvisors >= maxAdvisors) {
            return {
                valid: false,
                error: `Maximum advisors reached (${maxAdvisors}). Purchase upgrades to hire more.`,
            };
        }
    }
    if (role === 'technician') {
        if (!hasServiceAccess(state)) {
            return {
                valid: false,
                error: 'Service department not available. Purchase "Build Service Department" upgrade first.',
            };
        }
        const maxTechs = getMaxTechnicians(state);
        const currentTechs = state.technicians.filter(t => t.active).length;
        if (currentTechs >= maxTechs) {
            return {
                valid: false,
                error: `Maximum technicians reached (${maxTechs}). Purchase upgrades to hire more.`,
            };
        }
    }
    return { valid: true };
}
exports.validateHiring = validateHiring;
