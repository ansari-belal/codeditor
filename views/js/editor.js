const logout_btn = document.getElementById("logout_btn");
const preview_btn = document.getElementById("preview_btn");
const save_btn = document.getElementById("save_btn");
const name = document.getElementById("name");
const profile = document.getElementById("profile");
const profile_dialog = document.querySelector(".profile_dialog");
const project_input = document.querySelector("#project");
const create_project_btn = document.querySelector("#cr_pr_btn");
const bars = document.querySelector(".bars");
const sidebar = document.querySelector(".sidebar_left");
const container = document.querySelector(".editor_container");
const con1 = document.querySelector(".editor");
const con2 = document.querySelector(".container");
const editor = document.querySelector("pre code");
const columnNumbers = document.getElementById("col_numbers");
const projectHierarchy = document.querySelector("#projectsHierarchy");
const fileHierarchy = document.querySelector("#filesHierarchy");
const logo = document.querySelector(".logo");

name.innerText = localStorage.getItem("username");
let activeFile = null;
let activePro = null;
let code = "";
let currentCode = "";
let language = "html";

logout_btn.addEventListener("click", async () => {
    const res = await fetch("/logout", { method: "POST" });
    const data = await res.json();
    if (data.success) {
        window.location.href = "/login";
    } else {
        alert("logout failed");
    }
});

async function req(url, method, data) {
    try {
        const res = await fetch(url, {
            method,
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json"
            }
        });
        const result = await res.json();
        return result;
    } catch (e) {
        throw new Error(e);
    }
}

const state = createState({ isLoading: false });
state.registerModule("sidebar", "projects", { projects: [] });
state.registerModule("sidebar", "activeProject", { activeProject: [] });
state.registerModule("sidebar", "dialog", { isShow: false });
const proMod = state.getModule("sidebar", "projects");
const fileMod = state.getModule("sidebar", "activeProject");
const dialogMod = state.getModule("sidebar", "dialog");

proMod.subscribe((newState, oldState) => {
    const { projects } = newState;
    if (projects.length > 0) {
        con1.style.display = "flex";
        con2.style.display = "none";
    } else {
        con1.style.display = "none";
        con2.style.display = "flex";
    }

    const projectList = document.createElement("ul");
    projects.forEach((item, index) => {
        const li = document.createElement("li");
        const div = document.createElement("div");
        const span = document.createElement("span");
        span.textContent = item.name;
        const img = new Image();
        const img2 = new Image();
        img.src = "/folder2.png";
        img2.src = "/dots.png";
        div.appendChild(img);
        div.appendChild(span);
        div.classList.add("folder");
        li.classList.add("file_li");
        div.addEventListener("click", () => {
            activePro = item.name;
            preview_btn.hidden = false;
            state.emit("activeProject", [item]);
        });
        li.appendChild(div);
        img2.addEventListener("click", () => deleteFolder(item.path));
        li.appendChild(img2);
        projectList.appendChild(li);
    });
    projectHierarchy.innerHTML = "";
    projectHierarchy.appendChild(projectList);
});

