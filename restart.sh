screen -list | grep "spotapi" && killall screen && screen -dmS spotapi bash -c 'node app.js' || screen -dmS spotapi bash -c 'node/app.js'
