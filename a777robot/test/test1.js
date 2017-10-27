
const Q = require('q')

const allPlayerNum = 10
const player1 = {
    wolf:0,
    preditor:0
}

const player2 = {
    wolf:0,
    preditor:0
}


function applyPredictor(player) {

    player.preditor = 1 / allPlayerNum

}

//1. EveryOne have a chance of 1/num as Predictor, applying as Predictor gives no information
//2. One predict a Wolf, it has big chance a wolf
//3. One predict a non-wolf, it has big chance a wolf
//4.