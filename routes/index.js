const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  const wes = { name: 'Wes', age: 100, cool: true };
  // res.send('Hey! It works!');
  // res.json(wes);

  // get the data from the query string
  // res.send(req.query.name);
  res.send(req.query);
});

// make a new endpoint to take in a name and reverse it
router.get('/reverse/:name', (req, res) => {
  // res.send('it works!');
  // res.send(req.params.name);
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);
});

module.exports = router;
