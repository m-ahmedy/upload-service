const fileUpload = require("express-fileupload");
var fs = require("fs");
const path = require('path')
const yaml = require('js-yaml');
var cors = require("cors");

const middleware = [fileUpload(), cors()];

const uploadHandler = (req, res) => {

  if (req.files === null) {
    return res.json({ status: "Blank" })
  }
  const file = req.files.file;

  var yamlStr = Buffer(file.data).toString("utf-8")
  try {
    var doc = yaml.safeLoad(yamlStr);
    file.mv(`${__dirname}/example-files/${file.name}`, (err) => {
      if (err) {
        return res.status(500).send(err);
      }

      // Validations starts here
      const fileNameValidator = `example-files/${file.name}`;
      const FileName = fileNameValidator.split("/")[1];
      var numUpper = (FileName.match(/[A-Z]/g) || []).length

      try {
        var validFile = true;
        var ymlAr = yamlStr.split("\n");
        for (var i = 0; i < ymlAr.length; i++) {
          if (!ymlAr[i].includes("#")) {
            if (ymlAr[i].trim().length) {
              validFile = false;
              break
            }
          }
        }

        console.log(validFile)
        if (validFile) {
          var config = JSON.parse(
            fs.readFileSync(`${path.resolve(__dirname)}/Config/config.json`)
          );
          const { controller, test, protocol } = req.body;
          const index = config.controllers.findIndex((c) => c.Name === req.body.controller.toLowerCase());
          if (controller.toLowerCase() === FileName.split("_")[0] && test.toLowerCase() === FileName.split("_")[1] && protocol.toLowerCase() === FileName.split("_")[2]) {
            if (index === -1) {
              config.controllers.push({
                Name: controller.toLowerCase(),
                Test: [test.toLowerCase()],
                Protocol: [protocol.toLowerCase()],
              });
            } else {
              // Check if test exists in Test array...
              if (!config.controllers[index].Test.includes(test.toLowerCase())) {
                config.controllers[index].Test.push(test);
              } else {
                // Check if protocol exists in Protocol array...
                if (!config.controllers[index].Protocol.includes(protocol)) {
                  config.controllers[index].Protocol.push(protocol);
                }
              }

            }
            fs.writeFileSync(
              `${path.resolve(__dirname)}/Config/config.json`,
              JSON.stringify(config)
            );
            console.log("Sending OK!")
            res.json({ status: "ok" });
            //Writing Config back to disk              
          }
          else {
            if (controller.toLowerCase() != FileName.split("_")[0]) {
              res.json({ status: "InvalidController" });
            }
            else if (test.toLowerCase() != FileName.split("_")[1]) {
              res.json({ status: "InvalidTest" });
            }
            else if (protocol.toLowerCase() != FileName.split("_")[2]) {
              res.json({ status: "InvalidProtocol" });
            }
            else if (numUpper != 0) {
              res.json({ status: "InvalidUpload" })
            }
          }
        }
        else if (ymlAr[i].trim().length == 0) {
          res.json({ status: "FileSpace" });
        }
        else {
          fs.unlinkSync(fileNameValidator);
          res.json({ status: "Invalid File" });
        }
      } catch (error) {
        console.log(error)
        res.json({ status: "Error" });
      }
    }
    );
  } catch (e) {
    console.log("Error! Invalid syntax")
    console.log(e);
    res.json({ status: "invalid", error: e });
  }
  // validation ends here

};

// defaults
module.exports = {
  middleware,
  uploadHandler
}