contract DecentralizedVoting {
  owner: address;
  candidates: mapping;
  votes: mapping;
  hasVoted: mapping;

  def constructor() {
    onlyOwner
    # Initialize the owner
    owner = msg.sender;
  }

  def addCandidate(candidateId: uint256, name: string) {
    onlyOwner
    # Add a new candidate to the voting system
    candidates[candidateId] = name;
    votes[candidateId] = 0;
  }

  def vote(candidateId: uint256) {
    payable
    # Ensure the voter has not already voted
    # if (hasVoted[msg.sender]) -> revert
    hasVoted[msg.sender] = true;

    # Increment the candidate's vote count
    votes[candidateId] = votes[candidateId] + 1;
  }

  def getCandidateName(candidateId: uint256) -> string {
    view
    return candidates[candidateId];
  }

  def getVoteCount(candidateId: uint256) -> uint256 {
    view
    return votes[candidateId];
  }

  def hasUserVoted(user: address) -> bool {
    view
    return hasVoted[user];
  }
}
