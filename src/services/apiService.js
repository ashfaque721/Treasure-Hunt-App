import { API_ENDPOINTS, USE_MOCK_MODE } from "../config/apiConfig";

// --- MOCK BACKEND (Simulation) ---
const mockApi = {
	db: { teams: {} },

	login: async (teamId) => {
		await new Promise((r) => setTimeout(r, 500));
		if (!mockApi.db.teams[teamId]) {
			mockApi.db.teams[teamId] = {
				id: teamId,
				name: teamId,
				currentStage: 0,
				penaltyEndsAt: null,
				completed: false,
				wrongCount: 0,
			};
		}
		return mockApi.db.teams[teamId];
	},

	submit: async (teamId, code) => {
		await new Promise((r) => setTimeout(r, 800));
		const team = mockApi.db.teams[teamId];

		if (code.toLowerCase() === "start" && team.currentStage === 0) {
			team.currentStage = 1;
			return {
				success: true,
				message:
					"Round 1: Go to the IPE library. Find book IPE-101. What color is it?",
				currentStage: 1,
				penaltyEndsAt: null,
			};
		}

		if (code.toLowerCase() === "code" || code.toLowerCase() === "skip") {
			team.currentStage += 1;
			team.wrongCount = 0;
			if (team.currentStage > 15) team.completed = true;
			return {
				success: true,
				message: team.completed
					? "🎉 CONGRATULATIONS! You won!"
					: `Correct! Next clue for Stage ${team.currentStage}...`,
				currentStage: team.currentStage,
				penaltyEndsAt: null,
				completed: team.completed,
			};
		}

		team.wrongCount += 1;
		let penalty = null;
		let msg = `❌ Incorrect code. Attempts: ${team.wrongCount}/3`;

		if (team.wrongCount >= 3) {
			const ends = Date.now() + 30 * 60 * 1000;
			team.penaltyEndsAt = ends;
			penalty = ends;
			msg = "🚫 WRONG CODE. 3 Strikes. System locked for 30 minutes.";
		}

		return {
			success: false,
			message: msg,
			currentStage: team.currentStage,
			penaltyEndsAt: penalty,
		};
	},

	getTeams: async () => Object.values(mockApi.db.teams),

	clearPenalty: async (teamId) => {
		if (mockApi.db.teams[teamId]) {
			mockApi.db.teams[teamId].penaltyEndsAt = null;
			mockApi.db.teams[teamId].wrongCount = 0;
		}
		return { success: true };
	},
};

// --- REAL API SERVICE ---
export const apiService = {
	login: async (teamName) => {
		if (USE_MOCK_MODE) return mockApi.login(teamName);
		const response = await fetch(API_ENDPOINTS.LOGIN, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team_id: teamName }),
		});
		if (!response.ok) throw new Error("API Login Failed");
		return await response.json();
	},

	submitAnswer: async (teamName, code) => {
		if (USE_MOCK_MODE) return mockApi.submit(teamName, code);
		const response = await fetch(API_ENDPOINTS.SUBMIT_ANSWER, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team_id: teamName, code: code }),
		});
		if (!response.ok) throw new Error("API Submit Failed");
		return await response.json();
	},

	getAdminTeams: async () => {
		if (USE_MOCK_MODE) return mockApi.getTeams();
		const response = await fetch(API_ENDPOINTS.ADMIN_TEAMS);
		if (!response.ok) throw new Error("Admin Fetch Failed");
		return await response.json();
	},

	clearPenalty: async (teamId) => {
		if (USE_MOCK_MODE) return mockApi.clearPenalty(teamId);
		const response = await fetch(API_ENDPOINTS.ADMIN_CLEAR_PENALTY, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team_id: teamId }),
		});
		return await response.json();
	},
};
