setTimeout(() => {

    // pull the markdown editor
    const editor = document.querySelector('[data-language="markdown"]');

    if (!editor) {
        console.log("markdown editor not found");
        return;
    }

    // create the rich editor
    const richEditor = document.createElement("div");
    richEditor.id = "github-rich-editor";
    richEditor.contentEditable = "true";
    richEditor.spellcheck = false;

    richEditor.style.cssText = `
        width: 100%;
        min-height: 500px;
        padding: 40px;
        box-sizing: border-box;
        overflow-y: auto;
        outline: none;
        font-size: 16px;
        line-height: 1.6;
    `;

    // get whatever content is currently available
    const initialMarkdown = editor.innerText;

    // render it
    richEditor.innerHTML = marked.parse(initialMarkdown);

    // replace the github editor
    editor.style.display = "none";
    editor.parentElement.appendChild(richEditor);

    // handle markdown shortcuts
    richEditor.addEventListener("keydown", (e) => {

        if (e.key !== " ") return;

        const selection = window.getSelection();

        if (!selection.rangeCount) return;

        const node = selection.anchorNode;

        if (!node || node.nodeType !== Node.TEXT_NODE) return;

        const text = node.textContent;
        const cursor = selection.anchorOffset;

        const beforeCursor = text.slice(0, cursor);

        // # heading
        if (/^#{1,3}$/.test(beforeCursor)) {
            e.preventDefault();

            const level = beforeCursor.length;
            const heading = document.createElement(`h${level}`);
            heading.textContent = " ";

            const range = document.createRange();
            range.selectNodeContents(node);
            range.deleteContents();

            range.insertNode(heading);

            range.setStart(heading, 1);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);
        }

        // - bullet list
        if (beforeCursor === "-") {
            e.preventDefault();

            const list = document.createElement("ul");
            const item = document.createElement("li");

            item.innerHTML = "<br>";
            list.appendChild(item);

            node.textContent = "";

            node.parentElement?.appendChild(list);

            const range = document.createRange();
            range.selectNodeContents(item);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);
        }

        // 1. numbered list
        if (/^\d+\.$/.test(beforeCursor)) {
            e.preventDefault();

            const list = document.createElement("ol");
            const item = document.createElement("li");

            item.innerHTML = "<br>";
            list.appendChild(item);

            node.textContent = "";

            node.parentElement?.appendChild(list);

            const range = document.createRange();
            range.selectNodeContents(item);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    // basic github-style markdown
    const style = document.createElement("style");

    style.textContent = `
        #github-rich-editor h1,
        #github-rich-editor h2,
        #github-rich-editor h3 {
            border-bottom: 1px solid #30363d;
            padding-bottom: 0.3em;
        }

        #github-rich-editor ul,
        #github-rich-editor ol {
            padding-left: 2em;
        }

        #github-rich-editor pre {
            padding: 16px;
            background: #161b22;
            border-radius: 6px;
            overflow-x: auto;
        }

        #github-rich-editor code {
            font-family: monospace;
        }

        #github-rich-editor :not(pre) > code {
            padding: 0.2em 0.4em;
            background: #6e768166;
            border-radius: 6px;
        }

        #github-rich-editor img {
            max-width: 100%;
        }
    `;

    document.head.appendChild(style);

}, 3000);