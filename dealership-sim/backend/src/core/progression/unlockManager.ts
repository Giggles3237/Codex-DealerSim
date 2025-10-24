import { GameState, Upgrade, Achievement, UpgradeRequirements, Notification, SalesAdvisor, Technician } from '@dealership/shared';
import { UPGRADE_DEFINITIONS, ACHIEVEMENT_DEFINITIONS } from './unlockDefinitions';
import { ADVISOR_ARCHETYPES, TECH_ARCHETYPES } from '../balance/archetypes';

/**
 * Check if upgrade requirements are met
 */
export function checkUpgradeRequirements(
  state: GameState,
  requirements: UpgradeRequirements
): boolean {
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

/**
 * Check if an achievement should be completed
 */
export function checkAchievementCompletion(
  state: GameState,
  achievement: Achievement
): boolean {
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

/**
 * Evaluate all upgrades and return newly unlocked ones
 * This should be called each day
 */
export function evaluateUpgrades(state: GameState): Upgrade[] {
  const newlyUnlocked: Upgrade[] = [];
  
  for (const definition of UPGRADE_DEFINITIONS) {
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

/**
 * Evaluate all achievements and return newly completed ones
 */
export function evaluateAchievements(state: GameState): Achievement[] {
  const newlyCompleted: Achievement[] = [];
  const now = new Date().toISOString();
  
  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    // Find existing achievement
    const existing = state.achievements.find(a => a.id === definition.id);
    
    // Skip if already completed
    if (existing?.completed) {
      continue;
    }
    
    // Check if should be completed
    const achievement: Achievement = existing || {
      ...definition,
      completed: false,
    };
    
      if (checkAchievementCompletion(state, achievement)) {
        // Include ALL achievements when showing completion, even hidden ones
        newlyCompleted.push({
          ...achievement,
          completed: true,
          completedDate: now,
        });
      }
  }
  
  return newlyCompleted;
}

/**
 * Initialize achievements for a new game
 */
export function initializeAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    completed: false,
  }));
}

/**
 * Purchase an upgrade and apply its effects to the state
 */
export function purchaseUpgrade(state: GameState, upgradeId: string): GameState {
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
  nextState.availableUpgrades = state.availableUpgrades.map(u => 
    u.id === upgradeId ? { ...u, purchased: true } : u
  );
  
  // Auto-hire advisors for advisor upgrades
  if (upgradeId.includes('advisor') && upgrade.effects.maxAdvisors) {
    const advisorsToHire = upgrade.effects.maxAdvisors - state.advisors.filter(a => a.active).length;
    
    if (advisorsToHire > 0) {
      const rookie = ADVISOR_ARCHETYPES.find((a: any) => a.id === 'rookie') || ADVISOR_ARCHETYPES[0];
      
      for (let i = 0; i < advisorsToHire; i++) {
        const newAdvisor: SalesAdvisor = {
          id: `advisor-${Date.now()}-${i}`,
          name: `${rookie.name} ${Math.floor(Math.random() * 90)}`,
          archetype: rookie.id,
          skill: {
            close: 55 + Math.random() * 20,
            gross: 55 + Math.random() * 20,
            csi: 50 + Math.random() * 20,
            speed: 50 + Math.random() * 20,
          },
          morale: 68,
          trained: [],
          active: true,
        };
        nextState.advisors.push(newAdvisor);
      }
      
      // Add notification
      nextState.notifications.push(`Hired ${advisorsToHire} new advisor${advisorsToHire > 1 ? 's' : ''}!`);
    }
  }
  
  // Auto-hire technicians for technician upgrades
  if (upgradeId.includes('tech') && upgrade.effects.maxTechnicians) {
    const techsToHire = upgrade.effects.maxTechnicians - state.technicians.filter(t => t.active).length;
    
    if (techsToHire > 0) {
      const mechanic = TECH_ARCHETYPES.find((a: any) => a.id === 'mechanic') || TECH_ARCHETYPES[0];
      
      for (let i = 0; i < techsToHire; i++) {
        const newTech: Technician = {
          id: `tech-${Date.now()}-${i}`,
          name: `${mechanic.name} ${Math.floor(Math.random() * 90)}`,
          archetype: mechanic.id,
          efficiency: 1 + mechanic.modifiers.efficiency,
          comebackRate: 0.08 + mechanic.modifiers.comebackRate,
          morale: 64,
          active: true,
        };
        nextState.technicians.push(newTech);
      }
      
      // Add notification
      nextState.notifications.push(`Hired ${techsToHire} new technician${techsToHire > 1 ? 's' : ''}!`);
    }
  }
  
  // Apply effects - these are tracked in purchasedUpgrades and checked by feature flags
  // The actual enforcement happens in featureFlags.ts
  
  return nextState;
}

/**
 * Run full progression check (upgrades + achievements)
 * Returns notifications for new unlocks/achievements
 */
export function runProgressionCheck(state: GameState): {
  state: GameState;
  notifications: string[];
  storedNotifications: Notification[];
} {
  const notifications: string[] = [];
  const storedNotifications: Notification[] = [];
  let nextState = { ...state };
  
  // Initialize storedNotifications if it doesn't exist
  if (!nextState.storedNotifications) {
    nextState.storedNotifications = [];
  }
  
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
    console.log(`[ACHIEVEMENTS] Found ${newAchievements.length} new achievements`);
    // Update achievements list
    const updatedAchievements = [...nextState.achievements];
    for (const newAchievement of newAchievements) {
      const index = updatedAchievements.findIndex(a => a.id === newAchievement.id);
      if (index >= 0) {
        updatedAchievements[index] = newAchievement;
      } else {
        updatedAchievements.push(newAchievement);
      }
      
      if (!newAchievement.hidden) {
        notifications.push(`🏆 Achievement unlocked: ${newAchievement.name}`);
      }
      
      // Store achievement notification for ALL achievements (including hidden ones)
      const achievementNotification: Notification = {
        id: `achievement-${newAchievement.id}-${Date.now()}`,
        type: 'achievement',
        title: 'Achievement Unlocked',
        message: `${newAchievement.name}: ${newAchievement.description}`,
        timestamp: new Date().toISOString(),
      };
      storedNotifications.push(achievementNotification);
      console.log(`[ACHIEVEMENTS] Stored notification for: ${newAchievement.name}`);
    }
    nextState.achievements = updatedAchievements;
  }
  
  return { state: nextState, notifications, storedNotifications };
}





