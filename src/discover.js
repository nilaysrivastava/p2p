import dgram from 'dgram';
import net from 'net';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

const MULTICAST_ADDR = '239.255.255.250';
const MULTICAST_PORT = 1900;

export function startDiscovery() {
  const availableFiles = new Map();
  const socket = dgram.createSocket('udp4');

  console.log(chalk.blue('Discovering shared files on the network...'));
  
  socket.on('message', async (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());
      
      if (data.type === 'FILE_SHARE') {
        const key = `${rinfo.address}:${data.tcpPort}`;
        
        if (!availableFiles.has(key)) {
          availableFiles.set(key, {
            fileName: data.fileName,
            fileSize: data.fileSize,
            address: rinfo.address,
            tcpPort: data.tcpPort
          });

          console.log(chalk.green('\nNew file discovered:'));
          console.log(chalk.yellow(`File: ${data.fileName}`));
          console.log(chalk.yellow(`Size: ${data.fileSize} bytes`));
          console.log(chalk.yellow(`From: ${rinfo.address}`));
          
          const { download } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'download',
              message: 'Would you like to download this file?'
            }
          ]);

          if (download) {
            downloadFile(data.fileName, rinfo.address, data.tcpPort);
          }
        }
      }
    } catch (err) {
      // Ignore invalid messages
    }
  });

  socket.bind(MULTICAST_PORT, () => {
    socket.setBroadcast(true);
    socket.addMembership(MULTICAST_ADDR);
  });

  process.on('SIGINT', () => {
    socket.close();
    process.exit(0);
  });
}

function downloadFile(fileName, address, port) {
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