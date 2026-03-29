import { Modal, App, TFile, Notice } from "obsidian";
import { insertTagsIntoFile } from "./tagger";

export class TagConfirmationModal extends Modal {
	private file: TFile;
	private suggestedTags: string[];
	private selectedTags: Set<string>;
	private onDone: (inserted: boolean) => void;

	constructor(
		app: App,
		file: TFile,
		suggestedTags: string[],
		onDone: (inserted: boolean) => void
	) {
		super(app);
		this.file = file;
		this.suggestedTags = suggestedTags;
		this.selectedTags = new Set(suggestedTags);
		this.onDone = onDone;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ai-auto-tagger-modal");

		contentEl.createEl("h2", { text: "AI Tag Suggestions" });
		contentEl.createEl("p", {
			text: "Click a tag to select or deselect it:",
		});

		// Tags container
		const tagsDisplay = contentEl.createDiv({ cls: "tags-container" });

		const confirmButton = contentEl.createEl("button"); // created early for reference

		this.suggestedTags.forEach((tag) => {
			const span = tagsDisplay.createSpan({
				cls: "ai-tag-suggestion ai-tag-selected",
				text: tag,
			});

			span.addEventListener("click", () => {
				if (this.selectedTags.has(tag)) {
					this.selectedTags.delete(tag);
					span.removeClass("ai-tag-selected");
					span.addClass("ai-tag-deselected");
				} else {
					this.selectedTags.add(tag);
					span.removeClass("ai-tag-deselected");
					span.addClass("ai-tag-selected");
				}
				confirmButton.disabled = this.selectedTags.size === 0;
				if (this.selectedTags.size === 0) {
					confirmButton.addClass("ai-btn-disabled");
				} else {
					confirmButton.removeClass("ai-btn-disabled");
				}
			});
		});

		// Buttons
		const buttonContainer = contentEl.createDiv({
			cls: "modal-button-container",
		});

		const cancelButton = buttonContainer.createEl("button", {
			text: "Cancel",
		});
		cancelButton.addEventListener("click", () => {
			this.onDone(false);
			this.close();
		});

		// Move confirm button into the container
		buttonContainer.appendChild(confirmButton);
		confirmButton.setText("Add Tags");
		confirmButton.addClass("mod-cta");

		confirmButton.addEventListener("click", async () => {
			if (this.selectedTags.size === 0) return;

			confirmButton.disabled = true;
			confirmButton.setText("Adding...");

			try {
				const tags = Array.from(this.selectedTags);
				await insertTagsIntoFile(this.app, this.file, tags);
				new Notice(
					`Tags added: ${tags.map((t) => `[[${t}]]`).join(" ")}`,
					3000
				);
				this.onDone(true);
				this.close();
			} catch {
				new Notice("Failed to insert tags. Please try again.", 5000);
				confirmButton.disabled = false;
				confirmButton.setText("Add Tags");
			}
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
