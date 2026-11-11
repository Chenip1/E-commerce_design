declare namespace Cloudflare {
  interface Env {
    WORKSHOP_CREDENTIAL_SECRET?: string;
    OPENAI_API_KEY?: string;
    OPENAI_IMAGE_MODEL?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
