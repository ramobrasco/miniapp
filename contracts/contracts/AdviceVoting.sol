// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Single contract for all questions. questionId matches offchain DB id.
 * One vote per wallet per question. Preset choices: Yes / No / Wait / Depends.
 */
contract AdviceVoting {
    enum Choice {
        Yes,
        No,
        Wait,
        Depends
    }

    // questionId => voter => choice (only meaningful if hasVoted is true)
    mapping(uint256 => mapping(address => Choice)) public votes;
    // questionId => voter => has voted (needed because enum default is Yes)
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    // questionId => choice => count
    mapping(uint256 => mapping(Choice => uint256)) public results;

    event VoteCast(uint256 indexed questionId, address indexed voter, Choice choice);

    /**
     * Vote for a question. One vote per wallet; later vote overwrites (change vote).
     */
    function vote(uint256 questionId, Choice choice) external {
        if (hasVoted[questionId][msg.sender]) {
            Choice previous = votes[questionId][msg.sender];
            results[questionId][previous] -= 1;
        } else {
            hasVoted[questionId][msg.sender] = true;
        }
        votes[questionId][msg.sender] = choice;
        results[questionId][choice] += 1;
        emit VoteCast(questionId, msg.sender, choice);
    }

    function getResults(uint256 questionId)
        external
        view
        returns (uint256 yesCount, uint256 noCount, uint256 waitCount, uint256 dependsCount)
    {
        return (
            results[questionId][Choice.Yes],
            results[questionId][Choice.No],
            results[questionId][Choice.Wait],
            results[questionId][Choice.Depends]
        );
    }

    function getChoice(uint256 questionId, address voter) external view returns (Choice) {
        return votes[questionId][voter];
    }
}
