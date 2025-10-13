"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMonth = exports.formatDate = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const formatDate = (day, month, year) => {
    return (0, dayjs_1.default)().year(year).month(month - 1).date(day).format('YYYY-MM-DD');
};
exports.formatDate = formatDate;
const formatMonth = (month, year) => {
    return (0, dayjs_1.default)().year(year).month(month - 1).format('YYYY-MM');
};
exports.formatMonth = formatMonth;
