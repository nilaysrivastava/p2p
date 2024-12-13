import inquirer from 'inquirer';
import chalk from 'chalk';
import { validateFilePath, getFileInfo } from '../utils/file.js';
import { createMulticastSocket, broadcastMessage } from '../utils/network.js';
import { createFileServer } from './fileTransfer.js';
import { NETWORK } from '../config/constants.js';

export async function startSharing() {
  const { filePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: 'Enter the path to the file you want to share:',
      validate: validateFilePath
    }
  ]);

  const { fileName, fileSize } = getFileInfo(filePath);
  const udpSocket = createMulticastSocket();
  const tcpServer = await createFileServer(filePath);

  console.log(chalk.blue(`\nSharing ${fileName} (${fileSize} bytes)`));
  console.log(chalk.yellow('Waiting for peers to connect...'));

  // Broadcast file availability
  const interval = setInterval(() => {
    broadcastMessage(udpSocket, {
      type: 'FILE_SHARE',
      fileName,
      fileSize,
      tcpPort: NETWORK.TCP_PORT
    });
  }, 1000);

  setupCleanup(udpSocket, tcpServer, interval);
}

function setupCleanup(socket, server, interval) {
  process.on('SIGINT', () => {
    clearInterval(interval);
    socket.close();
    server.close();
    process.exit(0);
  });
}