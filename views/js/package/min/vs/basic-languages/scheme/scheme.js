"use strict";/*!-----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Version: 0.43.0(94c055bcbdd49f04a0fa15515e848542a79fb948)
 * Released under the MIT license
 * https://github.com/microsoft/monaco-editor/blob/main/LICENSE.txt
 *-----------------------------------------------------------------------------*/
define("vs/basic-languages/scheme/scheme", ["require","require"],(require)=>{
var moduleExports=(()=>{var s=Object.defineProperty;var r=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var c=(o,e)=>{for(var t in e)s(o,t,{get:e[t],enumerable:!0})},m=(o,e,t,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of i(e))!l.call(o,n)&&n!==t&&s(o,n,{get:()=>e[n],enumerable:!(a=r(e,n))||a.enumerable});return o};var p=o=>m(s({},"__esModule",{value:!0}),o);var u={};c(u,{conf:()=>d,language:()=>g});var d={comments:{lineComment:";",blockComment:["#|","|#"]},brackets:[["(",")"],["{","}"],["[","]"]],autoClosingPairs:[{open:"{",close:"}"},{open:"[",close:"]"},{open:"(",close:")"},{open:'"',close:'"'}],surroundingPairs:[{open:"{",close:"}"},{open:"[",close:"]"},{open:"(",close:")"},{open:'"',close:'"'}]},g={defaultToken:"",ignoreCase:!0,tokenPostfix:".scheme",brackets:[{open:"(",close:")",token:"delimiter.parenthesis"},{open:"{",close:"}",token:"delimiter.curly"},{open:"[",close:"]",token:"delimiter.square"}],keywords:["case","do","let","loop","if","else","when","cons","car","cdr","cond","lambda","lambda*","syntax-rules","format","set!","quote","eval","append","list","list?","member?","load"],constants:["#t","#f"],operators:["eq?","eqv?","equal?","and","or","not","null?"],tokenizer:{root:[[/#[xXoObB][0-9a-fA-F]+/,"number.hex"],[/[+-]?\d+(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?/,"number.float"],[/(?:\b(?:(define|define-syntax|define-macro))\b)(\s+)((?:\w|\-|\!|\?)*)/,["keyword","white","variable"]],{include:"@whitespace"},{include:"@strings"},[/[a-zA-Z_#][a-zA-Z0-9_\-\?\!\*]*/,{cases:{"@keywords":"keyword","@constants":"constant","@operators":"operators","@default":"identifier"}}]],comment:[[/[^\|#]+/,"comment"],[/#\|/,"comment","@push"],[/\|#/,"comment","@pop"],[/[\|#]/,"comment"]],whitespace:[[/[ \t\r\n]+/,"white"],[/#\|/,"comment","@comment"],[/;.*$/,"comment"]],strings:[[/"$/,"string","@popall"],[/"(?=.)/,"string","@multiLineString"]],multiLineString:[[/[^\\"]+$/,"string","@popall"],[/[^\\"]+/,"string"],[/\\./,"string.escape"],[/"/,"string","@popall"],[/\\$/,"string"]]}};return p(u);})();
return moduleExports;
});
