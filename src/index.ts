import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,

    getFrontend,

    Constants,

    Custom,

    getAllEditor,

} from "siyuan";
import "./index.scss";

import ProfileSettings from "./profile-settings.svelte";
import { svelteDialog } from "./libs/dialog";
import { lsNotebooks } from "./api";

const STORAGE_NAME = "menu-config";
const PROFILES_STORAGE_NAME = "notebook-profiles";


export default class SiyuanFakeWorkspace extends Plugin {

    private custom: () => Custom;
    private isMobile: boolean;
    private notebooks: any[] = [];
    private profiles: { [key: string]: string[] } = {};
    private currentProfile: string = null;
    private appliedStyleElement: HTMLStyleElement = null;


    async onload() {
        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };


        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        this.addIcons(`
<symbol id="iconProfiles" viewBox="0 0 32 32">
<path d="M28 4H4c-1.1 0-2 .9-2 2v20c0 1.1.9 2 2 2h24c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 26V6h24v20H4zm4-14h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z"/>
</symbol>`);








        try {
            this.loadProfiles();
        } catch (error) {
            console.error("Error loading settings storage, probably empty config json:", error);
        }







    }

    onLayoutReady() {
        lsNotebooks().then(result => {
            console.log(result);
            this.notebooks = result.notebooks;
        }).catch(error => {
            console.error("Error fetching notebooks:", error);
        });


        const profileTopBarElement = this.addTopBar({
            icon: "iconProfiles",
            title: "Notebook Profiles",
            position: "right",
            callback: () => {
                if (this.isMobile) {
                    this.addProfileMenu();
                } else {
                    let rect = profileTopBarElement.getBoundingClientRect();
                    if (rect.width === 0) {
                        rect = document.querySelector("#barMore").getBoundingClientRect();
                    }
                    if (rect.width === 0) {
                        rect = document.querySelector("#barPlugins").getBoundingClientRect();
                    }
                    this.addProfileMenu(rect);
                }
            }
        });

        const statusIconTemp = document.createElement("template");
        statusIconTemp.innerHTML = `<div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
    <svg>
        <use xlink:href="#iconTrashcan"></use>
    </svg>
</div>`;
    }

    async onunload() {
    }

    uninstall() {
    }

    openSetting(): void {
        let dialog = new Dialog({
            title: "Notebook Profile Settings",
            content: `<div id="ProfileSettingsPanel" style="height: 100%;"></div>`,
            width: "90%",
            height: "90%",
            destroyCallback: (options) => {
                console.log("destroyCallback", options);
                panel.$destroy();
            }
        });
        let panel = new ProfileSettings({
            target: dialog.element.querySelector("#ProfileSettingsPanel"),
            props: {
                plugin: this
            }
        });
    }


    private getEditor() {


        const editors = getAllEditor();


        if (editors.length === 0) {


            showMessage("please open doc first");


            return;


        }


        return editors[0];


    }

    private showDialog() {
        const docId = this.getEditor().protyle.block.rootID;
        svelteDialog({
            title: `SiYuan ${Constants.SIYUAN_VERSION}`,
            width: this.isMobile ? "92vw" : "720px",
            constructor: (container: HTMLElement) => {
                return new HelloExample({
                    target: container,
                    props: {
                        app: this.app,
                        blockID: docId
                    }
                });
            }
        });
    }




    applyProfile(profileName: string) {
        this.currentProfile = profileName;
        this.applyCSSForProfile(profileName);
        this.saveProfiles();

    }

    clearAppliedProfile() {
        this.currentProfile = null;
        if (this.appliedStyleElement) {
            this.appliedStyleElement.remove();
            this.appliedStyleElement = null;
        }
        this.saveProfiles();
    }

    showMessage(msg: string) {
        showMessage(msg);
    }

    private applyCSSForProfile(profileName: string) {
        if (this.appliedStyleElement) {
            this.appliedStyleElement.remove();
        }

        const hiddenNotebooks = this.profiles[profileName] || [];
        if (hiddenNotebooks.length === 0) {
            return;
        }

        const cssRules = hiddenNotebooks.map(notebookId =>
            `ul[data-url="${notebookId}"] { display: none !important; }`
        ).join('\n');

        this.appliedStyleElement = document.createElement('style');
        this.appliedStyleElement.textContent = cssRules;
        document.head.appendChild(this.appliedStyleElement);
    }

    private loadProfiles() {
        this.loadData(PROFILES_STORAGE_NAME).then(data => {
            if (data) {
                this.profiles = data.profiles || {};
                this.currentProfile = data.currentProfile || null;

                if (this.currentProfile && this.profiles[this.currentProfile]) {
                    this.applyCSSForProfile(this.currentProfile);
                }
            }
        }).catch(error => {
            console.error("Error loading profiles:", error);
        });
    }

    private saveProfiles() {
        const data = {
            profiles: this.profiles,
            currentProfile: this.currentProfile
        };
        this.saveData(PROFILES_STORAGE_NAME, data);
    }

    private addProfileMenu(rect?: DOMRect) {
        const menu = new Menu("profileMenu", () => {
            console.log("Profile menu closed");
        });

        if (Object.keys(this.profiles).length === 0) {
            menu.addItem({
                icon: "iconInfo",
                label: "No profiles available",
                type: "readonly"
            });
            menu.addSeparator();
        } else {
            menu.addItem({
                icon: "iconClose",
                label: "Clear Profile",
                click: () => {
                    this.clearAppliedProfile();
                }
            });
            menu.addSeparator();

            Object.keys(this.profiles).forEach(profileName => {
                menu.addItem({
                    icon: this.currentProfile === profileName ? "iconCheck" : "iconCircle",
                    label: profileName,
                    click: () => {
                        this.applyProfile(profileName);
                    }
                });
            });
            menu.addSeparator();
        }

        menu.addItem({
            icon: "iconSettings",
            label: "Manage Profiles",
            click: () => {
                this.openSetting();
            }
        });

        if (this.isMobile) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }
}
