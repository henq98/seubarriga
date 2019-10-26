const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const findAll = (userId) => app.db('accounts').where({ user_id: userId });

  const find = (filter) => app.db('accounts').where(filter).first();

  const create = async (account) => {
    if (!account.name) throw new ValidationError('Nome é um atributo obrigatório');

    const accSaved = await find({ name: account.name, user_id: account.user_id });

    if (accSaved) throw new ValidationError('Já existe uma conta com esse nome');

    return app.db('accounts').insert(account, '*');
  };

  const update = (id, account) => app.db('accounts')
    .where({ id })
    .update(account, '*');

  const remove = (id) => app.db('accounts').where({ id }).del();

  return {
    create,
    findAll,
    find,
    update,
    remove,
  };
};
