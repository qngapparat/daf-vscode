"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
const CodelensProvider_1 = require("./CodelensProvider");
const childprocess = require('child_process');
const fs = require('fs');
const path = require('path');
const llend = require('llend');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
var disposables = [];
function activate(context) {
    let codelensProvider = new CodelensProvider_1.CodelensProvider();
    vscode_1.languages.registerCodeLensProvider("*", codelensProvider);
    vscode_1.commands.registerCommand("llend-vscode.enablellend", () => {
        vscode_1.workspace.getConfiguration("llend-vscode").update("enablellend", true, true);
    });
    vscode_1.commands.registerCommand("llend-vscode.disablellend", () => {
        vscode_1.workspace.getConfiguration("llend-vscode").update("enablellend", false, true);
    });
    vscode_1.commands.registerCommand("llend-vscode.codelensAction", (argsJSON) => {
        let { codeLens, fpath, workspacePath } = JSON.parse(argsJSON);
        let linenum = codeLens.range[0].line; // NOTE we know we use singleline comments so linenum(s) is trivial
        /////////////////////////////////
        // workspacePath validation
        if (workspacePath == null || workspacePath.trim() === "") {
            vscode_1.window.showErrorMessage("In VSCode, open your project folder with your package.json for l to work");
            return;
        }
        // See if package.json is there
        if (fs.existsSync(path.join(workspacePath, 'package.json')) === false) {
            vscode_1.window.showErrorMessage("No package.json found in folder open in VSCode");
            return;
        }
        // See if it has the loutdir field
        let pkgjson = fs.readFileSync(path.join(workspacePath, 'package.json'), { encoding: 'utf8' });
        try {
            pkgjson = JSON.parse(pkgjson);
        }
        catch (e) {
            vscode_1.window.showErrorMessage("package.json is invalid JSON");
            return;
        }
        if (pkgjson['loutdir'] == null) {
            vscode_1.window.showErrorMessage("Please specify the 'loutdir' field in package.json");
            return;
        }
        ////////////////////////////////////
        // linenum and fpath validation
        if (isNaN(linenum)) {
            vscode_1.window.showWarningMessage("Couldn't extract line number from codeLens");
            return;
        }
        if (fpath == null || fpath.trim() === "") {
            vscode_1.window.showErrorMessage("Couldn't extract file path from codeLens (Internal error)");
            return;
        }
        if (/(.*?)\.js/.test(fpath) == false) {
            vscode_1.window.showErrorMessage("File must be a .js file");
        }
        // run llend (Bulk of work)
        return llend(fpath, linenum, workspacePath)
            .then(() => vscode_1.window.showInformationMessage("Done success"))
            .catch((e) => vscode_1.window.showErrorMessage("Something errored:" + e));
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    if (disposables) {
        disposables.forEach(item => item.dispose());
    }
    disposables = [];
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map