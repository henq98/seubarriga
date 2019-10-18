test('to know some main Jest assertions', () => {
  let number = null;
  expect(number).toBeNull();
  number = 10;
  expect(number).not.toBeNull();
  expect(number).toBe(10);
  expect(number).toEqual(10);
  expect(number).toBeGreaterThan(9);
  expect(number).toBeLessThan(11);
});

test('to know how to work with objects', () => {
  const obj = { name: 'John', email: 'john@email.com' };
  expect(obj).toHaveProperty('name');
  expect(obj).toHaveProperty('name', 'John');
  expect(obj.name).toBe('John');

  const obj2 = { name: 'John', email: 'john@email.com' };
  expect(obj).toEqual(obj2);
  expect(obj).not.toBe(obj2);
  expect(obj).toBe(obj);
});
