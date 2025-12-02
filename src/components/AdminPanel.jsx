import { useState, useEffect } from "react";
import {
	ShieldAlert,
	RefreshCw,
	CheckCircle,
	Clock,
	Unlock,
	Award,
	Lock,
} from "lucide-react";
import { apiService } from "../services/apiService";

export default function AdminPanel() {
	const [teams, setTeams] = useState([]);
	const [firstSolvers, setFirstSolvers] = useState({});
	const [loading, setLoading] = useState(false);

	const fetchTeams = async () => {
		setLoading(true);
		try {
			const data = await apiService.getAdminInfo();
			const teamList = data?.info || [];

			// Process First Solvers Logic
			const solversMap = {};

			if (Array.isArray(teamList)) {
				teamList.forEach((team) => {
					const riddles = team.solved_riddles || [];
					const times = team.solved_riddles_time || [];

					riddles.forEach((riddleId, index) => {
						const timeStr = times[index];
						if (!timeStr) return;

						const solveTime = new Date(timeStr).getTime();

						if (
							!solversMap[riddleId] ||
							solveTime < solversMap[riddleId].time
						) {
							solversMap[riddleId] = {
								teamName: team.team_name || team.team_id,
								time: solveTime,
								timeStr: timeStr,
							};
						}
					});
				});

				setFirstSolvers(solversMap);

				const sorted = teamList.sort(
					(a, b) => (b.solved_riddle_num || 0) - (a.solved_riddle_num || 0)
				);
				setTeams(sorted);
			} else {
				setTeams([]);
			}
		} catch (err) {
			console.error("Fetch Error:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTeams();
		const interval = setInterval(fetchTeams, 10000);
		return () => clearInterval(interval);
	}, []);

	const handleTogglePenalty = async (teamId, currentStatus) => {
		const action = currentStatus ? "Lift" : "Impose";
		if (!confirm(`${action} penalty for this team?`)) return;

		try {
			// If currently TRUE (penalty active), send FALSE to lift.
			// If currently FALSE (no penalty), send TRUE to impose.
			await apiService.togglePenalty(teamId, !currentStatus);
			alert(`Penalty ${action.toLowerCase()}ed successfully.`);
			fetchTeams();
		} catch (err) {
			alert(`Failed to ${action.toLowerCase()} penalty: ${err.message}`);
		}
	};

	return (
		<div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
			{/* Header */}
			<div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md z-10">
				<h1 className="text-xl font-bold flex items-center gap-2">
					<ShieldAlert className="text-indigo-500" /> Control Center
				</h1>
				<button
					onClick={fetchTeams}
					className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
				>
					<RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
				</button>
			</div>

			<div className="flex-1 overflow-hidden flex flex-col md:flex-row">
				{/* MAIN DASHBOARD: Team List */}
				<div className="flex-1 overflow-y-auto p-6 border-r border-slate-800">
					<h2 className="text-lg font-bold mb-4 text-slate-300 flex items-center gap-2">
						<CheckCircle className="w-5 h-5 text-emerald-500" /> Live Team
						Status
					</h2>
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
						{teams.map((team, idx) => {
							const isPenalty = team.isPenalty;

							return (
								<div
									key={team.team_id || idx}
									className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden"
								>
									{isPenalty && (
										<div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
									)}

									<div className="flex justify-between items-start mb-2">
										<div className="overflow-hidden pr-2">
											<h3
												className="font-bold text-lg truncate text-white"
												title={team.team_name}
											>
												{team.team_name || "Unknown Team"}
											</h3>
											<p
												className="text-xs text-slate-500 font-mono truncate"
												title={team.team_id}
											>
												ID: {team.team_id}
											</p>
										</div>
										{isPenalty ? (
											<div className="flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-900/50 whitespace-nowrap">
												<Clock className="w-3 h-3 animate-pulse" /> Penalty
												Active
											</div>
										) : (
											<div className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700 whitespace-nowrap">
												Active
											</div>
										)}
									</div>

									<div className="space-y-3 mt-3">
										<div>
											<div className="flex justify-between text-xs text-slate-400 mb-1">
												<span>Progress</span>
												<span className="text-white font-medium">
													{team.solved_riddle_num} / 15 Solved
												</span>
											</div>
											<div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
												<div
													className={`h-full rounded-full transition-all duration-500 ${
														isPenalty ? "bg-red-500" : "bg-indigo-500"
													}`}
													style={{
														width: `${
															((team.solved_riddle_num || 0) / 15) * 100
														}%`,
													}}
												></div>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/50 p-2 rounded-lg">
											<div className="flex flex-col">
												<span className="text-slate-500">Current Level</span>
												<span className="text-indigo-300 font-medium truncate">
													{team.current_riddle || "None"}
												</span>
											</div>
											<div className="flex flex-col items-end">
												<span className="text-slate-500">Wrong Guesses</span>
												<span
													className={`font-medium ${
														team.wrong_guess >= 3
															? "text-red-500"
															: "text-emerald-400"
													}`}
												>
													{team.wrong_guess}
												</span>
											</div>
										</div>

										<button
											onClick={() =>
												handleTogglePenalty(team.team_id, isPenalty)
											}
											className={`w-full py-2 mt-2 border rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
												isPenalty
													? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
													: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/50"
											}`}
										>
											{isPenalty ? (
												<>
													<Unlock className="w-3 h-3" /> Lift Penalty
												</>
											) : (
												<>
													<Lock className="w-3 h-3" /> Impose Penalty
												</>
											)}
										</button>
									</div>
								</div>
							);
						})}
						{teams.length === 0 && (
							<div className="col-span-full text-center py-10 text-slate-500">
								Waiting for teams...
							</div>
						)}
					</div>
				</div>

				{/* SIDEBAR: First Solvers Leaderboard */}
				<div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto">
					<h2 className="text-lg font-bold mb-4 text-slate-300 flex items-center gap-2">
						<Award className="w-5 h-5 text-yellow-500" /> First Solvers
					</h2>
					<div className="space-y-3">
						{Object.keys(firstSolvers).length > 0 ? (
							Object.entries(firstSolvers)
								.sort((a, b) => {
									const numA = parseInt(a[0].replace(/\D/g, "")) || 0;
									const numB = parseInt(b[0].replace(/\D/g, "")) || 0;
									return numA - numB;
								})
								.map(([riddle, data]) => (
									<div
										key={riddle}
										className="p-3 bg-slate-800 rounded-lg border border-slate-700/50"
									>
										<div className="flex justify-between items-center mb-1">
											<span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
												{riddle}
											</span>
											<span className="text-[10px] text-slate-500">
												{data.timeStr}
											</span>
										</div>
										<div className="text-sm text-white font-medium flex items-center gap-2">
											<Award className="w-3 h-3 text-yellow-500" />
											{data.teamName}
										</div>
									</div>
								))
						) : (
							<div className="text-sm text-slate-500 text-center py-4">
								No riddles solved yet.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
