var downloadInfo = {};

function saveImageTo(info, tab) {
    var url = info.srcUrl;

    chrome.storage.local.get({
        entries: []
    }, function(items) {
        var index = items.entries.findIndex(function(e, i) {
            return e.title == info.menuItemId;
        });

        downloadInfo.directory = items.entries[index].directory.trim();
        var dialog = items.entries[index].dialog;
        var ifExists = items.entries[index].ifExists;

        if ("rename" in items.entries[index]) {
            downloadInfo.rename = true;
            downloadInfo.renameName = items.entries[index].rename.name;
            downloadInfo.renamePrefix = items.entries[index].rename.prefix;
            downloadInfo.renameSuffix = items.entries[index].rename.suffix;
        } else {
            downloadInfo.rename = false;
        }

        downloadInfo.conflictAction  = "uniquify";

        switch (ifExists) {
            case "rename":
                downloadInfo.conflictAction =  "uniquify";
                break;
            case "overwrite":
                downloadInfo.conflictAction = "overwrite";
                break;
            case "dialog":
                downloadInfo.conflictAction = "prompt";
                break;
            default:
                break;
        }

        chrome.downloads.download({
            url: url,
            saveAs: dialog
        }, function(downloadId) {
            downloadInfo.id = downloadId;
        });
    });
}

function saveToDefault(info, tab) {
    var url = info.srcUrl;
    chrome.downloads.download({
        url: url,
        conflictAction: "uniquify",
        saveAs: false
    }, function(downloadId) {
        downloadInfo.id = downloadId;
        downloadInfo.directory = '_default_';
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

chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
    if (item.id === downloadInfo.id) {
        if (downloadInfo.directory === '_default_') {
            // do not suggest anything, use defaults.
        } else {
            // get host name and file path
            var a = document.createElement('a');
            a.href = item.url;
            var hostname = a.hostname;
            var path_ = a.pathname.replace(new RegExp('/', 'g'), '_');
            // get filename determined by Chrome
            var filename = item.filename;
            // separate extension from the filename
            var ext = filename.substr(filename.lastIndexOf('.') + 1);
            filename = filename.substring(0, filename.lastIndexOf('.'));
            // get directory from the saved download info
            var directory = downloadInfo.directory;

            // do renaming of the filename if required
            if (downloadInfo.rename) {
                var date = new Date();
                var dateStr = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" +  date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds();

                switch (downloadInfo.renameName) {
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

                switch (downloadInfo.renamePrefix) {
                    case 'no prefix':
                        break;
                    case 'timestamp prefix':
                        filename = dateStr + '_' + filename;
                        break;
                    case 'host prefix':
                        filename = hostname + '_' + filename;
                        break;
                    case 'URL path':
                        filename = path_ + '_' + filename;
                        break;
                    default:
                        break;
                }

                switch (downloadInfo.renameSuffix) {
                    case 'no suffix':
                        break;
                    case 'timestamp suffix':
                        filename = filename + '_' + dateStr;
                        break;
                    case 'host suffix':
                        filename = filename + '_' + hostname;
                        break;
                    case 'URL path':
                        filename = filename + '_' + path_;
                        break;
                    default:
                        break;
                }
            }

            // make sure renaming didn't erase the filename completely (no prefix + empty name + no suffix)
            if (filename == "") {
                filename = "SaveImageRouter";
            }
            // add back the extension to the filename
            filename = filename + "." + ext;

            // prepend the directory to the modified filename
            if (directory === "") {
                // base directory, do not add slash
                filename = directory + filename;
            } else {
                filename = directory + "/" + filename;
            }

            // make sure the modified filename doesn't contain any illegal characters
            filename = filename.replace(/[\#\?].*$/,'');

            // suggest the new filename to Chrome
            suggest({ filename: filename, conflictAction: downloadInfo.conflictAction });
        }
    }

    // reset the download info for the next download item
    downloadInfo = {};
});

// update menus when new entries are saved from the options
chrome.storage.onChanged.addListener(function(changes, namespace) {
    chrome.contextMenus.removeAll(function() {
        createMenus();
    });
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
