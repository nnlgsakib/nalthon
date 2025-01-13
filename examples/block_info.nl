# Simple Smart Contract to Retrieve Block Information

contract BlockInfo st
  # Function to get the current block number
  def getCurrentBlock() view -> uint256 st
    return block.number
  en

  # Function to get the current block hash
  def getBlockHash() view -> bytes32 st
    return block.hash
  en

  # Function to get the current block's coinbase address
  def getCoinbase() view -> address st
    return block.coinbase
  en

en
