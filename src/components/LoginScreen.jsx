import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { USE_MOCK_MODE } from "../config/apiConfig";

export default function LoginScreen({ onLogin, loading }) {
	const [name, setName] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		onLogin(name);
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
					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1">
							Team Identity
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
							placeholder="e.g. Beta Squad"
							autoFocus
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2"
					>
						{loading ? (
							<Loader2 className="animate-spin" />
						) : (
							"Establish Connection"
						)}
					</button>
				</form>
				{USE_MOCK_MODE && (
					<div className="mt-4 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-500 text-center">
						⚠️ Running in Mock Mode (No Real API)
					</div>
				)}
			</div>
		</div>
	);
}
