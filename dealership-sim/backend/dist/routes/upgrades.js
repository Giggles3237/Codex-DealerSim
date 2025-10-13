"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const types_1 = require("./types");
const unlockManager_1 = require("../core/progression/unlockManager");
const router = (0, express_1.Router)();
const purchaseSchema = zod_1.z.object({
    upgradeId: zod_1.z.string(),
});
router.post('/upgrades/purchase', (0, types_1.asEngineHandler)((req, res) => {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    try {
        const newState = (0, unlockManager_1.purchaseUpgrade)(state, parsed.data.upgradeId);
        const upgrade = newState.availableUpgrades.find(u => u.id === parsed.data.upgradeId);
        newState.notifications.push(`✨ Purchased: ${upgrade?.name}!`);
        newState.notifications.push(upgrade?.description || '');
        req.repository.setState(newState);
        res.json(newState);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}));
exports.default = router;
