import { App, TFile, TFolder } from "obsidian";

/**
 * Reads tag filenames from the specified folder (without extensions).
 */
export async function getAvailableTags(
	app: App,
	folderPath: string
): Promise<string[]> {
	if (!folderPath) {
		return [];
	}

	const folder = app.vault.getAbstractFileByPath(folderPath);
	if (!folder || !(folder instanceof TFolder)) {
		return [];
	}

	return folder.children
		.filter((f): f is TFile => f instanceof TFile)
		.map((f) => f.name.replace(/\.[^/.]+$/, ""));
}

/**
 * Inserts tags into the file. Updates existing Tags: line or prepends one.
 * Returns the tag line string that was written.
 */
export async function insertTagsIntoFile(
	app: App,
	file: TFile,
	tags: string[]
): Promise<string> {
	const content = await app.vault.read(file);
	const tagLine = `Tags: ${tags.map((t) => `[[${t}]]`).join(" ")}`;

	// Check for existing Tags: line
	const tagsLineRegex = /^(#*\s*Tags:\s*)(.*?)$/im;
	const match = content.match(tagsLineRegex);

	if (match) {
		const newContent = content.replace(
			tagsLineRegex,
			`${match[1]}${tags.map((t) => `[[${t}]]`).join(" ")}`
		);
		await app.vault.modify(file, newContent);
	} else {
		// Check for YAML frontmatter
		const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
		const fmMatch = content.match(frontmatterRegex);

		if (fmMatch) {
			// Insert after frontmatter
			const afterFm = content.slice(fmMatch[0].length);
			const newContent = fmMatch[0] + "\n" + tagLine + afterFm;
			await app.vault.modify(file, newContent);
		} else {
			// Prepend to file
			const newContent = tagLine + "\n" + content;
			await app.vault.modify(file, newContent);
		}
	}

	return tagLine;
}
