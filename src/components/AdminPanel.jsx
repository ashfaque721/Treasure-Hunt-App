import { useState, useEffect } from "react";
import {
	ShieldAlert,
	RefreshCw,
	CheckCircle,
	Clock,
	Unlock,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { formatTimeRemaining } from "../utils/helper";

export default function AdminPanel() {
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchTeams = async () => {
		setLoading(true);
		try {
			const data = await apiService.getAdminTeams();
			const sorted = data.sort((a, b) => b.currentStage - a.currentStage);
			setTeams(sorted);
		} catch {
			alert("Failed to fetch admin data");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTeams();
		const interval = setInterval(fetchTeams, 10000);
		return () => clearInterval(interval);
	}, []);

	const handleClearPenalty = async (teamId) => {
		if (!confirm("Clear penalty for this team?")) return;
		try {
			await apiService.clearPenalty(teamId);
			fetchTeams();
		} catch {
			alert("Failed to clear penalty");
		}
	};

	return (
		<div className="h-screen flex flex-col bg-slate-950 text-white">
			<div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
				<h1 className="text-xl font-bold flex items-center gap-2">
					<ShieldAlert className="text-indigo-500" /> Control Center
				</h1>
				<button
					onClick={fetchTeams}
					className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"
				>
					<RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{teams.map((team) => {
						const isPenalty =
							team.penaltyEndsAt &&
							new Date(team.penaltyEndsAt).getTime() > Date.now();
						return (
							<div
								key={team.id}
								className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden"
							>
								{isPenalty && (
									<div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
								)}
								{team.completed && (
									<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
								)}

								<div className="flex justify-between items-start mb-2">
									<h3 className="font-bold text-lg truncate">{team.name}</h3>
									{team.completed ? (
										<CheckCircle className="text-emerald-500 w-5 h-5" />
									) : isPenalty ? (
										<Clock className="text-red-500 w-5 h-5 animate-pulse" />
									) : (
										<div className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
											Active
										</div>
									)}
								</div>

								<div className="space-y-3">
									<div className="flex justify-between text-sm text-slate-400">
										<span>Stage: {team.currentStage} / 15</span>
										{isPenalty && (
											<span className="text-red-400">
												{formatTimeRemaining(team.penaltyEndsAt)}
											</span>
										)}
									</div>
									<div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
										<div
											className={`h-full rounded-full ${
												team.completed
													? "bg-emerald-500"
													: isPenalty
													? "bg-red-500"
													: "bg-indigo-500"
											}`}
											style={{ width: `${(team.currentStage / 15) * 100}%` }}
										></div>
									</div>
									{isPenalty && (
										<button
											onClick={() => handleClearPenalty(team.id)}
											className="w-full py-2 mt-2 bg-red-900/30 text-red-400 border border-red-800 rounded text-xs font-bold flex items-center justify-center gap-2"
										>
											<Unlock className="w-3 h-3" /> Lift Penalty
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
