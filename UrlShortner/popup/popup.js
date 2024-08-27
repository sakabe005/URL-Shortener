document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("settingIcon").addEventListener("click", handleClickSettingIcon);
});

const handleClickSettingIcon = () => {
    const url = chrome.runtime.getURL("../settings/index.html");
    chrome.tabs.create({ url: url });
};
