exports.myMiddleware = (req, res, next) => {
    req.name = 'Wes';
    // if (req.name === 'Wes') {
    //   throw Error('That is a stupid name');
    // }
    next(); // pass off to the next piece of middle ware
}

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
}
