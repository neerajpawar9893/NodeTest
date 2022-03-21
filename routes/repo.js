let express = require("express");
let repoController = require("../controllers/repoController")
let  router = express.Router();

router.post("/getRepos",repoController.getRepos);
router.post("/getReposDetails",repoController.getReposDetails);


module.exports = router;