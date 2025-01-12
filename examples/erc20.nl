contract SimpleToken {
  owner: address;
  balances: mapping;
  totalSupply: uint256;

  def constructor() {
    onlyOwner
    # Set the contract owner and initialize total supply to 0
    owner = msg.sender;
    totalSupply = 0;
  }

  def mint(to: address, amount: uint256) {
    onlyOwner
    # Mint new tokens and add them to the user's balance
    balances[to] = balances[to] + amount;
    totalSupply = totalSupply + amount;
  }

  def transfer(to: address, amount: uint256) {
    payable
    # Ensure the sender has enough balance to transfer
    # if (balances[msg.sender] < amount) -> revert
    balances[msg.sender] = balances[msg.sender] - amount;
    balances[to] = balances[to] + amount;
  }

  def balanceOf(user: address) -> uint256 {
    view
    # Return the balance of a specific user
    return balances[user];
  }

  def getTotalSupply() -> uint256 {
    view
    # Return the total supply of tokens
    return totalSupply;
  }
}
