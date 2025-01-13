contract CrowdFunding st
  # State variables
  owner: address
  goal: uint256
  totalFunds: uint256

  # Constructor to initialize the contract
  def constructor(initialOwner: address, fundingGoal: uint256) st
    owner = initialOwner
    goal = fundingGoal
    totalFunds = 0
  en

  # Function to contribute to the funding
  def contribute(amount: uint256) payable st
    totalFunds = totalFunds + amount
  en

  # Function to check if the funding goal is met
  def isGoalReached() view -> bool st
    return totalFunds >= goal
  en

  # Function to withdraw funds (onlyOwner)
  def withdraw() onlyOwner st
    if totalFunds < goal {
      return;
    }
    totalFunds = 0
  en
en
