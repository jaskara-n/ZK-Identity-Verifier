export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/$/, "");
export const VERIFIER_URL = (import.meta.env.VITE_VERIFIER_URL || "http://localhost:5050").replace(/\/$/, "");
export const IS_SANDBOX = (import.meta.env.VITE_ENV || "sandbox") !== "production";
