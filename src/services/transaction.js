module.exports = (app) => {
  const find = (userId, filter = {}) => app.db('transactions')
    .join('accounts', 'accounts.id', 'acc_id')
    .where(filter)
    .andWhere('accounts.user_id', '=', userId)
    .select();

  const findOne = (filter) => app.db('transactions').where(filter).first();

  const create = (transaction) => app.db('transactions').insert(transaction, '*');

  const update = (id, transaction) => app.db('transactions')
    .where({ id })
    .update(transaction, '*');

  const remove = (id) => app.db('transactions').where({ id }).del();

  return { find, findOne, create, update, remove };
};
