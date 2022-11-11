const express = require("express");

const app = express();
const router = express.Router();

router.use(require("./health"));

// app.set("x-powered-by", false);
app.use(router);

// Establishing the port
const PORT = process.env.PORT || 5000;

app.start = function start() {
  app.listen(PORT, (err) => {
    if (err) {
      return err;
    }
    console.log(`App running on port : ${PORT}`); // eslint-disable-line no-console
    return 0;
  });
};

module.exports = app;
