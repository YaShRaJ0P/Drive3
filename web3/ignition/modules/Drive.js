const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DriveModule", (m) => {
  const drive = m.contract("Drive");

  return { drive };
});
