import { program } from 'commander';
import { startSharing } from './services/sharing.js';
import { startDiscovery } from './services/discovery.js';

program
  .name('p2p-share')
  .description('P2P file sharing over LAN')
  .version('1.0.0');

program
  .command('share')
  .description('Share a file on the network')
  .action(startSharing);

program
  .command('discover')
  .description('Discover and download shared files')
  .action(startDiscovery);

// Add default command to show help
program
  .action(() => {
    console.log('Please specify a command: share or discover\n');
    program.help();
  });

program.parse();