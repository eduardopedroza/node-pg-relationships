const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    if (results.rowCount === 0) throw new ExpressError(`No invoices found`, 404);
    return res.json({
      invoices: results.rows
    })
  } catch (e) {
    return next(e)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoiceQuery = `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description
                          FROM invoices i
                          JOIN companies c ON i.comp_code = c.code
                          WHERE i.id = $1`;
    const results = await db.query(invoiceQuery, [id]);
    if (results.rowCount === 0) throw new ExpressError(`Invoice with id ${id} not found`, 404);
    return res.json({
      invoice: results.rows[0]
    });
  } catch (e) {
    return next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const add_date = new Date(); 
    const invoiceQuery = `INSERT INTO invoices (comp_code, amt, add_date) 
                          VALUES ($1, $2, $3) 
                          RETURNING id, comp_code, amt, paid, add_date, paid_date`;
    const results = await db.query(invoiceQuery, [comp_code, amt, add_date]);
    return res.status(201).json({
      invoice: results.rows[0]
    });
  } catch (e) {
    return next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const results = await db.query(
      `UPDATE invoices SET amt=$1 WHERE id=$2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, id])
    if (results.rowCount === 0) throw new ExpressError(`Invoice with id ${id} not found`, 404);
    return res.json({
      invoice: results.rows[0]
    })
  } catch (e) {
    return next(e)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(`DELETE FROM invoices WHERE id=$1`, [id]);
    if (results.rowCount === 0) throw new ExpressError(`Invoice with id ${id} not found`, 404);
    return res.status(200).json({
      status: 'deleted'
    })
  } catch (e) {
    return next(e)
  }
})

module.exports = router;