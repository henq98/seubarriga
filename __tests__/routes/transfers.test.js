const request = require('supertest');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transfers';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAwMDAsIm5hbWUiOiJVc2VyICMxIiwiZW1haWwiOiJ1c2VyMUBlbWFpbC5jb20ifQ.uWD9nlVO5CWR8A-Qm3RzsvPvQBhzsYQ5NyWTyX0PNLE';

beforeAll(async () => {
  // await app.db.migrate.rollback();
  // await app.db.migrate.latest();
  await app.db.seed.run();
});

test('to list only user transfers', () => request(app).get(MAIN_ROUTE)
  .set('authorization', `Bearer ${TOKEN}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toBe('Transfer #1');
  }));

test('to create a transfer', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `Bearer ${TOKEN}`)
  .send({
    description: 'Regular Transfer',
    user_id: 10000,
    acc_ori_id: 10000,
    acc_dest_id: 10001,
    amount: 100,
    date: new Date(),
  })
  .then(async (res) => {
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Regular Transfer');

    const transactions = await app.db('transactions').where({ transfer_id: res.body.id });
    expect(transactions).toHaveLength(2);
    expect(transactions[0].description).toBe('Transfer to acc #10001');
    expect(transactions[1].description).toBe('Transfer from acc #10000');
    expect(transactions[0].amount).toBe('-100.00');
    expect(transactions[1].amount).toBe('100.00');
    expect(transactions[0].acc_id).toBe(10000);
    expect(transactions[1].acc_id).toBe(10001);
  }));

describe('when creating a valid transfer', () => {
  let transferId;
  let inbound;
  let outbound;

  it('should return status code 201 and data from transfer', () => request(app).post(MAIN_ROUTE)
    .set('authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'Regular Transfer',
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      amount: 100,
      date: new Date(),
    })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Regular Transfer');
      transferId = res.body.id;
    }));

  it('should generate equivalent transactions', async () => {
    const transactions = await app.db('transactions')
      .where({ transfer_id: transferId })
      .orderBy('amount');

    expect(transactions).toHaveLength(2);
    [outbound, inbound] = transactions;
  });

  it('should both reference the transfer that originated them', () => {
    expect(inbound.transfer_id).toBe(transferId);
    expect(outbound.transfer_id).toBe(transferId);
  });

  it('outbound transaction must be negative', () => {
    expect(outbound.description).toBe('Transfer to acc #10001');
    expect(outbound.amount).toBe('-100.00');
    expect(outbound.acc_id).toBe(10000);
    expect(outbound.type).toBe('O');
  });

  it('inbound transaction must be positive', () => {
    expect(inbound.description).toBe('Transfer from acc #10000');
    expect(inbound.amount).toBe('100.00');
    expect(inbound.acc_id).toBe(10001);
    expect(inbound.type).toBe('I');
  });
});

describe('when creating an invalid transfer', () => {
  const template = (newData, errorMessage) => request(app).post(MAIN_ROUTE)
    .set('authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'this transfer gonna fail',
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      amount: 300,
      date: new Date(),
      ...newData,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  it('without description', () => template({ description: null }, 'Descrição é um atributo obrigatório'));
  it('without amount', () => template({ amount: null }, 'Valor é um atributo obrigatório'));
  it('without date', () => template({ date: null }, 'Data é um atributo obrigatório'));
  it('without an origin account', () => template({ acc_ori_id: null }, 'Conta de origem é obrigatória'));
  it('without a destination account', () => template({ acc_dest_id: null }, 'Conta de destino é obrigatória'));
  it('whose origin and destination is from the same account', () => template({ acc_dest_id: 10000 }, 'Conta de origem deve ser diferente da conta de destino'));
  it('whose account belongs to another user', () => template({ acc_ori_id: 10002 }, 'Conta de origem #10002 não pertence ao usuário'));
});

test('to return a transfer by ID', () => request(app).get(`${MAIN_ROUTE}/10000`)
  .set('authorization', `Bearer ${TOKEN}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Transfer #1');
  }));

describe('when updating a valid transfer', () => {
  let transferId;
  let inbound;
  let outbound;

  it('should return status code 201 and data from transfer', () => request(app).put(`${MAIN_ROUTE}/10000`)
    .set('authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'Transfer updated',
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      amount: 500,
      date: new Date(),
    })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Transfer updated');
      expect(res.body.amount).toBe('500.00');
      transferId = res.body.id;
    }));

  it('should generate equivalent transactions', async () => {
    const transactions = await app.db('transactions')
      .where({ transfer_id: transferId })
      .orderBy('amount');

    expect(transactions).toHaveLength(2);
    [outbound, inbound] = transactions;
  });

  it('should both reference the transfer that originated them', () => {
    expect(inbound.transfer_id).toBe(transferId);
    expect(outbound.transfer_id).toBe(transferId);
  });

  it('outbound transaction must be negative', () => {
    expect(outbound.description).toBe('Transfer to acc #10001');
    expect(outbound.amount).toBe('-500.00');
    expect(outbound.acc_id).toBe(10000);
    expect(outbound.type).toBe('O');
  });

  it('inbound transaction must be positive', () => {
    expect(inbound.description).toBe('Transfer from acc #10000');
    expect(inbound.amount).toBe('500.00');
    expect(inbound.acc_id).toBe(10001);
    expect(inbound.type).toBe('I');
  });
});

describe('when updating an invalid transfer', () => {
  const template = (newData, errorMessage) => request(app).put(`${MAIN_ROUTE}/10000`)
    .set('authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'this transfer gonna fail',
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      amount: 300,
      date: new Date(),
      ...newData,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  it('without description', () => template({ description: null }, 'Descrição é um atributo obrigatório'));
  it('without amount', () => template({ amount: null }, 'Valor é um atributo obrigatório'));
  it('without date', () => template({ date: null }, 'Data é um atributo obrigatório'));
  it('without an origin account', () => template({ acc_ori_id: null }, 'Conta de origem é obrigatória'));
  it('without a destination account', () => template({ acc_dest_id: null }, 'Conta de destino é obrigatória'));
  it('whose origin and destination is from the same account', () => template({ acc_dest_id: 10000 }, 'Conta de origem deve ser diferente da conta de destino'));
  it('whose account belongs to another user', () => template({ acc_ori_id: 10002 }, 'Conta de origem #10002 não pertence ao usuário'));
});

describe('when removing a transfer', () => {
  it('should return status code 204', () => request(app).delete(`${MAIN_ROUTE}/10000`)
    .set('authorization', `Bearer ${TOKEN}`)
    .then((res) => {
      expect(res.status).toBe(204);
    }));

  it('should have register removed from database', () => app.db('transfers').where({ id: 10000 })
    .then((result) => {
      expect(result).toHaveLength(0);
    }));

  it('should have associated transfers removed', () => app.db('transactions').where({ transfer_id: 10000 })
    .then((result) => {
      expect(result).toHaveLength(0);
    }));
});

test('to not return a transfer from another user', () => request(app).get(`${MAIN_ROUTE}/10001`)
  .set('authorization', `Bearer ${TOKEN}`)
  .then((res) => {
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Este recurso não pertence ao usuário');
  }));
