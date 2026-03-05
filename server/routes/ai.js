/**
 * AI Product Assistant
 * POST /api/ai/product-question/:id  Body: { question: string }  Return: { answer: string }
 */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai');

router.post('/product-question/:id', aiController.postProductQuestion);

module.exports = router;
