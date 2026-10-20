"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('=== SERVER TS LOADED ===');
const app_1 = __importDefault(require("./src/app"));
const db_1 = __importDefault(require("./src/config/db"));
const aiScheduler_1 = require("./src/jobs/aiScheduler");
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        // Attempt to connect to the database to verify it's working
        await db_1.default.$connect();
        console.log('Successfully connected to the database.');
        // Initialize Gemini AI Daily Scheduler
        await aiScheduler_1.aiScheduler.initialize();
        app_1.default.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        await db_1.default.$disconnect();
        process.exit(1);
    }
}
startServer();
// Graceful shutdown
process.on('SIGINT', async () => {
    await db_1.default.$disconnect();
    console.log('Prisma disconnected on app termination');
    process.exit(0);
});
