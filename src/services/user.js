module.exports = (app) => {
  const findAll = (filter = {}) => app.db('users').where(filter).select();

  const create = async (user) => {
    if (!user.name) return { error: 'Nome é um atributo obrigatório' };
    if (!user.email) return { error: 'Email é um atributo obrigatório' };
    if (!user.password) return { error: 'Senha é um atributo obrigatório' };

    const userSaved = await findAll({ email: user.email });

    if (userSaved && userSaved.length > 0) return { error: 'Já existe um usuário com esse email' };

    return app.db('users').insert(user, '*');
  };

  return { create, findAll };
};
