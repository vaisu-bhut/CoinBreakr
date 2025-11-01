export const API_CONFIG = {
    DOMAIN_URL: process.env.EXPO_PUBLIC_API_DOMAIN_URL,
    FALLBACK_IP: process.env.EXPO_PUBLIC_API_FALLBACK_IP,
    PORT: parseInt(process.env.EXPO_PUBLIC_API_PORT),
    API_VERSION: process.env.EXPO_PUBLIC_API_VERSION,
    TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT, 10),
    RETRY_ATTEMPTS: parseInt(process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS, 10),
    HEALTH_CHECK_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_HEALTH_CHECK_TIMEOUT, 10),
};

let currentApiUrl: string | null = null;
let lastHealthCheck: number = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

const checkDomainHealth = async (): Promise<boolean> => {
    try {
        // For HTTPS domains, don't add port if it's 443 (standard HTTPS port)
        const isHttps = API_CONFIG.DOMAIN_URL.startsWith('https://');
        const isStandardPort = (isHttps && API_CONFIG.PORT === 443) || (!isHttps && API_CONFIG.PORT === 80);

        const healthUrl = isStandardPort
            ? `${API_CONFIG.DOMAIN_URL}/${API_CONFIG.API_VERSION}/healthz`
            : `${API_CONFIG.DOMAIN_URL}:${API_CONFIG.PORT}/${API_CONFIG.API_VERSION}/healthz`;

        console.log('Checking health at:', healthUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.HEALTH_CHECK_TIMEOUT);

        const response = await fetch(healthUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        clearTimeout(timeoutId);
        console.log('Health check response status:', response.status);
        return response.status === 200;
    } catch (error) {
        console.warn('Domain health check failed:', error);
        return false;
    }
};

export const getApiUrl = async (): Promise<string> => {
    const now = Date.now();

    // Use cached URL if health check was recent
    if (currentApiUrl && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
        return currentApiUrl;
    }

    // Check domain health
    const isDomainHealthy = await checkDomainHealth();
    lastHealthCheck = now;

    if (isDomainHealthy) {
        // For HTTPS domains, don't add port if it's 443 (standard HTTPS port)
        const isHttps = API_CONFIG.DOMAIN_URL.startsWith('https://');
        const isStandardPort = (isHttps && API_CONFIG.PORT === 443) || (!isHttps && API_CONFIG.PORT === 80);

        currentApiUrl = isStandardPort
            ? `${API_CONFIG.DOMAIN_URL}/${API_CONFIG.API_VERSION}`
            : `${API_CONFIG.DOMAIN_URL}:${API_CONFIG.PORT}/${API_CONFIG.API_VERSION}`;
        console.log('Using domain URL:', currentApiUrl);
    } else {
        currentApiUrl = `http://${API_CONFIG.FALLBACK_IP}:${API_CONFIG.PORT}/${API_CONFIG.API_VERSION}`;
        console.log('Using fallback IP:', currentApiUrl);
    }

    return currentApiUrl;
};

// Synchronous version for immediate use (uses last known good URL)
export const getApiUrlSync = (): string => {
    if (currentApiUrl) {
        return currentApiUrl;
    }
    // Default to domain on first load
    const isHttps = API_CONFIG.DOMAIN_URL.startsWith('https://');
    const isStandardPort = (isHttps && API_CONFIG.PORT === 443) || (!isHttps && API_CONFIG.PORT === 80);

    return isStandardPort
        ? `${API_CONFIG.DOMAIN_URL}/${API_CONFIG.API_VERSION}`
        : `${API_CONFIG.DOMAIN_URL}:${API_CONFIG.PORT}/${API_CONFIG.API_VERSION}`;
};

// Initialize API URL on app start
export const initializeApiUrl = async (): Promise<void> => {
    await getApiUrl();
};

// Helper for making API requests with automatic URL resolution
export const makeApiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const baseUrl = await getApiUrl();
    return fetch(`${baseUrl}${endpoint}`, options);
};

export default API_CONFIG;
