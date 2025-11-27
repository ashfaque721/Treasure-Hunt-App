import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import LoginScreen from "./components/LoginScreen";
import GameInterface from "./components/GameInterface";
import AdminPanel from "./components/AdminPanel";
import { apiService } from "./services/apiService";
import { getLocalStorageKey } from "./utils/helper";

export default function App() {
	const [view, setView] = useState("login");
	const [teamName, setTeamName] = useState("");
	const [teamData, setTeamData] = useState(null);
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [initializing, setInitializing] = useState(true);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const urlTeam = params.get("team");
		const localTeam = localStorage.getItem("ipe_active_team");

		if (urlTeam) {
			handleLoginFlow(decodeURIComponent(urlTeam));
		} else if (localTeam) {
			handleLoginFlow(localTeam);
		} else {
			setInitializing(false);
		}
	}, []);

	useEffect(() => {
		if (teamName && messages.length > 0) {
			localStorage.setItem(
				getLocalStorageKey(teamName),
				JSON.stringify(messages)
			);
		}
	}, [messages, teamName]);

	const handleLoginFlow = async (name) => {
		const cleanName = name.trim();
		if (!cleanName) return;

		if (cleanName === "admin") {
			setTeamName(cleanName);
			setView("admin");
			setInitializing(false);
			return;
		}

		setLoading(true);
		setTeamName(cleanName);
		localStorage.setItem("ipe_active_team", cleanName);

		const savedChat = localStorage.getItem(getLocalStorageKey(cleanName));
		if (savedChat) {
			setMessages(JSON.parse(savedChat));
		} else {
			setMessages([
				{
					sender: "bot",
					text: `Welcome Team ${cleanName}!\nI am the Hunt Master. Type 'start' to begin your journey.`,
					timestamp: Date.now(),
				},
			]);
		}

		try {
			const data = await apiService.login(cleanName);
			setTeamData(data);
			setView("game");
		} catch (err) {
			console.error("Login failed:", err);
			alert("Could not sync with server. You are in offline mode.");
			setView("game");
		} finally {
			setLoading(false);
			setInitializing(false);
		}
	};

	if (initializing)
		return (
			<div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
				<Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
			</div>
		);

	return (
		<div className="h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
			{view === "login" && (
				<LoginScreen onLogin={handleLoginFlow} loading={loading} />
			)}
			{view === "game" && (
				<GameInterface
					teamName={teamName}
					teamData={teamData}
					messages={messages}
					setMessages={setMessages}
					setTeamData={setTeamData}
				/>
			)}
			{view === "admin" && <AdminPanel />}
		</div>
	);
}
