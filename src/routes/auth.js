require('dotenv-safe').config();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = (app) => {
  const signin = (req, res, next) => {
    app.services.user.findOne({ email: req.body.email })
      .then((user) => {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
          };
          const token = jwt.sign(payload, process.env.JWT_SECRET);

          res.status(200).json({ token });
        }
      }).catch((err) => next(err));
  };

  return { signin };
};
