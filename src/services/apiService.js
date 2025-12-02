import { API_ENDPOINTS } from "../config/apiConfig";

// Helper to parse backend errors
const parseError = async (response) => {
	try {
		const text = await response.text(); // Get text first to debug HTML errors
		try {
			const err = JSON.parse(text);
			if (typeof err.detail === "string") return err.detail;
			if (Array.isArray(err.detail)) {
				return err.detail
					.map((e) => `${e.loc ? e.loc.join("->") : "Field"}: ${e.msg}`)
					.join(", ");
			}
			return err.message || response.statusText;
		} catch {
			return `Server Error (${response.status}): Response was not JSON`;
		}
	} catch (e) {
		return `Server Error (${response.status})`;
	}
};

export const apiService = {
	// POST /user/login
	login: async (teamId, password) => {
		try {
			const response = await fetch(API_ENDPOINTS.LOGIN, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					team_id: teamId,
					password: password,
				}),
			});

			if (!response.ok) {
				const errorMessage = await parseError(response);
				throw new Error(errorMessage);
			}
			return await response.json();
		} catch (error) {
			console.error("Login API Error:", error);
			throw error;
		}
	},

	// POST /game
	sendGameAction: async (teamId, command, code) => {
		try {
			const payload = {
				team_id: teamId,
				command: command ? command : null,
				code: code ? code : null,
			};

			const response = await fetch(API_ENDPOINTS.GAME_ACTION, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				if (response.status === 500) {
					throw new Error("Server Error (500). Possible invalid Team ID.");
				}
				const errorMessage = await parseError(response);
				throw new Error(errorMessage);
			}

			const data = await response.json();

			let penaltyTime = data?.penalty_ends_at || data?.penaltyEndsAt;

			if (
				!penaltyTime &&
				data?.message === "You have given 3 consecutive wrong answers!!!"
			) {
				console.warn("Penalty triggered by message content");
				penaltyTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
			}

			return {
				...data,
				penaltyEndsAt: penaltyTime,
			};
		} catch (error) {
			console.error("Game API Error:", error);
			throw error;
		}
	},

	// GET /info
	getAdminInfo: async () => {
		try {
			const response = await fetch(API_ENDPOINTS.ADMIN_INFO);
			if (!response.ok) {
				const errorMessage = await parseError(response);
				throw new Error(errorMessage);
			}
			return await response.json();
		} catch (error) {
			console.error("Admin API Error:", error);
			throw error;
		}
	},

	// Helper: Clear penalty = set isPenalty to false
	clearPenalty: async (teamId) => {
		return apiService.togglePenalty(teamId, false);
	},

	// POST /isPenalty
	// Payload: { team_id: "...", isPenalty: boolean }
	togglePenalty: async (teamId, isPenalty) => {
		try {
			const response = await fetch(API_ENDPOINTS.TOGGLE_PENALTY, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					team_id: teamId,
					isPenalty: isPenalty,
				}),
			});

			if (!response.ok) {
				const errorMessage = await parseError(response);
				throw new Error(errorMessage);
			}
			return await response.json();
		} catch (error) {
			console.error("Toggle Penalty Error:", error);
			throw error;
		}
	},
};
