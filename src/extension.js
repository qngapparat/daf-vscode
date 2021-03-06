// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { ExtensionContext, languages, commands, Disposable, workspace, window } = require('vscode');
const { CodelensProvider } = require('./CodelensProvider');
const childprocess = require('child_process')
const fs = require('fs')
const path = require('path')

const x2faas = require('x2faas')
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

var disposables = []

function activate(context) {
    let codelensProvider = new CodelensProvider();

    languages.registerCodeLensProvider("*", codelensProvider);

    commands.registerCommand("daf-vscode.enabledaf", () => {
        workspace.getConfiguration("daf-vscode").update("enabledaf", true, true);
    });

    commands.registerCommand("daf-vscode.disabledaf", () => {
        workspace.getConfiguration("daf-vscode").update("enabledaf", false, true);
    });

    function sharedVerification(argsJSON) {
        let { codeLens, fpath, workspacePath } = JSON.parse(argsJSON)
        let linenum = codeLens.range[0].line

        /////////////////////////////////
        // workspacePath validation

        if (workspacePath == null || workspacePath.trim() === "") {
            window.showErrorMessage("In VSCode, open your project folder with your package.json for DAF to work")
            throw new Error()
        }

        // See if package.json is there
        if (fs.existsSync(path.join(workspacePath, 'package.json')) === false) {
            window.showErrorMessage("No package.json found in folder open in VSCode")
            throw new Error()
        }

        // OMIT loutdir, assume it's the current dir

        // // See if it has the loutdir field
        // let pkgjson = fs.readFileSync(path.join(workspacePath, 'package.json'), { encoding: 'utf8' })
        // try { pkgjson = JSON.parse(pkgjson) } catch (e) {
        //     window.showErrorMessage("package.json is invalid JSON")
        //     throw new Error()
        // }

        // if (pkgjson['loutdir'] == null) {
        //     window.showErrorMessage("Please specify 'loutdir' (where DAF should put the generated lambdas) in package.json")
        //     throw new Error()
        // }

        ////////////////////////////////////
        // linenum and fpath validation

        if (isNaN(linenum)) {
            window.showWarningMessage("Couldn't extract line number from codeLens")
            throw new Error()
        }

        if (fpath == null || fpath.trim() === "") {
            window.showErrorMessage("Couldn't extract file path from codeLens (Internal error)")
            throw new Error()
        }

        if (/(.*?)\.js/.test(fpath) == false) {
            window.showErrorMessage("File must be a .js file")
            throw new Error()
        }

    }

    commands.registerCommand("daf-vscode.addfaascall", (argsJSON) => {
        
        sharedVerification(argsJSON)

        let { codeLens, fpath, workspacePath } = JSON.parse(argsJSON)
        let linenum = codeLens.range[0].line

        // TODO call x2faas.addcall
        // run x2faas (Bulk of work)
        return x2faas(fpath, linenum, workspacePath, "amazon",true)
        .then(() => window.showInformationMessage("Done: Add FaaS call"))
        .catch((e) => window.showErrorMessage("Something errored: " + e))

    })


    commands.registerCommand("daf-vscode.converttolambda", (argsJSON) => {
        
        sharedVerification(argsJSON)

        let { codeLens, fpath, workspacePath } = JSON.parse(argsJSON)
        let linenum = codeLens.range[0].line // NOTE we know we use singleline comments so linenum(s) is trivial

        // run x2faas (Bulk of work)
            return x2faas(fpath, linenum, workspacePath, "amazon")
            .then(() => window.showInformationMessage("Done: Convert to Lambda"))
            .catch((e) => window.showErrorMessage("Something errored: " + e))
     
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