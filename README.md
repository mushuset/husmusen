# Husmusen
Husmusen (the house mouse) is an inventory managment system protocol for museums and other institutions to publish information about their items and inventory for the public viewing. Husmusen aims to be as simple as possible, while still offering functionality that is important or even *required*. **This is an example implementation of the protocol.** That means that the code hopefully will be easy to read and understand, as well as contain helpful comments. Although *Husmusen* is technically only aimed at Swedish institutions (for now), all comments and code will be in English, simply because I think it is a hot mess to have the code in English and comments in another language. The UI for a control panel example that is included is in Swedish though.

## Setup and requirements
There are some steps to setting up this project. There are also some requirements:
- Node.js, the latest version should be fine (`16.16.0 LTS` and `18.7.0 current` as of writing).
- A MariaDB server to store data on. This can be a little bit of a hassle to setup, but I will provide som links to various help resources further down.
- Some time, and maybe a cup of your favourite beverage. Coffee for most, but I prefer tea.

#### How to obtain a MariaDB server?
There are two ways: host yourself or buy hosting from someone else. Various web hotels provide MariaDB hosting, but for testing I recommend hosting a server locally yourself, as that is free. See the links below for your platform:
- [Windows](https://www.mariadbtutorial.com/getting-started/install-mariadb/)
- [Arch Linux](https://wiki.archlinux.org/title/MariaDB)
- [Ubuntu](https://hevodata.com/learn/installing-mariadb-on-ubuntu/)
- [Fedora](https://docs.fedoraproject.org/en-US/quick-docs/installing-mysql-mariadb/)

If I didn't mention your platform you can probably just search for `how to install mariadb <my-platform>` where you replace `<my-platform>` with your platform.

### 1. Install Node
Node is a Javascript runtime for servers. Traditionally Javascript was used solely when creating web pages' front-end. Nowadays it can be used for server development as well.

The install instructions will differ a bit depending on your platform.

#### Windows and Mac OS/OSX
For Windows and Mac OS/OSX you can install Node by downloading it from the official website: https://nodejs.org/en/download/

#### Linux and BSD
For Linux and BSD it is recommended to install Node via your distribution's package manager. You can read more about that here: https://nodejs.org/en/download/package-manager/

Usually it is something along the lines of `sudo package-manager install node`.

#### NVM
There are also so called *Node version managers* that can be used to install Node. They can be cross-platform, meaning you can use them to install Node on any of Windows, Linux, BSD, and Mac OS/OSX One of them is `NVM`. Learn more about that here: https://github.com/nvm-sh/nvm

### 2. Clone this repository
#### Via `git clone`
If you have [git](https://git-scm.com/) installed you can clone this repository via:
```sh
git clone https://github.com/mushuset/husmusen
```

#### Downloading a ZIP file
You can also download a ZIP file by clicking the green button above where it says `Code ▼` and then clicking on `Download ZIP`. (Or by simple clicking [on this link](https://github.com/mushuset/husmusen/archive/refs/heads/main.zip).)

If you use this method, remember to unzip/decompress the ZIP file!

### 3. Install dependencies
Once you've cloned the repository, enter it. You need to open a *Terminal*/*Command Prompt* in this folder. When you've entered your Terminal/Command Prompt you need to run the following command:
```sh
npm install
```
NPM is a package manager for Node. It should've been installed when you installed Node. This command will install all needed dependencies for Husmusen to run.

### 4. Create your `.env` file
Now create a file called `.env` in the project root (next to `index.js`). In the file you will specify various *environment variables* for the Husmusen to use to, among other things, connect to the MariaDB server and database. In your file, copy-paste this template and customize it to your needs:
```ini
PORT = 12345
DB_HOST = 127.0.0.1
DB_PORT = 3306
DB_USER = husmusen
DB_PASS = super_secret_password
DB_NAME = husmusen
TOKEN_SECRET = super_secret
```
Here is a description of all the variables:
|    Variable:   |                   Description:                  |
| -------------- | ----------------------------------------------- |
| `PORT`         | Refers to the port Husmusen is running on.      |
| `DB_HOST`      | The IP/hostname/domain of the MariaDB server.   |
| `DB_PORT`      | The port the MariaDB server is running on.      |
| `DB_USER`      | The user to connect to the MariaDB server as.   |
| `DB_PASS`      | The password for said user.                     |
| `DB_NAME`      | The name of the database on the MariaDB server. |
| `TOKEN_SECRET` | A secretfor signing API/access tokens with.     |

**NOTE:** `TOKEN_SECRET` should only be set in development environments, so that you don't have to get a new one every time the server restarts. In production it should not be set. The server will generate its own secret.

### 5. Start the Husmusen server
#### First-time setup
Before starting the Husmusen server for the first time, you need to run a setup script to set some things up. You do it by running the following command:
```sh
node setup.js
```
This will create some initial files and directories, namely:
```
PROJECT_DIRECOTRY
└─ data/
   ├─ db_info.yml
   ├─ files/
   └─ keywords.txt
```

#### Start the server
Now everything should be set up in way where you can start the Husmusen server. You start the server by, in the project root, running the following command:
```sh
node index.js
```

If everything has been done properly, the server should start and become reachable at `http://localhost:$PORT`. If something is not working, feel free to [open an issue](https://github.com/mushuset/husmusen/issues/new) and describe your problem.

#### Start the server in *debug mode*
The server has a *debug mode*. As of writing it doesn't do much, but it enables a way to forcefully create an initial admin user. To start the server in debug mode use:
```sh
DEBUG=true node index.js
```
Or, alternatively add `DEBUG = true` to your `.env` file.

**Important!** Never go live/public with this implementation and with *debug mode* on, as that would **allow anyone to create an admin user on your instance**!

## Bug reports, questions, and contribution
If you notice any bug or have any questiosns, feel free to [open an issue](https://github.com/mushuset/husmusen/issues/new).

If you make any changes that you think are valuable for others, consider opening a [pull request](https://github.com/mushuset/husmusen/pulls).