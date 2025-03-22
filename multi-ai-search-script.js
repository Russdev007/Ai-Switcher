// ==UserScript==
// @name         Multi-AI Search
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Search across multiple AI and traditional search engines with @ symbol
// @author       You
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Default search engines configuration with updated URLs
    const defaultEngines = [
        { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', icon: '🧠', color: '#6B46C1' },
        { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=', icon: '🔍', color: '#0F172A' },
        { id: 'grok', name: 'Grok', url: 'https://grok.com/', icon: '𝕏', color: '#000000' },
        { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/chat', icon: '💬', color: '#10A37F' },
        { id: 'notebooklm', name: 'NotebookLM', url: 'https://notebooklm.google.com/', icon: '📓', color: '#EA4335' },
        { id: 'aistudio', name: 'AI Studio', url: 'https://aistudio.google.com/prompts/new_chat', icon: '🎨', color: '#34A853' },
        { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', icon: '✨', color: '#4285F4' },
        { id: 'yandex', name: 'Yandex', url: 'https://yandex.com/search/?text=', icon: 'Я', color: '#FF0000' }
    ];

    // Get saved engines or use defaults
    let searchEngines = GM_getValue('searchEngines', defaultEngines);

    // Add CSS styles with modern look and dark mode compatibility
    GM_addStyle(`
        #multi-search-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: #3498db;
            color: white;
            font-size: 20px;
            text-align: center;
            line-height: 48px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            user-select: none;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        @media (prefers-color-scheme: dark) {
            #multi-search-button {
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
        }
        
        #multi-search-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        #multi-search-menu {
            position: fixed;
            bottom: 80px;
            right: 20px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            padding: 12px 8px;
            z-index: 9999;
            display: none;
            max-width: 320px;
            min-width: 240px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        @media (prefers-color-scheme: dark) {
            #multi-search-menu {
                background-color: #2d2d2d;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                color: #e0e0e0;
                border: 1px solid #444;
            }
        }
        
        .search-engine-option {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            cursor: pointer;
            border-radius: 8px;
            margin-bottom: 6px;
            transition: background-color 0.15s;
        }
        
        .search-engine-option:hover {
            background-color: #f5f5f5;
        }
        
        @media (prefers-color-scheme: dark) {
            .search-engine-option:hover {
                background-color: #3d3d3d;
            }
        }
        
        .search-engine-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-weight: bold;
            flex-shrink: 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .search-engine-name {
            flex-grow: 1;
            font-size: 14px;
            font-weight: 500;
        }
        
        .drag-handle {
            cursor: grab;
            color: #aaa;
            padding: 0 5px;
        }
        
        .search-settings {
            text-align: center;
            padding-top: 12px;
            border-top: 1px solid #eee;
            margin-top: 8px;
            font-size: 13px;
            color: #666;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        
        @media (prefers-color-scheme: dark) {
            .search-settings {
                border-top: 1px solid #444;
                color: #aaa;
            }
        }
        
        .search-settings:hover {
            color: #3498db;
        }
        
        #settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 5px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            display: none;
            width: 380px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        @media (prefers-color-scheme: dark) {
            #settings-panel {
                background-color: #2d2d2d;
                color: #e0e0e0;
                box-shadow: 0 5px 30px rgba(0,0,0,0.5);
                border: 1px solid #444;
            }
        }
        
        .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .settings-title {
            font-size: 18px;
            font-weight: 600;
        }
        
        .close-settings {
            cursor: pointer;
            font-size: 24px;
            height: 32px;
            width: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.15s;
        }
        
        .close-settings:hover {
            background-color: #f5f5f5;
        }
        
        @media (prefers-color-scheme: dark) {
            .close-settings:hover {
                background-color: #3d3d3d;
            }
        }
        
        .settings-content {
            max-height: 300px;
            overflow-y: auto;
            padding-right: 5px;
        }
        
        .settings-footer {
            margin-top: 20px;
            text-align: right;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
        
        .settings-button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.15s;
        }
        
        .save-button {
            background-color: #3498db;
            color: white;
        }
        
        .save-button:hover {
            background-color: #2980b9;
        }
        
        .reset-button {
            background-color: #f0f0f0;
            color: #333;
        }
        
        .reset-button:hover {
            background-color: #e0e0e0;
        }
        
        @media (prefers-color-scheme: dark) {
            .reset-button {
                background-color: #444;
                color: #e0e0e0;
            }
            
            .reset-button:hover {
                background-color: #555;
            }
        }
        
        #overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            display: none;
        }
    `);

    // Create floating button
    function createFloatingButton() {
        const button = document.createElement('div');
        button.id = 'multi-search-button';
        button.textContent = '@';
        button.title = 'Multi-AI Search';
        document.body.appendChild(button);
        
        button.addEventListener('click', toggleSearchMenu);
        
        // Create search menu
        const menu = document.createElement('div');
        menu.id = 'multi-search-menu';
        document.body.appendChild(menu);
        
        // Create overlay for settings
        const overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.addEventListener('click', () => {
            document.getElementById('settings-panel').style.display = 'none';
            overlay.style.display = 'none';
        });
        document.body.appendChild(overlay);
        
        updateSearchMenu();
    }
    
    // Toggle search menu visibility
    function toggleSearchMenu() {
        const menu = document.getElementById('multi-search-menu');
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
        } else {
            updateSearchMenu();
            menu.style.display = 'block';
        }
    }
    
    // Update search menu contents
    function updateSearchMenu() {
        const menu = document.getElementById('multi-search-menu');
        menu.innerHTML = '';
        
        const selectedText = getSelectedText();
        
        searchEngines.forEach(engine => {
            const option = document.createElement('div');
            option.className = 'search-engine-option';
            option.innerHTML = `
                <div class="search-engine-icon" style="background-color: ${engine.color}; color: white;">
                    ${engine.icon}
                </div>
                <div class="search-engine-name">${engine.name}</div>
                <div class="drag-handle">⋮</div>
            `;
            
            option.addEventListener('click', () => {
                // Open the page directly without prompting
                searchWithEngine(engine, selectedText);
                toggleSearchMenu();
            });
            
            // Add drag functionality
            option.querySelector('.drag-handle').addEventListener('mousedown', e => {
                e.stopPropagation();
                enableDragMode(option, engine.id);
            });
            
            menu.appendChild(option);
        });
        
        // Add settings option
        const settings = document.createElement('div');
        settings.className = 'search-settings';
        settings.innerHTML = '<span>⚙️</span><span>Settings</span>';
        settings.addEventListener('click', e => {
            e.stopPropagation();
            toggleSearchMenu();
            openSettings();
        });
        menu.appendChild(settings);
    }
    
    // Enable drag mode for reordering
    function enableDragMode(element, engineId) {
        const menu = document.getElementById('multi-search-menu');
        const options = Array.from(menu.querySelectorAll('.search-engine-option'));
        const startIndex = options.indexOf(element);
        let currentIndex = startIndex;
        
        function moveElement(e) {
            const y = e.clientY;
            
            // Find the position in the list
            let newIndex = currentIndex;
            
            options.forEach((option, index) => {
                const rect = option.getBoundingClientRect();
                const middle = rect.top + rect.height / 2;
                
                if (y > middle && index > currentIndex) {
                    newIndex = index;
                } else if (y < middle && index < currentIndex) {
                    newIndex = index;
                }
            });
            
            if (newIndex !== currentIndex) {
                // Update the DOM
                const targetElement = options[newIndex];
                
                if (newIndex > currentIndex) {
                    menu.insertBefore(element, targetElement.nextSibling);
                } else {
                    menu.insertBefore(element, targetElement);
                }
                
                // Update the options array
                options.splice(currentIndex, 1);
                options.splice(newIndex, 0, element);
                
                currentIndex = newIndex;
                
                // Update the searchEngines array
                const engineToMove = searchEngines.splice(startIndex, 1)[0];
                searchEngines.splice(newIndex, 0, engineToMove);
                GM_setValue('searchEngines', searchEngines);
            }
        }
        
        function stopDrag() {
            document.removeEventListener('mousemove', moveElement);
            document.removeEventListener('mouseup', stopDrag);
        }
        
        document.addEventListener('mousemove', moveElement);
        document.addEventListener('mouseup', stopDrag);
    }
    
    // Open settings panel
    function openSettings() {
        // Create settings panel if it doesn't exist
        if (!document.getElementById('settings-panel')) {
            const panel = document.createElement('div');
            panel.id = 'settings-panel';
            panel.innerHTML = `
                <div class="settings-header">
                    <div class="settings-title">Multi-AI Search Settings</div>
                    <div class="close-settings">×</div>
                </div>
                <div class="settings-content">
                    <div id="engines-list"></div>
                </div>
                <div class="settings-footer">
                    <button class="settings-button reset-button">Reset</button>
                    <button class="settings-button save-button">Save</button>
                </div>
            `;
            document.body.appendChild(panel);
            
            // Close button event
            panel.querySelector('.close-settings').addEventListener('click', () => {
                panel.style.display = 'none';
                document.getElementById('overlay').style.display = 'none';
            });
            
            // Reset button event
            panel.querySelector('.reset-button').addEventListener('click', () => {
                searchEngines = [...defaultEngines];
                GM_setValue('searchEngines', searchEngines);
                updateSettingsPanel();
                updateSearchMenu();
            });
            
            // Save button event
            panel.querySelector('.save-button').addEventListener('click', () => {
                // Save is automatic when dragging, so just close
                panel.style.display = 'none';
                document.getElementById('overlay').style.display = 'none';
            });
        }
        
        // Update and show panel
        const panel = document.getElementById('settings-panel');
        document.getElementById('overlay').style.display = 'block';
        updateSettingsPanel();
        panel.style.display = 'block';
    }
    
    // Update settings panel content
    function updateSettingsPanel() {
        const enginesList = document.getElementById('engines-list');
        enginesList.innerHTML = '';
        
        searchEngines.forEach((engine, index) => {
            const engineItem = document.createElement('div');
            engineItem.className = 'search-engine-option';
            engineItem.innerHTML = `
                <div class="search-engine-icon" style="background-color: ${engine.color}; color: white;">
                    ${engine.icon}
                </div>
                <div class="search-engine-name">${engine.name}</div>
                <div class="drag-handle">⋮</div>
            `;
            
            // Add drag functionality for settings panel
            engineItem.querySelector('.drag-handle').addEventListener('mousedown', e => {
                e.stopPropagation();
                enableSettingsDragMode(engineItem, index);
            });
            
            enginesList.appendChild(engineItem);
        });
    }
    
    // Enable drag mode for settings panel
    function enableSettingsDragMode(element, startIndex) {
        const enginesList = document.getElementById('engines-list');
        const options = Array.from(enginesList.querySelectorAll('.search-engine-option'));
        let currentIndex = startIndex;
        
        function moveElement(e) {
            const y = e.clientY;
            
            // Find the position in the list
            let newIndex = currentIndex;
            
            options.forEach((option, index) => {
                const rect = option.getBoundingClientRect();
                const middle = rect.top + rect.height / 2;
                
                if (y > middle && index > currentIndex) {
                    newIndex = index;
                } else if (y < middle && index < currentIndex) {
                    newIndex = index;
                }
            });
            
            if (newIndex !== currentIndex) {
                // Update the DOM
                const targetElement = options[newIndex];
                
                if (newIndex > currentIndex) {
                    enginesList.insertBefore(element, targetElement.nextSibling);
                } else {
                    enginesList.insertBefore(element, targetElement);
                }
                
                // Update the options array
                options.splice(currentIndex, 1);
                options.splice(newIndex, 0, element);
                
                // Update the searchEngines array
                const engineToMove = searchEngines.splice(currentIndex, 1)[0];
                searchEngines.splice(newIndex, 0, engineToMove);
                GM_setValue('searchEngines', searchEngines);
                
                currentIndex = newIndex;
            }
        }
        
        function stopDrag() {
            document.removeEventListener('mousemove', moveElement);
            document.removeEventListener('mouseup', stopDrag);
        }
        
        document.addEventListener('mousemove', moveElement);
        document.addEventListener('mouseup', stopDrag);
    }
    
    // Search with selected engine
    function searchWithEngine(engine, query) {
        // Just open the URL directly without prompting for input
        if (engine.url.includes('?q=') && query) {
            GM_openInTab(engine.url + encodeURIComponent(query), { active: true });
        } else {
            // For AI assistants that don't accept direct query parameters
            GM_openInTab(engine.url, { active: true });
        }
    }
    
    // Get currently selected text
    function getSelectedText() {
        return window.getSelection().toString().trim();
    }
    
    // Add context menu commands
    function addContextMenuCommands() {
        searchEngines.forEach(engine => {
            GM_registerMenuCommand(`Search with ${engine.name}`, () => {
                const selectedText = getSelectedText();
                searchWithEngine(engine, selectedText);
            });
        });
    }
    
    // Override address bar behavior for @ searches
    function setupAddressBarSearch() {
        // We can't directly modify browser address bar behavior with userscripts
        // But we can detect if the URL contains a specific pattern that might indicate
        // our extension was triggered
        
        const url = window.location.href;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            const match = url.match(/search\?q=%40\s*(.+)/i);
            if (match) {
                const query = decodeURIComponent(match[1]);
                // Open default engine (first in list)
                if (searchEngines.length > 0) {
                    searchWithEngine(searchEngines[0], query);
                }
            }
        }
    }
    
    // Initialize the script
    function init() {
        createFloatingButton();
        addContextMenuCommands();
        setupAddressBarSearch();
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
