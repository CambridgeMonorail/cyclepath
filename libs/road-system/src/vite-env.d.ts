/// <reference types="vite/client" />

/**
 * Type declarations for Vite environment variables
 * This extends the ImportMeta interface to include Vite's env property
 */
interface ImportMeta {
  readonly env: {
    /**
     * Built-in environment variable that indicates whether the app is running in development mode
     */
    readonly DEV: boolean;
    /**
     * Built-in environment variable that indicates whether the app is running in production mode
     */
    readonly PROD: boolean;
    /**
     * Base public path when served in development or production
     */
    readonly BASE_URL: string;
    /**
     * Current mode (development or production)
     */
    readonly MODE: string;
    /**
     * Allow custom environment variables (prefixed with VITE_)
     */
    readonly [key: `VITE_${string}`]: string | boolean | undefined;
  };
}
