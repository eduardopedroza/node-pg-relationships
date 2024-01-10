const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const ExpressError = require('../expressError');
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const companyResults = await db.query(`SELECT * FROM companies`);
    if (companyResults.rowCount === 0) throw new ExpressError(`Companies not found`, 404);
    for (let company of companyResults.rows) {
      const invoiceResults = await db.query(
        `SELECT id FROM invoices WHERE comp_code = $1`, 
        [company.code]
      );
      company.invoices = invoiceResults.rows.map(row => row.id);
    }
    return res.json({ companies: companyResults.rows });
  } catch (e) {
    return next(e);
  }
});


router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
    if (results.rowCount === 0) throw new ExpressError(`Company with code ${code} not found`, 404);
    return res.json({
      company: results.rows
    })
  } catch (e) {
    return next(e)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const code = slugify(name, { lower: true, strict: true });

    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) 
      RETURNING code, name, description`, 
      [code, name, description]
    );

    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3
      RETURNING code, name, description`, [name, description, code]);
    if (results.rowCount === 0) throw new ExpressError(`Company with code ${code} not found`, 404);
    return res.json({
      company: results.rows[0]
    });
  } catch (e) {
    return next(e);
  }
});

router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(`DELETE FROM companies WHERE code=$1`, [code]);
    if (results.rowCount === 0) throw new ExpressError(`Company with code ${code} not found`, 404);
    return res.status(200).json({
      status: 'deleted'
    });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;