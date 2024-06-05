const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    numbers: [{
        number: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            default: 0
        }
    }]
});

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    prize: {
        type: Number,
        required: true,
        validate: {
            validator: function(value) {
                return value < 100;
            },
            message: props => `Prize must be less than 100!`
        }
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    ticket: {
        type: ticketSchema,
        required: true
    }
});

gameSchema.virtual('totalAmount').get(function() {
    return this.ticket.numbers.reduce((sum, number) => sum + number.amount, 0);
});

gameSchema.virtual('lowestAmountNumber').get(function() {
    return this.ticket.numbers.reduce((lowest, number) => {
        return number.amount < lowest.amount ? number : lowest;
    }, this.ticket.numbers[0]);
});

gameSchema.virtual('highestAmountNumber').get(function() {
    return this.ticket.numbers.reduce((highest, number) => {
        return number.amount > highest.amount ? number : highest;
    }, this.ticket.numbers[0]);
});

gameSchema.virtual('totalGiveAway').get(function() {
    const lowestAmountNumber = this.lowestAmountNumber;
    return lowestAmountNumber.amount * this.prize;
});

module.exports = mongoose.model('Games', gameSchema);
