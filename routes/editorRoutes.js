const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const fs2 = require("fs");
const isAuth = require("../middlewares/auth.js");
const User = require("../models/User.js");
//const userController = require("../controllers/userController.js");

async function readDirectory(dir, basePath = "") {
    const files = await fs.readdir(dir);
    const result = [];

    for (const file of files) {
        const filePath = path.join(dir, file);
        const relativePath = path.join(basePath, file);

        const stats = await fs.stat(filePath);
        const isDirectory = await stats.isDirectory();

        const item = {
            name: file,
            type: isDirectory ? "folder" : "file",
            path: relativePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
        };

        if (isDirectory) {
            item.children = await readDirectory(filePath, relativePath);
        }
        result.push(item);
    }
    return result;
}


async function createDirectoryAndFiles(dirPath, contents) {
  try {
    await fs.mkdir(dirPath);
    const keys = Object.keys(contents)
    const names = ["index", "style", "script"]
    let num = 0;
    for (const key of keys) {
      const fileName = `${names[num]}.${key}`;
      const filePath = path.join(dirPath, fileName);
      await fs.writeFile(filePath, contents[key]);
      num++
    }
    console.log(`Directory and files created successfully.`);
  } catch (error) {
    console.error('Error creating directory and files:', error);
  }
}


router.get("/create_project/:project_name", isAuth, async (req, res) => {
    const { project_name } = req.params;
    if (project_name.includes("/") || project_name.includes(" ")) {
        res.status(500).json({ success: false });
        return;
    }
    const html = `<!DOCTYPE html>
<html>
 <head>
   <title>${project_name}</title>
   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
   <link rel="stylesheet" href="./style.css"/>
 </head>
 <body>
   <h2>${project_name}</h2>
   <script src="./script.js"></script>
 </body>
</html>
`;
    const css = `* {
  margin: 0; 
  padding: 0; 
  box-sizing: border-box;
}
h2 {
  color: green;
}
`;
    const js = `const name = "${project_name}"
console.log(name)
`;
    try {
        await createDirectoryAndFiles(`./users/${req.user.id}/${project_name}`, {html, css, js})
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

router.get("/projects", isAuth, async (req, res) => {
    try {
        const projects = await readDirectory(`./users/${req.user.id}`);
        res.status(200).json({ projects });
    } catch (error) {
        console.error("Error reading directory:", error);
        res.status(500).json({
            projects: [],
            message: "Internal Server Error"
        });
    }
});

router.post("/create_folder", isAuth, async (req, res) => {
    const { filepath, file_name } = req.body;
    if (file_name.includes("/")) {
        res.status(500).json({ success: false });
        return;
    }
    const dirPath = path.join(__dirname, "../users", req.user.id, filepath);
    try {
        await fs.mkdir(path.join(dirPath, file_name)); // Delete the file and its subdirectories
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});
router.post("/create_file", isAuth, async (req, res) => {
    const { filepath, file_name } = req.body;
    if (file_name.includes("/")) {
        res.status(500).json({ success: false });
        return;
    }
    const dirPath = path.join(__dirname, "../users", req.user.id, filepath);
    try {
        await fs.writeFile(
            path.join(dirPath, file_name),
            "// let's start coding"
        ); // Delete the file and its subdirectories
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

router.post("/update_file", isAuth, async (req, res) => {
    const { filepath, content } = req.body;
    const filePath = path.join(__dirname, "../users", req.user.id, filepath);
    try {
        await fs.writeFile(filePath, content);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

router.post("/loadFile", isAuth, async (req, res) => {
    const { filepath } = req.body; // Assuming directory and filename are sent in the request body
    const filePath = path.join(__dirname, "../users", req.user.id, filepath);
    try {
        const file = await fs.readFile(filePath, "utf8");
        res.status(200).json({ success: true, file });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

router.delete("/deleteFile", isAuth, async (req, res) => {
    const { filepath } = req.body; // Assuming directory and filename are sent in the request body
    const filePath = path.join(__dirname, "../users", req.user.id, filepath);

    try {
        await fs.unlink(filePath);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

async function deleteFileRecursive(filePath) {
    const stat = await fs.lstat(filePath);
    if (stat.isDirectory()) {
        // If it's a directory, iterate through its contents
        const files = await fs.readdir(filePath);
        for (const file of files) {
            const curPath = path.join(filePath, file);
            await deleteFileRecursive(curPath); // Recursively delete files and subdirectories
        }
        await fs.rmdir(filePath); // Finally, delete the empty directory
    } else {
        await fs.unlink(filePath); // If it's a file, delete it
    }
}

router.delete("/deleteFolder", isAuth, async (req, res) => {
    const { filepath } = req.body; // Assuming directory and filename are sent in the request params
    const filePath = path.join(__dirname, "../users", req.user.id, filepath);
    try {
        await deleteFileRecursive(filePath); // Delete the file and its subdirectories
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});
router.get("/css/:filename", isAuth, async (req, res) => {
    res.sendFile(req.params.filename, {
        root: path.join(__dirname, "../views/css/styles")
    });
});
router.get("/js/:filename", isAuth, async (req, res) => {
    res.sendFile(req.params.filename, {
        root: path.join(__dirname, "../views/js")
    });
});
router.get("/editor", isAuth, (req, res) => {
    res.sendFile("editor.html", { root: path.join(__dirname, "../views") });
});
module.exports = router;