function buildFileTree(pro, pareElm) {
    pro.forEach(item => {
        const li = document.createElement("li");
        const div = document.createElement("div");
        const div2 = document.createElement("div");
        const img = document.createElement("img");
        const span = document.createElement("span");
        const img2 = document.createElement("img");
        if (item.type === "folder") {
            img.src = "/folder2.png";
            span.textContent = item.name;
            div.appendChild(img);
            div.appendChild(span);
            img2.src = "/dots.png";
            img2.addEventListener("click", function () {
                state.emit("showDialog", { element: this, item });
            });
            const sublist = document.createElement("ul");
            div.addEventListener("click", () => {
                sublist.classList.toggle("collapse");
            });
            div.classList.add("folder");
            div2.appendChild(div);
            div2.appendChild(img2);
            div2.classList.add("file_li");
            li.appendChild(div2);
            if (item.children.length) {
                li.appendChild(sublist);
                buildFileTree(item.children, sublist);
            }
        } else {
            span.textContent = item.name;
            const ext = item.name.match(/\.(html|css|js)$/i)[1];
            if (ext == "html") {
                img.src = "/html-5.png";
            }
            if (ext == "css") {
                img.src = "/css-3.png";
            }
            if (ext == "js") {
                img.src = "/js.png";
            }
            img2.src = "/dots.png";
            div.appendChild(img);
            div.appendChild(span);
            div.classList.add("folder");
            div.addEventListener("click", async () => {
                language = ext;
                await loadFile(item.path);
                activeFile = item.path;
                save_btn.hidden = false;
                logo.textContent = item.name
                syncColumnNumbers();
            });
            div2.appendChild(div);
            img2.addEventListener("click", function () {
                state.emit("showDialog", { element: this, item });
            });
            div2.appendChild(img2);
            div2.classList.add("file_li");
            li.appendChild(div2);
        }
        pareElm.appendChild(li);
    });
}

fileMod.subscribe((newState, oldState) => {
    const { activeProject } = newState;
    const filesList = document.createElement("ul");
    buildFileTree(activeProject, filesList);
    fileHierarchy.innerHTML = "";
    fileHierarchy.appendChild(filesList);
});

const div = document.createElement("div");
dialogMod.subscribe((newValue, oldValue) => {
    const { element, item, isShow } = newValue;
    if (isShow) {
        const box = document.createElement("div");
        box.style.position = "absolute";
        box.style.top = `${element.offsetTop - 8}px`;
        box.style.left = `${element.offsetLeft + 30}px`;
        const img = document.createElement("img");
        const img1 = document.createElement("img");
        const img2 = document.createElement("img");
        const img3 = document.createElement("img");
        img.src = "/delete.png";
        img1.src = "/delete.png";
        img2.src = "/delete.png";
        img3.src = "/delete.png";
        function deleteFileOrFolder(item) {
            if (item.type === "folder") {
                return deleteFolder(item.path);
            } else {
                return deleteFile(item.path);
            }
        }
        img.addEventListener("click", () => deleteFileOrFolder(item));
        box.appendChild(img);
        if (item.type === "folder") {
            img1.addEventListener("click", () => createFolder(item.path));
            box.appendChild(img1);
            img2.addEventListener("click", () => createFile(item.path));
            box.appendChild(img2);
        }
        box.appendChild(img3);
        div.innerHTML = "";
        box.classList.add("dialog_box");
        div.appendChild(box);
        div.id = "dialog";
        sidebar.appendChild(div);
    } else {
        const s = sidebar.querySelector("#dialog");
        s.remove();
        dialogMod.setState({ isShow: false });
    }
});

proMod.addMiddleware((newState, oldState) => {
    return newState;
});

fileMod.addMiddleware((newState, oldState) => {
    return newState;
});

dialogMod.addMiddleware((newState, oldState) => {
    return newState;
});

state.on("projects", payload => {
    proMod.setState({
        projects: payload
    });
});

state.on("activeProject", payload => {
    fileMod.setState({
        activeProject: payload
    });
});

state.on("showDialog", payload => {
    dialogMod.setState({
        ...payload,
        isShow: true
    });
});

profile.addEventListener("click", () => {
    profile_dialog.classList.toggle("show_profile");
});

async function createFolder(path) {
    const result = await req("/create_folder", "POST", {
        filepath: path,
        file_name: Math.floor(Math.random() * 100) + "demo"
    });
    await getProjects();
}
async function createFile(path) {
    const result = await req("/create_file", "POST", {
        filepath: path,
        file_name: Math.floor(Math.random() * 100) + "demo.html"
    });
    await getProjects();
}

async function getProjects() {
    try {
        state.setState({ isLoading: true });
        const res = await fetch(`/projects`);
        const data = await res.json();
        state.setState({ isLoading: false });
        state.emit("projects", data.projects);
        if (data.projects.length < 2) {
            state.emit("activeProject", [data.projects[0]]);
        }
    } catch (e) {
        alert(e.message);
    }
}

