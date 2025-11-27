import React, { useState, useEffect, useRef } from "react";
import {
	Send,
	Link as LinkIcon,
	Trophy,
	ShieldAlert,
	Loader2,
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

	const isPenaltyActive =
		teamData?.penaltyEndsAt &&
		new Date(teamData.penaltyEndsAt).getTime() > Date.now();

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (!isPenaltyActive) return;
		const interval = setInterval(() => {
			setTimeLeft(formatTimeRemaining(teamData.penaltyEndsAt));
		}, 1000);
		return () => clearInterval(interval);
	}, [isPenaltyActive, teamData?.penaltyEndsAt]);

	const handleSend = async (e) => {
		e.preventDefault();
		if (!input.trim() || sending || isPenaltyActive) return;

		const userText = input.trim();
		setInput("");
		setSending(true);

		const newMsgs = [
			...messages,
			{ sender: "user", text: userText, timestamp: Date.now() },
		];
		setMessages(newMsgs);

		try {
			const response = await apiService.submitAnswer(teamName, userText);

			setTeamData((prev) => ({
				...prev,
				currentStage: response.currentStage,
				penaltyEndsAt: response.penaltyEndsAt,
				completed: response.completed,
			}));

			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: response.message,
					image: response.image || null,
					timestamp: Date.now(),
				},
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: "⚠️ Connection Error: Could not reach the server.",
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

	return (
		<div className="flex flex-col h-full bg-slate-900">
			{/* Header */}
			<div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between shadow-md z-10">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-white text-lg">{teamName}</h2>
						<button
							onClick={copyLink}
							className="text-slate-400 hover:text-emerald-400 p-1"
						>
							<LinkIcon className="w-4 h-4" />
						</button>
					</div>
					<div className="flex items-center space-x-2 text-xs text-slate-400">
						<span>Stage: {teamData?.currentStage || 0}</span>
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

			{/* Messages */}
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
									? "bg-red-900/50 border border-red-700 text-red-200"
									: "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
							}`}
						>
							<p className="whitespace-pre-wrap text-sm leading-relaxed">
								{msg.text}
							</p>
							{msg.image && (
								<div className="mt-2 rounded-lg overflow-hidden bg-black/20">
									<img
										src={msg.image}
										alt="Clue"
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

			{/* Input */}
			{isPenaltyActive ? (
				<div className="bg-red-900/20 backdrop-blur-sm border-t-2 border-red-600 p-6 flex flex-col items-center justify-center">
					<ShieldAlert className="w-8 h-8 text-red-500 mb-2 animate-pulse" />
					<h3 className="text-red-400 font-bold">SYSTEM LOCKED</h3>
					<div className="text-3xl font-mono font-bold text-red-500 mt-1">
						{timeLeft}
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
						placeholder="Type code here..."
						className="flex-1 bg-slate-900 text-white border border-slate-700 rounded-full px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
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
