const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clubSchema = new Schema({
    clubID: {
        type: Number,
        required: true
    },
    clubName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const Club = mongoose.model('Club', clubSchema);
module.exports = Club;
