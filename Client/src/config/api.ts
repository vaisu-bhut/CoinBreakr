export const API_CONFIG = {
    DOMAIN_URL: 'http://api.beleno.clestiq.com',
    FALLBACK_IP: '35.188.9.86', 
    PORT: 3000,
    API_VERSION: 'v1',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    HEALTH_CHECK_TIMEOUT: 5000,
};

let currentApiUrl: string | null = null;
let lastHealthCheck: number = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

const checkDomainHealth = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.HEALTH_CHECK_TIMEOUT);
        
        const response = await fetch(`${API_CONFIG.DOMAIN_URL}:${API_CONFIG.PORT}/${API_CONFIG.API_VERSION}/healthz`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        clearTimeout(timeoutId);
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
        currentApiUrl = `${API_CONFIG.DOMAIN_URL}:${API_CONFIG.PORT}/${API_CONFIG.API_VERSION}`;
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
    return `${API_CONFIG.DOMAIN_URL}/${API_CONFIG.API_VERSION}`;
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
