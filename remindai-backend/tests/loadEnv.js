const path = require("path");
process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.resolve(__dirname, "../.env.test") });
