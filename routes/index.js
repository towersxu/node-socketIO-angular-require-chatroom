var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/file-upload',function(req,res,next){
  //console.log(req.files);
  //res.render('index', { title: 'Express' });
  res.header("Access-Control-Allow-Origin","*");
  var form = new formidable.IncomingForm();
  form.uploadDir = 'public/upload/';
  form.keepExtensions = true;
  form.parse(req,function(err,fields,files){
    if(err){
      console.log("error");
      console.log(err);
      return;
    }
    //var extName = "png";
    //
    //var avatarName = Math.random() + '.' + extName;
    //var newPath = form.uploadDir + avatarName;

    console.log("======================file==================");
    console.log(fields);
    console.log(files);
    fields.filePath = "http://192.168.1.39:3000"+files.file.path.substring(6);
    fields.isSuccess = true;
    //fs.renameSync(files.file.path, newPath);  //重命名

    res.json(fields);
  });

});
module.exports = router;
