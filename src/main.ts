import { Plugin, Notice, TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "./types";
import type { AIAutoTaggerSettings } from "./types";
import { AIAutoTaggerSettingTab } from "./settings";
import { TagConfirmationModal } from "./modals";
import { fetchTagsFromOpenRouter } from "./api";
import { getAvailableTags, insertTagsIntoFile } from "./tagger";

export default class AIAutoTaggerPlugin extends Plugin {
	settings: AIAutoTaggerSettings = DEFAULT_SETTINGS;
	private isProcessing = false;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addRibbonIcon("tag", "AI Auto Tagger", () =>
			this.handleTagging()
		);

		this.addSettingTab(new AIAutoTaggerSettingTab(this.app, this));

		this.addCommand({
			id: "ai-auto-tagger-run",
			name: "Run AI Auto Tagger",
			callback: () => this.handleTagging(),
		});
	}

	async handleTagging(): Promise<void> {
		if (this.isProcessing) {
			new Notice("Already analyzing — please wait.", 3000);
			return;
		}

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file. Open a note first.");
			return;
		}

		// Validate settings early
		if (!this.settings.openRouterApiKey) {
			new Notice(
				"OpenRouter API key not configured. Open plugin settings to add it.",
				5000
			);
			return;
		}

		if (!this.settings.tagsFolderPath) {
			new Notice(
				"Tags folder not configured. Set it in plugin settings.",
				5000
			);
			return;
		}

		// Get available tags
		const availableTags = await getAvailableTags(
			this.app,
			this.settings.tagsFolderPath
		);

		if (availableTags.length === 0) {
			new Notice(
				"No tag files found in your tags folder. Add files to use as tags.",
				5000
			);
			return;
		}

		// Read document
		const fileContent = await this.app.vault.read(activeFile);

		// Show processing indicator
		this.isProcessing = true;
		const processingNotice = new Notice(
			"Analyzing document and suggesting tags...",
			0
		);

		try {
			const response = await fetchTagsFromOpenRouter(
				this.settings.openRouterApiKey,
				fileContent,
				availableTags,
				this.settings.maxTags
			);

			processingNotice.hide();

			if (response.error || response.tags.length === 0) {
				const msg = response.error?.message ?? "No tags suggested. Please try again.";
				new Notice(msg, 6000);
				return;
			}

			if (this.settings.autoInsert) {
				await this.autoInsertTags(activeFile, response.tags);
			} else {
				this.showTagModal(activeFile, response.tags);
			}
		} catch {
			processingNotice.hide();
			new Notice(
				"An unexpected error occurred while generating tags.",
				5000
			);
		} finally {
			this.isProcessing = false;
		}
	}

	private async autoInsertTags(
		file: TFile,
		tags: string[]
	): Promise<void> {
		try {
			await insertTagsIntoFile(this.app, file, tags);
			new Notice(
				`Tags added: ${tags.map((t) => `[[${t}]]`).join(" ")}`,
				3000
			);
		} catch {
			new Notice("Failed to insert tags. Please try again.", 5000);
		}
	}

	private showTagModal(file: TFile, tags: string[]): void {
		new TagConfirmationModal(this.app, file, tags, () => {
			// No-op: modal handles insertion and notices internally
		}).open();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
