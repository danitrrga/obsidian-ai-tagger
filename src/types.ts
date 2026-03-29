export interface AIAutoTaggerSettings {
	tagsFolderPath: string;
	openRouterApiKey: string;
	maxTags: number;
	autoInsert: boolean;
}

export const DEFAULT_SETTINGS: AIAutoTaggerSettings = {
	tagsFolderPath: "",
	openRouterApiKey: "",
	maxTags: 5,
	autoInsert: false,
};

export type ErrorType =
	| "api_key_missing"
	| "empty_document"
	| "api_error"
	| "parsing_error"
	| "no_relevant_tags"
	| "no_tags_folder";

export interface TagError {
	type: ErrorType;
	message: string;
}

export interface TagResponse {
	tags: string[];
	error?: TagError;
}
