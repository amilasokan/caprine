"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const element_ready_1 = __importDefault(require("element-ready"));
const electron_util_1 = require("electron-util");
const config_1 = __importDefault(require("./config"));
const listSelector = 'div[role="navigation"] > div > ul';
const conversationSelector = '._4u-c._1wfr > ._5f0v.uiScrollableArea';
const selectedConversationSelector = '._5l-3._1ht1._1ht2';
const preferencesSelector = '._10._4ebx.uiLayer._4-hy';
window.onload=function(){
async function withMenu(menuButtonElement, callback) {
    const { classList } = document.documentElement;
    // Prevent the dropdown menu from displaying
    classList.add('hide-dropdowns');
    // Click the menu button
    menuButtonElement.click();
    // Wait for the menu to close before removing the 'hide-dropdowns' class
    const menuLayer = document.querySelector('.uiContextualLayerPositioner:not(.hidden_elem)');
    const observer = new MutationObserver(() => {
        if (menuLayer.classList.contains('hidden_elem')) {
            classList.remove('hide-dropdowns');
            observer.disconnect();
        }
    });
    observer.observe(menuLayer, { attributes: true, attributeFilter: ['class'] });


		await callback();
	}
}
async function withSettingsMenu(callback) {
    await withMenu(await element_ready_1.default('._30yy._2fug._p'), callback);
}
function selectMenuItem(itemNumber) {
    const selector = document.querySelector(`.uiLayer:not(.hidden_elem) ._54nq._2i-c._558b._2n_z li:nth-child(${itemNumber}) a`);
    selector.click();
}
async function selectOtherListViews(itemNumber) {
    // In case one of other views is shown
    clickBackButton();
    await withSettingsMenu(() => {
        selectMenuItem(itemNumber);
    });
}
function clickBackButton() {
    const backButton = document.querySelector('._30yy._2oc9');
    if (backButton) {
        backButton.click();
    }
}
electron_1.ipcRenderer.on('show-preferences', async () => {
    if (isPreferencesOpen()) {
        return;
    }
    await openPreferences();
});
electron_1.ipcRenderer.on('new-conversation', () => {
    document.querySelector("._30yy[data-href$='/new']").click();
});
electron_1.ipcRenderer.on('log-out', async () => {
    if (config_1.default.get('useWorkChat')) {
        document.querySelector('._5lxs._3qct._p').click();
        // Menu creation is slow
        setTimeout(() => {
            const nodes = document.querySelectorAll('._54nq._9jo._558b._2n_z li:last-child a');
            nodes[nodes.length - 1].click();
        }, 250);
    }
    else {
        await withSettingsMenu(() => {
            const nodes = document.querySelectorAll('._54nq._2i-c._558b._2n_z li:last-child a');
            nodes[nodes.length - 1].click();
        });
    }
});
electron_1.ipcRenderer.on('find', () => {
    document.querySelector('._58al').focus();
});
electron_1.ipcRenderer.on('search', () => {
    document.querySelector('._3szo:nth-of-type(1)').click();
});
electron_1.ipcRenderer.on('insert-gif', () => {
    document.querySelector('._yht').click();
});
electron_1.ipcRenderer.on('insert-emoji', () => {
    document.querySelector('._5s2p').click();
});
electron_1.ipcRenderer.on('insert-text', () => {
    document.querySelector('._5rpu').focus();
});
electron_1.ipcRenderer.on('next-conversation', nextConversation);
electron_1.ipcRenderer.on('previous-conversation', previousConversation);
electron_1.ipcRenderer.on('mute-conversation', async () => {
    await openMuteModal();
});
electron_1.ipcRenderer.on('delete-conversation', async () => {
    await deleteSelectedConversation();
});
electron_1.ipcRenderer.on('archive-conversation', async () => {
    const index = selectedConversationIndex();
    if (index !== -1) {
        await archiveSelectedConversation();
        const key = index + 1;
        await jumpToConversation(key);
    }
});
function setSidebarVisibility() {
    document.documentElement.classList.toggle('sidebar-hidden', config_1.default.get('sidebarHidden'));
    electron_1.ipcRenderer.send('set-sidebar-visibility');
}
electron_1.ipcRenderer.on('toggle-mute-notifications', async (_event, defaultStatus) => {
    const preferencesAreOpen = isPreferencesOpen();
    if (!preferencesAreOpen) {
        const style = document.createElement('style');
        // Hide both the backdrop and the preferences dialog
        style.textContent = `${preferencesSelector} ._3ixn, ${preferencesSelector} ._59s7 { opacity: 0 !important }`;
        document.body.append(style);
        await openPreferences();
        // Will clean up itself after the preferences are closed
        document.querySelector(preferencesSelector).append(style);
    }
    const notificationCheckbox = document.querySelector('._374b:nth-of-type(4) ._4ng2 input');
    if (defaultStatus === undefined) {
        notificationCheckbox.click();
    }
    else if ((defaultStatus && notificationCheckbox.checked) ||
        (!defaultStatus && !notificationCheckbox.checked)) {
        notificationCheckbox.click();
    }
    electron_1.ipcRenderer.send('mute-notifications-toggled', !notificationCheckbox.checked);
    if (!preferencesAreOpen) {
        closePreferences();
    }
});
electron_1.ipcRenderer.on('toggle-message-buttons', async () => {
    const messageButtons = await element_ready_1.default('._39bj');
    messageButtons.style.display = config_1.default.get('showMessageButtons') ? 'flex' : 'none';
});
electron_1.ipcRenderer.on('show-active-contacts-view', () => {
    selectOtherListViews(3);
});
electron_1.ipcRenderer.on('show-message-requests-view', () => {
    selectOtherListViews(4);
});
electron_1.ipcRenderer.on('show-archived-threads-view', () => {
    selectOtherListViews(5);
});
electron_1.ipcRenderer.on('toggle-unread-threads-view', () => {
    selectOtherListViews(6);
});
function setDarkMode() {
    if (electron_util_1.is.macos && config_1.default.get('followSystemAppearance')) {
        document.documentElement.classList.toggle('dark-mode', electron_util_1.api.systemPreferences.isDarkMode());
    }
    else {
        document.documentElement.classList.toggle('dark-mode', config_1.default.get('darkMode'));
    }
    updateVibrancy();
}
function updateVibrancy() {
    const { classList } = document.documentElement;
    classList.remove('sidebar-vibrancy', 'full-vibrancy');
    switch (config_1.default.get('vibrancy')) {
        case 'sidebar':
            classList.add('sidebar-vibrancy');
            break;
        case 'full':
            classList.add('full-vibrancy');
            break;
        default:
    }
    electron_1.ipcRenderer.send('set-vibrancy');
}
function renderOverlayIcon(messageCount) {
    const canvas = document.createElement('canvas');
    canvas.height = 128;
    canvas.width = 128;
    canvas.style.letterSpacing = '-5px';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f42020';
    ctx.beginPath();
    ctx.ellipse(64, 64, 64, 64, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.font = '90px sans-serif';
    ctx.fillText(String(Math.min(99, messageCount)), 64, 96);
    return canvas;
}
electron_1.ipcRenderer.on('toggle-sidebar', () => {
    config_1.default.set('sidebarHidden', !config_1.default.get('sidebarHidden'));
    setSidebarVisibility();
});
electron_1.ipcRenderer.on('set-dark-mode', setDarkMode);
electron_1.ipcRenderer.on('update-vibrancy', () => {
    updateVibrancy();
});
electron_1.ipcRenderer.on('render-overlay-icon', (_event, messageCount) => {
    electron_1.ipcRenderer.send('update-overlay-icon', renderOverlayIcon(messageCount).toDataURL(), String(messageCount));
});
electron_1.ipcRenderer.on('zoom-reset', () => {
    setZoom(1.0);
});
electron_1.ipcRenderer.on('zoom-in', () => {
    const zoomFactor = config_1.default.get('zoomFactor') + 0.1;
    if (zoomFactor < 1.6) {
        setZoom(zoomFactor);
    }
});
electron_1.ipcRenderer.on('zoom-out', () => {
    const zoomFactor = config_1.default.get('zoomFactor') - 0.1;
    if (zoomFactor >= 0.8) {
        setZoom(zoomFactor);
    }
});
electron_1.ipcRenderer.on('jump-to-conversation', async (_event, key) => {
    await jumpToConversation(key);
});
async function nextConversation() {
    const index = selectedConversationIndex(1);
    if (index !== -1) {
        await selectConversation(index);
    }
}
async function previousConversation() {
    const index = selectedConversationIndex(-1);
    if (index !== -1) {
        await selectConversation(index);
    }
}
async function jumpToConversation(key) {
    const index = key - 1;
    await selectConversation(index);
}
// Focus on the conversation with the given index
async function selectConversation(index) {
    const conversationElement = (await element_ready_1.default(listSelector)).children[index];
    if (conversationElement) {
        conversationElement.firstChild.firstChild.click();
    }
}
function selectedConversationIndex(offset = 0) {
    const selected = document.querySelector(selectedConversationSelector);
    if (!selected) {
        return -1;
    }
    const list = [...selected.parentNode.children];
    const index = list.indexOf(selected) + offset;
    return ((index % list.length) + list.length) % list.length;
}
function setZoom(zoomFactor) {
    const node = document.querySelector('#zoomFactor');
    node.textContent = `${conversationSelector} {zoom: ${zoomFactor} !important}`;
    config_1.default.set('zoomFactor', zoomFactor);
}
async function withConversationMenu(callback) {
    const menuButton = document.querySelector(`${selectedConversationSelector} ._5blh._4-0h`);
    if (menuButton) {
        await withMenu(menuButton, callback);
    }
}
async function openMuteModal() {
    await withConversationMenu(() => {
        selectMenuItem(1);
    });
}
async function archiveSelectedConversation() {
    const groupConversationProfilePicture = document.querySelector(`${selectedConversationSelector} ._55lu`);
    const isGroupConversation = Boolean(groupConversationProfilePicture);
    await withConversationMenu(() => {
        selectMenuItem(isGroupConversation ? 4 : 3);
    });
}
async function deleteSelectedConversation() {
    const groupConversationProfilePicture = document.querySelector(`${selectedConversationSelector} ._55lu`);
    const isGroupConversation = Boolean(groupConversationProfilePicture);
    await withConversationMenu(() => {
        selectMenuItem(isGroupConversation ? 5 : 4);
    });
}
async function openPreferences() {
    await withSettingsMenu(() => {
        selectMenuItem(1);
    });
}
function isPreferencesOpen() {
    return Boolean(document.querySelector('._3quh._30yy._2t_._5ixy'));
}
function closePreferences() {
    const doneButton = document.querySelector('._3quh._30yy._2t_._5ixy');
    doneButton.click();
}
async function sendConversationList() {
    const conversations = await Promise.all([...(await element_ready_1.default(listSelector)).children]
        .splice(0, 10)
        .map(async (el) => {
        const profilePic = el.querySelector('._55lt img');
        const groupPic = el.querySelector('._4ld- div');
        // This is only for group chats
        if (groupPic) {
            // Slice image source from background-image style property of div
            const bgImage = groupPic.style.backgroundImage;
            groupPic.src = bgImage.slice(5, bgImage.length - 2);
        }
        const isConversationMuted = el.classList.contains('_569x');
        return {
            label: el.querySelector('._1ht6').textContent,
            selected: el.classList.contains('_1ht2'),
            unread: el.classList.contains('_1ht3') && !isConversationMuted,
            icon: await getDataUrlFromImg(profilePic ? profilePic : groupPic, el.classList.contains('_1ht3'))
        };
    }));
    electron_1.ipcRenderer.send('conversations', conversations);
}
// Return canvas with rounded image
function urlToCanvas(url, size) {
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.addEventListener('load', () => {
            const canvas = document.createElement('canvas');
            const padding = {
                top: 3,
                right: 0,
                bottom: 3,
                left: 0
            };
            canvas.width = size + padding.left + padding.right;
            canvas.height = size + padding.top + padding.bottom;
            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2 + padding.left, size / 2 + padding.top, size / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, padding.left, padding.top, size, size);
            ctx.restore();
            resolve(canvas);
        });
        img.src = url;
    });
}
// Return data url for user avatar
function getDataUrlFromImg(img, unread) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
        if (unread) {
            const dataUnreadUrl = img.getAttribute('dataUnreadUrl');
            if (dataUnreadUrl) {
                return resolve(dataUnreadUrl);
            }
        }
        else {
            const dataUrl = img.getAttribute('dataUrl');
            if (dataUrl) {
                return resolve(dataUrl);
            }
        }
        const canvas = await urlToCanvas(img.src, 30);
        const ctx = canvas.getContext('2d');
        const dataUrl = canvas.toDataURL();
        img.setAttribute('dataUrl', dataUrl);
        if (!unread) {
            return resolve(dataUrl);
        }
        const markerSize = 8;
        ctx.fillStyle = '#f42020';
        ctx.beginPath();
        ctx.ellipse(canvas.width - markerSize, markerSize, markerSize, markerSize, 0, 0, 2 * Math.PI);
        ctx.fill();
        const dataUnreadUrl = canvas.toDataURL();
        img.setAttribute('dataUnreadUrl', dataUnreadUrl);
        resolve(dataUnreadUrl);
    });
}
// Inject a global style node to maintain custom appearance after conversation change or startup
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.id = 'zoomFactor';
    document.body.append(style);
    // Set the zoom factor if it was set before quitting
    const zoomFactor = config_1.default.get('zoomFactor') || 1;
    setZoom(zoomFactor);
    // Enable OS specific styles
    document.documentElement.classList.add(`os-${process.platform}`);
    // Hide sidebar if it was hidden before quitting
    setSidebarVisibility();
    // Activate Dark Mode if it was set before quitting
    setDarkMode();
    // Prevent flash of white on startup when in dark mode
    // TODO: find a CSS-only solution
    if (!electron_util_1.is.macos && config_1.default.get('darkMode')) {
        document.documentElement.style.backgroundColor = '#1e1e1e';
    }
});
window.addEventListener('load', () => {
    const sidebar = document.querySelector('[role=navigation]');
    if (sidebar) {
        sendConversationList();
        const conversationListObserver = new MutationObserver(sendConversationList);
        conversationListObserver.observe(sidebar, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }
    if (location.pathname.startsWith('/login')) {
        const keepMeSignedInCheckbox = document.querySelector('#u_0_0');
        keepMeSignedInCheckbox.checked = config_1.default.get('keepMeSignedIn');
        keepMeSignedInCheckbox.addEventListener('change', () => {
            config_1.default.set('keepMeSignedIn', !config_1.default.get('keepMeSignedIn'));
        });
    }
});
// It's not possible to add multiple accelerators
// so this needs to be done the old-school way
document.addEventListener('keydown', async (event) => {
    // The `!event.altKey` part is a workaround for https://github.com/electron/electron/issues/13895
    const combineKey = electron_util_1.is.macos ? event.metaKey : event.ctrlKey && !event.altKey;
    if (!combineKey) {
        return;
    }
    if (event.key === ']') {
        await nextConversation();
    }
    if (event.key === '[') {
        await previousConversation();
    }
    const num = parseInt(event.code.slice(-1), 10);
    if (num >= 1 && num <= 9) {
        await jumpToConversation(num);
    }
});
// Pass events sent via `window.postMessage` on to the main process
window.addEventListener('message', ({ data: { type, data } }) => {
    if (type === 'notification') {
        showNotification(data);
    }
});
function showNotification({ id, title, body, icon, silent }) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = icon;
    img.addEventListener('load', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        electron_1.ipcRenderer.send('notification', {
            id,
            title,
            body,
            icon: canvas.toDataURL(),
            silent
        });
    });
}
electron_1.ipcRenderer.on('notification-callback', (_event, data) => {
    window.postMessage({ type: 'notification-callback', data }, '*');
});
//# sourceMappingURL=browser.js.map
