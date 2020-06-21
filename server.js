// server.js
const fs = require("fs");
const path = require("path");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults();

server.use(jsonServer.bodyParser);
server.use(middlewares);

// helpers
const getUsersDB = () => {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "users.json"), "UTF-8")
  );
};

const isAuthenticated = (email, password) => {
  return (
    getUsersDB().users.findIndex(
      (user) => user.email === email && user.password === password
    ) !== -1
  );
};

const isExist = (email) => {
  return getUsersDB().users.findIndex((user) => user.email === email) !== -1;
};

const secret = "akpitdx";
const expiresIn = "1h";
const createToken = (payload) => {
  return jwt.sign(payload, secret, { expiresIn });
};

// routes
server.post("/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (isAuthenticated(email, password)) {
      // get user data
      const user = getUsersDB().users.find(
        (user) => user.email === email && user.password === password
      );
      const { nickname, type } = user;
      // jwt
      const jwtoken = createToken({ nickname, email, type });
      return res.status(200).json({ jwtoken });
    } else {
      const status = 401;
      const message = "Incorrect email or password";
      return res.status(status).json({ status, message });
    }
    return res.status(200).json({ data: "success" });
  } catch (err) {
    console.error(err);
  }
});

// Register New User
server.post("/auth/register", (req, res) => {
  const { email, password, nickname, type } = req.body;

  // ----- 1 step
  if (isExist(email)) {
    const status = 401;
    const message = "Email already exist";
    return res.status(status).json({ status, message });
  }

  // ----- 2 step
  fs.readFile(path.join(__dirname, "users.json"), (err, _data) => {
    if (err) {
      const status = 401;
      const message = err;
      return res.status(status).json({ status, message });
    }
    // Get current users data
    const data = JSON.parse(_data.toString());
    // Get the id of last user
    const last_item_id = data.users[data.users.length - 1].id;
    //Add new user
    data.users.push({ id: last_item_id + 1, email, password, nickname, type }); //add some data
    fs.writeFile(
      path.join(__dirname, "users.json"),
      JSON.stringify(data),
      (err, result) => {
        // WRITE
        if (err) {
          const status = 401;
          const message = err;
          res.status(status).json({ status, message });
          return;
        }
      }
    );
  });

  // Create token for new user
  const jwToken = createToken({ nickname, type, email });
  res.status(200).json(jwToken);
});

server.use(router);

server.listen(3001, () => {
  console.log("JSON Server is running");
});
