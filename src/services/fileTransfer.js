import net from 'net';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { NETWORK } from '../config/constants.js';

export function createFileServer(filePath) {
  return new Promise((resolve) => {
    const server = net.createServer((socket) => {
      console.log(chalk.green('\nClient connected for file transfer'));
      const spinner = ora('Sending file...').start();
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(socket);

      fileStream.on('end', () => {
        spinner.succeed('File sent successfully');
        socket.end();
      });
    });

    server.listen(NETWORK.TCP_PORT, () => {
      resolve(server);
    });
  });
}

export function downloadFile(fileName, address, port) {
  const spinner = ora('Connecting to peer...').start();
  const client = new net.Socket();

  client.connect(port, address, () => {
    spinner.text = 'Downloading file...';
    
    const writeStream = fs.createWriteStream(
      path.join(process.cwd(), `received_${fileName}`)
    );

    client.pipe(writeStream);
  });

  client.on('end', () => {
    spinner.succeed('File downloaded successfully!');
    client.destroy();
  });

  client.on('error', (err) => {
    spinner.fail(`Download failed: ${err.message}`);
    client.destroy();
  });
}