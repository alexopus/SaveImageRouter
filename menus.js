function saveImageTo(info, tab) {
    var url = info.srcUrl;
    var a = document.createElement('a');
    a.href = info.pageUrl;
    var pageUrl = a.hostname;
    var path_ = a.pathname.replace(new RegExp('/', 'g'), '_');
    var filename = url.substring(url.lastIndexOf('/') + 1);
    var ext = filename.substr(filename.lastIndexOf('.') + 1);
    var filename = filename.substring(0, filename.lastIndexOf('.'));

    chrome.storage.local.get({
        entries: []
    }, function(items) {
        var index = items.entries.findIndex(function(e, i) {
            return e.title == info.menuItemId;
        });

        var title = items.entries[index].title.trim();
        var directory = items.entries[index].directory.trim();
        var dialog = items.entries[index].dialog;
        var ifExists = items.entries[index].ifExists;

        if ("rename" in items.entries[index]) {
            var date = new Date();
            var dateStr = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" +  date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds();

            switch (items.entries[index].rename.name) {
                case 'keep original name':
                    break;
                case '"SaveImageRouter"':
                    filename = "SaveImageRouter";
                    break;
                case 'empty name':
                    filename = "";
                    break;
                default:
                    break;
            }

            switch (items.entries[index].rename.prefix) {
                case 'no prefix':
                    break;
                case 'timestamp prefix':
                    filename = dateStr + '_' + filename;
                    break;
                case 'host prefix':
                    filename = pageUrl + '_' + filename;
                    break;
                case 'URL path':
                    filename = path_ + '_' + filename;
                    break;
                default:
                    break;
            }

            switch (items.entries[index].rename.suffix) {
                case 'no suffix':
                    break;
                case 'timestamp suffix':
                    filename = filename + '_' + dateStr;
                    break;
                case 'host suffix':
                    filename = filename + '_' + pageUrl;
                    break;
                case 'URL path':
                    filename = filename + '_' + path_;
                    break;
                default:
                    break;
            }
        }

        if (filename == "") {
            filename = "SaveImageRouter";
        }
        filename = filename + "." + ext;

        if (directory === "") {
            // base directory, do not add slash
            filename = directory + filename;
        } else {
            filename = directory + "/" + filename;
        }

        filename = filename.replace(/[\#\?].*$/,'');

        var conflictAction = "uniquify";

        switch (ifExists) {
            case "rename":
                conflictAction = "uniquify";
                break;
            case "overwrite":
                conflictAction = "overwrite";
                break;
            case "dialog":
                conflictAction = "prompt";
                break;
            default:
                break;
        }

        chrome.downloads.download({
            url: url,
            filename: filename,
            conflictAction: conflictAction,
            saveAs: dialog
        });
    });
}

function saveToDefault(info, tab) {
    var url = info.srcUrl;
    chrome.downloads.download({
        url: url,
        filename: url.substring(url.lastIndexOf('/') + 1),
        conflictAction: "uniquify",
        saveAs: false
    });
}

function createMenus() {
    chrome.contextMenus.create({
        "id": "SIT",
        "title": "Save Image to...",
        "contexts": ["image", "video"]
    });

    chrome.storage.local.get({
        entries: []
    }, function(items) {
        createEntriesMenus(items);
    });

    chrome.storage.local.get({
        defaultEntry: true
    }, function(items) {
        if (items.defaultEntry === true)
        {
            chrome.contextMenus.create({
                "parentId": "SIT",
                "contexts": ["image", "video"],
                "id": "_____internal_saveimagerouter_default_____",
                "title": "_default_",
                "onclick": saveToDefault
            });
        }
    });
}

createMenus();

// update menus when new entries are saved from the options
chrome.storage.onChanged.addListener(function(changes, namespace) {
    chrome.contextMenus.removeAll();
    createMenus();
});

function createEntriesMenus(items) {
    items.entries.forEach(function(entry) {
        chrome.contextMenus.create({
            "parentId": "SIT",
            "contexts": ["image", "video"],
            "id": entry.title,
            "title": entry.title,
            "onclick": saveImageTo
        });
    });
};