create_project_btn.addEventListener("click", async () => {
    const p = document.createElement("p");
    try {
        p.textContent = "Loading...";
        projectHierarchy.appendChild(p);
        const res = await fetch(`/create_project/${project_input.value}`);
        if (res.status === 201) {
            project_input.value = "";
            await getProjects();
            p.remove();
        }
    } catch (e) {
        alert(e.message);
    }
});

window.addEventListener("load", async () => await getProjects());

async function loadFile(path) {
    await sidebar.classList.remove("show_sidebar");
    await sidebar.classList.add("hide_sidebar");
    editor.innerHTML = "Loading...";
    const data = await req(`/loadFile`, "POST", {
        filepath: path
    });
    const result = hljs.highlight(language, data.file);
    editor.innerHTML = result.value;
    code = result.code;
    currentCode = code;
    return result;
}

async function deleteFile(path) {
    try {
        const data = await req(`/deleteFile`, "DELETE", {
            filepath: path
        });
        if (data.success) {
            await getProjects();
        }
    } catch (e) {
        alert(e);
    }
}
async function deleteFolder(path) {
    try {
        const data = await req(`/deleteFolder`, "DELETE", {
            filepath: path
        });
        if (data.success) {
            await getProjects();
        }
    } catch (e) {
        alert(e);
    }
}

editor.addEventListener("input", e => {
    e.preventDefault();
    const position = getCaretPosition();
    const result = hljs.highlight(language, editor.textContent);
    editor.innerHTML = result.value;
    currentCode = result.code;
    syncColumnNumbers();
    setCaretPosition(position);
});

editor.addEventListener("keydown", e => {});

save_btn.addEventListener("click", async () => {
    const data = await req("/update_file", "POST", {
        filepath: activeFile,
        content: currentCode
    });
    await loadFile(activeFile);
    code = currentCode;
});

container.addEventListener("click", () => {
    editor.focus();
    sidebar.classList.remove("show_sidebar");
    sidebar.classList.add("hide_sidebar");
    profile_dialog.classList.remove("show_profile");
    dialogMod.setState({ isShow: false });
});

bars.addEventListener("click", () => {
    sidebar.classList.remove("hide_sidebar");
    sidebar.classList.add("show_sidebar");
});

preview_btn.addEventListener("click", () => {
    location.href = `/preview/${activePro}`;
    profile_dialog.classList.remove("show_profile");
});

const pre = document.querySelector("pre");
pre.addEventListener("scroll", e => {
    if (e.target.scrollLeft) {
        columnNumbers.style.boxShadow = "2px 0 15px #09080855";
    } else {
        columnNumbers.style.boxShadow = "none";
    }
});

window.addEventListener("beforeunload", e => {
    if (code !== currentCode) {
        e.returnValue = "unsaved changes";
    }
});

function syncColumnNumbers() {
    let lines = editor.textContent.split("\n");
    lines = lines.slice(0, lines.length > 1 ? lines.length - 1 : lines.length);
    columnNumbers.innerHTML = "";
    lines.forEach((line, index) => {
        const span = document.createElement("span");
        span.textContent = index + 1;
        span.classList.add("num");
        columnNumbers.appendChild(span);
    });
}

function getCaretPosition() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const caretPosition = preCaretRange.toString().length;
        return caretPosition;
    }
    return 0;
}

function setCaretPosition(position) {
    // Create a range
    const range = document.createRange();
    const sel = window.getSelection();
    let charCount = 0;

    function findTextNodeAndOffset(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const textLength = node.textContent.length;
            if (charCount + textLength >= position) {
                return { node, offset: position - charCount };
            }
            charCount += textLength;
        } else {
            for (const childNode of node.childNodes) {
                const result = findTextNodeAndOffset(childNode);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
    const target = findTextNodeAndOffset(editor);
    if (target) {
        range.setStart(target.node, target.offset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        editor.focus();
    }
}

syncColumnNumbers();
