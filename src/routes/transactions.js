const router = require('express').Router();

module.exports = (app) => {
  router.get('/', (req, res, next) => {
    app.services.transaction.find(req.user.id)
      .then((result) => res.status(200).json(result))
      .catch((err) => next(err));
  });

  return router;
};
