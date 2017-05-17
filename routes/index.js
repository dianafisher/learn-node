const express = require('express');
const router = express.Router();
// import our controller
const storeController = require('../controllers/storeController');
const { catchErrors } = require('../handlers/errorHandlers');  // object destructuring

// here we are using route-specific middleware
// router.get('/', storeController.myMiddleware, storeController.homePage);

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
router.post('/add', catchErrors(storeController.createStore));  // composition (wrapping a function in another function)

// router.get('/', (req, res) => {
//   const wes = { name: 'Wes', age: 100, cool: true };
//   // res.send('Hey! It works!');
//   // res.json(wes);
//
//   // get the data from the query string
//   // res.send(req.query.name);
//   // res.send(req.query);
//
//   // render out a template
//   res.render('hello', {
//     name: 'wes',
//     dog: req.query.dog,
//     title: 'I love food'
//   });
// });

// make a new endpoint to take in a name and reverse it
router.get('/reverse/:name', (req, res) => {
  // res.send('it works!');
  // res.send(req.params.name);
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);
});

module.exports = router;
