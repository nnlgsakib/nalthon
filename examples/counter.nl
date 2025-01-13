contract Counter st
  count: uint256  # Counter value

  def constructor() st
    count = 0  # Initialize counter to 0
  en

  def increment(by: uint256 = 1) st
    count = count + by
  en

  def getCount() -> uint256 st
    return count
  en
en
