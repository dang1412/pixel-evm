// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract RTCConnect {
    event OfferConnect(address from, address indexed to, string cid);
    event AnswerConnect(address indexed from, address indexed to, string cid);

    constructor() {}

    function offerConnect(address to, string calldata cid) public {
        emit OfferConnect(msg.sender, to, cid);
    }

    function answerConnect(address to, string calldata cid) public {
        emit AnswerConnect(msg.sender, to, cid);
    }
}
