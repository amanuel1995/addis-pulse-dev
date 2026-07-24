import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StagingConfig = {
  projectRef: string;
  url: string;
  serviceRoleKey: string;
  appUrl?: string;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadStagingConfig(options: { requireAppUrl?: boolean } = {}): StagingConfig {
  if (process.env.ALLOW_STAGING_FIXTURES !== "true") {
    throw new Error("Refusing staging operation: ALLOW_STAGING_FIXTURES must equal true.");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing staging operation while NODE_ENV is production.");
  }

  const projectRef = required("STAGING_PROJECT_REF");
  const url = required("STAGING_SUPABASE_URL");
  const serviceRoleKey = required("STAGING_SUPABASE_SERVICE_ROLE_KEY");
  const productionRef = required("PRODUCTION_PROJECT_REF");
  if (!url.includes(projectRef)) {
    throw new Error("Refusing staging operation: staging URL does not contain the staging project reference.");
  }
  if (productionRef === projectRef) {
    throw new Error("Refusing staging operation: staging and production project references match.");
  }

  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== `${projectRef}.supabase.co`) {
    throw new Error("Refusing staging operation: staging URL host does not exactly match the project reference.");
  }

  const appUrl = process.env.STAGING_APP_URL;
  if (options.requireAppUrl && !appUrl) {
    throw new Error("Missing required environment variable: STAGING_APP_URL");
  }
  return { projectRef, url, serviceRoleKey, appUrl };
}

export function createStagingAdmin(config: StagingConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
