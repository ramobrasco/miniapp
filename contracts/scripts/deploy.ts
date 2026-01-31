import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const AdviceVoting = await ethers.getContractFactory("AdviceVoting");
  const contract = await AdviceVoting.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("AdviceVoting deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
