import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zxmyyltezdzsusjcdtfw.supabase.co";
const supabaseAnonKey = "sb_publishable_Gs8P8oR7wcYMshCgWSc31Q_GZ5Nw8Vc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
