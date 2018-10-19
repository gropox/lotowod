const global = require("basescript");
const log = global.getLogger("golos");
const CONFIG = global.CONFIG;

const golosjs = require("golos-js");

if(CONFIG.ws) {
    golosjs.config.set("websocket", CONFIG.ws);
}

const HIST_BLOCK = 10000;

async function scanUserHistory(userid, scanner, filter) {

    let start = -1;
    let count = HIST_BLOCK;
    while (start === -1 || start > 0) {
        log.debug("get history", start, count);
        let userHistory = await golosjs.api.getAccountHistoryAsync(userid, start, count, filter);
        if (!(userHistory instanceof Array)) {
            return;
        }

        if (userHistory.length == 0) {
            return;
        }
        let firstReadId = userHistory[0][0];
        let terminate = false;
        for (let h = 0; h < userHistory.length; h++) {
            if (scanner.process(userHistory[h])) {
                if (!terminate) {
                    terminate = true;
                }
            }
        }
        start = firstReadId - 1;
        if (terminate || start <= 0) {
            break;
        }
        count = (start > HIST_BLOCK) ? HIST_BLOCK : start;
    }
}

module.exports.vote = async (voter, key, permlink) => {
    await golosjs.broadcast.voteAsync(key, voter, "golos.loto", permlink, 10000);
}

module.exports.comment = async (author, key, parent_permlink, body) => {
    let permlink = "re-golos-loto-" + parent_permlink + "-" 
        + new Date().toISOString().toLowerCase().replace(/[-.:]/g,"");
    
    await golosjs.broadcast.commentAsync(key, 
        "golos.loto", parent_permlink, 
        author, permlink, "", body,
        {
            tags: ["ru--lotereya"]
        });
}

module.exports.getActiveVotes = async (comment) => {
    return golosjs.api.getActiveVotesAsync(comment.author, comment.permlink, -1);
}

module.exports.scanUserHistory = scanUserHistory;