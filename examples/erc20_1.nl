contract NLGToken {
  # State variables
  owner: address;
  totalSupply: uint256;
  balances: mapping;         # Maps address to balance;
  allowances: mapping;       # Nested mapping: allowances[owner][spender];

  name: string = "NLG";
  symbol: string = "N";
  decimals: uint256 = 18;

  def constructor() {
    onlyOwner;
    # Initialize the owner and total supply
    owner = msg.sender;
    totalSupply = 10000000 * (10 ** decimals);

    # Assign the total supply to the owner
    balances[owner] = totalSupply;
  }

  def transfer(to: address, amount: uint256) -> bool {
    payable;
    # Ensure the sender has enough balance
    if (balances[msg.sender] < amount) {
      revert;
    }

    # Perform the transfer
    balances[msg.sender] = balances[msg.sender] - amount;
    balances[to] = balances[to] + amount;

    return true;
  }

  def approve(spender: address, amount: uint256) -> bool {
    payable;
    # Approve the spender to spend the specified amount on behalf of msg.sender
    allowances[msg.sender][spender] = amount;

    return true;
  }

  def transferFrom(from: address, to: address, amount: uint256) -> bool {
    payable;
    # Ensure the spender is allowed to transfer the specified amount
    if (allowances[from][msg.sender] < amount || balances[from] < amount) {
      revert;
    }

    # Perform the transfer
    balances[from] = balances[from] - amount;
    balances[to] = balances[to] + amount;

    # Decrease the allowance
    allowances[from][msg.sender] = allowances[from][msg.sender] - amount;

    return true;
  }

  def balanceOf(account: address) -> uint256 {
    view;
    # Return the balance of the specified account
    return balances[account];
  }

  def allowance(owner: address, spender: address) -> uint256 {
    view;
    # Return the remaining allowance for the spender
    return allowances[owner][spender];
  }

  def getTotalSupply() -> uint256 {
    view;
    # Return the total supply of tokens
    return totalSupply;
  }
}
