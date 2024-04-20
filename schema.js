const Joi = require('joi');
const review = require('./models/review');



module.exports.listingschema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        descrisption: Joi.string().required(),
        location: Joi.string().required(),
        Country: Joi.string().required(),
        price: Joi.number().required().min(0),
        // image:Joi.string().allow("", null)

    }).required(),
    
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),

});

