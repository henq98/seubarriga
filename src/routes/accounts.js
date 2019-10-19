module.exports = (app) => {
  const create = (req, res) => app.services.accounts.create(req.body)
    .then((result) => res.status(201).json(result[0]))
    .catch((err) => res.status(400).json({ error: err.message }));

  const findAll = (req, res) => app.services.accounts.findAll()
    .then((result) => res.status(200).json(result));

  const find = (req, res) => app.services.accounts.find({ id: req.params.id })
    .then((result) => res.status(200).json(result));

  const update = (req, res) => app.services.accounts.update(req.params.id, req.body)
    .then((result) => res.status(200).json(result[0]));

  const remove = (req, res) => app.services.accounts.remove(req.params.id)
    .then(() => res.status(204).send());

  return {
    create,
    findAll,
    find,
    update,
    remove,
  };
};
