import * as vscode from 'vscode';
const fs = require('fs')
const path = require('path')
/**
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private isOpening;
    private secret = "1234"
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        this.isOpening = (line: string) => {
            line = line.replace(/\/\/\s*l/, '//l')
            return line.includes("//l ") || /\/\/l$/.test(line)
        }

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

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
                }
            }

            return this.codeLenses;
        }
        return [];
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        if (vscode.workspace.getConfiguration("llend-vscode").get("enablellend", true)) {

            let workspacePath = null;
            if (vscode.workspace && vscode.workspace.workspaceFolders) {
                workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath
            }

            // Decoding the crude encoding from above (lol)
            if (codeLens.range[0].character === 0) {
                // Show 'Convert to Lambda label'
                codeLens.command = {
                    title: "xConvert to Lambda",
                    tooltip: "Tooltip",
                    command: "llend-vscode.llendAction",
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
                // Show other label
                codeLens.command = {
                    title: "add call",
                    tooltip: "Tooltip",
                    command: "llend-vscode.llendAction",
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

