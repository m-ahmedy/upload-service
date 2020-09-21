
// Add module.exports = app in the end of the script
// Remove static serving of build folder
// Remove httpServer initialization


// const http = require("http");
const express = require("express");
const fileUpload = require("express-fileupload");
var app = express();
app.use(fileUpload());
var fs = require("fs");
// var httpServer = http.createServer(app);
const lineReader = require("line-reader");
const path = require("path");
const YamlValidator = require('yaml-validator');
const yaml = require('js-yaml');
var cors = require("cors");
app.use(cors());

/* 
app.use(express.static(path.join(path.resolve(__dirname), "build")));
app.get("/", function (req, res) {
  res.sendFile(path.join(path.resolve(__dirname), "build", "index.html"));
});
 */
//Posting the upload request
app.post("/upload", (req, res) => {

  if (req.files === null) {
    return res.json({ status: "Blank" })
  }
  const file = req.files.file;

  var yamlStr = Buffer(file.data).toString("utf-8")
  try {
    var doc = yaml.safeLoad(yamlStr);
    file.mv(`${path.resolve(__dirname)}/example-files/${file.name}`, (err) => {
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

});


// Remove httpServerInitialization
/*
httpServer.listen(process.env.port || 8000, () => {
  console.log("Communicating");
});
*/

app.get("/getconfig/:controller/:test/:protocol", async function (req, res) {
  var fieldObject = {};
  var parentObject = fieldObject;
  var curruntIndex = 0;
  var fileName =
    req.params.controller.toLowerCase() +
    "_" +
    req.params.test.toLowerCase() +
    "_" +
    req.params.protocol.toLowerCase() +
    "_uut.yaml-example";
  //console.log(fileName)
  lineReader.eachLine(
    path.resolve(__dirname) + "/example-files/" + fileName,
    function (line) {
      let lineObject = parseFeild(line);
      var comment = lineObject.comment;
      lineObject.comment = lineObject.comment.replace("MUST HAVE", "");
      try {
        if (lineObject.type != "Comment") {
          if (lineObject.isContainer == true) {
            if (curruntIndex < lineObject.index) {
              lineObject._parent = parentObject; //Set Parent object property to get parent
              //console.log(lineObject)
              parentObject[lineObject.name] = lineObject; //adding line object to parent object
              parentObject = parentObject[lineObject.name]; //Setting new parent Object
              curruntIndex = lineObject.index;
            } else if (curruntIndex == lineObject.index) {
              if (!(curruntIndex == 0)) {
                parentObject = parentObject._parent; // setting parent upward as object as sigling
              }
              lineObject._parent = parentObject; //setting parent of line object
              parentObject[lineObject.name] = lineObject; // adding lineobject to tree
              parentObject = parentObject[lineObject.name]; // setting currunt parent as line object
              curruntIndex = lineObject.index;
            } else if (curruntIndex > lineObject.index) {
              let step = (curruntIndex - lineObject.index) / 4;
              var index = 0;
              for (index; index < step + 1; index++) {
                parentObject = parentObject._parent; // setting parent upward as object as sibling
              }
              lineObject._parent = parentObject; //setting parent of line object
              parentObject[lineObject.name] = lineObject; // adding lineobject to tree
              parentObject = parentObject[lineObject.name]; // setting currunt parent as line object
              curruntIndex = lineObject.index;
            }
          } else {
            lineObject._parent = parentObject;
            parentObject[lineObject.name] = lineObject;
          }
        }
      } catch (e) {
        res.status(404).send("Error");
        console.log(e);
      }
    }, function finished(err) {
      if (err) {
        console.log(err)
        if (err.code === "ENOENT") {
          fieldObject.Error = "ENOENT";
          res.send(fieldObject);
        }
      } else {
        removeKeys(fieldObject, ["_parent"]);
        res.send(fieldObject);
      }
    }
  );
});

app.get("/getoptions", function (req, res) {
  var config = fs.readFileSync(path.resolve(__dirname) + "/Config/config.json");
  res.send(JSON.parse(config));
});

//This is YAML  Parser Implementation

function parseFeild(line) {
  let returnObj = { type: "Comment", comment: "" };

  //Checking Index to determine indent

  //checking type of line starting - List Item # comment A Field

  //Line Starting with - List Item container

  if (line.indexOf("NOT REQUIRED") == -1) {
    let index = line.search(/[a-z|\x2D|#|[]/i);
    returnObj.index = index;
    if (line.substring(index, index + 1) === "-") {
      returnObj.type = "listItem";
      returnObj.feildName = line.substring(line.indexOf("#") + 2);
      returnObj.name = line
        .substring(line.indexOf("#") + 2)
        .replace(/\s/g, "_");
      returnObj.comment = line.substring(line.indexOf("#") + 2);
      returnObj.isContainer = true;
    }
    //Line Starting wil # Only Comment add comment to ignore
    else if (line.substring(index, index + 1) === "#") {
      returnObj.type = "Comment";
    }
    else {
      // ==================================== Start with [ so ignore
      if (line.substring(index, index + 1) === "[") {
        returnObj.type = "Comment";
      } else {
        //============== Field ======================
        returnObj.type = "Field";
        //========= There is nothing after : and before # so its list container like PDU,CONTROLLER
        if (
          line
            .substring(
              line.indexOf(":") + 1,
              line.indexOf("#") == -1 ? line.indexOf(/\n/) : line.indexOf("#")
            )
            .trim() == ""
        ) {
          returnObj.isContainer = true;
          returnObj.feildName = line.substring(index, line.indexOf(":"));
          returnObj.name = line
            .substring(index, line.indexOf(":"))
            .replace(/\s/g, "_");
          returnObj.comment = line.substring(line.indexOf("#"));
        } else {
          returnObj.feildName = line.substring(index, line.indexOf(":"));
          returnObj.name = line
            .substring(index, line.indexOf(":"))
            .replace(/\s/g, "_");
          returnObj.comment = line.substring(line.indexOf("#"));
          returnObj.value = "";
        }

        if (returnObj.feildName == "ID") {
          returnObj.valueType = "DisplayOnly";
          returnObj.name = line
            .substring(index, line.indexOf(":"))
            .replace(/\s/g, "_");
          returnObj.comment = line.substring(line.indexOf("#"));
          returnObj.value = line
            .substring(
              line.indexOf(":") + 1,
              line.indexOf("#") == -1 ? line.indexOf(/\n/) : line.indexOf("#")
            )
            .trim();
        } else {
          returnObj.valueType = "value";
        }
      }
    }
  }
  return returnObj;
}
// Remove _parent so it can parse to json
function removeKeys(obj, keys) {
  var index;
  for (var prop in obj) {
    // important check that this is objects own property
    // not from prototype prop inherited
    if (obj.hasOwnProperty(prop)) {
      switch (typeof obj[prop]) {
        case "string":
          index = keys.indexOf(prop);
          if (index > -1) {
            delete obj[prop];
          }
          break;
        case "object":
          index = keys.indexOf(prop);
          if (index > -1) {
            delete obj[prop];
          } else {
            removeKeys(obj[prop], keys);
          }
          break;
      }
    }
  }
}

// Export the app
module.exports = app;