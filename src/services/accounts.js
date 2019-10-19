const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const findAll = () => app.db('users');

  const find = (filter) => app.db('accounts').where(filter).first();

  const create = async (account) => {
    if (!account.name) throw new ValidationError('Nome é um atributo obrigatório');

    return app.db('accounts').insert(account, '*');
  };

  const update = (id, account) => app.db('accounts').where({ id }).update(account, '*');

  const remove = (id) => app.db('accounts').where({ id }).del();

  return {
    create,
    findAll,
    find,
    update,
    remove,
  };
};
