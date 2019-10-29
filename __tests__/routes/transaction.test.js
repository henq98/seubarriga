const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transactions';
let user;
let user2;
let accUser;
let accUser2;

beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('accounts').del();
  await app.db('users').del();

  const users = await app.db('users').insert([
    { name: 'User #1', email: 'user@email.com', password: '$2a$10$6.jH9AuG2ghkszKF692cHOZCUXVxw0XQI3MUrUN9Qs2tq4cydjdZi' },
    { name: 'User #2', email: 'user2@email.com', password: '$2a$10$6.jH9AuG2ghkszKF692cHOZCUXVxw0XQI3MUrUN9Qs2tq4cydjdZi' },
  ], '*');

  [user, user2] = users;
  delete user.password;
  user.token = jwt.sign(user, process.env.JWT_SECRET);

  const accs = await app.db('accounts').insert([
    { name: 'Acc #1', user_id: user.id },
    { name: 'Acc #2', user_id: user2.id },
  ], '*');

  [accUser, accUser2] = accs;
});

test('to list only user transactions', () => app.db('transactions').insert([
  { description: 'T1', date: new Date(), amount: 100, type: 'I', acc_id: accUser.id },
  { description: 'T2', date: new Date(), amount: 300, type: 'O', acc_id: accUser2.id },
]).then(() => request(app).get(MAIN_ROUTE).set('authorization', `Bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toBe('T1');
  }));

test('to create a transaction', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `Bearer ${user.token}`)
  .send({ description: 'New T', date: new Date(), amount: 160, type: 'I', acc_id: accUser.id })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.amount).toBe('160.00');
  }));

it('onbound transaction must be positive', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `Bearer ${user.token}`)
  .send({ description: 'New T', date: new Date(), amount: -160, type: 'I', acc_id: accUser.id })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.amount).toBe('160.00');
  }));

it('outbound transaction must be negative', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `Bearer ${user.token}`)
  .send({ description: 'New T', date: new Date(), amount: 160, type: 'O', acc_id: accUser.id })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.amount).toBe('-160.00');
  }));

describe('invalid transaction creation', () => {
  const testTemplate = (newData, errorMessage) => request(app).post(MAIN_ROUTE)
    .set('authorization', `Bearer ${user.token}`)
    .send({
      description: 'New T',
      date: new Date(),
      amount: 160,
      type: 'I',
      acc_id: accUser.id,
      ...newData,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  test('without description property', () => testTemplate({ description: null }, 'Descrição é um atributo obrigatório'));
  test('without amount property', () => testTemplate({ amount: null }, 'Valor é um atributo obrigatório'));
  test('without date property', () => testTemplate({ date: null }, 'Data é um atributo obrigatório'));
  test('without acc_id property', () => testTemplate({ acc_id: null }, 'Conta é um atributo obrigatório'));
  test('without type property', () => testTemplate({ type: null }, 'Tipo é um atributo obrigatório'));
  test('with invalid type property', () => testTemplate({ type: 'A' }, 'Tipo inválido'));
});

test('to return a transaction by ID', () => app.db('transactions').insert({
  description: 'T ID',
  date: new Date(),
  amount: 160,
  type: 'I',
  acc_id: accUser.id,
}, ['id']).then((trans) => request(app).get(`${MAIN_ROUTE}/${trans[0].id}`)
  .set('authorization', `Bearer ${user.token}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(trans[0].id);
    expect(res.body.description).toBe('T ID');
  })));

test('to update a transaction', () => app.db('transactions').insert({
  description: 'T to update',
  date: new Date(),
  amount: 160,
  type: 'I',
  acc_id: accUser.id,
}, ['id']).then((trans) => request(app).put(`${MAIN_ROUTE}/${trans[0].id}`)
  .set('authorization', `Bearer ${user.token}`)
  .send({ description: 'T updated', amount: 300 })
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('T updated');
  })));

test('to remove a transaction', () => app.db('transactions').insert({
  description: 'T to remove',
  date: new Date(),
  amount: 100,
  type: 'I',
  acc_id: accUser.id,
}, ['id']).then((trans) => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
  .set('authorization', `Bearer ${user.token}`)
  .then((res) => {
    expect(res.status).toBe(204);
  })));

test('to not remove a transaction from another user', () => app.db('transactions').insert({
  description: 'T to remove',
  date: new Date(),
  amount: 100,
  type: 'I',
  acc_id: accUser2.id,
}, ['id']).then((trans) => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
  .set('authorization', `Bearer ${user.token}`)
  .then((res) => {
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Este recurso não pertence ao usuário');
  })));
