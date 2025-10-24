import { BASE_CAPABILITIES } from './unlockDefinitions';
/**
 * Feature flags system - determines what player can access
 * based on purchased upgrades
 */
/**
 * Get maximum number of advisors based on purchased upgrades
 */
export function getMaxAdvisors(state) {
    let max = BASE_CAPABILITIES.maxAdvisors; // Start with 1
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
/**
 * Get maximum number of technicians based on purchased upgrades
 */
export function getMaxTechnicians(state) {
    let max = BASE_CAPABILITIES.maxTechnicians; // Start with 0 (no service)
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
/**
 * Get maximum inventory slots based on purchased upgrades
 */
export function getMaxInventorySlots(state) {
    let max = BASE_CAPABILITIES.maxInventorySlots; // Start with 15
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
/**
 * Check if player has access to service department
 */
export function hasServiceAccess(state) {
    return state.purchasedUpgrades.includes('service_department');
}
/**
 * Check if player can use auto-advance
 */
export function canAutoAdvance(state) {
    return state.purchasedUpgrades.includes('sales_manager') || state.salesManager !== null;
}
/**
 * Check if player can use auto-buyer
 */
export function canAutoBuy(state) {
    return state.purchasedUpgrades.includes('auto_buyer') || state.purchasedUpgrades.includes('used_car_manager');
}
/**
 * Check if player can use auto-pricer
 */
export function canAutoPricer(state) {
    return state.purchasedUpgrades.includes('auto_pricer');
}
/**
 * Check if player can use marketing optimizer
 */
export function canOptimizeMarketing(state) {
    return state.purchasedUpgrades.includes('marketing_optimizer');
}
/**
 * Get maximum speed multiplier available
 */
export function getMaxSpeed(state) {
    if (state.purchasedUpgrades.includes('speed_boost_30x'))
        return 30;
    if (state.purchasedUpgrades.includes('speed_boost_5x'))
        return 5;
    return 1;
}
/**
 * Check if player can buy bulk inventory (5+ at once)
 */
export function canBuyBulk(state) {
    return state.purchasedUpgrades.includes('bulk_inventory');
}
/**
 * Check if player has increased marketing capacity
 */
export function hasIncreasedMarketing(state) {
    return state.purchasedUpgrades.includes('marketing_boost');
}
/**
 * Check if player has access to premium vehicles
 */
export function hasPremiumAccess(state) {
    return state.purchasedUpgrades.includes('premium_inventory');
}
/**
 * Get maximum marketing spend per day based on upgrades
 */
export function getMaxMarketingSpend(state) {
    if (hasIncreasedMarketing(state)) {
        return 5000; // Higher cap with marketing boost
    }
    return 1000; // Initial cap
}
/**
 * Check if a specific feature is unlocked
 */
export function isFeatureUnlocked(state, feature) {
    switch (feature) {
        case 'service':
            return hasServiceAccess(state);
        case 'auto_advance':
            return canAutoAdvance(state);
        case 'auto_buyer':
        case 'auto_inventory_buying':
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
/**
 * Validate that a purchase doesn't exceed limits
 */
export function validateInventoryPurchase(state, quantity) {
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
/**
 * Validate that hiring doesn't exceed limits
 */
export function validateHiring(state, role) {
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
