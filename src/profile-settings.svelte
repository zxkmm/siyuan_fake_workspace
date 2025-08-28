<script>
    import { onMount } from 'svelte';
    
    export let plugin;
    
    let notebooks = [];
    let profiles = {};
    let currentProfile = null;
    let selectedProfile = null;
    let newProfileName = '';
    let isCreatingNew = false;
    let editingProfileName = '';
    
    onMount(async () => {
        notebooks = plugin.notebooks || [];
        profiles = plugin.profiles || {};
        currentProfile = plugin.currentProfile;
        
        // Auto-select current profile or first profile if available
        if (currentProfile && profiles[currentProfile]) {
            selectedProfile = currentProfile;
        } else if (Object.keys(profiles).length > 0) {
            selectedProfile = Object.keys(profiles)[0];
        }
    });
    
    function selectProfile(profileName) {
        selectedProfile = profileName;
        isCreatingNew = false;
        newProfileName = '';
        editingProfileName = profileName;
    }
    
    function startCreatingProfile() {
        isCreatingNew = true;
        selectedProfile = null;
        newProfileName = '';
        editingProfileName = '';
    }
    
    function createProfile() {
        const profileName = newProfileName.trim();
        if (!profileName) {
            plugin.showMessage("Please enter a profile name");
            return;
        }
        
        if (profiles[profileName]) {
            plugin.showMessage("Profile already exists");
            return;
        }
        
        profiles[profileName] = [];
        plugin.profiles = profiles;
        plugin.saveProfiles();
        
        selectedProfile = profileName;
        isCreatingNew = false;
        newProfileName = '';
        
        plugin.showMessage(`Profile "${profileName}" created successfully`);
        
        profiles = {...profiles}; // Trigger reactivity
    }
    
    function deleteCurrentProfile() {
        if (!selectedProfile) return;
        
        // const confirmMsg = `Are you sure you want to delete profile "${selectedProfile}"?`;
        // if (!confirm(confirmMsg)) return;
        
        if (currentProfile === selectedProfile) {
            plugin.clearAppliedProfile();
            currentProfile = null;
        }
        
        delete profiles[selectedProfile];
        plugin.profiles = profiles;
        plugin.saveProfiles();
        
        // Select another profile or clear selection
        const remainingProfiles = Object.keys(profiles);
        selectedProfile = remainingProfiles.length > 0 ? remainingProfiles[0] : null;
        
        plugin.showMessage("Profile deleted successfully");
        
        profiles = {...profiles}; // Trigger reactivity
    }
    
    function toggleNotebook(notebookId) {
        if (!selectedProfile) return;
        
        const profileNotebooks = profiles[selectedProfile] || [];
        
        if (profileNotebooks.includes(notebookId)) {
            profiles[selectedProfile] = profileNotebooks.filter(id => id !== notebookId);
        } else {
            profiles[selectedProfile] = [...profileNotebooks, notebookId];
        }
        
        plugin.profiles = profiles;
        plugin.saveProfiles();
        
        profiles = {...profiles}; // Trigger reactivity
    }
    
    function applyProfile(profileName) {
        plugin.applyProfile(profileName);
        currentProfile = profileName;
        plugin.showMessage(`Profile "${profileName}" applied`);
    }
    
    function clearProfile() {
        plugin.clearAppliedProfile();
        currentProfile = null;
        plugin.showMessage("Profile cleared");
    }
    
    function updateProfileName() {
        const newName = editingProfileName.trim();
        if (!newName || newName === selectedProfile) return;
        
        if (profiles[newName]) {
            plugin.showMessage("Profile name already exists");
            editingProfileName = selectedProfile;
            return;
        }
        
        // Create new profile with new name and copy notebooks
        const notebooks = profiles[selectedProfile] || [];
        profiles[newName] = [...notebooks];
        
        // Update current profile if it was the one being renamed
        if (currentProfile === selectedProfile) {
            currentProfile = newName;
            plugin.currentProfile = newName;
        }
        
        // Delete old profile
        delete profiles[selectedProfile];
        
        // Update selected profile
        selectedProfile = newName;
        
        // Save changes
        plugin.profiles = profiles;
        plugin.saveProfiles();
        
        plugin.showMessage(`Profile renamed to "${newName}"`);
        profiles = {...profiles}; // Trigger reactivity
    }

    function handleKeydown(event) {
        if (event.key === 'Enter' && isCreatingNew) {
            createProfile();
        } else if (event.key === 'Escape') {
            isCreatingNew = false;
            newProfileName = '';
        }
    }

    function handleProfileNameKeydown(event) {
        if (event.key === 'Enter') {
            updateProfileName();
            event.target.blur();
        } else if (event.key === 'Escape') {
            editingProfileName = selectedProfile;
            event.target.blur();
        }
    }
    
    $: selectedNotebooks = selectedProfile ? (profiles[selectedProfile] || []) : [];
