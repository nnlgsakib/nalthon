contract ERC20 st
  # State variables
  name: string
  symbol: string
  decimals: uint256
  totalSupply: uint256

  balances: mapping(address -> uint256)
  allowances: mapping(address -> mapping(address -> uint256))

  # Constructor to initialize the token
  def constructor() st
    name = "MyToken"  # Hardcoded token name
    symbol = "MTK"    # Hardcoded token symbol
    decimals = 18     # Standard decimal places for ERC20
    totalSupply = 100000000000000000000000  # Hardcoded total supply
    balances[msg.sender] = totalSupply  # Allocate total supply to deployer
  en

  # Function to get the token name
  def getName() view -> string st
    return name
  en

  # Function to get the token symbol
  def getSymbol() view -> string st
    return symbol
  en

  # Function to get the token decimals
  def getDecimals() view -> uint256 st
    return decimals
  en

  # Function to get the token total supply
  def getTotalSupply() view -> uint256 st
    return totalSupply
  en

  # Function to get the balance of an address
  def balanceOf(account: address) view -> uint256 st
    return balances[account]
  en

  # Function to transfer tokens
  def transfer(to: address, amount: uint256) st
    if balances[msg.sender] >= amount {
      balances[msg.sender] = balances[msg.sender] - amount
      balances[to] = balances[to] + amount
    }
  en

  # Function to approve another address to spend tokens
  def approve(spender: address, amount: uint256) st
    allowances[msg.sender][spender] = amount
  en

  # Function to get the allowance for a spender
  def allowance(owner: address, spender: address) view -> uint256 st
    return allowances[owner][spender]
  en

  # Function to transfer tokens on behalf of another address
  def transferFrom(from: address, to: address, amount: uint256) st
    if balances[from] >= amount && allowances[from][msg.sender] >= amount {
      balances[from] = balances[from] - amount
      balances[to] = balances[to] + amount
      allowances[from][msg.sender] = allowances[from][msg.sender] - amount
    }
  en
en
