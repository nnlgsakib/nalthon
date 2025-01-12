contract Crowdfunding {
  owner: address;
  goal: uint256;
  totalFunds: uint256;
  contributors: mapping; # Maps contributor addresses to their contribution amounts

  def constructor(goal: uint256) {
    onlyOwner
    # Set the contract owner and the funding goal
    owner = msg.sender;
    self.goal = goal;
    totalFunds = 0;
  }

  def contribute() {
    payable
    # Ensure the contribution is greater than 0
    # if (msg.value <= 0) -> revert

    # Add the contribution to the contributor's record and update total funds
    contributors[msg.sender] = contributors[msg.sender] + msg.value;
    totalFunds = totalFunds + msg.value;
  }

  def withdraw() {
    onlyOwner
    # Ensure the goal has been reached before withdrawing
    # if (totalFunds < goal) -> revert

    # Transfer the funds to the owner
    # owner.transfer(totalFunds)

    # Reset total funds (for potential reuse)
    totalFunds = 0;
  }

  def getContribution(user: address) -> uint256 {
    view
    # Return the contribution of a specific user
    return contributors[user];
  }

  def getTotalFunds() -> uint256 {
    view
    # Return the total funds collected
    return totalFunds;
  }

  def hasReachedGoal() -> bool {
    view
    # Return whether the goal has been reached
    return totalFunds >= goal;
  }
}
