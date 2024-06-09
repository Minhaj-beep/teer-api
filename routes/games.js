const express = require('express');
const router = express.Router();
const Games = require('../models/games');

// Helper function to generate ticket numbers
function generateTicketNumbers() {
    const numbers = [];
    for (let i = 0; i <= 99; i++) {
        numbers.push({
            number: i.toString().padStart(2, '0'),
            amount: 0
        });
    }
    return numbers;
}

// Helper function to get today's date at midnight for comparison
function getStartOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Get all games
router.get('/', async (req, res) => {
    try {
        const games = await Games.find();
        res.json(games.map(game => ({
            ...game.toObject(),
            totalAmount: game.totalAmount,
            lowestAmountNumber: game.lowestAmountNumber,
            highestAmountNumber: game.highestAmountNumber,
            totalGiveAway: game.totalGiveAway
        })));
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get one game
router.get('/:id', getGame, (req, res) => {
    res.json({
        ...res.game.toObject(),
        totalAmount: res.game.totalAmount,
        lowestAmountNumber: res.game.lowestAmountNumber,
        highestAmountNumber: res.game.highestAmountNumber,
        totalGiveAway: res.game.totalGiveAway
    });
});

// Create one game
router.post('/', async (req, res) => {
    const game = new Games({
        name: req.body.name,
        prize: req.body.prize,
        date: req.body.date,
        time: req.body.time,
        ticket: {
            numbers: generateTicketNumbers()
        }
    });

    try {
        const newGame = await game.save();
        res.status(201).json({
            ...newGame.toObject(),
            totalAmount: newGame.totalAmount,
            lowestAmountNumber: newGame.lowestAmountNumber,
            highestAmountNumber: newGame.highestAmountNumber,
            totalGiveAway: newGame.totalGiveAway
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

// Update one game
router.patch('/:id', getGame, async (req, res) => {
    if (req.body.name != null) {
        res.game.name = req.body.name;
    }
    if (req.body.prize != null) {
        res.game.prize = req.body.prize;
    }
    if (req.body.date != null) {
        res.game.date = req.body.date;
    }
    if (req.body.time != null) {
        res.game.time = req.body.time;
    }
    try {
        const updatedGame = await res.game.save();
        res.json({
            ...updatedGame.toObject(),
            totalAmount: updatedGame.totalAmount,
            lowestAmountNumber: updatedGame.lowestAmountNumber,
            highestAmountNumber: updatedGame.highestAmountNumber,
            totalGiveAway: updatedGame.totalGiveAway
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

// Delete one game
router.delete('/:id', getGame, async (req, res) => {
    try {
        await Games.deleteOne({ _id: res.game._id });
        res.json({ message: "Game Deleted." });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get ongoing games
router.get('/status/ongoing', async (req, res) => {
    const currentDate = getStartOfDay(new Date());
    try {
        const ongoingGames = await Games.find({ date: { $gte: currentDate } });
        res.json(ongoingGames.map(game => ({
            ...game.toObject(),
            totalAmount: game.totalAmount,
            lowestAmountNumber: game.lowestAmountNumber,
            highestAmountNumber: game.highestAmountNumber,
            totalGiveAway: game.totalGiveAway
        })));
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get past games
router.get('/status/past', async (req, res) => {
    const currentDate = getStartOfDay(new Date());
    try {
        const pastGames = await Games.find({ date: { $lt: currentDate } });
        res.json(pastGames.map(game => ({
            ...game.toObject(),
            totalAmount: game.totalAmount,
            lowestAmountNumber: game.lowestAmountNumber,
            highestAmountNumber: game.highestAmountNumber,
            totalGiveAway: game.totalGiveAway
        })));
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get today's games
router.get('/status/today', async (req, res) => {
    const currentDate = getStartOfDay(new Date());
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    try {
        const todayGames = await Games.find({ date: { $gte: currentDate, $lt: nextDay } });
        const data = todayGames.map(game => ({
            number: game.lowestAmountNumber,
            date: game.date,
            time: game.time,
            name: game.name
        }));
        res.json(data);
        // res.json(todayGames.map(game => ({
        //     ...game.toObject(),
        //     totalAmount: game.totalAmount,
        //     lowestAmountNumber: game.lowestAmountNumber,
        //     highestAmountNumber: game.highestAmountNumber,
        //     totalGiveAway: game.totalGiveAway
        // })));
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get total games and sales/profit
router.get('/count/total', async (req, res) => {
    try {
        const games = await Games.find();
        const totalGames = games.length;
        const totalSale = games.reduce((sum, game) => sum + game.totalAmount, 0);
        const totalGiveAway = games.reduce((sum, game) => sum + game.totalGiveAway, 0);
        const totalProfit = totalSale - totalGiveAway;

        res.json({ totalGames, totalSale, totalProfit, totalGiveAway });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Helper function to convert UTC date to IST
const toIST = (date) => {
    const offset = 5.5 * 60 * 60 * 1000; // IST offset is +5:30 from UTC
    return new Date(date.getTime() + offset);
};

// Update ticket amounts
router.patch('/:id/ticket', async (req, res) => {
    try {
        const game = await Games.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        // Combine game date and time into a single Date object in IST
        const gameDate = new Date(game.date);
        const [hours, minutes] = game.time.split(':').map(Number);
        gameDate.setUTCHours(hours - 5, minutes - 30, 0, 0); // Set hours and minutes in UTC

        // Convert game date to IST
        const gameTimeIST = toIST(gameDate);
        
        // Convert current server time to IST
        const currentTime = new Date();
        const currentTimeIST = toIST(currentTime);

        const fiveMinutesBeforeGameIST = new Date(gameTimeIST.getTime() - 5 * 60000);

        // Log times for debugging
        console.log("Game Time (IST):", gameTimeIST.toISOString());
        console.log("Current Time (IST):", currentTimeIST.toISOString());
        console.log("Five Minutes Before Game (IST):", fiveMinutesBeforeGameIST.toISOString());

        if (currentTimeIST >= fiveMinutesBeforeGameIST) {
            return res.status(403).send({message: 'Updates are not allowed within 5 minutes of the game time'});
        }

        const updates = req.body.numbers;  // Expect an array of { number, amount }
        updates.forEach(update => {
            const ticketNumber = game.ticket.numbers.find(n => n.number === update.number);
            if (ticketNumber) {
                ticketNumber.amount += update.amount;  // Add the new amount to the existing amount
            }
        });

        const updatedGame = await game.save();
        res.json({
            ...updatedGame.toObject(),
            totalAmount: updatedGame.totalAmount,
            lowestAmountNumber: updatedGame.lowestAmountNumber,
            highestAmountNumber: updatedGame.highestAmountNumber,
            totalGiveAway: updatedGame.totalGiveAway
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get lowestAmountNumber, date, and time from all past games
router.get('/past/lowest', async (req, res) => {
    const currentDate = getStartOfDay(new Date());
    try {
        // Find past games where the date is before today
        const pastGames = await Games.find({ date: { $lt: currentDate } });

        // Extract lowestAmountNumber, date, and time from each past game
        const data = pastGames.map(game => ({
            number: game.lowestAmountNumber,
            date: game.date,
            time: game.time,
            name: game.name
        }));

        res.json(data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Middleware to get a game by ID
async function getGame(req, res, next) {
    let game;
    try {
        game = await Games.findById(req.params.id);
        if (game == null) {
            return res.status(404).json({ message: "Game not found" });
        }
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
    res.game = game;
    next();
}

module.exports = router;
