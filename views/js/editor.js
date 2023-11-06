window.addEventListener("load", () => {
const logout_btn = document.getElementById("logout_btn");
const preview_btn = document.getElementById("preview_btn");
const save_btn = document.getElementById("save_btn");
const format_btn = document.getElementById("format_btn");
const run_btn = document.getElementById("run_btn");
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
state.registerModule("console", "dialog", { isShow: false });
const proMod = state.getModule("sidebar", "projects");
const fileMod = state.getModule("sidebar", "activeProject");
const dialogMod = state.getModule("sidebar", "dialog");
const consoleMod = state.getModule("console", "dialog");

proMod.subscribe((newState, oldState) => {
    const { projects } = newState;
    if (projects.length > 0) {
        preview_btn.hidden = false;
        con1.style.display = "flex";
        con2.style.display = "none";
    } else {
        preview_btn.hidden = true;
        con1.style.display = "none";
        con2.style.display = "flex";
    }

    const proList = document.createElement("ul");
    projects.forEach(item => {
        const li = document.createElement("li");
        const div = document.createElement("div");
        const span = document.createElement("span");
        span.textContent = item.name;
        const img = new Image();
        const img2 = new Image();
        const img3 = new Image();
        img.src = "/folder2.png";
        img2.src = "/menu.png";
        img3.src = "/menu.png";
        div.appendChild(img);
        div.appendChild(span);
        div.classList.add("folder");
        li.classList.add("file_li");
        div.addEventListener("click", () => {
            activePro = item.name;
            state.emit("activeProject", [item]);
        });
        img3.addEventListener("click", () => download(item.name));
        li.appendChild(div);
        img2.addEventListener("click", () => deleteFolder(item.path));
        li.appendChild(img3);
        li.appendChild(img2);
        proList.appendChild(li);
    });
    projectHierarchy.innerHTML = "";
    projectHierarchy.appendChild(proList);
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
            img2.src = "/menu.png";
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
            img2.src = "/menu.png";
            div.appendChild(img);
            div.appendChild(span);
            div.classList.add("folder");
            div.addEventListener("click", async () => {
                language = ext;
                dialogMod.setState({ isShow: false });
                await loadFile(item.path);
                activeFile = item.path;
                save_btn.hidden = false;
                format_btn.hidden = false;
                if (language === "js" || language === "mjs") {
                    run_btn.hidden = false;
                } else {
                    run_btn.hidden = true;
                }
                logo.textContent = item.name;
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

function deleteFileOrFolder(item) {
    if (item.type === "folder") {
        return deleteFolder(item.path);
    } else {
        return deleteFile(item.path);
    }
}

(function () {
  const div = document.createElement("div");
  const box = document.createElement("div");
  div.style.display = "none";
  box.style.position = "absolute";
  box.classList.add("dialog_box");

  function createIcon(src, id) {
    const i = document.createElement("i");
    i.classList.add(src)
    i.id = id;
    return i;
  }

  function createIcons(box) {
    const iconData = [
      { src: "fa fa-folder-plus", id: "add_folder" },
      { src: "fa fa-file-circle-plus", id: "add_file" },
      { src: "fa fa-trash-can", id: "delete" },
      { src: "fa fa-pencil", id: "rename" },
      { src: "fa fa-circle-info", id: "info" },
    ];

    box.innerHTML = ""
    iconData.forEach((data) => {
      box.appendChild(createIcon(data.src, data.id));
    });
    div.innerHTML = ""
    div.appendChild(box);
    sidebar.appendChild(div);
  }


  dialogMod.subscribe((newValue, oldValue) => {
    createIcons(box);
    try {
      if (newValue.isShow) {
        const { element, item } = newValue;
        box.style.top = `${element.offsetTop - 5}px`;
        box.style.left = `${element.offsetLeft + 30}px`;

        box.childNodes.forEach((icon) => {
          switch (icon.id) {
            case "add_folder":
              icon.addEventListener("click", () => createFolder(item.path));
              break;
            case "add_file":
              icon.addEventListener("click", () => createFile(item.path));
              break;
            case "delete":
              icon.addEventListener("click", () => deleteFileOrFolder(item));
              break;
            case "rename":
              icon.addEventListener("click", () => rename(item));
              break;
            case "info":
              icon.addEventListener("click", () => showInfo(item));
              break;
          }

          if (item.type === "file" && (icon.id === "add_folder" || icon.id === "add_file")) {
            icon.style.display = "none";
          } else {
            icon.style.display = "block";
          }
        });

        div.style.display = "block";
      } else {
        div.style.display = "none";
      }
    } catch (error) {
      console.error(error.message);
    }
  });
})();


const consoleTab = document.getElementById("consoleTab");

let logMessages = [];

function writeToConsole(message) {
    const logElement = document.createElement("p");
    logElement.style.padding = "10px";
    logElement.style.background = "#e58b6e";
    logElement.style.fontWeight = "bold";
    logElement.style.fontSize = "13px";
    logElement.innerText = message;
    consoleTab.appendChild(logElement);
    consoleTab.scrollTop = consoleTab.scrollHeight; // Automatically scroll to the latest log
    logMessages.push(message);
}

// Override console.log to capture log messages
const originalConsoleLog = console.log;
console.log = function () {
    const message = Array.from(arguments)
        .map(arg => JSON.stringify(arg))
        .join(" ");
    writeToConsole(message);
    originalConsoleLog.apply(console, arguments); // Call the original console.log
};

// Use the custom console
//console.log();

// Handle error logging
window.onerror = function (message, source, lineno, colno, error) {
    console.log(`Error: ${message}`);
};

consoleMod.subscribe((newValue, oldValue) => {
    const { results, isShow } = newValue;
    if (isShow) {
        if(consoleTab.style.bottom < "0") {
           consoleTab.style.bottom = `0`;
        }else {
           consoleTab.addEventListener("transitionend", () => {
             consoleTab.style.display = 'none'
           })
        }
        let error = "";
        results[0].messages.forEach(message => {
            error += message.message;
        });
        consoleTab.innerHTML = error;
    } else {
        consoleTab.style.bottom = `-310px`;
    }
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

state.on("showConsoleTab", payload => {
    consoleMod.setState({
        ...payload,
        isShow: true
    });
});

profile.addEventListener("click", () => {
    profile_dialog.classList.toggle("show_profile");
});

async function download(name) {
    //const progressBar = document.getElementById("progressBar");
    //progressBar.style.display = "block";

    try {
        const response = await fetch(`/download/${name}`);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const reader = response.body.getReader();
        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        controller.close();
                        break;
                    }
                    controller.enqueue(value);

                    // Calculate and update progress based on the amount read
                    //progressBar.value += value.length;
                }
            }
        });

        const blob = await new Response(stream).blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.zip`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error:", error);
    }
}
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

async function getProjects(starting = "") {
    try {
        const res = await fetch(`/projects`);
        const data = await res.json();
        state.emit("projects", data.projects);

        if (data.projects.length === 1) {
            activePro = data.projects[0].name;
            state.emit("activeProject", [data.projects[0]]);
        }
    } catch (e) {
        alert(e.message);
    }
}

async function rename(item) {
    console.log(item.modifiedAt);
}

async function showInfo(item) {
    console.log(item.size);
}

create_project_btn.addEventListener("click", async () => {
    const p = document.createElement("p");
    try {
        p.textContent = "Loading...";
        projectHierarchy.appendChild(p);
        const data = await req(`/create_project`, "POST", {
            project_name: project_input.value
        });
        if (data.success) {
            await getProjects();
            activePro = project_input.value;
            project_input.value = "";
            p.remove();
        } else {
            p.style.display = "none";
            alert(data.message);
        }
    } catch (e) {
        alert(e);
    }
});

getProjects("starting");

async function loadFile(path) {
    await sidebar.classList.remove("show_sidebar");
    await sidebar.classList.add("hide_sidebar");
    editor.innerHTML = "Loading...";
    const data = await req(`/loadFile`, "POST", {
        filepath: path
    });
    if (data.success) {
        const result = await hljs.highlight(language, data.file);
        editor.innerHTML = await result.value;
        code = result.code;
        currentCode = code;
    } else {
        alert("file loading failed");
    }
    syncColumnNumbers();
}

async function deleteFile(path) {
    try {
        const data = await req(`/deleteFile`, "DELETE", {
            filepath: path
        });
        if (data.success) {
            await getProjects();
            dialogMod.setState({ isShow: false });
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
            if (activePro === path) {
                state.emit("activeProject", []);
            }
            await getProjects();
            dialogMod.setState({ isShow: false });
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

save_btn.addEventListener("click", async () => {
    const data = await req("/update_file", "POST", {
        filepath: activeFile,
        content: currentCode
    });
    if (data.success) {
        await loadFile(activeFile);
    } else {
        alert("file saving failed");
    }
    code = currentCode;
});
format_btn.addEventListener("click", async () => {
    const data = await req("/format", "POST", {
        filepath: activeFile,
        content: currentCode
    });
    if (data.success) {
        await loadFile(activeFile);
    } else {
        alert("file formatting failed");
    }
});

run_btn.addEventListener("click", async () => {
    const data = await req("/run", "POST", {
        filepath: activeFile,
        content: currentCode
    });
    if (data.isError) {
        state.emit("showConsoleTab", { results: data.results });
    }
});

consoleTab.addEventListener("click", e => {
    e.stopPropagation();
});

container.addEventListener("click", () => {
    if (consoleMod.getState().isShow) {
        consoleMod.setState({ isShow: false });
        editor.blur();
    }
    editor.focus();
    profile_dialog.classList.remove("show_profile");
    sidebar.classList.remove("show_sidebar");
    sidebar.classList.add("hide_sidebar");
    if (dialogMod.getState().isShow) {
        dialogMod.setState({ isShow: false });
    }
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

function syncColumnNumbers(messages = null) {
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
})
