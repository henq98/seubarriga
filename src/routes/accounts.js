module.exports = (app) => {
  const create = (req, res, next) => app.services.accounts.create(req.body)
    .then((result) => res.status(201).json(result[0]))
    .catch((err) => next(err));

  const findAll = (req, res, next) => app.services.accounts.findAll()
    .then((result) => res.status(200).json(result))
    .catch((err) => next(err));

  const find = (req, res, next) => app.services.accounts.find({ id: req.params.id })
    .then((result) => res.status(200).json(result))
    .catch((err) => next(err));

  const update = (req, res, next) => app.services.accounts.update(req.params.id, req.body)
    .then((result) => res.status(200).json(result[0]))
    .catch((err) => next(err));

  const remove = (req, res, next) => app.services.accounts.remove(req.params.id)
    .then(() => res.status(204).send())
    .catch((err) => next(err));

  return {
    create,
    findAll,
    find,
    update,
    remove,
  };
};
