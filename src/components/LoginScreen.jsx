import { useState } from "react";
import { MapPin, Loader2, User, Lock, AlertCircle } from "lucide-react";
import { USE_MOCK_MODE } from "../config/apiConfig";

export default function LoginScreen({ onLogin, loading }) {
	const [teamId, setTeamId] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!teamId.trim() || !password.trim()) {
			setError("Please enter both Team ID and Password.");
			return;
		}

		try {
			await onLogin(teamId, password);
		} catch (err) {
			console.error("Login Component Error:", err);
			if (err.message === "Failed to fetch") {
				setError(
					"Network Error: Unable to reach the server. The backend might be sleeping (Render free tier) or CORS is blocking the request."
				);
			} else {
				setError(err.message || "Login failed. Please check your credentials.");
			}
		}
	};

	return (
		<div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
			<div className="w-full max-w-md bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl">
				<div className="flex justify-center mb-6">
					<MapPin className="w-16 h-16 text-emerald-400" />
				</div>
				<h1 className="text-3xl font-bold text-center mb-2 text-white">
					IPE '24 Hunt
				</h1>
				<p className="text-slate-400 text-center mb-8">
					Secure Terminal Access
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="flex items-center gap-2 p-3 text-sm text-red-200 bg-red-900/50 border border-red-700 rounded-lg animate-pulse">
							<AlertCircle className="w-4 h-4 flex-shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
							<User className="w-3 h-3" /> Team ID
						</label>
						<input
							type="text"
							value={teamId}
							onChange={(e) => setTeamId(e.target.value)}
							className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
							placeholder="e.g. 0170514756"
							autoFocus
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
							<Lock className="w-3 h-3" /> Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
							placeholder="••••••••"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								<span>Authenticating...</span>
							</>
						) : (
							"Establish Connection"
						)}
					</button>
				</form>
				{USE_MOCK_MODE && (
					<div className="mt-4 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-500 text-center">
						⚠️ Running in Mock Mode
					</div>
				)}
			</div>
		</div>
	);
}
