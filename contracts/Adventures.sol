// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Adventures {
  // monster => position
  mapping(uint256 => uint32) public positions;
  // monster => point
  mapping(uint256 => uint256) public points;
  // position count
  mapping(uint32 => uint256) public positionCount;

  function move(uint256 id, uint32 pos) public {
    uint32 curPos = positions[id];

    // check distance

    // move
    positions[id] = pos;

    // update count
    positionCount[curPos]--;
    positionCount[pos]++;
  }

  function shoot(uint256 id, uint32 pos) public {
    uint32 curPos = positions[id];

    // check distance

    // point
    points[id] += positionCount[pos];
  }
}
