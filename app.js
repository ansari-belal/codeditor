const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');
const uuid = require('uuid');
dotenv.config()


const port = process.env.PORT || 3000;
const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    passphrase: "myssl"
};
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mydatabase',
  database: 'mydatabase',
});
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});


const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({message: "Authentication failed"});
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    req.user = decoded
    next()
  });
};


app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));
app.use(helmet(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self"],
        styleSrc: ["'self"]
      }
    })
  ))

app.get("/login", (req, res) => {
   res.sendFile("login.html", {root: "./public"})
})
app.get("/register", (req, res) => {
   res.sendFile("register.html", {root: "./public"})
})
app.get("/css/:filename", isAuthenticated, (req,res) => {
  if(fs.existsSync("./views/css/styles/" + req.params.filename)){
    res.sendFile(req.params.filename, {root: "./views/css/styles"})
    return 
  }
  res.send("not found")
})
app.get("/js/:filename", isAuthenticated, (req,res) => {
  if(fs.existsSync("./views/js/" + req.params.filename)){
   res.sendFile(req.params.filename, {root: "./views/js"})
   return
  }
  res.send("not found")
})
app.get("/editor", isAuthenticated, (req, res) => {
   res.sendFile("editor.html", {root: "./views"})
})

function readDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    const children = [];

    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      const isDirectory = stats.isDirectory();

      const child = {
        name: item,
        type: isDirectory ? 'folder' : 'file',
      };

      if (isDirectory) {
        child.children = readDirectory(itemPath);
      }

      children.push(child);
    });
    return children;
  }

app.get('/folders', isAuthenticated, (req, res) => {
  const directoryPath = './users/' + req.user.id; // Replace with the actual directory path
 
  try {
    const jsonData = {
      name: path.basename(directoryPath),
      type: 'folder',
      children: readDirectory(directoryPath),
    };
    res.json(jsonData);
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/create_project", isAuthenticated, (req, res) => {
   const { project_name } = req.body
   if(project_name.includes("jpg")){
     res.status(500).json({success: false})
     return
   }
   try {
     fs.mkdirSync(`./users/${req.user.id}/${project_name}`)
     res.status(201).json({success: true})
   } catch (e) {
     console.log(e)
     res.status(500).json({success: false})
   }
})

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) {
     res.json({isReg: false, message: "fill the inputs"})
     return
  }
  const saltRounds = 10;
  const id = uuid.v1()
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  db.query(
    'INSERT INTO users (user_id, email, password) VALUES (?, ?, ?)',
    [id, email, hashedPassword],
    (err, result) => {
      if (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ isReg: false, message: 'Registration failed' });
      } else {
        fs.mkdirSync(`./users/${id}`)
        res.json({ isReg: true, message: 'User registered successfully' });
      }
    }
  );
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) {
     res.json({isLoggedIn: false, message: "fill the inputs"})
     return
  }
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Error retrieving user:', err);
      res.status(500).json({isLoggedIn: false, message: 'Authentication failed' });
    } else if (results.length === 0) {
      res.status(401).json({isLoggedIn: false,  message: 'Authentication failed' });
    } else {
      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const token = jwt.sign({ id : user.user_id }, process.env.JWT_SECRET);
        res.cookie('token', token, { httpOnly: true, secure: true });
        res.status(200).json({ 
          isLoggedIn: true, 
          message: 'Login successful',
          username: user.email.split("@")[0],
          userId: user.user_id
        });
      } else {
        res.status(401).json({ isLoggedIn: false, message: 'Authentication failed' });
      }
    }
  });
});

function findAndDeleteFile(directoryPath, fileName) {
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      // If it's a directory, recursively search for the file
      findAndDeleteFile(filePath, fileName);
    } else if (file === fileName) {
      // If it's the file we're looking for, delete it
      fs.unlinkSync(filePath);
    }
  }
}

app.delete('/deleteFile', isAuthenticated, (req, res) => {
  const { file_name } = req.body; // Assuming directory and filename are sent in the request body
  const directoryPath = path.join(__dirname, "users", req.user.id);
  
  try {
    findAndDeleteFile(directoryPath, file_name);
    res.status(200).json({success: true })
  } catch (e) {}
    res.status(500).json({success: false })
});

function deleteFileRecursive(filePath) {
  if (fs.existsSync(filePath)) {
    if (fs.lstatSync(filePath).isDirectory()) {
      // If it's a directory, iterate through its contents
      const files = fs.readdirSync(filePath);
      for (const file of files) {
        const curPath = path.join(filePath, file);
        deleteFileRecursive(curPath); // Recursively delete files and subdirectories
      }
      fs.rmdirSync(filePath); // Finally, delete the empty directory
    } else {
      fs.unlinkSync(filePath); // If it's a file, delete it
    }
  }
}

app.delete('/deleteFolder', isAuthenticated, (req, res) => {
  const { file_name } = req.body; // Assuming directory and filename are sent in the request body
  const filePath = path.join(__dirname, 'users', req.user.id, file_name);
  try {
    deleteFileRecursive(filePath); // Delete the file and its subdirectories
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.post('/logout', isAuthenticated, (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

app.get("*", (req, res, next) => {
  res.status(404).sendFile("404.html", {root: "./views"});
});

const server = https.createServer(httpsOptions, app);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
