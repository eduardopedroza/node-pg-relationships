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


describe("GET /", () => {
  test("List all companies with their invoices", async () => {
    const res = await request(app).get('/companies');
    expect(res.body).toEqual({
      "companies": [
        {
          "code": "apple",
          "name": "Apple", 
          "description": "Maker of OSX.",
          "invoices": [
            expect.any(Number), 
            expect.any(Number)
          ]
        },
        {
          "code": "ibm",
          "name": "IBM",
          "description": "Big blue.",
          "invoices": [
            expect.any(Number) 
          ]
        }
      ]
    });
  });
  
  test("Handle no companies found", async () => {
    await db.query(`DELETE FROM companies`);
    const res = await request(app).get('/companies');
    expect(res.statusCode).toBe(404);
  });
});


describe("GET /:code", () => {
  test("Retrieve a company by code", async () => {
    const res = await request(app).get('/companies/apple');
    expect(res.body).toEqual({ 
      "company": [
        {
          "code": "apple",
          "name": "Apple",
          "description": "Maker of OSX."
        }
      ]
    });
  });

  test("Handle company not found", async () => {
    const res = await request(app).get('/nonexistentcode');
    expect(res.statusCode).toBe(404);
  });
});


describe("POST /", () => {
  test("Create a new company", async () => {
    const newCompany = { 
      "code": "newcode", 
      "name": "New Company", 
      "description": "A new company" 
    };
    const res = await request(app).post('/companies').send(newCompany);
    expect(res.body).toEqual({
      "company": {
        "code": "newcode",
        "name": "New Company",
        "description": "A new company"
      }
    });
  });
});


describe("PUT /:code", () => {
  test("Update a company", async () => {
    const res = await request(app)
        .put(`/companies/apple`)
        .send({ 
          "name": "Apple Updated", 
          "description": "Updated Description"
        });

    expect(res.body).toEqual({
      "company": {
        "code": "apple",
        "name": "Apple Updated",
        "description": "Updated Description"
      }
    });
  });

  test("Handle company not found on update", async () => {
    const res = await request(app)
        .put('/companies/nonexistentcompany').
        send({ 
          "name": "Updated Name", 
          "description": "Updated Description"
        });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /:code", () => {
  test("Delete company", async function () {
    const res = await request(app)
        .delete('/companies/apple');

        expect(res.body).toEqual({
          "status": "deleted"
        });
  })

  test("Handle company not found on delete", async function () {
    const res = await request(app)
      .delete('/companies/nonexistencompany');

    expect(res.statusCode).toBe(404);
  })
})


