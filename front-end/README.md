ck# 1. Check if Node.js and npm are installed

```bash
node -v
npm -v
```
# 2. Vite requires Node.js version 20.19+ 22.12+

check if NVM is available
```bash
nvm version
```
if nvm gives an error, install NMV for Windows [from] (https://github.com/coreybutler/nvm-windows/releases)
Under Assets, download and install the latest .exe

if nvm version is old, update it
```bash
nvm install 22.12.0
nvm use 22.12.0
node -v
```

# 3. Install dependencies
Go to /front-end and run:
```bash
npm install
```
# 4. Run the app
```bash
npm run dev
```
Open the link you get from the output in a browser to view the app
