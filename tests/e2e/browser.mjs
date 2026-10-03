import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const require=createRequire(import.meta.url);
let playwright;
try { playwright=require('playwright'); } catch { playwright=require('C:/Users/gnsyo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const binary=process.env.PYORYUDO_BROWSER||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
export const chromium={launch:options=>playwright.chromium.launch({...options,...(binary?{executablePath:binary}:{})})};
