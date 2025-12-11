import { validateEnv } from "#base";
import { z } from "zod";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";

// #region agent log
fetch('http://127.0.0.1:7242/ingest/546674be-faae-42e3-ad4a-2feced9a0111',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'env.ts:4',message:'env.ts module loading',data:{cwd:cwd(),envFileExists:existsSync(join(cwd(),'.env')),envFileAbsolute:join(cwd(),'.env')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion

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
    WEBHOOK_LOGS_URL: z.url().optional(),
    DISCORD_LOG_WEBHOOK_ID: z.string().optional(),
    DISCORD_LOG_WEBHOOK_TOKEN: z.string().optional(),
}));