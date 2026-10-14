declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    INSTAGRAM_APP_ID?: string;
    INSTAGRAM_APP_SECRET?: string;
    INSTAGRAM_TOKEN_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
