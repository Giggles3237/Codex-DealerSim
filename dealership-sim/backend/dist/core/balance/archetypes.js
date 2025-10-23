export const ADVISOR_ARCHETYPES = [
    {
        id: 'closer',
        name: 'Closer',
        description: 'Relentless negotiator, high close rate with CSI trade-off.',
        modifiers: { close: 0.18, gross: 0.1, csi: -0.1, speed: -0.05, bevAffinity: -0.05, backGross: 0.04 },
    },
    {
        id: 'relationship-builder',
        name: 'Relationship Builder',
        description: 'Prioritizes long-term satisfaction.',
        modifiers: { close: 0.06, gross: 0, csi: 0.15, speed: -0.02, bevAffinity: 0, backGross: 0.02 },
    },
    {
        id: 'tech-geek',
        name: 'Tech Geek',
        description: 'EV evangelist with product mastery.',
        modifiers: { close: 0.08, gross: -0.03, csi: 0.05, speed: -0.01, bevAffinity: 0.2, backGross: 0.03 },
    },
    {
        id: 'grinder',
        name: 'Grinder',
        description: 'Works every deal for maximum gross.',
        modifiers: { close: 0.02, gross: 0.18, csi: -0.05, speed: -0.08, bevAffinity: 0, backGross: 0.05 },
    },
    {
        id: 'charmer',
        name: 'Charmer',
        description: 'High energy, keeps appointments and CSI high.',
        modifiers: { close: 0.1, gross: -0.04, csi: 0.1, speed: 0.08, bevAffinity: 0.05, backGross: 0.01 },
    },
    {
        id: 'rookie',
        name: 'Rookie',
        description: 'Learning quickly but currently underperforming.',
        modifiers: { close: -0.06, gross: -0.08, csi: -0.02, speed: -0.05, bevAffinity: 0, backGross: -0.04 },
    },
    {
        id: 'process-pro',
        name: 'Process Pro',
        description: 'Consistent and reliable performer.',
        modifiers: { close: 0.07, gross: 0.04, csi: 0.03, speed: 0, bevAffinity: 0.02, backGross: 0.02 },
    },
    {
        id: 'high-energy',
        name: 'High Energy',
        description: 'Volume machine with thinner deals.',
        modifiers: { close: 0.12, gross: -0.09, csi: -0.02, speed: 0.15, bevAffinity: 0.03, backGross: -0.02 },
    },
    {
        id: 'finance-whisperer',
        name: 'Finance Whisperer',
        description: 'Excels at back-end products.',
        modifiers: { close: 0.05, gross: 0.02, csi: 0, speed: -0.03, bevAffinity: 0, backGross: 0.16 },
    },
    {
        id: 'slacker',
        name: 'Slacker',
        description: 'Low activity and engagement.',
        modifiers: { close: -0.08, gross: -0.06, csi: -0.08, speed: -0.12, bevAffinity: -0.05, backGross: -0.06 },
    },
];
export const TECH_ARCHETYPES = [
    {
        id: 'master-tech',
        name: 'Master Tech',
        description: 'High efficiency and low comebacks.',
        modifiers: { efficiency: 0.25, comebackRate: -0.05, moraleSensitivity: 0.1, bevCapture: 0.05 },
    },
    {
        id: 'flat-rate-rocket',
        name: 'Flat-Rate Rocket',
        description: 'Cranks hours with some quality risk.',
        modifiers: { efficiency: 0.35, comebackRate: 0.06, moraleSensitivity: -0.05, bevCapture: 0 },
    },
    {
        id: 'diagnostic-ace',
        name: 'Diagnostic Ace',
        description: 'Solves complex issues efficiently.',
        modifiers: { efficiency: 0.15, comebackRate: -0.03, moraleSensitivity: 0.05, bevCapture: 0.07 },
    },
    {
        id: 'apprentice',
        name: 'Apprentice',
        description: 'Still learning but motivated.',
        modifiers: { efficiency: -0.2, comebackRate: 0.04, moraleSensitivity: 0.08, bevCapture: 0 },
    },
    {
        id: 'grumpy-veteran',
        name: 'Grumpy Veteran',
        description: 'Steady output but morale swings matter.',
        modifiers: { efficiency: 0.05, comebackRate: -0.01, moraleSensitivity: 0.2, bevCapture: -0.02 },
    },
    {
        id: 'hybrid-specialist',
        name: 'Hybrid/EV Specialist',
        description: 'Captures BEV service revenue.',
        modifiers: { efficiency: 0.1, comebackRate: -0.02, moraleSensitivity: 0, bevCapture: 0.2 },
    },
    {
        id: 'warranty-wizard',
        name: 'Warranty Wizard',
        description: 'Finds billable warranty work.',
        modifiers: { efficiency: 0.08, comebackRate: -0.01, moraleSensitivity: 0.04, bevCapture: 0.02 },
    },
    {
        id: 'detail-oriented',
        name: 'Detail Oriented',
        description: 'Very low comebacks but slower throughput.',
        modifiers: { efficiency: -0.05, comebackRate: -0.08, moraleSensitivity: 0.05, bevCapture: 0 },
    },
];
export const CUSTOMER_ARCHETYPES = [
    {
        id: 'tire-kicker',
        name: 'Tire-Kicker',
        description: 'Here to browse with low intent.',
        modifiers: { closeBias: -0.2, grossBias: -0.1, csiBias: 0, bevAffinity: -0.05, priceSensitivity: 0.6, loyalty: -0.2 },
    },
    {
        id: 'payment-buyer',
        name: 'Payment Buyer',
        description: 'Payment sensitive, slow to close.',
        modifiers: { closeBias: -0.1, grossBias: -0.15, csiBias: 0, bevAffinity: 0, priceSensitivity: 0.9, loyalty: -0.05 },
    },
    {
        id: 'luxury-shopper',
        name: 'Luxury Shopper',
        description: 'Demands high CSI, pays for experience.',
        modifiers: { closeBias: 0.05, grossBias: 0.12, csiBias: 0.2, bevAffinity: 0.05, priceSensitivity: 0.3, loyalty: 0.1 },
    },
    {
        id: 'internet-shopper',
        name: 'Internet Shopper',
        description: 'Research heavy, expects best price.',
        modifiers: { closeBias: -0.02, grossBias: -0.12, csiBias: -0.05, bevAffinity: 0.08, priceSensitivity: 0.8, loyalty: 0 },
    },
    {
        id: 'loyalist',
        name: 'Loyalist',
        description: 'Repeat customer, easier close.',
        modifiers: { closeBias: 0.2, grossBias: 0.08, csiBias: 0.1, bevAffinity: 0.05, priceSensitivity: 0.2, loyalty: 0.4 },
    },
    {
        id: 'grinder',
        name: 'Grinder',
        description: 'Pushes for discounts, tough gross.',
        modifiers: { closeBias: -0.03, grossBias: -0.2, csiBias: -0.05, bevAffinity: 0, priceSensitivity: 0.85, loyalty: -0.1 },
    },
    {
        id: 'urgent-buyer',
        name: 'Urgent Buyer',
        description: 'Needs a car now, high close rate.',
        modifiers: { closeBias: 0.3, grossBias: -0.05, csiBias: -0.02, bevAffinity: -0.02, priceSensitivity: 0.4, loyalty: -0.05 },
    },
    {
        id: 'fleet-buyer',
        name: 'Fleet Buyer',
        description: 'Buys in bulk with thin margins.',
        modifiers: { closeBias: 0.1, grossBias: -0.25, csiBias: 0.05, bevAffinity: 0.1, priceSensitivity: 0.7, loyalty: 0.2 },
    },
    {
        id: 'ev-curious',
        name: 'EV Curious',
        description: 'Interested in BEVs and incentives.',
        modifiers: { closeBias: 0.08, grossBias: -0.05, csiBias: 0.05, bevAffinity: 0.25, priceSensitivity: 0.5, loyalty: 0.05 },
    },
    {
        id: 'service-to-sales',
        name: 'Service-to-Sales',
        description: 'In the shop, ready to trade.',
        modifiers: { closeBias: 0.18, grossBias: 0, csiBias: 0.12, bevAffinity: 0.05, priceSensitivity: 0.35, loyalty: 0.3 },
    },
];
