const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const fs2 = require("fs");
const isAuth = require("../middlewares/auth.js");
const User = require("../models/User.js");
const prettier = require("prettier");
const { ESLint } = require("eslint");
const archiver = require("archiver");
//const userController = require("../controllers/userController.js");

// Create an instance of ESLint with the configuration passed to the function
function createESLintInstance(overrideConfig) {
    return new ESLint({
        useEslintrc: false,
        overrideConfig: overrideConfig
    });
}

// Lint the specified files and return the results
async function lintAndFix(eslint, code) {
    const results = await eslint.lintText(code, null);
    //const formatter = await eslint.loadFormatter();
    //const result = await formatter.format(results, null);
    await ESLint.outputFixes(results);
    return results;
}

// Log results to console if there are any problems
function outputLintingResults(results) {
    // Identify the number of problems found
    const problems = results.reduce(
        (acc, result) => acc + result.errorCount + result.warningCount,
        0
    );

    if (problems > 0) {
        console.log("Linting errors found!");
        return { results, isError: true };
    } else {
        console.log("No linting errors found.");
        return { results, isError: false };
    }
}

// Put previous functions all together
async function lintFiles(filePaths) {
    // The ESLint configuration. Alternatively, you could load the configuration
    // from a .eslintrc file or just use the default config.
    const overrideConfig = {
        env: {
            es6: true,
            node: true
        },
        parserOptions: {
            ecmaVersion: 2021
        },
        rules: {
            "no-unused-vars": "warn"
        }
    };

    const eslint = createESLintInstance(overrideConfig);
    const results = await lintAndFix(eslint, filePaths);
    return outputLintingResults(results);
}

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
        const keys = Object.keys(contents);
        const names = ["index", "style", "script"];
        let num = 0;
        for (const key of keys) {
            const fileName = `${names[num]}.${key}`;
            const filePath = path.join(dirPath, fileName);
            await fs.writeFile(filePath, contents[key]);
            num++;
        }
        console.log(`Directory and files created successfully.`);
    } catch (error) {
        console.error("Error creating directory and files:", error);
    }
}

router.post("/create_project", isAuth, async (req, res) => {
    const { project_name } = req.body;
    if (
        project_name.includes("/") ||
        project_name.includes(" ") ||
        project_name == ""
    ) {
        res.status(500).json({
            success: false,
            message: "use '_' instead space and '/' not allowed"
        });
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
        await createDirectoryAndFiles(
            `./users/${req.user.id}/${project_name}`,
            { html, css, js }
        );
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "something went wrong"
        });
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
    if (file_name.includes("/") || file_name.includes(" ")) {
        res.status(500).json({
            success: false,
            message: "use '_' instead space and '/' not allowed"
        });
        return;
    }
    const dirPath = path.join(__dirname, "../users", req.user.id, filepath);
    try {
        await fs.writeFile(
            path.join(dirPath, file_name),
            "// let's start coding"
        );
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
        console.log(content);
        res.status(500).json({ success: false });
    }
});

router.post("/format", isAuth, async (req, res) => {
    const { filepath, content } = req.body;
    const filePath = path.join(__dirname, "../users", req.user.id, filepath);
    try {
        const formatted = await prettier.format(content, {
            filepath: filePath
        });
        await fs.writeFile(filePath, formatted);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

router.post("/run", isAuth, async (req, res) => {
    const { filepath, content } = req.body;
    const filePath = path.join(__dirname, "../users", req.user.id, filepath);
    try {
        const { results, isError } = await lintFiles(content);
        res.status(200).json({ isError, results });
    } catch (e) {
        res.status(500).json({ isError: false });
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

const fs1 = require("fs");

// Function to collect file paths recursively
function getFilesRecursive(dir) {
    const files = fs1.readdirSync(dir);
    const filePaths = [];
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs1.statSync(filePath).isDirectory()) {
            filePaths.push(...getFilesRecursive(filePath));
        } else {
            filePaths.push(filePath);
        }
    }
    return filePaths;
}

router.get("/download/:projectName", isAuth, async (req, res) => {
    const sourceDirectory = `./users/${req.user.id}/${req.params.projectName}`; // Replace with the directory you want to zip
    const outputFilePath = `${sourceDirectory}/${req.params.projectName}.zip`; // Change this to your desired ZIP file name
    const archive = archiver("zip", {
        zlib: { level: 9 } // Optional: set compression level
    });

    const output = fs2.createWriteStream(outputFilePath);

    output.on("close", () => {
        console.log("Zip file created successfully");
        // Send the zip file to the client
        res.download(outputFilePath, `${req.params.projectName}.zip`);
    });

    archive.on("error", error => {
        throw error;
    });

    archive.pipe(output);

    async function addFilesToArchive(directoryPath, archive, prefix = "") {
        const files = await fs.readdir(directoryPath);
        files.forEach(async file => {
            const filePath = path.join(directoryPath, file);
            const archivePath = prefix ? path.join(prefix, file) : file;
            const stats = await fs.lstat(filePath)
            if (stats.isDirectory()) {
                // If it's a directory, recursively add its contents to the archive
                addFilesToArchive(filePath, archive, archivePath);
            } else {
                // If it's a file, add it to the archive
                archive.file(filePath, { name: archivePath });
            }
        });
    }

    // Start adding files from the source directory
    addFilesToArchive(sourceDirectory, archive);

    // Finalize the archive
    archive.finalize();
});

/*router.get("/download/:projectName", isAuth, async (req, res) => {
    const projectName = req.params.projectName || "project.zip"; // Get project name from query parameter or use 'default'
    const sourceDir = `./users/${req.user.id}/${projectName}`;
    try {
        const outputZip = `${projectName}.zip`;
        let archive = archiver("zip", {
            zlib: { level: 9 }
        });

        archive.on("warning", function (err) {
            if (err.code === "ENOENT") {
                console.warn(err);
            } else {
                throw err;
            }
        });

        archive.on("error", function (err) {
            throw err;
        });

        const filesToZip = getFilesRecursive(sourceDir);

        let totalSize;
        for (const file of filesToZip) {
            const stats = await fs.lstat(file);
            archive.file(file, { name: path.relative(sourceDir, file) });
            totalSize += stats.size;
        }

        const output = fs2.createWriteStream(outputZip);
        archive.pipe(output);
        // Send progress percentage as each file is added
        let currentSize = 0;
        archive.on("data", data => {
            currentSize += data.length;
            const progress = (currentSize / totalSize) * 100;
            res.write(`\nProgress: ${progress.toFixed(2)}%`);
        });

        archive.on("end", async () => {
            // Delete the temporary file when archiving is complete
            //await fs.unlink(outputZip);
        });
        archive.finalize();
        res.sendFile(sourceDir);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});*/

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
