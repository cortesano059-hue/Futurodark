import { validateEnv } from "#base";
import { z } from "zod";

export const env = validateEnv(z.object({
    // Discord Bot Configuration
    BOT_TOKEN: z.string("Discord Bot Token is required").min(1),
    CLIENT_ID: z.string("Discord Client ID is required").min(1),
    OWNER_ID: z.string("Bot Owner ID is required").min(1),
    GUILD_ID: z.string().optional(),
    
    // Database Configuration
    MONGO_URI: z.string("MongoDb URI is required").min(1),
    DATABASE_NAME: z.string().optional(),
    
    // Webhook Logging (optional)
    WEBHOOK_LOGS_URL: z.preprocess((val) => (val === "" || val === undefined) ? undefined : val, z.url().optional()),
    DISCORD_LOG_WEBHOOK_ID: z.string().optional(),
    DISCORD_LOG_WEBHOOK_TOKEN: z.string().optional(),
}));