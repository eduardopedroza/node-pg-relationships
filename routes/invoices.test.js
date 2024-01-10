process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

async function createData() {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
  await db.query("SELECT setval('invoices_id_seq', 1, false)");

  await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('apple', 'Apple', 'Maker of OSX.'),
                           ('ibm', 'IBM', 'Big blue.')`);

  const inv = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
           VALUES ('apple', 100, false, '2018-01-01', null),
                  ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                  ('ibm', 300, false, '2018-03-01', null)
           RETURNING id`);
}

beforeEach(createData);


afterAll(async () => {
  await db.end();
});




describe("GET /invoices", () => {
  test("List all invoices", async () => {
    const res = await request(app).get('/invoices');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          comp_code: expect.any(String),
          amt: expect.any(Number),
          paid: expect.any(Boolean),
          add_date: expect.any(String),
          paid_date: expect.any(String),
        }),
      ]),
    });
  });

  test("Handle no invoices found", async () => {
    await db.query(`DELETE FROM invoices`);
    const res = await request(app).get('/invoices');
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /invoices/:id", () => {
  test("Retrieve an invoice by id", async () => {
    const res = await request(app).get('/invoices/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: 1,
        code: "apple",
        name: "Apple",
        description: "Maker of OSX.",
        amt: 100,
        paid: false,
        add_date: "2017-12-31T23:00:00.000Z",
        paid_date: null,
      },
    });
  });
  

  test("Handle invoice not found", async () => {
    const res = await request(app).get('/invoices/99999'); 
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Create a new invoice", async () => {
    const newInvoice = { comp_code: 'apple', amt: 500 };
    const res = await request(app).post('/invoices').send(newInvoice);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: expect.objectContaining({
        id: expect.any(Number),
        comp_code: 'apple',
        amt: 500,
        paid: false, 
        add_date: expect.any(String),
        paid_date: null,
      }),
    });
  });
});

describe("PUT /invoices/:id", () => {
  test("Update an invoice", async () => {
    const updatedInvoice = { amt: 600 };
    const res = await request(app).put('/invoices/1').send(updatedInvoice); 
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: expect.objectContaining({
        id: 1,
        amt: 600,
      }),
    });
  });

  test("Handle invoice not found on update", async () => {
    const res = await request(app)
        .put('/invoices/99999')
        .send({
           amt: 600 
          });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Delete an invoice", async () => {
    const res = await request(app).delete('/invoices/1');
    expect(res.body).toEqual({
      status: 'deleted',
    });
  });

  test("Handle invoice not found on delete", async () => {
    const res = await request(app).delete('/invoices/99999'); 
    expect(res.statusCode).toBe(404);
  });
});
