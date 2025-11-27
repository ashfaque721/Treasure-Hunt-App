export const API_BASE_URL = "https://chatbot-qy8i.onrender.com";

export const API_ENDPOINTS = {
	LOGIN: `${API_BASE_URL}/api/login`,
	SUBMIT_ANSWER: `${API_BASE_URL}/api/submit`,
	ADMIN_TEAMS: `${API_BASE_URL}/api/admin/teams`,
	ADMIN_CLEAR_PENALTY: `${API_BASE_URL}/api/admin/clear_penalty`,
	GET_RIDDLES: `${API_BASE_URL}/api/riddles`,
};

// Set to false when ready to use the real backend
export const USE_MOCK_MODE = true;
