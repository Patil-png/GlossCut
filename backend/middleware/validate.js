/**
 * Generic Validation Middleware
 * usage: app.post('/route', validate(schema), controller)
 */
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

module.exports = validate;
