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
  { description: 'T1', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id },
  { description: 'T2', date: new Date(), ammount: 300, type: 'O', acc_id: accUser2.id },
]).then(() => request(app).get(MAIN_ROUTE).set('authorization', `Bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toBe('T1');
  }));
