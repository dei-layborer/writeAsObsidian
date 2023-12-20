import { App, ButtonComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as writeas from 'writeas-api';

interface pluginSettings {
	blogTarget: string;			// which blog to upload to
	primaryAccount: string;		// the login name
	blogList: string[];			// list of blogs
	postType: string;			// whether to use serif, sans, or monospace
}

const DEFAULT_SETTINGS: pluginSettings = {
	blogTarget: '',
	primaryAccount: '',
	blogList: [''],
	postType: 'serif'
}

export default class WriteAsPlugin extends Plugin {
	settings: pluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('book-plus', 'Upload post', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WriteAsSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

/****************
 * SETTINGS
 ****************/

class WriteAsSettingsTab extends PluginSettingTab {
	plugin: WriteAsPlugin;
	
	blogListSetting;

	constructor(app: App, plugin: WriteAsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}


	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		/******* BLOG LIST *******/
		this.blogListSetting = new Setting(containerEl)
			.setName('Blog')
			.setDesc('Which blog to upload to')
			.addButton(btn => btn
				.setButtonText('Retrieve list of blogs')
				.onClick(async () => {
					const blogList = await this.populateBlogList(this.blogListSetting);
					this.plugin.settings.blogList = blogList;
					await this.plugin.saveSettings();
				})
			)
			.addDropdown(dropdown => dropdown
				.onChange(async (newValue) => {
					this.plugin.settings.blogTarget = newValue;
					new Notice(`Target blog ${newValue}`);
					await this.plugin.saveSettings();
				})
			)
		;

		// check to see if there's a saved list already, and populate the drop-down if so
		if (this.plugin.settings.blogList.length > 0) {
			const blogListDropdown = this.blogListSetting.controlEl.children[1];
			for (let i = 0; i < this.plugin.settings.blogList.length; i++) {
				const newItemText = this.plugin.settings.blogList[i];
				const newOption = document.createElement('option');
				newOption.textContent = newItemText;
				newOption.setAttribute('value', getValueName(newItemText));
				blogListDropdown.appendChild(newOption);
			}
		}
	}

	async populateBlogList(settingsObject: Setting): Promise<string[]> {

		new Notice('Retrieving blog list...');
		const blogList = await writeas.getBlogs();
		const dropdown = settingsObject.controlEl.children[1];
		
		// we're refreshing the list, so remove any existing entries
		if (dropdown.children.length > 0) {
			const opts = dropdown.getElementsByTagName('option');
			for (let optEl of opts) {
				optEl.remove();
			}
		}

		for (let i = 0; i < blogList.length; i++) {
			const newItemText = blogList[i];
			const newOption = document.createElement('option');
			newOption.textContent = newItemText;
			newOption.setAttribute('value', getValueName(newItemText));
			dropdown.appendChild(newOption);
		}

		return blogList;

	}
}

function getValueName(blogName: string): string {
	let valName = blogName.toLowerCase();
	valName = valName.replaceAll(' ', '-');
	return valName;
}