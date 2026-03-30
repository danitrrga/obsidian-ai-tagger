import { PluginSettingTab, Setting, App } from "obsidian";
import type AIAutoTaggerPlugin from "./main";

export class AIAutoTaggerSettingTab extends PluginSettingTab {
	plugin: AIAutoTaggerPlugin;

	constructor(app: App, plugin: AIAutoTaggerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("ai-auto-tagger-settings");

		// --- Tag Source ---
		containerEl.createEl("h3", { text: "Tag Source" });

		new Setting(containerEl)
			.setName("Tags folder path")
			.setDesc(
				"Path to the folder containing your tag files. Each filename (without extension) becomes an available tag."
			)
			.addText((text) =>
				text
					.setPlaceholder("e.g., Utility/MyTags")
					.setValue(this.plugin.settings.tagsFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.tagsFolderPath = value;
						await this.plugin.saveSettings();
					})
			);

		// --- AI Configuration ---
		containerEl.createEl("h3", { text: "AI Configuration" });

		new Setting(containerEl)
			.setName("OpenRouter API key")
			.setDesc(
				createFragment((el) => {
					el.appendText("Your OpenRouter API key. Get one at ");
					el.createEl("a", {
						text: "openrouter.ai/keys",
						href: "https://openrouter.ai/keys",
					});
					el.appendText(
						". The plugin uses the free Qwen3 model — no charges apply."
					);
				})
			)
			.addText((text) => {
				text.setPlaceholder("sk-or-v1-...")
					.setValue(this.plugin.settings.openRouterApiKey)
					.onChange(async (value) => {
						this.plugin.settings.openRouterApiKey = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = "password";
				text.inputEl.style.width = "300px";
			});

		new Setting(containerEl)
			.setName("Max tags")
			.setDesc(
				"Maximum number of tags the AI can suggest per note (1–10)."
			)
			.addSlider((slider) =>
				slider
					.setLimits(1, 10, 1)
					.setValue(this.plugin.settings.maxTags)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.maxTags = value;
						await this.plugin.saveSettings();
					})
			);

		// --- Behavior ---
		containerEl.createEl("h3", { text: "Behavior" });

		new Setting(containerEl)
			.setName("Auto-insert tags")
			.setDesc(
				"When enabled, tags are inserted immediately without showing the confirmation dialog."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoInsert)
					.onChange(async (value) => {
						this.plugin.settings.autoInsert = value;
						await this.plugin.saveSettings();
					})
			);

		// --- Instructions ---
		containerEl.createEl("h3", { text: "How to use" });

		const ol = containerEl.createEl("ol");
		const steps = [
			'Set the "Tags folder path" to a folder in your vault containing tag files.',
			"Each file in that folder represents a tag (e.g., project-alpha.md, meeting-notes.md).",
			"Add your OpenRouter API key above.",
			"Open a note and click the tag icon in the left ribbon, or use the command palette: \"Run AI Auto Tagger\".",
			"Review the suggested tags and confirm to add them to your note.",
		];
		for (const step of steps) {
			ol.createEl("li", { text: step });
		}

		const note = containerEl.createEl("p");
		note.style.marginTop = "12px";
		note.style.color = "var(--text-muted)";
		note.style.fontSize = "0.85em";
		note.setText(
			"Model: nvidia/nemotron-3-super-120b via OpenRouter (free). Tags are selected only from your existing tag files — the AI will never create new tags."
		);
	}
}
