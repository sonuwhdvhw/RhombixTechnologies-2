"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserClient = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in server/.env');
}
// Use service_role if available (bypasses RLS), otherwise fallback to anon
const adminKey = supabaseServiceKey && !supabaseServiceKey.includes('your-service-role')
    ? supabaseServiceKey
    : supabaseAnonKey;
if (!supabaseServiceKey || supabaseServiceKey.includes('your-service-role')) {
    console.warn('\x1b[33m[WARN] SUPABASE_SERVICE_ROLE_KEY not set — using anon key (RLS applies to server)\x1b[0m');
}
// Admin client — used for all server-side DB operations
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, adminKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
// Create a client with user's JWT for RLS-respecting operations
const createUserClient = (accessToken) => (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    },
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
exports.createUserClient = createUserClient;
//# sourceMappingURL=supabase.js.map