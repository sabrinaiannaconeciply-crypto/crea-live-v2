import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://zxmyyltezdzsusjcdtfw.supabase.co", "sb_publishable_Gs8P8oR7wcYMshCgWSc31Q_GZ5Nw8Vc");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

