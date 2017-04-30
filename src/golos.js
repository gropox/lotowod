var log = require("./logger").getLogger(__filename, 12);

var steem = require("steem");
var global = require("./global");
var Scanner = require("./scanner");

steem.config.set('websocket',global.settings.golos_websocket);
steem.config.set('address_prefix',"GLS");
steem.config.set('chain_id','782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12');

log.debug(steem.config.get('websocket'));

var lastRetrievedProps = 0;


var props = {};

/** holt properties */
async function retrieveDynGlobProps() {
    props = await steem.api.getDynamicGlobalPropertiesAsync();
}

/** time in milliseconds */
async function getCurrentServerTimeAndBlock() {
    await retrieveDynGlobProps();
    if(props.time) { 
        return {
            time : Date.parse(props.time), 
            block : props.head_block_number 
        };
    }
    throw "Current time could not be retrieved";
}

module.exports.getCurrentServerTimeAndBlock = getCurrentServerTimeAndBlock;

async function getContent(permlink) {
    log.debug("retrive content for user " + USERID + " " + permlink);
    var content = await steem.api.getContentAsync(USERID, permlink);
    if(permlink == content.permlink) {
        return content;
    } 
    return null;
}

module.exports.getContent = getContent;

async function vote(userid, key, author, permlink, weight) {
    await steem.broadcast.voteAsync(key, userid, author, permlink, weight * 100);
}

async function comment(userid, key, parent_author, parent_permlink, comment) {
    let permlink = "re-"+parent_author.replace(/\./g,"") 
        + "-" + parent_permlink + "-" 
        + new Date().toISOString().toLowerCase().replace(/[-.:]/g,"");
    
    await steem.broadcast.commentAsync(key, 
        parent_author, parent_permlink, 
        userid, permlink, "", comment,
        {
            tags: ["ru--lotereya"]
        });
}

module.exports.comment = comment;
module.exports.vote = vote;

async function scanUserHistory(userid, scanner) {

        //scan user history backwards, and collect transfers
        let start = -1;
        let count = 500;
        log.debug("scan history, userid = " + userid);
        while(start == -1 || start > 0) {
            log.debug("\n\n\nget history start = "+ start + ", count = " + count);
            let userHistory = await steem.api.getAccountHistoryAsync(userid, start, count);
            if(!(userHistory instanceof Array)) {
                log.error("not an array");
                return;
            }
            let firstReadId = userHistory[0][0];
            log.debug("first id = " + firstReadId);
            let terminate = false;
            for(let h = 0; h < userHistory.length; h++) {
                log.trace("check hist id " + userHistory[h][0] + " / " + userHistory[h][1].op[0]);
                if(scanner.process(userHistory[h])) {
                    if(!terminate) {
                        terminate = true;
                    }
                }
            }
            log.debug("terminate = " + terminate);
            if(terminate) {
                break;
            }
            start = firstReadId;
            count = (start > 500)?500:start;
        }
}

module.exports.scanUserHistory = scanUserHistory;


module.exports.getExceptionCause = function(e) {
    if(e.cause && e.cause.payload && e.cause.payload.error) {
        let m = e.cause.payload.error.message; 
        if(m) {
            let am = m.split("\n");
            m = am[0];
            for(let i = 1; i < am.length && i < 3; i++) {
                m += ": " + am[i];
            }
            return m;
        }
    }
    return e;
}
