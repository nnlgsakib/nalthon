contract SimpleWallet {
  owner: address;
  balances: mapping;

  def constructor() {
    onlyOwner
    # Set the contract owner
    owner = msg.sender;
  }

  def deposit() {
    payable
    # Deposit ETH into the wallet
    balances[msg.sender] = balances[msg.sender] + msg.value;
  }

  def withdraw(amount: uint256) {
    payable
    # Ensure the sender has enough balance to withdraw
    # if (balances[msg.sender] < amount) -> revert
    balances[msg.sender] = balances[msg.sender] - amount;

    # Transfer ETH to the sender
    # msg.sender.transfer(amount)
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
}
