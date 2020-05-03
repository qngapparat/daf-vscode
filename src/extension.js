// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { ExtensionContext, languages, commands, Disposable, workspace, window } = require('vscode');
const { CodelensProvider } = require('./CodelensProvider');
const childprocess = require('child_process')
const fs = require('fs')
const path = require('path')

const llend = require('llend')
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

var disposables = []

function activate(context) {
    let codelensProvider = new CodelensProvider();

    languages.registerCodeLensProvider("*", codelensProvider);

    commands.registerCommand("llend-vscode.enablellend", () => {
        workspace.getConfiguration("llend-vscode").update("enablellend", true, true);
    });

    commands.registerCommand("llend-vscode.disablellend", () => {
        workspace.getConfiguration("llend-vscode").update("enablellend", false, true);
    });

    commands.registerCommand("llend-vscode.llendAction", (argsJSON) => {

        let { codeLens, fpath, workspacePath } = JSON.parse(argsJSON)
        let linenum = codeLens.range[0].line // NOTE we know we use singleline comments so linenum(s) is trivial

        /////////////////////////////////
        // workspacePath validation

        if (workspacePath == null || workspacePath.trim() === "") {
            window.showErrorMessage("In VSCode, open your project folder with your package.json for l to work")
            return
        }

        // See if package.json is there
        if (fs.existsSync(path.join(workspacePath, 'package.json')) === false) {
            window.showErrorMessage("No package.json found in folder open in VSCode")
            return
        }

        // See if it has the loutdir field
        let pkgjson = fs.readFileSync(path.join(workspacePath, 'package.json'), { encoding: 'utf8' })
        try { pkgjson = JSON.parse(pkgjson) } catch (e) {
            window.showErrorMessage("package.json is invalid JSON")
            return
        }

        if (pkgjson['loutdir'] == null) {
            window.showErrorMessage("Please specify the 'loutdir' field in package.json")
            return
        }

        ////////////////////////////////////
        // linenum and fpath validation

        if (isNaN(linenum)) {
            window.showWarningMessage("Couldn't extract line number from codeLens")
            return
        }

        if (fpath == null || fpath.trim() === "") {
            window.showErrorMessage("Couldn't extract file path from codeLens (Internal error)")
            return
        }

        if (/(.*?)\.js/.test(fpath) == false) {
            window.showErrorMessage("File must be a .js file")
        }

        // run llend (Bulk of work)
            return llend(fpath, linenum, workspacePath)
            .then(() => window.showInformationMessage("Done success"))
            .catch((e) => window.showErrorMessage("Something errored:" + e))
     
    });
}

// this method is called when your extension is deactivated
function deactivate() {
    if (disposables) {
        disposables.forEach(item => item.dispose());
    }
    disposables = [];
}

module.exports = {
    activate,
    deactivate
}