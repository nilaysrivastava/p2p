import dgram from 'dgram';
import net from 'net';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

const MULTICAST_ADDR = '239.255.255.250';
const MULTICAST_PORT = 1900;
const TCP_PORT = 8000;

export async function startSharing() {
  const { filePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: 'Enter the path to the file you want to share:',
      validate: (input) => fs.existsSync(input) || 'File does not exist'
    }
  ]);

  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;

  // Create UDP socket for discovery
  const udpSocket = dgram.createSocket('udp4');
  
  udpSocket.bind(() => {
    udpSocket.setBroadcast(true);
    udpSocket.setMulticastTTL(128);
  });

  // Create TCP server for file transfer
  const tcpServer = net.createServer((socket) => {
    console.log(chalk.green('\nClient connected for file transfer'));
    const spinner = ora('Sending file...').start();
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(socket);

    fileStream.on('end', () => {
      spinner.succeed('File sent successfully');
      socket.end();
    });
  });

  tcpServer.listen(TCP_PORT, () => {
    console.log(chalk.blue(`\nSharing ${fileName} (${fileSize} bytes)`));
    console.log(chalk.yellow('Waiting for peers to connect...'));

    // Broadcast file availability
    setInterval(() => {
      const announcement = JSON.stringify({
        type: 'FILE_SHARE',
        fileName,
        fileSize,
        tcpPort: TCP_PORT
      });
      
      udpSocket.send(
        announcement,
        0,
        announcement.length,
        MULTICAST_PORT,
        MULTICAST_ADDR
      );
    }, 1000);
  });

  process.on('SIGINT', () => {
    udpSocket.close();
    tcpServer.close();
    process.exit(0);
  });
}