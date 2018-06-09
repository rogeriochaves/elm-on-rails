const { JSDOM } = require("jsdom");
const { Script } = require("vm");
const fs = require("fs");
const { execSync } = require("child_process");
const Elm = fs.readFileSync(`${__dirname}/../out/elm.js`);
const ElmInterface = fs.readFileSync(`${__dirname}/elmInterface.js`);

const namedTransformation = (filePath, transformer) => name =>
  executeTransformation({
    transformer,
    code: fs.readFileSync(filePath).toString("utf-8"),
    args: { name }
  })
    .then(content => {
      fs.writeFileSync(filePath, content);
      try {
        execSync(`elm-format ${filePath} --yes`);
      } catch (err) {
        throw err.stderr.toString("utf-8");
      }
      console.log(`Updated ${filePath} file`);
    })
    .catch(err => console.error(err));

const executeTransformation = flags =>
  new Promise((resolve, reject) => {
    const dom = new JSDOM(`<!DOCTYPE html><html><head><body></body></html>`, {
      runScripts: "outside-only"
    });

    dom.window.flags = flags;
    dom.window.onSuccess = resolve;
    dom.window.onError = reject;

    const script = new Script(`
  ${Elm};
  ${ElmInterface};
`);
    dom.runVMScript(script);
  });

const addView = namedTransformation("src/View.elm", "VIEW");
const addRoute = namedTransformation("src/Router/Routes.elm", "ROUTE");

module.exports = { addRoute, addView };