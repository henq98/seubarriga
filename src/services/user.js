const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const findAll = (filter = {}) => app.db('users').where(filter).select();

  const create = async (user) => {
    if (!user.name) throw new ValidationError('Nome é um atributo obrigatório');
    if (!user.email) throw new ValidationError('Email é um atributo obrigatório');
    if (!user.password) throw new ValidationError('Senha é um atributo obrigatório');

    const userSaved = await findAll({ email: user.email });

    if (userSaved && userSaved.length > 0) throw new ValidationError('Já existe um usuário com esse email');

    return app.db('users').insert(user, '*');
  };

  return { create, findAll };
};
