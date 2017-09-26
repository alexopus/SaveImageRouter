# Save Image Router

Chrome plugin to save images to custom location from the context menu.

![screenshot](./screenshot.png?raw=true "screenshot")

[Try via Chrome Web Store](https://chrome.google.com/webstore/detail/save-image-router/pkimacjjcahflldkhofmdjlelllacbil).

### Saving images outside of the Chrome download location

Chrome only allows saving downloads inside the configured download location.

If you really want to work around it, you can make links inside your chrome doanload location, pointing to any location on your system:

- Windows: from the command line (cmd.exe from start->run) type the following command (replace the paths accordingly) and point the extension to the created link name:
```
mklink /D "C:\yourChromeDownloads\LinkName" "D:\yourDesiredLocation"
```

- Linux/OSX: create a symbolic link to the desired directory with the following command (replace the paths accordingly) and point the extension to the created directory name inside the Chrome Downloads location:
```
ln -s /Path/to/desired/directory /DirectoryName/inside/Chrome/downloads
```