import { requestUrl } from "obsidian";
import type { TagResponse } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "qwen/qwen3-next-80b-a3b-instruct:free";

function buildSystemPrompt(): string {
	return [
		"You are a tagging assistant for Obsidian notes.",
		"You will receive a document and a list of allowed tags.",
		"Select the most relevant tags from the allowed list ONLY.",
		"Do NOT invent or create new tags — use only the provided allowed tags.",
		"If no tags are relevant, return an empty list.",
		"Respond with valid JSON in this exact format and nothing else:",
		'{"tags": ["tag1", "tag2"]}',
	].join(" ");
}

function buildUserPrompt(
	content: string,
	allowedTags: string[],
	maxTags: number
): string {
	const truncated =
		content.length > 6000 ? content.slice(0, 6000) + "\n[...]" : content;

	return [
		"DOCUMENT:",
		truncated,
		"",
		"ALLOWED TAGS:",
		allowedTags.join(", "),
		"",
		`Return the best 1 to ${maxTags} tags in order of relevance.`,
	].join("\n");
}

function parseTagsFromResponse(raw: string): string[] | null {
	// Try direct JSON parse first
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed.tags)) {
			return parsed.tags.filter(
				(t: unknown) => typeof t === "string" && t.trim().length > 0
			);
		}
	} catch {
		// Fall through to regex extraction
	}

	// Try extracting JSON object from response text
	const jsonMatch = raw.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[0]);
			if (Array.isArray(parsed.tags)) {
				return parsed.tags.filter(
					(t: unknown) => typeof t === "string" && t.trim().length > 0
				);
			}
		} catch {
			// Fall through
		}
	}

	return null;
}

export async function fetchTagsFromOpenRouter(
	apiKey: string,
	documentContent: string,
	allowedTags: string[],
	maxTags: number
): Promise<TagResponse> {
	if (!apiKey || apiKey.trim() === "") {
		return {
			tags: [],
			error: {
				type: "api_key_missing",
				message:
					"OpenRouter API key not configured. Add it in plugin settings.",
			},
		};
	}

	if (!documentContent || documentContent.trim().length < 10) {
		return {
			tags: [],
			error: {
				type: "empty_document",
				message:
					"The document is empty or too short for meaningful tag analysis.",
			},
		};
	}

	if (allowedTags.length === 0) {
		return {
			tags: [],
			error: {
				type: "no_tags_folder",
				message:
					"No tags available. Add tag files to your tags folder first.",
			},
		};
	}

	try {
		const response = await requestUrl({
			url: OPENROUTER_URL,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey.trim()}`,
				"HTTP-Referer":
					"https://github.com/danitrrga/ai-auto-tagger",
				"X-Title": "AI Auto Tagger Obsidian Plugin",
			},
			body: JSON.stringify({
				model: MODEL,
				response_format: { type: "json_object" },
				temperature: 0.2,
				max_tokens: 200,
				messages: [
					{ role: "system", content: buildSystemPrompt() },
					{
						role: "user",
						content: buildUserPrompt(
							documentContent,
							allowedTags,
							maxTags
						),
					},
				],
			}),
			throw: false,
		});

		if (response.status === 401) {
			return {
				tags: [],
				error: {
					type: "api_error",
					message:
						"Invalid API key. Check your OpenRouter API key in settings.",
				},
			};
		}

		if (response.status === 429) {
			return {
				tags: [],
				error: {
					type: "api_error",
					message:
						"Rate limit exceeded. Please wait a moment and try again.",
				},
			};
		}

		if (response.status >= 500) {
			return {
				tags: [],
				error: {
					type: "api_error",
					message:
						"OpenRouter service error. Please try again later.",
				},
			};
		}

		if (response.status !== 200) {
			return {
				tags: [],
				error: {
					type: "api_error",
					message: `API request failed (status ${response.status}).`,
				},
			};
		}

		const data = response.json;

		if (
			!data.choices ||
			data.choices.length === 0 ||
			!data.choices[0].message?.content
		) {
			return {
				tags: [],
				error: {
					type: "api_error",
					message:
						"Unexpected API response structure. The AI service may be experiencing issues.",
				},
			};
		}

		const rawContent = data.choices[0].message.content.trim();
		const parsedTags = parseTagsFromResponse(rawContent);

		if (parsedTags === null) {
			return {
				tags: [],
				error: {
					type: "parsing_error",
					message:
						"AI returned a malformed response. Please try again.",
				},
			};
		}

		// Validate against allowed tags (case-insensitive)
		const allowedSet = new Map(
			allowedTags.map((t) => [t.toLowerCase(), t])
		);
		const validTags: string[] = [];
		const seen = new Set<string>();

		for (const tag of parsedTags) {
			const normalized = tag.toLowerCase().trim();
			const original = allowedSet.get(normalized);
			if (original && !seen.has(normalized)) {
				validTags.push(original);
				seen.add(normalized);
			}
		}

		if (validTags.length === 0) {
			return {
				tags: [],
				error: {
					type: "no_relevant_tags",
					message:
						"The AI could not identify any relevant tags from your tag list for this document.",
				},
			};
		}

		return { tags: validTags.slice(0, maxTags) };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Unknown error occurred";

		if (
			message.includes("net::") ||
			message.includes("fetch") ||
			message.includes("network") ||
			message.includes("ENOTFOUND") ||
			message.includes("ECONNREFUSED")
		) {
			return {
				tags: [],
				error: {
					type: "api_error",
					message:
						"Network error. Please check your internet connection.",
				},
			};
		}

		return {
			tags: [],
			error: {
				type: "api_error",
				message: `Request failed: ${message}`,
			},
		};
	}
}
