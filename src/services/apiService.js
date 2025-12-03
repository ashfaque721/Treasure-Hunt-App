import { API_ENDPOINTS } from "../config/apiConfig";

// Helper to parse backend errors
const parseError = async (response) => {
	try {
		const text = await response.text();
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
			// 1. Authenticate
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

			// 2. Fetch full team details from /info to get team_name, solved_riddles, etc.
			try {
				const infoResponse = await fetch(API_ENDPOINTS.ADMIN_INFO);
				if (infoResponse.ok) {
					const data = await infoResponse.json();
					// Find the specific team in the info array
					const teamDetails = data.info?.find((t) => t.team_id === teamId);

					if (teamDetails) {
						// Return the rich data object
						// Calculate penalty time if needed
						if (teamDetails.isPenalty && !teamDetails.penaltyEndsAt) {
							teamDetails.penaltyEndsAt = new Date(
								Date.now() + 30 * 60 * 1000
							).toISOString();
						}
						return teamDetails;
					}
				}
			} catch (e) {
				console.warn("Could not fetch team details, using defaults", e);
			}

			// Fallback if /info fails but login passed
			return {
				team_id: teamId,
				team_name: teamId, // Fallback name
				solved_riddle_num: 0,
				message: "Login Successful",
			};
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

			const gameResponse = await response.json();

			// Fetch updated stats (like solved count) to keep UI in sync
			let updatedStats = {};
			try {
				const infoResponse = await fetch(API_ENDPOINTS.ADMIN_INFO);
				if (infoResponse.ok) {
					const data = await infoResponse.json();
					const teamDetails = data.info?.find((t) => t.team_id === teamId);
					if (teamDetails) {
						updatedStats = teamDetails;
					}
				}
			} catch (e) {
				console.warn("Background stat update failed");
			}

			// Merge Game Response with Updated Stats
			const finalData = { ...updatedStats, ...gameResponse };

			// Penalty Logic
			let penaltyTime = finalData.penalty_ends_at || finalData.penaltyEndsAt;

			if (
				!penaltyTime &&
				(finalData.isPenalty === true ||
					finalData.message === "You have given 3 consecutive wrong answers!!!")
			) {
				console.warn("Penalty triggered locally");
				penaltyTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
				finalData.isPenalty = true; // Ensure flag is set
			}

			return {
				...finalData,
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

	clearPenalty: async (teamId) => {
		return apiService.togglePenalty(teamId, false);
	},

	// POST /isPenalty
	togglePenalty: async (teamId, isPenalty) => {
		try {
			const url = `${API_ENDPOINTS.TOGGLE_PENALTY}?team_id=${encodeURIComponent(
				teamId
			)}&isPenalty=${isPenalty}`;

			const response = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: null,
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
