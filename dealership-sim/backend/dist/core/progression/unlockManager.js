"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runProgressionCheck = exports.purchaseUpgrade = exports.initializeAchievements = exports.evaluateAchievements = exports.evaluateUpgrades = exports.checkAchievementCompletion = exports.checkUpgradeRequirements = void 0;
const unlockDefinitions_1 = require("./unlockDefinitions");
/**
 * Check if upgrade requirements are met
 */
function checkUpgradeRequirements(state, requirements) {
    if (requirements.revenue !== undefined && state.totalRevenue < requirements.revenue) {
        return false;
    }
    if (requirements.lifetimeSales !== undefined && state.lifetimeSales < requirements.lifetimeSales) {
        return false;
    }
    if (requirements.csi !== undefined && state.csi < requirements.csi) {
        return false;
    }
    if (requirements.cash !== undefined && state.cash < requirements.cash) {
        return false;
    }
    if (requirements.businessLevel !== undefined && state.businessLevel < requirements.businessLevel) {
        return false;
    }
    if (requirements.upgrades && requirements.upgrades.length > 0) {
        for (const requiredUpgrade of requirements.upgrades) {
            if (!state.purchasedUpgrades.includes(requiredUpgrade)) {
                return false;
            }
        }
    }
    if (requirements.achievements && requirements.achievements.length > 0) {
        const completedIds = state.achievements
            .filter(a => a.completed)
            .map(a => a.id);
        for (const requiredAchievement of requirements.achievements) {
            if (!completedIds.includes(requiredAchievement)) {
                return false;
            }
        }
    }
    return true;
}
exports.checkUpgradeRequirements = checkUpgradeRequirements;
/**
 * Check if an achievement should be completed
 */
function checkAchievementCompletion(state, achievement) {
    switch (achievement.requirements.type) {
        case 'revenue':
            return state.totalRevenue >= achievement.requirements.value;
        case 'sales':
            return state.lifetimeSales >= achievement.requirements.value;
        case 'csi':
            return state.csi >= achievement.requirements.value;
        case 'cash':
            return state.cash >= achievement.requirements.value;
        case 'service_ros':
            return state.completedROs.length >= achievement.requirements.value;
        default:
            return false;
    }
}
exports.checkAchievementCompletion = checkAchievementCompletion;
/**
 * Evaluate all upgrades and return newly unlocked ones
 * This should be called each day
 */
function evaluateUpgrades(state) {
    const newlyUnlocked = [];
    for (const definition of unlockDefinitions_1.UPGRADE_DEFINITIONS) {
        // Skip if already in available upgrades
        const existingUpgrade = state.availableUpgrades.find(u => u.id === definition.id);
        if (existingUpgrade) {
            continue;
        }
        // Skip if already purchased
        if (state.purchasedUpgrades.includes(definition.id)) {
            continue;
        }
        // Check if requirements are met
        if (checkUpgradeRequirements(state, definition.requirements)) {
            newlyUnlocked.push({
                ...definition,
                unlocked: true,
                purchased: false,
            });
        }
    }
    return newlyUnlocked;
}
exports.evaluateUpgrades = evaluateUpgrades;
/**
 * Evaluate all achievements and return newly completed ones
 */
function evaluateAchievements(state) {
    const newlyCompleted = [];
    const now = new Date().toISOString();
    for (const definition of unlockDefinitions_1.ACHIEVEMENT_DEFINITIONS) {
        // Find existing achievement
        const existing = state.achievements.find(a => a.id === definition.id);
        // Skip if already completed
        if (existing?.completed) {
            continue;
        }
        // Check if should be completed
        const achievement = existing || {
            ...definition,
            completed: false,
        };
        if (checkAchievementCompletion(state, achievement)) {
            newlyCompleted.push({
                ...achievement,
                completed: true,
                completedDate: now,
            });
        }
    }
    return newlyCompleted;
}
exports.evaluateAchievements = evaluateAchievements;
/**
 * Initialize achievements for a new game
 */
function initializeAchievements() {
    return unlockDefinitions_1.ACHIEVEMENT_DEFINITIONS.map(def => ({
        ...def,
        completed: false,
    }));
}
exports.initializeAchievements = initializeAchievements;
/**
 * Purchase an upgrade and apply its effects to the state
 */
function purchaseUpgrade(state, upgradeId) {
    const upgrade = state.availableUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
        throw new Error(`Upgrade ${upgradeId} not found in available upgrades`);
    }
    if (upgrade.purchased) {
        throw new Error(`Upgrade ${upgradeId} already purchased`);
    }
    if (state.cash < upgrade.cost) {
        throw new Error(`Not enough cash. Need $${upgrade.cost}, have $${state.cash}`);
    }
    // Deduct cost
    const nextState = { ...state };
    nextState.cash -= upgrade.cost;
    // Mark as purchased
    nextState.purchasedUpgrades = [...state.purchasedUpgrades, upgradeId];
    // Update the upgrade in available upgrades
    nextState.availableUpgrades = state.availableUpgrades.map(u => u.id === upgradeId ? { ...u, purchased: true } : u);
    // Apply effects - these are tracked in purchasedUpgrades and checked by feature flags
    // The actual enforcement happens in featureFlags.ts
    return nextState;
}
exports.purchaseUpgrade = purchaseUpgrade;
/**
 * Run full progression check (upgrades + achievements)
 * Returns notifications for new unlocks/achievements
 */
function runProgressionCheck(state) {
    const notifications = [];
    let nextState = { ...state };
    // Check for day-based unlocks
    if (nextState.day === 4 && !nextState.unlockedFeatures.includes('speed_controls')) {
        nextState.unlockedFeatures = [...nextState.unlockedFeatures, 'speed_controls'];
        notifications.push(`⏱️ Time's starting to fly! Speed controls are now available.`);
    }
    // Check for new upgrades
    const newUpgrades = evaluateUpgrades(nextState);
    if (newUpgrades.length > 0) {
        nextState.availableUpgrades = [...nextState.availableUpgrades, ...newUpgrades];
        notifications.push(`🔓 ${newUpgrades.length} new upgrade${newUpgrades.length > 1 ? 's' : ''} available!`);
    }
    // Check for new achievements
    const newAchievements = evaluateAchievements(nextState);
    if (newAchievements.length > 0) {
        // Update achievements list
        const updatedAchievements = [...nextState.achievements];
        for (const newAchievement of newAchievements) {
            const index = updatedAchievements.findIndex(a => a.id === newAchievement.id);
            if (index >= 0) {
                updatedAchievements[index] = newAchievement;
            }
            else {
                updatedAchievements.push(newAchievement);
            }
            if (!newAchievement.hidden) {
                notifications.push(`🏆 Achievement unlocked: ${newAchievement.name}`);
            }
        }
        nextState.achievements = updatedAchievements;
    }
    return { state: nextState, notifications };
}
exports.runProgressionCheck = runProgressionCheck;
