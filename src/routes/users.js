module.exports = (app) => {
  const create = async (req, res) => {
    try {
      const result = await app.services.user.create(req.body);
      return res.status(201).json(result[0]);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  };

  const findAll = (req, res) => app.services.user.findAll()
    .then((result) => res.status(200).json(result));

  return { findAll, create };
};
