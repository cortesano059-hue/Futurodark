import ck from "chalk";
import { z, ZodObject, ZodRawShape } from "zod";
import { brBuilder } from "@magicyan/discord";
import chalk from "chalk";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";

const x = chalk.red("✖︎");
const w = chalk.yellow("▲");

export function validateEnv<T extends ZodRawShape>(schema: ZodObject<T>){
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/546674be-faae-42e3-ad4a-2feced9a0111',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'base.env.ts:9',message:'validateEnv called',data:{cwd:cwd(),envFileExists:existsSync(join(cwd(),'.env')),botTokenExists:!!process.env.BOT_TOKEN,botTokenLength:process.env.BOT_TOKEN?.length||0,clientIdExists:!!process.env.CLIENT_ID,mongoUriExists:!!process.env.MONGO_URI,webhookLogsUrl:process.env.WEBHOOK_LOGS_URL||'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/546674be-faae-42e3-ad4a-2feced9a0111',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'base.env.ts:10',message:'process.env keys before validation',data:{envKeys:Object.keys(process.env).filter(k=>k.includes('BOT')||k.includes('CLIENT')||k.includes('OWNER')||k.includes('MONGO')||k.includes('WEBHOOK')).sort(),allEnvKeysCount:Object.keys(process.env).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const result = schema.loose().safeParse(process.env);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/546674be-faae-42e3-ad4a-2feced9a0111',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'base.env.ts:11',message:'validation result',data:{success:result.success,errorCount:result.success?0:result.error.issues.length,errors:result.success?[]:result.error.issues.map(e=>({path:e.path.join('.'),code:e.code,message:e.message}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!result.success){
        const u = ck.underline;
        for(const error of result.error.issues){
            const { path, message } = error;
            console.error(`${x} ENV VAR → ${u.bold(path)} ${message}`);
            if (error.code == "invalid_type")
                console.log(ck.dim(
                    `└ "Expected: ${u.green(error.expected)} | Received: ${u.red(error.input)}`
                ));
        }
        console.log();
        console.warn(brBuilder(
            `${w} Some ${ck.magenta("environment variables")} are undefined.`,
            `  Here are some ways to avoid these errors:`,
            `- Run the project using ${u.bold("./package.json")} scripts that include the ${ck.blue("--env-file")} flag.`,
            `- Inject the ${u("variables")} into the environment manually or through a tool`,
            "",
            chalk.blue(
                `↗ ${chalk.underline("https://constatic-docs.vercel.app/docs/discord/conventions/env")}`
            ),
            ""
        ));
        process.exit(1);
    }
    console.log(ck.green(`${ck.magenta("☰ Environment variables")} loaded ✓`));

    return result.data as Record<string, string> & z.infer<typeof schema>;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            "Use import { env } from \"#settings\"": never
        }
    }
}