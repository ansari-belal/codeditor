const logout_btn = document.getElementById("logout_btn")
const name = document.getElementById("name")
const profile = document.getElementById("profile")
const profile_dialog = document.querySelector(".profile_dialog")
const project_input = document.querySelector("#project")
const create_project_btn = document.querySelector("#cr_pr_btn")
const projectHierarchy = document.querySelector("#projectsHierarchy")
name.innerText = localStorage.getItem("username")
logout_btn.addEventListener("click", async () => {
  const res = await fetch("/logout", {method: "post"})
  const data = await res.json()
  window.location.href = "/login"
})

profile.addEventListener("click", () => {
  profile_dialog.classList.toggle("show_profile")
})

const fileHierarchy = document.getElementById("fileHierarchy");

function projectsHierarchy(data){
  const ul = document.createElement("ul");
  data.children.forEach((item, index) => {
    const li = document.createElement("li");
    const div = document.createElement("div");
    const img2 = document.createElement("img");
    const span = document.createElement("span");
    const img = document.createElement("img");
    span.textContent = item.name;
    div.addEventListener("click", () => updateFileHierarchy(item))
    
    img.src = "/folder2.png"
    img2.src = "/dots.png"
    img2.addEventListener("click", () => deleteFolder(item.name))
    div.appendChild(img)
    div.appendChild(span)
    div.classList.add("folder")
    li.classList.add("file_li")
    li.appendChild(div)
    li.appendChild(img2)
    ul.appendChild(li)
  })
  return ul
}

async function getData(){
  const res = await fetch(`/folders`)
  const data = await res.json()
  const hierarchy = projectsHierarchy(data);
  projectHierarchy.innerHTML = ""
  projectHierarchy.appendChild(hierarchy);
}
getData()

const filesHierarchy = (data) => {
  const ul = document.createElement("ul")
  const li = document.createElement("li")
  if(data.type = "folder"){
     const folder = document.createElement("ul")
     const list = document.createElement("li")
     
     
     
     list.textContent = child.name
     folder.appendChild(list)
     li.appendChild(folder)
  }else {
    li.textContent = data.name
  }
  ul.appendChild(li)
  return ul
}

const updateFileHierarchy = (data) => {
  if(!data){
    fileHierarchy.innerHTML = "no active project"
    return 
  }
  hierarchy = filesHierarchy(data)
  fileHierarchy.innerHTML = ""
  fileHierarchy.appendChild(hierarchy)
}
updateFileHierarchy(null)

create_project_btn.addEventListener('click', async () => {
  const res = await fetch("/create_project", {
    method: "POST",
    body: JSON.stringify({project_name: project_input.value}),
    headers: {
      "Content-type": "application/json"
    }
  })
  const data = await res.json()
  await getData()
})


async function deleteFile(file_name) {
  try {
    const res = await fetch("/deleteFile", {
    method: "DELETE",
    body: JSON.stringify({file_name: file_name}),
    headers: {
      "Content-type": "application/json"
    }
  })
  const data = await res.json()
  getData()
  } catch (e) {
    alert(e)
  }
}
async function deleteFolder(file_name, index) {
  try {
    const res = await fetch("/deleteFolder", {
    method: "DELETE",
    body: JSON.stringify({file_name: file_name}),
    headers: {
      "Content-type": "application/json"
    }
  })
  const data = await res.json()
  getData()
  } catch (e) {
    alert(e)
  }
}


const pre = document.querySelector("pre");
const editor = document.querySelector("pre code");
const columnNumbers = document.getElementById("col_numbers");

const result = hljs.highlight("javascript", editor.textContent)
editor.innerHTML = result.value


editor.addEventListener('input', (e) => {
   const position = getCaretPosition()
   e.preventDefault()
   const result = hljs.highlight("javascript", editor.textContent)
   editor.innerHTML = result.value
   setCaretPosition(position)
   syncColumnNumbers();
});

function syncColumnNumbers() {
  const content = editor.textContent;
  let lines = content.split('\n');
  lines = lines.slice(0, lines.length > 1 ? lines.length - 1 : lines.length)
  columnNumbers.innerHTML = "";
  lines.forEach((line, index) => {
    const span = document.createElement("span")
    span.textContent = index + 1
    span.classList.add("num")
    columnNumbers.appendChild(span);
  })
}


function getCaretPosition() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editor);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const caretPosition = preCaretRange.toString().length;
      return caretPosition
  }
  return 0
}

function setCaretPosition(position) {
    // Create a range
    const range = document.createRange();
    const sel = window.getSelection();
    let currentNode = editor;
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
