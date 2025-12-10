import React, { useState, useEffect, useRef } from "react";
import {
	Send,
	Link as LinkIcon,
	Trophy,
	Loader2,
	AlertTriangle,
	ShieldAlert,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { formatTimeRemaining } from "../utils/helper";

export default function GameInterface({
	teamName,
	teamData,
	messages,
	setMessages,
	setTeamData,
}) {
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [timeLeft, setTimeLeft] = useState("");
	const messagesEndRef = useRef(null);

	// 1. Calculate State-based Penalty
	const isStatePenalty =
		teamData?.isPenalty === true ||
		(teamData?.penaltyEndsAt &&
			new Date(teamData.penaltyEndsAt).getTime() > Date.now());

	// 2. Calculate Message-based Penalty (Fallback)
	const lastMsg = messages[messages.length - 1];
	const isMessagePenalty =
		lastMsg?.sender === "bot" &&
		(lastMsg.text?.includes("You are in penalty period") ||
			lastMsg.text?.includes("consecutive wrong answers"));

	const isPenaltyActive = isStatePenalty || isMessagePenalty;

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (!isPenaltyActive) return;

		const updateTimer = () => {
			if (teamData?.penaltyEndsAt) {
				const remaining =
					new Date(teamData.penaltyEndsAt).getTime() - Date.now();

				if (remaining <= 0) {
					// Time is up! Automatically lift penalty.
					apiService
						.togglePenalty(teamName, false)
						.then(() => {
							setTeamData((prev) => ({
								...prev,
								isPenalty: false,
								penaltyEndsAt: null,
							}));
						})
						.catch((err) => console.error("Auto-lift failed:", err));
				} else {
					setTimeLeft(formatTimeRemaining(teamData.penaltyEndsAt));
				}
			} else {
				setTimeLeft("LOCKED");
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [isPenaltyActive, teamData?.penaltyEndsAt, teamName, setTeamData]);

	const handleSend = async (e) => {
		e.preventDefault();
		if (!input.trim() || sending || isPenaltyActive) return;

		const userText = input.trim();
		setInput("");
		setSending(true);

		setMessages((prev) => [
			...prev,
			{ sender: "user", text: userText, timestamp: Date.now() },
		]);

		try {
			let response;
			const lowerText = userText.toLowerCase();

			if (lowerText === "start") {
				response = await apiService.sendGameAction(teamName, "start", null);
			} else if (lowerText === "hint") {
				response = await apiService.sendGameAction(teamName, "hint", null);
			} else if (lowerText === "team_info") {
				response = await apiService.sendGameAction(teamName, "team_info", null);
			} else {
				response = await apiService.sendGameAction(teamName, null, userText);
			}

			// Update state logic
			setTeamData((prev) => {
				const next = { ...(prev || {}) };

				if (response.currentStage !== undefined)
					next.currentStage = response.currentStage;
				if (response.isPenalty !== undefined)
					next.isPenalty = response.isPenalty;
				if (response.penaltyEndsAt) next.penaltyEndsAt = response.penaltyEndsAt;
				if (response.completed !== undefined)
					next.completed = response.completed;

				return next;
			});

			// FIX: Prioritize 'message' field if 'text' is missing.
			// This is common for error-like 200 OK responses (e.g. "Wrong answer")
			const botText =
				response.text ||
				response.message ||
				(response.image ? "" : "No response text received.");

			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: botText,
					image: response.image || null,
					timestamp: Date.now(),
				},
			]);
		} catch (error) {
			console.error("Game Action Error:", error);
			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: error.message || "⚠️ Connection Error. Please try again.",
					isError: true,
					timestamp: Date.now(),
				},
			]);
		} finally {
			setSending(false);
		}
	};

	const copyLink = () => {
		const url = `${window.location.origin}${
			window.location.pathname
		}?team=${encodeURIComponent(teamName)}`;
		navigator.clipboard.writeText(url);
		alert("Link copied!");
	};

	const displayName = teamData?.team_name || teamName;
	const solvedCount = teamData?.solved_riddle_num || 0;

	return (
		<div className="flex flex-col h-full bg-slate-900">
			<div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between shadow-md z-10">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-white text-lg">{displayName}</h2>
						<button
							onClick={copyLink}
							className="text-slate-400 hover:text-emerald-400 p-1"
						>
							<LinkIcon className="w-4 h-4" />
						</button>
					</div>
					<div className="flex items-center space-x-2 text-xs text-slate-400">
						<span>Solved: {solvedCount}</span>
						<span className="w-1 h-1 bg-slate-500 rounded-full"></span>
						<span
							className={
								isPenaltyActive ? "text-red-400 font-bold" : "text-emerald-400"
							}
						>
							{isPenaltyActive ? "PENALTY ACTIVE" : "Active"}
						</span>
					</div>
				</div>
				{teamData?.completed && <Trophy className="text-yellow-400 w-6 h-6" />}
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900 scroll-smooth">
				{messages.map((msg, idx) => (
					<div
						key={idx}
						className={`flex ${
							msg.sender === "user" ? "justify-end" : "justify-start"
						}`}
					>
						<div
							className={`max-w-[85%] rounded-2xl p-3 shadow-sm flex flex-col ${
								msg.sender === "user"
									? "bg-emerald-600 text-white rounded-tr-none"
									: msg.isError
									? "bg-red-900/80 border border-red-700 text-white"
									: "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
							}`}
						>
							{/* Only render text p tag if there is text */}
							{msg.text && (
								<p className="whitespace-pre-wrap text-sm leading-relaxed flex gap-2">
									{msg.isError && (
										<AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
									)}
									{msg.text}
								</p>
							)}

							{msg.image && (
								<div className="mt-2 rounded-lg overflow-hidden bg-black/20">
									<img
										src={msg.image}
										alt="Riddle Clue"
										className="w-full h-auto max-h-60 object-contain"
									/>
								</div>
							)}
							<span className="text-[10px] opacity-40 mt-1 text-right block">
								{new Date(msg.timestamp).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			{isPenaltyActive ? (
				<div className="bg-red-900/20 backdrop-blur-sm border-t-2 border-red-600 p-6 flex flex-col items-center justify-center animate-in slide-in-from-bottom-2">
					<ShieldAlert className="w-8 h-8 text-red-500 mb-2 animate-pulse" />
					<h3 className="text-red-400 font-bold">SYSTEM LOCKED</h3>
					<p className="text-red-300/70 text-xs mb-1">
						Too many incorrect attempts
					</p>
					<div className="text-3xl font-mono font-bold text-red-500 mt-1">
						{timeLeft || "30:00"}
					</div>
				</div>
			) : teamData?.completed ? (
				<div className="bg-emerald-900/20 border-t-2 border-emerald-600 p-6 flex flex-col items-center text-center">
					<Trophy className="w-8 h-8 text-emerald-400 mb-2" />
					<h3 className="text-emerald-400 font-bold">Mission Accomplished!</h3>
				</div>
			) : (
				<form
					onSubmit={handleSend}
					className="bg-slate-800 p-3 border-t border-slate-700 flex items-center gap-2"
				>
					<input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type 'start', 'hint', or your answer..."
						disabled={sending}
						className="flex-1 bg-slate-900 text-white border border-slate-700 rounded-full px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					/>
					<button
						disabled={sending || !input.trim()}
						type="submit"
						className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-3 rounded-full shadow-lg transition-all"
					>
						{sending ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							<Send className="w-5 h-5" />
						)}
					</button>
				</form>
			)}
		</div>
	);
}
