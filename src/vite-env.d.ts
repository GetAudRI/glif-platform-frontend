/// <reference types="vite/client" />

// Declare custom Vite environment variables
interface ImportMetaEnv {
  readonly VITE_BRANCH_NAME?: string;
  // Add other VITE_ environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

