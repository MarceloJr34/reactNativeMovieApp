const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const IGNORED_DIRS = new Set(['node_modules', '.git', '.expo', 'dist', 'build']);

function walk(dir, cb) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (IGNORED_DIRS.has(name)) continue;
            walk(full, cb);
        } else cb(full);
    }
}

const root = process.cwd();
const exts = ['.tsx', '.jsx'];
let found = 0;

walk(root, (file) => {
    if (!exts.includes(path.extname(file))) return;
    const src = fs.readFileSync(file, 'utf8');
    let sourceFile;
    try {
        sourceFile = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    } catch (e) {
        return;
    }

    const report = [];

    function isInText(node) {
        let cur = node.parent;
        while (cur) {
            if (cur.kind === ts.SyntaxKind.JsxElement) {
                const opening = cur.openingElement;
                const tagName = opening.tagName.getText(sourceFile);
                if (tagName === 'Text') return true;
            }
            cur = cur.parent;
        }
        return false;
    }

    function visit(node) {
        if (node.kind === ts.SyntaxKind.JsxText) {
            const text = node.getText(sourceFile);
            if (/\S/.test(text) && !isInText(node)) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
                report.push({ line: line + 1, col: character + 1, text: text.trim() });
            }
        }

        if (node.kind === ts.SyntaxKind.JsxExpression) {
            const expr = node.expression;
            if (expr && (expr.kind === ts.SyntaxKind.StringLiteral || expr.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral || expr.kind === ts.SyntaxKind.NumericLiteral)) {
                if (!isInText(node)) {
                    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
                    report.push({ line: line + 1, col: character + 1, text: expr.getText(sourceFile) });
                }
            }
        }

        found += report.length;
    }
});

if (!found) console.log('No JSX text outside <Text> found.');
