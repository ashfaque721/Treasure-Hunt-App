export const getLocalStorageKey = (teamName) =>
	`ipe_hunt_chat_${teamName.toLowerCase().replace(/\s+/g, "_")}`;

export const formatTimeRemaining = (endsAt) => {
	if (!endsAt) return "";
	const diff = new Date(endsAt).getTime() - Date.now();
	if (diff <= 0) return "00:00";
	const minutes = Math.floor(diff / 60000);
	const seconds = Math.floor((diff % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
