function saveOptions() {
    var $entries = $('.entry');

    var newEntries = [];

    $entries.each(function(index, entry) {
        var newEntry = {};
        newEntry.title = $(this).find('.title').text();
        newEntry.directory = $(this).find('.directory').text();
        newEntry.dialog = $(this).find('.dialog').find('.material-icons').hasClass('fa-check');
        if (!newEntry.dialog) {
            if ($(this).find('.rename-list').length > 0) {
                newEntry.rename = {};
                newEntry.rename.prefix = $(this).find('.rename-list-prefix').text();
                newEntry.rename.name = $(this).find('.rename-list-name').text();
                newEntry.rename.suffix = $(this).find('.rename-list-suffix').text();
            }
        }
        newEntry.ifExists = $(this).find('.if-exists').text();
        newEntries.push(newEntry);
    });

    chrome.storage.local.set({
        entries: newEntries
    }, function() {
        $('#status').text('Directories saved.').show('fast');
        setTimeout(function() {
            $('#status').text('').hide('fast');
        }, 1000);
    });
}

function createEntry(entry) {
    var newEntry = "";
    newEntry += "<tr class='entry'>";
    newEntry += "<td class='handle mdl-data-table__cell--non-numeric'><i class='material-icons fa-bars'>reorder</i></td>";
    newEntry += "<td class='title mdl-data-table__cell--non-numeric'>" + entry.title + "</td>";
    newEntry += "<td class='directory mdl-data-table__cell--non-numeric'>" + entry.directory + "</td>";
    if (entry.dialog) {
        newEntry += "<td class='dialog mdl-data-table__cell'><i class='material-icons fa-check'>done</i></td>";
        newEntry += "<td class='rename mdl-data-table__cell'>&nbsp;</td>";
        newEntry += "<td class='if-exists mdl-data-table__cell'>&nbsp;</td>";
    } else {
        newEntry += "<td class='dialog mdl-data-table__cell'><i class='material-icons fa-times'>clear</i></td>";
        if ("rename" in entry) {
            newEntry += "<td class='rename mdl-data-table__cell'>";
            newEntry += "    <ul class='rename-list'>";
            newEntry += "        <li class='rename-list-prefix' title='prefix'>" + entry.rename.prefix + "</li>";
            newEntry += "        <li class='rename-list-name' title='file name'>" + entry.rename.name + "</li>";
            newEntry += "        <li class='rename-list-suffix' title='suffix'>" + entry.rename.suffix + "</li>";
            newEntry += "    </ul>";
            newEntry += "</td>";
        } else {
            newEntry += "<td class='rename mdl-data-table__cell'>&nbsp;</td>";
        }
        newEntry += "<td class='if-exists mdl-data-table__cell'>" + entry.ifExists + "</td>";
        }
    newEntry += "<td class='actions mdl-data-table__cell--non-numeric'>";
    newEntry += "<button class='mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect delete-button' title='delete'><i class='material-icons'>delete</i></button>";
    newEntry += "</td>";
    newEntry += "</tr>";

    $('.new-entry').before($(newEntry));

    $('.delete-button').off("click");

    $(".delete-button").on("click", function() {
        $(this).closest("tr.entry").remove();
        saveOptions();
    });
}

