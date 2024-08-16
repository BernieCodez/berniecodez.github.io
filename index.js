import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBareServer } from '@tomphttp/bare-server-node';
import request from '@cypress/request';
import chalk from 'chalk';
import packageJson from './package.json' assert { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const bareServer = createBareServer('/bear/');

const version = packageJson.version;
const discord = 'https://discord.gg/unblocking';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/student', (req, res) => res.sendFile(path.join(__dirname, 'loader.html')));
app.get('/apps', (req, res) => res.sendFile(path.join(__dirname, 'apps.html')));
app.get('/gms', (req, res) => res.sendFile(path.join(__dirname, 'gms.html')));
app.get('/lessons', (req, res) => res.sendFile(path.join(__dirname, 'agloader.html')));
app.get('/info', (req, res) => res.sendFile(path.join(__dirname, 'info.html')));
app.get('/go', (req, res) => res.sendFile(path.join(__dirname, 'loading.html')));

app.get('/worker.js', (req, res) => {
  request('https://cdn.surfdoge.pro/worker.js', (error, response, body) => {
    if (error) {
      console.error('Error fetching worker script:', error);
      res.status(500).send('Error fetching worker script');
      return; // Stop execution if error
    }
    if (response.statusCode !== 200) {
      console.error('Error fetching worker script:', `Status code: ${response.statusCode}`);
      res.status(500).send('Error fetching worker script');
      return; // Stop execution if error
    }
    res.setHeader('Content-Type', 'text/javascript');
    res.send(body);
  });
});

// Define specific routes before the catch-all route
app.get('/other-route', (req, res) => {
  // ... Handle the request
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'gms.html'));
});

server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// Simplify the 'upgrade' handler if you only care about bare server upgrades
server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  }
});

server.on('listening', () => {
  try {
    const port = server.address().port;
    console.log(chalk.bgBlue.white.bold('  Welcome to Doge V4, user!  ') + '\n');
    console.log(chalk.cyan('-----------------------------------------------'));
    console.log(chalk.green('  🌟 Status: ') + chalk.bold('Active'));
    console.log(chalk.green('  🌍 Port: ') + chalk.bold(chalk.yellow(port)));
    console.log(chalk.green('  🕒 Time: ') + chalk.bold(new Date().toLocaleTimeString()));
    console.log(chalk.cyan('-----------------------------------------------'));
    console.log(chalk.magenta('📦 Version: ') + chalk.bold(version));
    console.log(chalk.magenta('🔗 URL: ') + chalk.underline(`http://localhost:${port}`));
    console.log(chalk.cyan('-----------------------------------------------'));
    console.log(chalk.blue('💬 Discord: ') + chalk.underline(discord));
    console.log(chalk.cyan('-----------------------------------------------'));
  } catch (error) {
    console.error('Error getting server address:', error);
  }
});

function shutdown(signal) {
  console.log(chalk.bgRed.white.bold(`  Shutting Down (Signal: ${signal})  `) + '\n');
  console.log(chalk.red('-----------------------------------------------'));
  console.log(chalk.yellow('  🛑 Status: ') + chalk.bold('Shutting Down'));
  console.log(chalk.yellow('  🕒 Time: ') + chalk.bold(new Date().toLocaleTimeString()));
  console.log(chalk.red('-----------------------------------------------'));
  console.log(chalk.blue('  Performing graceful exit...'));
  server.close(() => {
    console.log(chalk.blue('  Doge has been closed.'));
    process.exit(0);
  });
}

// Handle SIGTERM, SIGINT, and uncaught exceptions
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('UncaughtException');
});

server.listen(8001, () => {
  console.log(`Server running on http://localhost:8001`);
});
