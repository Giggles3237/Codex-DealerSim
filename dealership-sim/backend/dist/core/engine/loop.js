"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationEngine = void 0;
const shared_1 = require("@dealership/shared");
const random_1 = require("../../utils/random");
const inventory_1 = require("../services/inventory");
const sales_1 = require("../services/sales");
const service_1 = require("../services/service");
const randomEvents_1 = require("../events/randomEvents");
const math_1 = require("../../utils/math");
const unlockManager_1 = require("../progression/unlockManager");
const DAYS_PER_MONTH = 30;
/**
 * Calculate daily operating expenses including salaries, facility costs, and overhead
 */
function calculateOperatingExpenses(state) {
    const advisorCount = state.advisors.filter(a => a.active).length;
    const technicianCount = state.technicians.filter(t => t.active).length;
    const inventorySlots = state.inventory.filter(v => v.status === 'inStock').length;
    const salaries = (advisorCount * shared_1.OPERATING_EXPENSES.advisorSalaryPerDay) +
        (technicianCount * shared_1.OPERATING_EXPENSES.technicianSalaryPerDay) +
        (state.salesManager ? shared_1.OPERATING_EXPENSES.salesManagerSalaryPerDay : 0);
    const facilityCosts = shared_1.OPERATING_EXPENSES.facilityBaseCost +
        (inventorySlots * shared_1.OPERATING_EXPENSES.facilityPerSlot);
    const overhead = shared_1.OPERATING_EXPENSES.overheadBase;
    return salaries + facilityCosts + overhead;
}
/**
 * Calculate daily floor plan interest on all in-stock inventory
 * Floor plan financing is how dealerships finance their inventory - they pay daily interest
 */
