// Dragon Strike uses the central Dragon Realm database shared by every site in the
// ecosystem (see src/dps/config.ts). There are no per-site Supabase keys to configure.
export { supabase } from "../dps";

export const supabaseConfigured = true;
