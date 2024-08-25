document.addEventListener('DOMContentLoaded', function() {
    const tabGroupSelect = document.getElementById('tabGroupSelect');

    // タブグループをSelectに追加
    function populateTabGroups() {
        chrome.tabGroups.query({}, function(groups) {
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.title || `Group ${group.id}`;
                tabGroupSelect.appendChild(option);
            });
        });
    }

    populateTabGroups();

    tabGroupSelect.addEventListener('change', function() {
        const selectedGroupId = this.value;
        console.log('Selected group ID:', selectedGroupId);
    });
});