function checkInput() {
    chrome.storage.local.get({
        entries: []
    }, function(items) {
        var newEntry = {};
        newEntry.title = $('#title-input').val().trim();

        if (newEntry.title === "") {
            $('#errors').text('Title cannot be empty!').show('fast');
            setTimeout(function() {
                $('#errors').text('').hide('fast');
            }, 2000);
            return;
        }

        // check if the provided title already exists and exit if it does
        var index = items.entries.findIndex(function(e, i) {
            return e.title == newEntry.title;
        });
        if (index !== -1) {
            $('#errors').text('Title already exists, must be unique!').show('fast');
            setTimeout(function() {
                $('#errors').text('').hide('fast');
            }, 2000);
            return;
        }

        newEntry.directory = $('#directory-input').val().trim();

        while (newEntry.directory.charAt(0) === '/') {
            newEntry.directory = newEntry.directory.substring(1);
        }

        while (newEntry.directory.charAt(newEntry.directory.length - 1) === '/') {
            newEntry.directory = newEntry.directory.substring(0, newEntry.directory.length - 1);
        }

        newEntry.directory = newEntry.directory.replace(/\\/g, '/');

        var illegalChars = [ '?', ':', '~', '"', '<', '>', '*', '|' ];

        var error = false;

        illegalChars.forEach(function(char) {
            if (newEntry.directory.indexOf(char) !== -1) {
                $('#errors').html('Directory name contains illegal character: <strong>' + char +  '</strong>!').show('fast');
                setTimeout(function() {
                    $('#errors').text('').hide('fast');
                }, 2000);
                error = true;
                return;
            }
        });

        if (error) {
            return;
        }

        newEntry.dialog = $("#dialog-input").is(":checked") ? true : false;
        if (newEntry.dialog) {
            newEntry.ifExists = "";
        } else {
            newEntry.ifExists = $('#if-exists-input').val();

            var rename = $("#rename-input").is(":checked") ? true : false;
            if (rename) {
                newEntry.rename = {};
                newEntry.rename.prefix = $('#prefix-input').val();
                newEntry.rename.name = $('#name-input').val();
                newEntry.rename.suffix = $('#suffix-input').val();
            }
        }

        createEntry(newEntry);

        saveOptions();

        // reset the input form
        $('#title-input').val("");
        $('#directory-input').val("");
        $('#if-exists-input').val("rename");
        var dialog = $("#dialog-input").is(":checked") ? true : false;
        if (dialog) {
            $("#dialog-input").trigger("click");
        }
        $('#prefix-input').val("no prefix");
        $('#name-input').val("keep original name");
        $('#suffix-input').val("no suffix");
        var rename = $("#rename-input").is(":checked") ? true : false;
        if (rename) {
            $("#rename-input").trigger("click");
        }
    });
}

function initialize(items) {
    $("tbody").sortable({
        items: "> tr:not(:last)",
        appendTo: "parent",
        handle: ".handle",
        helper: "clone",
        stop: function(event, ui) { saveOptions(); }
    });

    if (items.hints === true) {
        $(".hint").show();
        $(".hints-toggle").text("keyboard_arrow_up");
    } else {
        $(".hint").hide();
        $(".hints-toggle").text("keyboard_arrow_down");
    }

    items.entries.forEach(function(item) {
        createEntry(item);
    });

    $(".delete-button").on("click", function() {
        $(this).closest("tr.entry").remove();
    });

    $("#dialog-input").on("click", function() {
        dialog = $(this).is(":checked") ? true : false;
        if (dialog) {
            var rename = $("#rename-input").is(":checked") ? true : false;
            if (rename) {
                $("#rename-input").trigger("click");
            }
            $("#if-exists-input-container").css("display", "none");
            $("#rename-input-container").css("display", "none");
        } else {
            $("#if-exists-input-container").css("display", "inline-block");
            $("#rename-input-container").css("display", "inline-block");
        }
    });

    $("#rename-input").on("click", function() {
        rename = $(this).is(":checked") ? true : false;
        if (rename) {
            $(".rename-box").css("display", "table-row");
        } else {
            $('#prefix-input').val("no prefix");
            $('#name-input').val("keep original name");
            $('#suffix-input').val("no suffix");
            $(".rename-box").css("display", "none");
        }
    });

    $(".hints-title").on("click", function() {
        $(".hint").toggle("fast");
        if ($(".hints-toggle").text() == "keyboard_arrow_down") {
            chrome.storage.local.set({
                hints: true
            }, function() {
                $(".hints-toggle").text("keyboard_arrow_up");
            });
        } else {
            chrome.storage.local.set({
                hints: false
            }, function() {
                $(".hints-toggle").text("keyboard_arrow_down");
            });
        }
    });

    $("#add-button").on("click", function() {
        checkInput();
    });

    $('input').on("keypress", function(e) {
        if (e.keyCode === 13) {
            checkInput();
        }
    });
}

function restoreOptions() {
    chrome.storage.local.get({
        entries: [],
        hints: true
    }, function(items) {
        initialize(items);
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
// document.getElementById('save').addEventListener('click', saveOptions);
