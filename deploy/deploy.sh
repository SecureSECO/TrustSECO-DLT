#!/bin/sh



printf "\n  $ git pull\n\n"
git pull



printf "\n\n\n  >> Loading nvm...\n"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"



printf "\n  $ nvm use\n\n"
nvm use
printf "\n\n\n  $ npm install\n"
npm install



printf "\n\n\n  $ sudo systemctl restart TrustSECO-DLT\n"
sudo systemctl restart TrustSECO-DLT

printf "\n  >> done\n"
