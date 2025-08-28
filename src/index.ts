import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    // Setting,
    // fetchPost,
    Protyle,
    openWindow,
    IOperation,
    Constants,
    openMobileFileById,
    lockScreen,
    ICard,
    ICardData,
    Custom,
    exitSiYuan,
    getModelByDockType,
    getAllEditor,
    Files,
    platformUtils,
    openSetting,
    openAttributePanel,
    saveLayout
} from "siyuan";
import "./index.scss";
import { IMenuItem } from "siyuan/types";

import HelloExample from "@/hello.svelte";
import SettingExample from "@/setting-example.svelte";
import ProfileSettings from "@/profile-settings.svelte";
import { svelteDialog } from "./libs/dialog";
import { lsNotebooks } from "./api";

const STORAGE_NAME = "menu-config";
const PROFILES_STORAGE_NAME = "notebook-profiles";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    private custom: () => Custom;
    private isMobile: boolean;
    private blockIconEventBindThis = this.blockIconEvent.bind(this);
    private notebooks: any[] = [];
    private profiles: {[key: string]: string[]} = {};
    private currentProfile: string = null;
    private appliedStyleElement: HTMLStyleElement = null;


    updateProtyleToolbar(toolbar: Array<string | IMenuItem>) {
        // toolbar.push("|");
        toolbar.push({
            name: "insert-smail-emoji",
            icon: "iconEmoji",
            hotkey: "⇧⌘I",
            tipPosition: "n",
            tip: this.i18n.insertEmoji,
            click(protyle: Protyle) {
                protyle.insert("😊");
            }
        });
        return toolbar;
    }

    async onload() {
        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

        console.log("loading plugin-sample", this.i18n);

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>
<symbol id="iconProfiles" viewBox="0 0 32 32">
<path d="M28 4H4c-1.1 0-2 .9-2 2v20c0 1.1.9 2 2 2h24c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 26V6h24v20H4zm4-14h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z"/>
</symbol>`);

        let tabDiv = document.createElement("div");
        let app = null;
        this.custom = this.addTab({
            type: TAB_TYPE,
            init() {
                app = new HelloExample({
                    target: tabDiv,
                    props: {
                        app: this.app,
                        blockID: this.data.blockID
                    }
                });
                this.element.appendChild(tabDiv);
                console.log(this.element);
            },
            beforeDestroy() {
                console.log("before destroy tab:", TAB_TYPE);
            },
            destroy() {
                app?.$destroy();
                console.log("destroy tab:", TAB_TYPE);
            }
        });

        this.addCommand({
            langKey: "showDialog",
            hotkey: "⇧⌘O",
            callback: () => {
                this.showDialog();
            },
        });

        this.addCommand({
            langKey: "getTab",
            hotkey: "⇧⌘M",
            globalCallback: () => {
                console.log(this.getOpenedTab());
            },
        });

        this.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 200, height: 0 },
                icon: "iconSaving",
                title: "Custom Dock",
                hotkey: "⌥⌘W",
            },
            data: {
                text: "This is my custom dock"
            },
            type: DOCK_TYPE,
            resize() {
                console.log(DOCK_TYPE + " resize");
            },
            update() {
                console.log(DOCK_TYPE + " update");
            },
            init: (dock) => {
                if (this.isMobile) {
                    dock.element.innerHTML = `<div class="toolbar toolbar--border toolbar--dark">
                    <svg class="toolbar__icon"><use xlink:href="#iconEmoji"></use></svg>
                        <div class="toolbar__text">Custom Dock</div>
                    </div>
                    <div class="fn__flex-1 plugin-sample__custom-dock">
                        ${dock.data.text}
                    </div>
                    </div>`;
                } else {
                    dock.element.innerHTML = `<div class="fn__flex-1 fn__flex-column">
                    <div class="block__icons">
                        <div class="block__logo">
                            <svg class="block__logoicon"><use xlink:href="#iconEmoji"></use></svg>
                            Custom Dock
                        </div>
                        <span class="fn__flex-1 fn__space"></span>
                        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("⌘W")}"><svg class="block__logoicon"><use xlink:href="#iconMin"></use></svg></span>
                    </div>
                    <div class="fn__flex-1 plugin-sample__custom-dock">
                        ${dock.data.text}
                    </div>
                    </div>`;
                }
            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
            }
        });

        try {
            this.loadProfiles();
        } catch (error) {
            console.error("Error loading settings storage, probably empty config json:", error);
        }


        this.protyleSlash = [{
            filter: ["insert emoji 😊", "插入表情 😊", "crbqwx"],
            html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18n.insertEmoji}</span><span class="b3-list-item__meta">😊</span></div>`,
            id: "insertEmoji",
            callback(protyle: Protyle) {
                protyle.insert("😊");
            }
        }];

        this.protyleOptions = {
            toolbar: ["block-ref",
                "a",
                "|",
                "text",
                "strong",
                "em",
                "u",
                "s",
                "mark",
                "sup",
                "sub",
                "clear",
                "|",
                "code",
                "kbd",
                "tag",
                "inline-math",
                "inline-memo",
            ],
        };

        console.log(this.i18n.helloPlugin);

    }

    onLayoutReady() {
        lsNotebooks().then(result => {
            console.log(result);
            this.notebooks = result.notebooks;
            /*data format:
            {
    "notebooks": [
        {
            "id": "20250106162719-pkorur1",
            "name": "演示专用",
            "icon": "",
            "sort": 0,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20250109202222-g0r4f69",
            "name": "空",
            "icon": "",
            "sort": 0,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20250109210007-5xizuog",
            "name": "test1",
            "icon": "",
            "sort": 0,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20250127183132-boiy60i",
            "name": "AutoModeDemo",
            "icon": "",
            "sort": 0,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20250304163859-48tp54t",
            "name": "文档树测试",
            "icon": "",
            "sort": 0,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20250316215753-goo8tpo",
            "name": "db_test",
            "icon": "",
            "sort": 0,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20240307172252-flhgzd4",
            "name": "test",
            "icon": "",
            "sort": 1,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20240528234601-8urjy7t",
            "name": "121212",
            "icon": "",
            "sort": 2,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20240528234614-sq8rksh",
            "name": "fgyfgh",
            "icon": "",
            "sort": 3,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20240528234625-e0rrzk4",
            "name": "456456456",
            "icon": "",
            "sort": 4,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20250105201719-suvxxvh",
            "name": "I'm a father notebook",
            "icon": "",
            "sort": 5,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        },
        {
            "id": "20250105164252-zybt785",
            "name": "doctreetest",
            "icon": "",
            "sort": 6,
            "sortMode": 15,
            "closed": false,
            "newFlashcardCount": 0,
            "dueFlashcardCount": 0,
            "flashcardCount": 0
        }
    ]
}*/
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
        statusIconTemp.content.firstElementChild.addEventListener("click", () => {
            confirm("⚠️", this.i18n.confirmRemove.replace("${name}", this.name), () => {
                this.removeData(STORAGE_NAME).then(() => {
                    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
                    showMessage(`[${this.name}]: ${this.i18n.removedData}`);
                });
            });
        });
        this.addStatusBar({
            element: statusIconTemp.content.firstElementChild as HTMLElement,
        });
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    async onunload() {
        console.log(this.i18n.byePlugin);
        showMessage("Goodbye SiYuan Plugin");
        console.log("onunload");
    }

    uninstall() {
        console.log("uninstall");
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

    private blockIconEvent({ detail }: any) {
        detail.menu.addItem({
            id: "pluginSample_removeSpace",
            iconHTML: "",
            label: this.i18n.removeSpace,
            click: () => {
                const doOperations: IOperation[] = [];
                detail.blockElements.forEach((item: HTMLElement) => {
                    const editElement = item.querySelector('[contenteditable="true"]');
                    if (editElement) {
                        editElement.textContent = editElement.textContent.replace(/ /g, "");
                        doOperations.push({
                            id: item.dataset.nodeId,
                            data: item.outerHTML,
                            action: "update"
                        });
                    }
                });
                detail.protyle.getInstance().transaction(doOperations);
            }
        });
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
        
        showMessage(`Profile "${profileName}" applied successfully`);
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
                    showMessage("Profile cleared");
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
