export interface EnvVariables {
  supabaseUrl: string;
  supabaseServiceKey: string;
  emailJsServiceId: string;
  emailJsTemplateId: string;
  emailJsPublicKey: string;
}

const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY,
  emailJsServiceId: process.env.NEXT_PUBLIC_EMAIL_SERVICE_ID,
  emailJsTemplateId: process.env.NEXT_PUBLIC_EMAIL_TEMPLATE_ID,
  emailJsPublicKey: process.env.NEXT_PUBLIC_EMAIL_PUBLIC_KEY,
};

export default env;
