setTimeout(() => {

    // resolve repo asset paths to thier github urls
    function resolveGithubAssetUrl(imgPath) {
        if (/^https?:\/\//.test(imgPath)) return imgPath;

        const parts = location.pathname.split("/").filter(Boolean);
        const [owner, repo, , ...rest] = parts;
        const branch = rest[0];
        const currentFilePath = rest.slice(1).join("/");

        let targetPath;

        if (imgPath.startsWith("/")) {
            targetPath = imgPath.slice(1);
        } else {
            const dir = currentFilePath.split("/").slice(0, -1);
            const segments = [...dir, ...imgPath.split("/")];

            const resolved = [];
            for (const seg of segments) {
                if (seg === "." || seg === "") continue;
                if (seg === "..") resolved.pop();
                else resolved.push(seg);
            }
            targetPath = resolved.join("/");
        }

        const encodedPath = targetPath.split("/").map(encodeURIComponent).join("/");
        return `https://github.com/${owner}/${repo}/raw/${branch}/${encodedPath}`;
    }

    // custom renderer so marked.parse() rewrites image src on the way in
    const renderer = new marked.Renderer();
    renderer.image = (...args) => {
        let href, title, text;

        if (typeof args[0] === "object") {
            ({ href, title, text } = args[0]);
        } else {
            [href, title, text] = args;
        }

        const resolvedSrc = resolveGithubAssetUrl(href);
        return `<img src="${resolvedSrc}" alt="${text || ""}" style="max-width: 100%;">`;
    };

    // pull the markdown editor
    const editor = document.querySelector('[data-language="markdown"]');

    if (!editor) {
        console.log("markdown editor not found");
        return;
    }

    // create rich editor
    const richEditor = document.createElement("div");
    richEditor.id = "github-rich-editor";
    richEditor.contentEditable = "true";
    richEditor.spellcheck = false;

    // get whatever content is currently available
    const initialMarkdown = editor.innerText;

    richEditor.innerHTML = marked.parse(initialMarkdown, { renderer });

    // replace the github editor
    editor.style.display = "none";
    editor.parentElement.appendChild(richEditor);

    // handle markdown shortcuts
    richEditor.addEventListener("keydown", (e) => {

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const node = selection.anchorNode;
        if (!node || node.nodeType !== Node.TEXT_NODE) return;

        if (e.key === " ") {
            const text = node.textContent;
            const cursor = selection.anchorOffset;
            const beforeCursor = text.slice(0, cursor);

            // ** / * bold-italic formatting
            const match = beforeCursor.match(/(\*\*|\*)([^*]+)\1$/);
            if (match) {
                e.preventDefault();

                const isBold = match[1] === "**";
                const content = match[2];
                const openStart = cursor - match[0].length;

                const element = document.createElement(isBold ? "strong" : "em");
                element.textContent = content;

                const range = document.createRange();
                range.setStart(node, openStart);
                range.setEnd(node, cursor);
                range.deleteContents();
                range.insertNode(element);

                const spacer = document.createTextNode("\u00A0");
                element.after(spacer);
                range.setStart(spacer, 1);
                range.collapse(true);

                selection.removeAllRanges();
                selection.addRange(range);

                return;
            }

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
            if (beforeCursor === "-" || beforeCursor === "+") {
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