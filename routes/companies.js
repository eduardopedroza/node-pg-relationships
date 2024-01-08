const express = require('express');
const router = new express.router();
const ExpressError = require('../expressError');
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { code } = req.params;
    const companyResults = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
    if (companyResults.rowCount === 0) throw new ExpressError(`Company with code ${code} not found`, 404);
    const invoiceResults = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code]);
    const invoices = invoiceResults.rows.map(row => row.id);
    const company = companyResults.rows[0];
    company.invoices = invoices;
    return res.json({ company });
  } catch (e) {
    return next(e)
  }
})

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
    const { code, name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) 
      RETURNING code, name, description`, [code, name, description]);
    return res.status(201).json({
      company: results.rows[0]
    })
  } catch (e) {
    return next(e)
  }
})

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