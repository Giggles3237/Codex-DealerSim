"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveStateToFile = exports.loadStateFromFile = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const DEFAULT_SAVE_PATH = path_1.default.resolve(__dirname, '../../data/save.json');
const loadStateFromFile = async (customPath) => {
    const filePath = customPath ? path_1.default.resolve(customPath) : DEFAULT_SAVE_PATH;
    try {
        const raw = await fs_1.promises.readFile(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch (error) {
        return null;
    }
};
exports.loadStateFromFile = loadStateFromFile;
const saveStateToFile = async (state, customPath) => {
    const filePath = customPath ? path_1.default.resolve(customPath) : DEFAULT_SAVE_PATH;
    await fs_1.promises.mkdir(path_1.default.dirname(filePath), { recursive: true });
    await fs_1.promises.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
};
exports.saveStateToFile = saveStateToFile;
