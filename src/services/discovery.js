import chalk from "chalk";
import inquirer from "inquirer";
import dgram from "dgram";
import { NETWORK } from "../config/constants.js";
import { downloadFile } from "./fileTransfer.js";

let discoverySocket = null;

export function startDiscovery() {
  if (discoverySocket) {
    console.log(chalk.yellow("Discovery is already running"));
    return;
  }

  const availableFiles = new Map();
  discoverySocket = dgram.createSocket({ type: "udp4", reuseAddr: true });

  console.log(chalk.blue("Discovering shared files on the network..."));

  discoverySocket.on("message", async (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.type === "FILE_SHARE") {
        await handleNewFile(data, rinfo, availableFiles);
      }
    } catch (err) {
      // Ignore invalid messages
    }
  });

  discoverySocket.on("error", (err) => {
    console.error(chalk.red(`Discovery error: ${err.message}`));
    cleanup();
  });

  discoverySocket.bind(NETWORK.MULTICAST_PORT, () => {
    discoverySocket.setBroadcast(true);
    discoverySocket.addMembership(NETWORK.MULTICAST_ADDR);
  });

  setupCleanup();
}

async function handleNewFile(data, rinfo, availableFiles) {
  const key = `${rinfo.address}:${data.tcpPort}`;

  if (!availableFiles.has(key)) {
    availableFiles.set(key, {
      fileName: data.fileName,
      fileSize: data.fileSize,
      address: rinfo.address,
      tcpPort: data.tcpPort,
    });

    displayFileInfo(data, rinfo);

    const { download } = await inquirer.prompt([
      {
        type: "confirm",
        name: "download",
        message: "Would you like to download this file?",
      },
    ]);

    if (download) {
      downloadFile(data.fileName, rinfo.address, data.tcpPort);
    }
  }
}

function displayFileInfo(data, rinfo) {
  console.log(chalk.green("\nNew file discovered:"));
  console.log(chalk.yellow(`File: ${data.fileName}`));
  console.log(chalk.yellow(`Size: ${data.fileSize} bytes`));
  console.log(chalk.yellow(`From: ${rinfo.address}`));
}

function cleanup() {
  if (discoverySocket) {
    try {
      discoverySocket.dropMembership(NETWORK.MULTICAST_ADDR);
      discoverySocket.close();
    } catch (err) {
      // Ignore cleanup errors
    }
    discoverySocket = null;
  }
}

function setupCleanup() {
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
}
