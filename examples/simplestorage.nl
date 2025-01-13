# Simple Smart Contract Example: Storage and Addition

contract SimpleStorage st
  # State variable to store a number
  storedNumber: uint256

  # Constructor to initialize the stored number
  def constructor(initialValue: uint256) st
    storedNumber = initialValue
  en

  # Function to set a new value for storedNumber
  def setStoredNumber(newValue: uint256) st
    storedNumber = newValue
  en

  # Function to get the current stored value
  def getStoredNumber() view -> uint256 st
    return storedNumber
  en

  # Function to add two numbers and return the result
  def addNumbers(a: uint256, b: uint256) -> uint256 st
    return a + b
  en

en
