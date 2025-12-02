export const API_BASE_URL = "https://chatbot-1-61wp.onrender.com";

export const API_ENDPOINTS = {
	LOGIN: `${API_BASE_URL}/user/login`,
	GAME_ACTION: `${API_BASE_URL}/game`,
	ADMIN_INFO: `${API_BASE_URL}/info`,
	// This is the single endpoint for managing penalties
	TOGGLE_PENALTY: `${API_BASE_URL}/isPenalty`,
};
// We are strictly using the real backend now
export const USE_MOCK_MODE = false;
