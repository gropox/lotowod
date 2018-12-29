var global = require("basescript");

global.initApp("lotowod");
const CONFIG = global.CONFIG;

var log = global.getLogger("index");

var golos = require("./src/golos");
var Scanner = require("./src/scanner");

function makeAGuess() {
    let numbers = [];
    while(Object.keys(numbers).length < 5) {
        numbers[Math.floor(Math.random()*36)+1] = true;
    }
    return Object.keys(numbers).join(" ");        
    
}

async function run() {
    
    while(true) {
        try {

            let scanner = new Scanner.GolosLotoRoundStart();
            await golos.scanUserHistory("golos.loto", scanner, {"select_ops":["comment"]});
            if(scanner.comment) {
                log.info("found round start " + scanner.comment.permlink);

                const active_votes = await golos.getActiveVotes(scanner.comment);

                var users = Object.keys(CONFIG.users);
                
                for(let i = 0; i < users.length; i++) {
                    
                    let user = users[i];
                    let key = CONFIG.users[users[i]];

                    log.info("\nProcessing user " + user);

                    let already_voted = false;
                    for(let v of active_votes) {
                        //log.debug("voter", v)
                        if(v.voter == user) {
                            already_voted = true;
                            break;
                        }
                    }
                    if(!already_voted) {
                        log.info("not yet voted");
                        await golos.vote(user, key, scanner.comment.permlink);
                    } else {
                        log.info("already voted");
                    }
                    
                    const ticketScanner = new Scanner.GolosLotoRoundTicket(scanner.comment, user);
                    await golos.scanUserHistory("golos.loto", ticketScanner, {"select_ops":["comment"]});
                    
                    if(!ticketScanner.ticket) {
                        let guess = makeAGuess();
                        log.info("not yet guessed, but will " + guess);
                        await golos.comment(user, key, scanner.comment.permlink, guess);
                    } else {
                        log.info("already guessed");
                    }
                }
            }
        } catch(e) {
            log.error("Error catched in main loop!");
            log.error(e);
        }  

        await global.sleep(1000*60*30); //sleep 5 minutes   
    }
}

run();