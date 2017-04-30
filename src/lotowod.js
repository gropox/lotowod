var global = require("./global");
var log = require("./logger").getLogger(__filename);
var golos = require("./golos");
var Scanner = require("./scanner");

function makeAGuess() {
    let numbers = [];
    while(Object.keys(numbers).length < 5) {
        numbers[Math.floor(Math.random()*36)+1] = true;
    }
    return Object.keys(numbers).join(" ");        
    
}

module.exports.run = async function() {
    
    while(true) {
        try {

            let scanner = new Scanner.GolosLotoRoundStart();
            
            await golos.scanUserHistory("golos.loto", scanner);
            if(scanner.comment) {
                log.info("found round start " + scanner.comment.permlink);
                
                var users = Object.keys(global.settings.users);
                
                for(let i = 0; i < users.length; i++) {
                    
                    let user = users[i];
                    let key = global.settings.users[users[i]];

                    log.info("\nProcessing user " + user);

                    
                    let voteScanner = new Scanner.GolosLotoRoundVote(scanner.comment, user); 
                    let ticketScanner = new Scanner.GolosLotoRoundTicket(scanner.comment, user);
                    
                    await golos.scanUserHistory("golos.loto", voteScanner);
                    await golos.scanUserHistory("golos.loto", ticketScanner);
                    
                    if(!voteScanner.vote) {
                       log.info("not yet voted");
                       await golos.vote(user, key, "golos.loto", scanner.comment.permlink, 100);
                    }
                    
                    if(!ticketScanner.ticket) {
                        let guess = makeAGuess();
                        log.info("not yet guessed, but will " + guess);
                        await golos.comment(user, key, scanner.comment.author,  scanner.comment.permlink, guess);
                    }       
                }
            }
        } catch(e) {
            log.error("Error catched in main loop!");
            log.error(golos.getExceptionCause(e));
        }  

        await sleep(1000*61*10); //sleep 5 minutes   
    }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
