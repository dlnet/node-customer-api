const { check, validationResult } = require('express-validator/check');
const util = require('util');
const uuidv4 = require('uuid/v4');
const debug = require('debug')('app:db');
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();

//const url = "mongodb://localhost:27017/bank";

const MongoClient = require('mongodb').MongoClient,format=require('util').format;

MongoClient.connect('mongodb://localhost:27017/bank', (err,db) => {
    if(err){
        throw err;
    } else {
        console.log("Connected");
    }
    db.close();
})


const salt = bcrypt.genSaltSync(10); // salt for password hash

const customers = [
    { id: uuidv4(), name: 'Default User', email: 'default@gmail.com', password: bcrypt.hashSync('testpass', salt) },
    { id: uuidv4(), name: 'Ben R', email: 'ben.r@gmail.com', password: bcrypt.hashSync('testpass', salt)}
]

router.get('/', (req, res) => {
    res.send(customers);
});

router.get('/:id', (req, res) => {
    const customer = customers.find(c => c.id === req.params.id);
    if (!customer) {
        return res.status(404).send('Customer with given ID not found');
    }
    debug(`Customer requested via id: ${customer.id}`);
    res.send(customer);
});

router.get('/:email', (req, res) => {
    const customer = customers.find(c => c.email === req.params.email);
    if (!customer) {
        return res.status(404).send('Customer with given email not found');
    }
    debug(`Customer requested via email: ${customer.email}`);
    res.send(customer);
});

router.post('/', [
        check('name').not().isEmpty(),
        check('email').isEmail(),
        check('password').isLength({ min: 5 })
    ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const customer = {
            id: uuidv4(),
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, salt)
        }

        customers.push(customer);
        let customerObj = util.inspect(customer, false, null, true);
        debug(`Customer added: ${customerObj}`);
        res.send(customer);
    }
);

router.put('/:id', [
    check('id').not().isEmpty()
    ], (req, res) => {
        // Look up customer by id, if not existing return 404
        const customer = customers.find(c => c.id === req.params.id);
        if (!customer) {
            return res.status(404).send('Customer with given id was not found');
        }
        // Validate, if invalid return 422 - Bad request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        // Update customer
        customer.email = req.body.email;
        debug(`Updated customer ${customer.id}'s email: ${customer.email} -> ${req.body.email}`)

        // Return updated customer
        res.send(customer);
    }
);

router.delete('/:id', (req, res) => {
    // Look up the customer, if not existing, return 404
    const customer = customers.find(c => c.id === req.params.id);
    if (!customer) {
        return res.status(404).send('The customer with the given id was not found.');
    }

    const index = customers.indexOf(customer); // Get customer index
    // Remove customer
    customers.splice(index, 1);
    debug(`Removed customer: ${customer.id} : ${customer.email}`);

    // Return the same customer
    res.send(customer);
});

module.exports = router;