</script>

<style>
    .profile-settings {
        padding: 20px;
        display: flex;
        flex-direction: column;
        background: var(--b3-theme-surface);
        height: 100%;
        max-height: 100%;
        overflow: hidden;
        box-sizing: border-box;
    }
    
    .header {
        margin-bottom: 20px;
        border-bottom: 2px solid var(--b3-theme-surface-lighter);
        padding-bottom: 15px;
        flex-shrink: 0;
    }
    
    .header h2 {
        margin: 0 0 10px 0;
        color: var(--b3-theme-on-surface);
        font-size: 24px;
        font-weight: 600;
    }
    
    .current-profile-indicator {
        padding: 8px 12px;
        border: 1px solid var(--b3-theme-primary);
        border-radius: 6px;
        background: var(--b3-theme-primary-light);
        color: var(--b3-theme-primary);
        font-size: 14px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    .main-content {
        display: flex;
        flex: 1;
        gap: 20px;
        min-height: 0;
        overflow: hidden;
    }
    
    .left-panel {
        width: 300px;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--b3-theme-surface-lighter);
        border-radius: 8px;
        background: var(--b3-theme-surface-light);
        min-height: 0;
    }
    
    .right-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--b3-theme-surface-lighter);
        border-radius: 8px;
        background: var(--b3-theme-surface-light);
        min-height: 0;
    }
    
    .panel-header {
        padding: 15px;
        border-bottom: 1px solid var(--b3-theme-surface-lighter);
        background: var(--b3-theme-surface);
        border-radius: 8px 8px 0 0;
        flex-shrink: 0;
    }
    
    .panel-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--b3-theme-on-surface);
        margin: 0;
    }
    
    .profile-list {
        flex: 1;
        padding: 10px;
        overflow-y: auto;
        min-height: 0;
    }
    
    .profile-item {
        padding: 12px;
        margin-bottom: 6px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .profile-item:hover {
        background: var(--b3-theme-surface-lighter);
        border-color: var(--b3-theme-primary-light);
    }
    
    .profile-item.selected {
        background: var(--b3-theme-primary-light);
        border-color: var(--b3-theme-primary);
        color: var (--b3-theme-primary);
    }
    
    .profile-name {
        font-weight: 500;
        flex: 1;
    }
    
    .profile-meta {
        font-size: 12px;
        opacity: 0.7;
        margin-top: 2px;
    }
    
    .profile-status {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .status-badge {
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .status-active {
        background: var(--b3-theme-primary);
        color: var(--b3-theme-on-primary);
    }
    
    .apply-btn {
        padding: 4px 8px;
        border: 1px solid var(--b3-theme-primary);
        border-radius: 4px;
        background: transparent;
        color: var(--b3-theme-primary);
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s ease;
    }
    
    .apply-btn:hover {
        background: var(--b3-theme-primary);
        color: var(--b3-theme-on-primary);
    }
    
    .panel-footer {
        padding: 15px;
        border-top: 1px solid var(--b3-theme-surface-lighter);
        background: var(--b3-theme-surface);
        border-radius: 0 0 8px 8px;
        flex-shrink: 0;
    }
    
    .new-profile-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .new-profile-form-input {
        width: 100%;
    }

    .new-profile-form-buttons {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
        flex-wrap: wrap;
    }
    
    .form-input {
        padding: 8px 12px;
        border: 1px solid var(--b3-theme-surface-lighter);
        border-radius: 4px;
        background: var(--b3-theme-surface-light);
        color: var(--b3-theme-on-surface);
        font-size: 14px;
        box-sizing: border-box;
    }
    
    .form-input:focus {
        outline: none;
        border-color: var(--b3-theme-primary);
        box-shadow: 0 0 0 2px var(--b3-theme-primary-light);
    }
    
    .btn {
        padding: 8px 16px;
        border: 1px solid var(--b3-theme-primary);
        border-radius: 4px;
        background: var(--b3-theme-primary);
        color: var(--b3-theme-on-primary);
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        font-weight: 500;
    }
    
    .btn:hover {
        background: var(--b3-theme-primary-light);
        transform: translateY(-1px);
    }
    
    .btn-secondary {
        background: var(--b3-theme-surface-light);
        color: var(--b3-theme-on-surface);
        border-color: var(--b3-theme-surface-lighter);
    }
    
    .btn-secondary:hover {
        background: var(--b3-theme-surface-lighter);
    }
    
    .btn-danger {
        background: var(--b3-theme-error);
        border-color: var (--b3-theme-error);
        color: var(--b3-theme-on-error);
    }
    
    .btn-danger:hover {
        background: var(--b3-theme-error-light);
    }
    
    .btn-small {
        padding: 6px 12px;
        font-size: 12px;
    }
    
    .notebook-list {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        min-height: 0;
    }
    
    .notebook-item {
        display: flex;
        align-items: center;
        padding: 10px;
        margin-bottom: 6px;
        border-radius: 6px;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        cursor: pointer;
    }
    
    .notebook-item:hover {
        background: var(--b3-theme-surface-lighter);
        border-color: var(--b3-theme-primary-light);
    }
    
    .notebook-checkbox {
        margin-right: 12px;
        cursor: pointer;
    }
    
    .notebook-info {
        flex: 1;
    }
    
    .notebook-name {
        color: var(--b3-theme-on-surface);
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 2px;
    }
    
    .notebook-id {
        color: var(--b3-theme-on-surface-light);
        font-size: 12px;
        opacity: 0.7;
    }
    
    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--b3-theme-on-surface-light);
        font-style: italic;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }
    
    .empty-icon {
        font-size: 48px;
        opacity: 0.3;
    }
    
    .clear-profile-btn {
        background: var(--b3-theme-surface-lighter);
        color: var(--b3-theme-on-surface);
        border: 1px solid var(--b3-theme-surface-lighter);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .clear-profile-btn:hover {
        background: var(--b3-theme-error-light);
        color: var(--b3-theme-error);
        border-color: var(--b3-theme-error);
    }

    .profile-header-with-input {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .profile-name-input-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .profile-name-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--b3-theme-on-surface);
        opacity: 0.8;
    }

    .profile-name-input {
        padding: 8px 12px;
        border: 1px solid var(--b3-theme-surface-lighter);
        border-radius: 4px;
        background: var(--b3-theme-surface-light);
        color: var(--b3-theme-on-surface);
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .profile-name-input:focus {
        outline: none;
        border-color: var(--b3-theme-primary);
        box-shadow: 0 0 0 2px var(--b3-theme-primary-light);
        background: var(--b3-theme-surface);
    }
</style>

<div class="profile-settings">
    <div class="header">
        <h2>我没钱吃饭了，希望您可以给我捐款或者给我的github仓库点个星星，谢谢</h2>
        <!-- {#if currentProfile}
            <div class="current-profile-indicator">
                <span>Active Profile: <strong>{currentProfile}</strong></span>
                <button class="clear-profile-btn" on:click={clearProfile}>Clear</button>
            </div>
        {/if} -->
    </div>
    
    <div class="main-content">
        <!-- Left Panel - Profiles -->
        <div class="left-panel">
            <div class="panel-header">
            <h3 class="panel-title">Profiles</h3>
            </div>
            
            <div class="profile-list">
            {#if Object.keys(profiles).length === 0 && !isCreatingNew}
                <div class="empty-state">
                <div class="empty-icon">📁</div>
                <div>No profiles yet</div>
                <div style="font-size: 12px;">Create your first profile below</div>
                </div>
            {:else}
                {#each Object.keys(profiles) as profileName}
                <div 
                    class="profile-item" 
                    class:selected={selectedProfile === profileName}
                    on:click={() => selectProfile(profileName)}
                >
                    <div style="flex: 1;">
                    <div class="profile-name">{profileName}</div>
                    <div class="profile-meta">
                        {profiles[profileName].length} notebook{profiles[profileName].length !== 1 ? 's' : ''} hidden
                    </div>
                    </div>
                    <div class="profile-status">
                    {#if currentProfile === profileName}
                        <span class="status-badge status-active">Active</span>
                    {:else}
                        <button 
                        class="apply-btn"
                        on:click|stopPropagation={() => applyProfile(profileName)}
                        >
                        Apply
                        </button>
                    {/if}
                    </div>
                </div>
                {/each}
            {/if}
            </div>
            
            <div class="panel-footer">
            {#if isCreatingNew}
                <div class="new-profile-form">
                    <input 
                        type="text" 
                        class="form-input new-profile-form-input" 
                        bind:value={newProfileName} 
                        placeholder="Profile name..."
                        on:keydown={handleKeydown}
                    />
                    <div class="new-profile-form-buttons">
                        <button class="btn btn-small" on:click={createProfile}>Create</button>
                        <button class="btn btn-secondary btn-small" on:click={() => {isCreatingNew = false; newProfileName = '';}}>Cancel</button>
                    </div>
                </div>
            {:else}
                <button class="btn" on:click={startCreatingProfile}>+ New Profile</button>
            {/if}
            </div>
        </div>
        
        <!-- Right Panel - Notebook Selector -->
        <div class="right-panel">
            <div class="panel-header">
                {#if selectedProfile}
                    <div class="profile-header-with-input">
                        <h3 class="panel-title">Notebooks to Hide</h3>
                        <div class="profile-name-input-container">
                            <label for="profile-name-input" class="profile-name-label">Profile Name:</label>
                            <input 
                                id="profile-name-input"
                                type="text" 
                                class="profile-name-input" 
                                bind:value={editingProfileName}
                                on:blur={updateProfileName}
                                on:keydown={handleProfileNameKeydown}
                                placeholder="Profile name..."
                            />
                        </div>
                    </div>
                {:else if isCreatingNew}
                    <h3 class="panel-title">Select Notebooks for New Profile</h3>
                {:else}
                    <h3 class="panel-title">Select a Profile</h3>
                {/if}
            </div>
            
            {#if selectedProfile || isCreatingNew}
                <div class="notebook-list">
                    {#if notebooks.length === 0}
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div>Loading notebooks...</div>
                        </div>
                    {:else}
                        {#each notebooks as notebook}
                            <div class="notebook-item" on:click={() => !isCreatingNew && toggleNotebook(notebook.id)}>
                                <input 
                                    type="checkbox" 
                                    class="notebook-checkbox"
                                    id="notebook-{notebook.id}"
                                    checked={selectedNotebooks.includes(notebook.id)}
                                    on:change={() => !isCreatingNew && toggleNotebook(notebook.id)}
                                    disabled={isCreatingNew}
                                />
                                <div class="notebook-info">
                                    <div class="notebook-name">{notebook.name}</div>
                                    <div class="notebook-id">{notebook.id}</div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                
                {#if selectedProfile}
                    <div class="panel-footer">
                        <button class="btn btn-danger" on:click={deleteCurrentProfile}>Delete Profile</button>
                    </div>
                {/if}
            {:else}
                <div class="notebook-list">
                    <div class="empty-state">
                        <div class="empty-icon">👈</div>
                        <div>Select a profile to view notebooks</div>
                        <div style="font-size: 12px;">Or create a new profile to get started</div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>