function calculateFloorPlanInterest(state) {
    const inStockVehicles = state.inventory.filter(v => v.status === 'inStock');
    const totalFloorValue = inStockVehicles.reduce((sum, vehicle) => sum + vehicle.floor, 0);
    return totalFloorValue * shared_1.OPERATING_EXPENSES.floorPlanInterestRate;
}
class SimulationEngine {
    constructor(repository, options = {}) {
        this.repository = repository;
        this.options = options;
        this.rng = new random_1.RNG(options.seed);
    }
    getState() {
        return this.repository.getState();
    }
    tick(hours = 1, forceTick = false) {
        let state = this.repository.getState();
        for (let i = 0; i < hours; i += 1) {
            state = this.runHour(state, forceTick);
        }
        this.repository.setState(state);
        return state;
    }
    // Helper to advance a full day (for manual "Advance 1 Day" button)
    tickDay(forceTick = false) {
        return this.tick(12, forceTick); // 12 hours = 1 business day
    }
    updateCoefficients(coefficients) {
        const state = this.repository.getState();
        state.coefficients = coefficients;
        this.repository.setState(state);
    }
    runHour(state, forceTick = false) {
        // Allow manual advancement even when paused (unless auto-advancing)
        if (state.paused && !forceTick) {
            return state;
        }
        const nextState = {
            ...state,
            hour: state.hour + 1,
            notifications: [],
            // Initialize daily accumulators if this is the first hour
            todayDeals: state.todayDeals || [],
            todaySoldVehicles: state.todaySoldVehicles || [],
            todayLeadsGenerated: state.todayLeadsGenerated || 0,
            todayAppointments: state.todayAppointments || 0,
            todayDealsWorked: state.todayDealsWorked || 0,
            todayCashDelta: state.todayCashDelta || 0,
            todayCsiDelta: state.todayCsiDelta || 0,
            todayMoraleDelta: state.todayMoraleDelta || 0,
            todayServiceHours: state.todayServiceHours || 0,
            todayServiceParts: state.todayServiceParts || 0,
            todayServiceROs: state.todayServiceROs || 0,
        };
        // Deliver pending inventory at noon (hour 12)
        if (nextState.hour === 12) {
            nextState.inventory = nextState.inventory.map(vehicle => {
                if (vehicle.status === 'pending') {
                    return { ...vehicle, status: 'inStock' };
                }
                return vehicle;
            });
            const pendingDelivered = nextState.inventory.filter(v => v.status === 'inStock' && v.ageDays === 0).length;
            if (pendingDelivered > 0) {
                nextState.notifications.push(`${pendingDelivered} vehicles arrived from auction.`);
            }
        }
        // If we've reached end of business day (9 PM = hour 21), pause and wait for player to close out
        const endOfDay = nextState.hour > 21;
        if (endOfDay) {
            // Don't advance yet, just pause and wait for manual closeout
            nextState.hour = 21; // Keep at 9 PM
            nextState.paused = true; // Pause for manual closeout
            return nextState;
        }
        // During business hours, process sales and service activity
        const currentInventory = nextState.inventory.filter(v => v.status === 'inStock');
        // Run hourly sales
        const sales = (0, sales_1.simulateSalesHour)(nextState.advisors, currentInventory, nextState.marketing, nextState.economy, nextState.coefficients, this.rng, nextState.hour);
        // Update inventory with sold vehicles
        const soldIds = new Set(sales.soldVehicles.map(v => v.id));
        nextState.inventory = nextState.inventory
            .filter(v => !soldIds.has(v.id))
            .concat(sales.soldVehicles.map(v => ({ ...v, status: 'sold' })));
        // Accumulate sales results
        nextState.todayDeals = nextState.todayDeals || [];
        nextState.todaySoldVehicles = nextState.todaySoldVehicles || [];
        nextState.todayDeals.push(...sales.deals);
        nextState.todaySoldVehicles.push(...sales.soldVehicles);
        nextState.todayLeadsGenerated = (nextState.todayLeadsGenerated || 0) + sales.leadsGenerated;
        nextState.todayAppointments = (nextState.todayAppointments || 0) + sales.appointments;
        nextState.todayDealsWorked = (nextState.todayDealsWorked || 0) + sales.dealsWorked;
        nextState.todayCashDelta = (nextState.todayCashDelta || 0) + sales.cashDelta;
        nextState.todayCsiDelta = (nextState.todayCsiDelta || 0) + sales.csiDelta;
        nextState.todayMoraleDelta = (nextState.todayMoraleDelta || 0) + sales.moraleDelta;
        // Update cash immediately
        nextState.cash = Math.round(nextState.cash + sales.cashDelta);
        // Store recent deals and lead activity
        nextState.recentDeals = [...sales.deals, ...nextState.recentDeals].slice(0, 20);
        nextState.leadActivity = [...sales.leadActivity, ...nextState.leadActivity].slice(0, 50);
        // Update pipeline (current hour's activity)
        nextState.pipeline = {
            leads: sales.leadsGenerated,
            appointments: sales.appointments,
            deals: sales.dealsWorked,
        };
        // Run hourly service (distribute daily service demand across 12 hours)
        const soldCount = sales.deals.length;
        const hourlyServiceDemand = Math.round((nextState.coefficients.service.baseDemand * 0.5 +
            soldCount * 0.8 +
            nextState.inventory.length * 0.05) / 12);
        const serviceResult = (0, service_1.runServiceDepartment)(nextState.technicians, nextState.serviceQueue, hourlyServiceDemand, this.rng);
        nextState.completedROs = [...serviceResult.completed, ...nextState.completedROs].slice(0, 50);
        nextState.serviceQueue = serviceResult.queue;
        // Accumulate service results
        nextState.todayServiceHours = (nextState.todayServiceHours || 0) + serviceResult.laborHours;
        nextState.todayServiceParts = (nextState.todayServiceParts || 0) + serviceResult.partsRevenue;
        nextState.todayServiceROs = (nextState.todayServiceROs || 0) + serviceResult.completed.length;
        const hourlyServiceGross = (serviceResult.partsRevenue + serviceResult.laborHours * 150) * 0.4;
        nextState.cash = Math.round(nextState.cash + hourlyServiceGross);
        nextState.todayCashDelta = (nextState.todayCashDelta || 0) + hourlyServiceGross;
        nextState.todayCsiDelta = (nextState.todayCsiDelta || 0) + serviceResult.csiDelta;
        return nextState;
    }
    // Close out the day - processes all daily operations and advances to next day
    closeOutDay(forceTick = false) {
        let state = this.repository.getState();
        // Only allow closeout if we're at end of day
        if (state.hour < 21) {
            return state;
        }
        state = this.runDailyOperations(state, forceTick);
        this.repository.setState(state);
        return state;
    }
    runDailyOperations(state, forceTick = false) {
        const startingCash = state.cash; // Track cash at start of day
        const startingInventory = state.inventory.filter(v => v.status === 'inStock').length;
        // Use accumulated daily results
        const soldCount = (state.todayDeals || []).length;
        const deals = state.todayDeals || [];
        const soldVehicles = state.todaySoldVehicles || [];
        const totalServiceHours = state.todayServiceHours || 0;
        const totalServiceParts = state.todayServiceParts || 0;
        const totalServiceROs = state.todayServiceROs || 0;
        let nextState = {
            ...state,
            hour: 9, // Reset to 9 AM
            day: state.day + 1,
            notifications: [],
            // Clear daily accumulators
            todayDeals: [],
            todaySoldVehicles: [],
            todayLeadsGenerated: 0,
            todayAppointments: 0,
            todayDealsWorked: 0,
            todayCashDelta: 0,
            todayCsiDelta: 0,
            todayMoraleDelta: 0,
            todayServiceHours: 0,
            todayServiceParts: 0,
            todayServiceROs: 0,
        };
        if (nextState.day > DAYS_PER_MONTH) {
            nextState.day = 1;
            nextState.month += 1;
            if (nextState.month > 12) {
                nextState.month = 1;
                nextState.year += 1;
            }
        }
        // economy drift and random events
        const drift = (this.rng.nextFloat() - 0.5) * state.coefficients.economy.volatility;
        nextState.economy = {
            ...nextState.economy,
            demandIndex: (0, math_1.clamp)(nextState.economy.demandIndex + drift, 0.4, 2),
            interestRate: (0, math_1.clamp)(nextState.economy.interestRate + (this.rng.nextFloat() - 0.5) * state.coefficients.economy.interestRateBand, 1.5, 12),
            incentiveLevel: (0, math_1.clamp)(nextState.economy.incentiveLevel * (0.96 + this.rng.nextFloat() * 0.08), 0, 1.5),
        };
        const randomEvent = (0, randomEvents_1.applyRandomEvents)(nextState, this.rng);
        nextState.economy = randomEvent.economy;
        nextState.notifications = [...nextState.notifications, ...randomEvent.notifications];
        // age inventory (happens at end of day)
        const agedInventory = (0, inventory_1.ageInventory)(nextState.inventory, nextState.economy.demandIndex);
        nextState.inventory = agedInventory;
        // update advisors morale based on today's performance
        const todayMoraleDelta = state.todayMoraleDelta || 0;
        nextState.advisors = nextState.advisors.map((advisor) => {
            const moraleAdjustment = todayMoraleDelta / Math.max(nextState.advisors.length, 1);
            const trainingBoost = advisor.trained.length * (state.coefficients.morale.trainingEffect / 100);
            const morale = (0, math_1.clamp)(advisor.morale + moraleAdjustment * 5 + trainingBoost, 20, 100);
            return { ...advisor, morale };
        });
        const trailingSales = Math.max(1, soldCount);
        // Service already happened throughout the day, calculate totals
        const serviceRevenue = totalServiceParts + totalServiceHours * 150;
        const serviceGross = serviceRevenue * 0.4;
        // update marketing lead multiplier
        const todayLeadsGenerated = state.todayLeadsGenerated || 0;
        nextState.marketing.leadMultiplier = todayLeadsGenerated / Math.max(1, nextState.coefficients.lead.basePerDay);
        // Final pipeline state shows total day's activity
        const pipeline = {
            leads: todayLeadsGenerated,
            appointments: state.todayAppointments || 0,
            deals: state.todayDealsWorked || 0,
        };
        nextState.pipeline = pipeline;
        // Calculate and deduct operating expenses, floor plan interest, and marketing spend (end of day)
        const operatingExpenses = calculateOperatingExpenses(nextState);
        const floorPlanInterest = calculateFloorPlanInterest(nextState);
        const marketingSpend = nextState.marketing.spendPerDay;
        nextState.cash = Math.round(nextState.cash - operatingExpenses - floorPlanInterest - marketingSpend);
        // Track revenue and sales for progression
        const dailyRevenue = deals.reduce((acc, deal) => acc + deal.soldPrice, 0) + serviceGross;
        nextState.totalRevenue += dailyRevenue;
        nextState.lifetimeSales += soldVehicles.length;
        // update CSI and morale index based on today's activity
        const todayCsiDelta = state.todayCsiDelta || 0;
        nextState.csi = (0, math_1.clamp)(nextState.csi + todayCsiDelta / 50, 10, 100);
        nextState.moraleIndex = (0, math_1.clamp)(nextState.advisors.reduce((acc, advisor) => acc + advisor.morale, 0) / Math.max(nextState.advisors.length, 1), 0, 100);
        // Deals and lead activity were already added throughout the day
        // reporting
        const gameDate = `${nextState.year}-${String(nextState.month).padStart(2, '0')}-${String(nextState.day).padStart(2, '0')}`;
        const dailyReport = {
            date: gameDate,
            salesUnits: soldCount,
            frontGross: deals.reduce((acc, deal) => acc + deal.frontGross, 0),
            backGross: deals.reduce((acc, deal) => acc + deal.backGross, 0),
            totalGross: deals.reduce((acc, deal) => acc + deal.totalGross, 0) + serviceGross,
            closingRate: pipeline.deals > 0 ? soldCount / pipeline.deals : 0,
            serviceLaborHours: totalServiceHours,
            servicePartsRevenue: totalServiceParts,
            serviceComebackRate: 0, // Can't easily calculate this from accumulated data
            cash: nextState.cash,
            marketingSpend: marketingSpend,
            operatingExpenses: operatingExpenses,
            floorPlanInterest: floorPlanInterest,
            moraleIndex: nextState.moraleIndex,
            csi: nextState.csi,
        };
        nextState.dailyHistory = [...nextState.dailyHistory, dailyReport].slice(-60);
        if (nextState.day === DAYS_PER_MONTH) {
            const monthKey = `${nextState.year}-${String(nextState.month).padStart(2, '0')}`;
            const monthReports = nextState.dailyHistory.filter((report) => report.date.startsWith(monthKey));
            const salesUnits = monthReports.reduce((acc, report) => acc + report.salesUnits, 0);
            const frontGross = monthReports.reduce((acc, report) => acc + report.frontGross, 0);
            const backGross = monthReports.reduce((acc, report) => acc + report.backGross, 0);
            const totalGross = monthReports.reduce((acc, report) => acc + report.totalGross, 0);
            const serviceLabor = monthReports.reduce((acc, report) => acc + report.serviceLaborHours, 0);
            const partsRevenue = monthReports.reduce((acc, report) => acc + report.servicePartsRevenue, 0);
            const comebackRate = monthReports.length
                ? monthReports.reduce((acc, report) => acc + report.serviceComebackRate, 0) / monthReports.length
                : 0;
            const closingRate = monthReports.length
                ? monthReports.reduce((acc, report) => acc + report.closingRate, 0) / monthReports.length
                : 0;
            const monthlyOperatingExpenses = monthReports.reduce((acc, report) => acc + report.operatingExpenses, 0);
            const monthlyFloorPlanInterest = monthReports.reduce((acc, report) => acc + report.floorPlanInterest, 0);
            const monthly = {
                month: monthKey,
                salesUnits,
                frontGross,
                backGross,
                totalGross,
                avgFrontGross: salesUnits ? frontGross / salesUnits : 0,
                avgBackGross: salesUnits ? backGross / salesUnits : 0,
                closingRate,
                inventoryStart: state.inventory.length,
                inventoryEnd: nextState.inventory.length,
                aged60Plus: nextState.inventory.filter((vehicle) => vehicle.ageDays >= 60).length,
                aged90Plus: nextState.inventory.filter((vehicle) => vehicle.ageDays >= 90).length,
                serviceLaborHours: serviceLabor,
                servicePartsRevenue: partsRevenue,
                comebackRate,
                cashDelta: nextState.cash - state.cash,
                advertisingROI: (state.todayCashDelta || 0) > 0 ? (state.todayCashDelta || 0) / Math.max(nextState.marketing.spendPerDay, 1) : 0,
                fixedCoverage: partsRevenue > 0 ? serviceGross / partsRevenue : 0,
                moraleTrend: nextState.moraleIndex - state.moraleIndex,
                trainingCompletions: nextState.advisors.reduce((acc, advisor) => acc + advisor.trained.length, 0),
                csi: nextState.csi,
                operatingExpenses: monthlyOperatingExpenses,
                floorPlanInterest: monthlyFloorPlanInterest,
            };
            nextState.monthlyReports = [monthly, ...nextState.monthlyReports.filter((report) => report.month !== monthKey)];
        }
        // Removed guardrail notification - no longer needed
        // Create daily summary notification (shown first as modal)
        const dailySummary = this.createDailySummary(nextState, soldCount, deals, totalServiceHours, totalServiceParts, totalServiceROs, serviceGross, operatingExpenses, floorPlanInterest, startingCash, startingInventory);
        nextState.notifications.push(dailySummary);
        // Check for progression unlocks and achievements (shown after daily summary)
        const progressionResult = (0, unlockManager_1.runProgressionCheck)(nextState);
        nextState = progressionResult.state;
        nextState.notifications.push(...progressionResult.notifications);
        // Keep paused after closeout so player can see summary
        nextState.paused = true;
        return nextState;
    }
    createDailySummary(state, soldCount, deals, serviceHours, serviceParts, serviceROs, serviceGross, opEx, floorInterest, startingCash, startingInventory) {
        const frontGross = deals.reduce((acc, deal) => acc + deal.frontGross, 0);
        const backGross = deals.reduce((acc, deal) => acc + deal.backGross, 0);
        const totalGross = frontGross + backGross + serviceGross;
        const salesCash = deals.reduce((acc, deal) => acc + deal.soldPrice, 0);
        const marketingSpend = state.marketing.spendPerDay;
        const totalRevenue = salesCash + serviceGross;
        const totalExpenses = opEx + floorInterest + marketingSpend;
        const netCash = totalRevenue - totalExpenses;
        const netSign = netCash >= 0 ? '+' : '';
        const endingInventory = state.inventory.filter(v => v.status === 'inStock').length;
        const inventoryChange = endingInventory - startingInventory;
        const inventorySign = inventoryChange >= 0 ? '+' : '';
        // Show the previous day's summary (the day that just completed)
        const completedDay = state.day === 1 ? 30 : state.day - 1;
        let summary = `📊 Day ${completedDay} Complete!\n\n`;
        // Sales Performance
        summary += `━━━ 🚗 SALES ━━━\n`;
        summary += `Units Sold: ${soldCount}\n`;
        summary += `Front Gross: $${Math.round(frontGross).toLocaleString()}`;
        if (soldCount > 0)
            summary += ` ($${Math.round(frontGross / soldCount).toLocaleString()}/unit)`;
        summary += `\n`;
        summary += `Back Gross: $${Math.round(backGross).toLocaleString()}`;
        if (soldCount > 0)
            summary += ` ($${Math.round(backGross / soldCount).toLocaleString()}/unit)`;
        summary += `\n`;
        summary += `Total Sales Gross: $${Math.round(frontGross + backGross).toLocaleString()}\n\n`;
        // Service Performance
        summary += `━━━ 🔧 SERVICE ━━━\n`;
        summary += `Labor Hours: ${serviceHours.toFixed(1)} hrs\n`;
        summary += `Parts Revenue: $${Math.round(serviceParts).toLocaleString()}\n`;
        summary += `Service Gross: $${Math.round(serviceGross).toLocaleString()}\n`;
        summary += `ROs Completed: ${serviceROs}\n\n`;
        // Cash Flow
        summary += `━━━ 💵 CASH FLOW ━━━\n`;
        summary += `Starting Cash: $${Math.round(startingCash).toLocaleString()}\n`;
        summary += `Revenue: +$${Math.round(totalRevenue).toLocaleString()}\n`;
        summary += `Expenses: -$${Math.round(totalExpenses).toLocaleString()}\n`;
        summary += `  • OpEx: $${Math.round(opEx).toLocaleString()}\n`;
        summary += `  • Floor Interest: $${Math.round(floorInterest).toLocaleString()}\n`;
        summary += `  • Marketing: $${Math.round(marketingSpend).toLocaleString()}\n`;
        summary += `Net Change: ${netSign}$${Math.round(netCash).toLocaleString()}\n`;
        summary += `Ending Cash: $${Math.round(state.cash).toLocaleString()}\n\n`;
        // Inventory
        summary += `━━━ 📦 INVENTORY ━━━\n`;
        summary += `Starting: ${startingInventory} units\n`;
        summary += `Sold: -${soldCount}\n`;
        summary += `Ending: ${endingInventory} units (${inventorySign}${inventoryChange})`;
        return summary;
    }
}
exports.SimulationEngine = SimulationEngine;
