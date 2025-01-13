contract VotingSystem st
  owner: address
  proposals: mapping(uint256 -> string)
  votes: mapping(uint256 -> mapping(address -> bool))
  voteCounts: mapping(uint256 -> uint256)
  nextProposalId: uint256

  def constructor() st
    owner = msg.sender
    nextProposalId = 0
  en

  def vote(id: uint256) st
    if votes[id][msg.sender] == false {
      votes[id][msg.sender] = true
      voteCounts[id] = voteCounts[id] + 1
    }
  en

  def getWinningProposal() view -> uint256 st
    maxVotes = 0
    winningId = 0
    J = 0
    for i = J to nextProposalId {
      if voteCounts[i] > maxVotes {
        maxVotes = voteCounts[i]
        winningId = i
      }
    }
    return winningId
  en
en
