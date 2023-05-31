// SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.13;

// import "forge-std/Test.sol";
// import {Airdrop} from "../src/Airdrop.sol";
// import {BaseTest} from "./base/BaseTest.t.sol";

// contract AirdropTest is BaseTest {
//     Airdrop public airdrop;

//     function setUp() public {
//         airdrop = new Airdrop("My airdrop contract", "AIR");
//     }

//     function test_claimWithSismo() public {
//         bytes memory response = hex"your actual response data"; // Replace with actual response data from your app

//         // Call the airdrop contract with this address as the msg.sender to have a valid signature
//         vm.startPrank(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
//         airdrop.claimWithSismo(response);

//         // Test that if you call the contract a second time, it reverts
//         // Since the user has already claimed the token
//         vm.expectRevert("ERC721: token already minted");
//         airdrop.claimWithSismo(response);
//     }

//     function test_claimWithSismo_no_contributor_claim() public {
//         // In this test, we provide response data that doesn't contain a Sismo Contributor Claim
//         bytes memory response = hex"your actual response data"; // Replace with actual response data from your app
//         vm.startPrank(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        
//         // As there is no contributor claim, the user will only get tokens based on the other claims (if any)
//         // Expected amount of tokens is (result.claims.length - 1) * 100
//         // You will need to replace `expectedAmount` with the actual expected amount
//         uint256 expectedAmount = 100; 
//         airdrop.claimWithSismo(response);
//         assertEq(airdrop.balanceOf(0x70997970C51812dc3A010C7d01b50e0d17dc79C8), expectedAmount);
//     }

//     function test_claimWithSismo_invalid_response() public {
//         // In this test, we provide invalid response data
//         bytes memory response = hex"0000"; 
//         vm.startPrank(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);

//         // It should revert as the response data is not valid
//         vm.expectRevert("ERC721: token already minted"); // Replace with actual error message
//         airdrop.claimWithSismo(response);
//     }
// }