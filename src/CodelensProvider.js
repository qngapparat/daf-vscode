const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
/**
 * CodelensProvider
 */
class CodelensProvider {

    codeLenses = [];
    isOpening;
    secret = "1234"
    _onDidChangeCodeLenses = new vscode.EventEmitter();
    onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    constructor() {
        this.isOpening = (line) => {
            line = line.replace(/\/\/\s*l/, '//l')
            return line.includes("//l ") || /\/\/l$/.test(line)
        }

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    provideCodeLenses(document, token) {

        if (vscode.workspace.getConfiguration("llend-vscode").get("enablellend", true)) {
            this.codeLenses = [];
            const text = document.getText();
            const lines = text.split('\n');
            for (const [idx, line] of lines.entries()) {
                if (this.isOpening(line)) {
                    // just an hacky way to encode in the codelens obj whether to show 'Convert to Lambda' or 'Add faas call'
                    this.codeLenses.push(new vscode.CodeLens(
                        new vscode.Range(
                            new vscode.Position(idx, 0),
                            new vscode.Position(idx, 1)
                        )
                    ));
                    this.codeLenses.push(new vscode.CodeLens(
                        new vscode.Range(
                            new vscode.Position(idx, 1),
                            new vscode.Position(idx, 2)
                        )
                    ));
                 //   console.log(this.codeLenses[0].range[0].character)
                }
            }

            return this.codeLenses;
        }
        return [];
    }

    resolveCodeLens(codeLens, token) {
        if (vscode.workspace.getConfiguration("llend-vscode").get("enablellend", true)) {

            let workspacePath = null;
            if (vscode.workspace && vscode.workspace.workspaceFolders) {
                workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath
            }

            // decoding whether this is the first or second label of the line
            // Using the JSON hack to get the raw data
            if(JSON.parse(JSON.stringify(codeLens)).range[0].character === 0) {

                codeLens.command = {
                    title: "Convert to Lambda",
                    tooltip: "Tooltip",
                    command: "llend-vscode.converttolambda",
                    // pass range of codelens
                    arguments: [JSON.stringify(
                        {
                            codeLens: codeLens,
                            fpath: vscode.window.activeTextEditor.document.fileName,
                            workspacePath: workspacePath
                            //outdir: outdir
                        }
                    ), false]
                };
            } 

            else {

                codeLens.command = {
                    title: "Add FaaS call",
                    tooltip: "Tooltip",
                    command: "llend-vscode.addfaascall",
                    // pass range of codelens
                    arguments: [JSON.stringify(
                        {
                            codeLens: codeLens,
                            fpath: vscode.window.activeTextEditor.document.fileName,
                            workspacePath: workspacePath
                            //outdir: outdir
                        }
                    ), false]
                };
            }

            return codeLens;
        }
        return null;
    }
}


module.exports = {
    CodelensProvider
}