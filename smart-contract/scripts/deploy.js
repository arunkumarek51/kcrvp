const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying KCRVP Carbon Registry with:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");

  const KCRVPCarbonRegistry = await ethers.getContractFactory("KCRVPCarbonRegistry");
  const contract = await KCRVPCarbonRegistry.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ KCRVPCarbonRegistry deployed to:", address);
  console.log("📋 ABI and address saved for backend integration");
  console.log("\n🔧 Next steps:");
  console.log("  1. Copy contract address to backend .env: CONTRACT_ADDRESS=" + address);
  console.log("  2. Authorize platform wallet: contract.setIssuer(platformWallet, true)");
  console.log("  3. Verify on Polygonscan: npx hardhat verify --network mumbai", address, deployer.address);

  // Save deployment info
  const fs = require("fs");
  const deployInfo = {
    network: hre.network.name,
    address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };
  fs.writeFileSync("./deployment.json", JSON.stringify(deployInfo, null, 2));
  console.log("\n📄 Deployment info saved to deployment.json");
}

main().catch(err => { console.error(err); process.exitCode = 1; });
