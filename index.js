#! /usr/bin/env node
"use strict";

var global = require("./src/global");
var debug = require("debug");
var dl = 0;

process.argv.forEach(function (val, index, array) {
    if("broadcast" == val) {
        global.settings.broadcast = true;
    } else if( "-v" == val) {
        dl = 1;
    } else if( "-vv" == val) {
        dl = 2;
    }
    
});

global.runtime.dl = dl;
require("./src/lotowod").run();


