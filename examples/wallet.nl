contract Wallet st
  # State variables
  owner: address
  balances: mapping(address -> uint256)

  # Constructor to initialize the wallet
  def constructor() st
    owner = msg.sender  # Set the deployer as the owner of the wallet
  en

  # Function to deposit Ether into the wallet
  def deposit() payable st
    balances[msg.sender] = balances[msg.sender] + msg.value
  en

  # Function to withdraw Ether from the wallet
  def withdraw(amount: uint256) st
    if msg.sender == owner && balances[msg.sender] >= amount {
      balances[msg.sender] = balances[msg.sender] - amount
      msg.sender.transfer(amount)
    }
  en

  # Function to get the balance of the wallet
  def getBalance() view -> uint256 st
    return balances[msg.sender]
  en

  # Function to transfer Ether to another address
  def transferEther(to: address, amount: uint256) st
    if balances[msg.sender] >= amount {
      balances[msg.sender] = balances[msg.sender] - amount
      balances[to] = balances[to] + amount
      to.transfer(amount)
    }
  en

  # Function to deposit ERC20 tokens into the wallet
  def depositToken(token: address, amount: uint256) st
    if token.transferFrom(msg.sender, address(this), amount) {
      balances[token] = balances[token] + amount
    }
  en

  # Function to withdraw ERC20 tokens from the wallet
  def withdrawToken(token: address, amount: uint256) st
    if balances[token] >= amount {
      balances[token] = balances[token] - amount
      token.transfer(msg.sender, amount)
    }
  en

  # Function to transfer ERC20 tokens to another address
  def transferToken(token: address, to: address, amount: uint256) st
    if balances[token] >= amount {
      balances[token] = balances[token] - amount
      token.transfer(to, amount)
    }
  en
en
