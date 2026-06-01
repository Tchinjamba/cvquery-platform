const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        format: {
            type: String,
            enum: ['text', 'html', 'latex', 'markdown'],
            default: 'text'
        },
        content: {
            type: String,
            required: true
        },
        description: {
            type: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);