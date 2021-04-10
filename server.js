require('dotenv').config();
const express = require('express');

const app = express();
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, './public')));

app.get('/favicon.ico', (req, res) => res.sendStatus(204));

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use('/', (req, res, next) => {
  res.locals.siteName = 'Cocktail Drink Generator';
  next();
});

app.use((req, res, next) => {
  const err = new Error('Requested page could not be found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  console.error(err);
  const status = err.status || 500;
  res.locals.status = status;
  res.status(status);
  res.render('layout', { pageTitle: `Error ${status}`, template: 'error' });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
