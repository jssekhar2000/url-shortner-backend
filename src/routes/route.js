const express = require("express");
const router = express.Router();
const urlController = require("../controller/urlController")

// Api to create shortUrl
router.post("/url/shorten",urlController.shortenUrl)

//Api for fetching data
router.get("/:urlCode",urlController.getUrl)

// if api is invalid OR wrong URL
router.all("/*", function (req, res) {
    res
      .status(404)
      .send({ status: false, msg: "The api you requested is not available" });
  });
  
  module.exports = router;
  
