var log = require("./logger").getLogger(__filename, 12);
var global = require("./global");

class Scanner {

    constructor(round) {
        this.round = round;
    }
    
    process(historyEntry) {
        throw "not implemented";
    }    
}

class GolosLotoRoundStart extends Scanner {
    
    constructor() {
        super(null);
        this.comment = null;  
    }
    
    process(historyEntry) {
        if(historyEntry[1].op[0] == "comment" && 
            historyEntry[1].op[1].parent_author == "") {
            log.debug("found possible round start " + historyEntry[1].op[1].permlink);
            if(historyEntry[1].op[1].permlink.startsWith("5x36-golos-lottery")) {
                log.debug("found round start");
                this.comment = historyEntry[1].op[1];
            }
        }
        return (this.comment != null);
    }    
}

class GolosLotoRoundVote extends Scanner {
    
    constructor(comment, userid) {
        super(null);
        this.comment = comment;
        this.vote = null;
        this.userid = userid;
    }
    
    process(historyEntry) {
        if(historyEntry[1].op[0] == "vote" && 
            historyEntry[1].op[1].voter == this.userid &&
            historyEntry[1].op[1].permlink == this.comment.permlink) {
                log.debug("found vote " + historyEntry[1].op[1].permlink);
                this.vote = historyEntry[1].op[1];
        }

        return (this.vote != null
            || historyEntry[1].op[0] == "comment" && 
                historyEntry[1].op[1].parent_author == "" &&
                historyEntry[1].op[1].permlink == this.comment.permlink);
    }
}

class GolosLotoRoundTicket extends Scanner {
    
    constructor(comment, userid) {
        super(null);
        this.comment = comment;
        this.ticket = null;
        this.userid = userid;
    }
    
    process(historyEntry) {
        if(historyEntry[1].op[0] == "comment" && 
            historyEntry[1].op[1].author == this.userid &&
            historyEntry[1].op[1].parent_permlink == this.comment.permlink) {
                log.debug("found ticket " + historyEntry[1].op[1].permlink);
                this.ticket = historyEntry[1].op[1];
        }
        return (this.ticket != null
            || historyEntry[1].op[0] == "comment" && 
                historyEntry[1].op[1].parent_author == "" &&
                historyEntry[1].op[1].permlink == this.comment.permlink);
    }    
}



module.exports.GolosLotoRoundStart = GolosLotoRoundStart;
module.exports.GolosLotoRoundVote = GolosLotoRoundVote;
module.exports.GolosLotoRoundTicket = GolosLotoRoundTicket;

