contract SubscriptionService st
  # State variables
  owner: address
  subscriptionFee: uint256
  activeSubscribers: mapping(address -> bool)
  subscriberCount: uint256

  # Constructor to initialize the service
  def constructor(initialFee: uint256) st
    owner = msg.sender
    subscriptionFee = initialFee
    subscriberCount = 0
  en

  # Function to subscribe to the service
  def subscribe() payable st
    if activeSubscribers[msg.sender] {
      revert("Already subscribed")
    }
    if msg.value != subscriptionFee {
      revert("Invalid subscription fee")
    }
    activeSubscribers[msg.sender] = true
    subscriberCount = subscriberCount + 1
  en

  # Function to unsubscribe from the service
  def unsubscribe() st
    if !activeSubscribers[msg.sender] {
      revert("Not subscribed")
    }
    activeSubscribers[msg.sender] = false
    subscriberCount = subscriberCount - 1
  en

  # Function to change the subscription fee (onlyOwner)
  def setSubscriptionFee(newFee: uint256) onlyOwner st
    subscriptionFee = newFee
  en

  # Function to withdraw funds (onlyOwner)
  def withdrawFunds() onlyOwner st
    owner.transfer(address(this).balance)
  en

  # Function to get the subscription status
  def isSubscribed(user: address) view -> bool st
    return activeSubscribers[user]
  en

  # Function to get the current subscription fee
  def getSubscriptionFee() view -> uint256 st
    return subscriptionFee
  en
en
