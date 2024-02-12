const qrcode = require('qrcode-terminal');
const {Client, LocalAuth} = require('whatsapp-web.js');
const chalk = require('chalk');
const fs = require('fs');
const readlineSync = require('readline-sync');

const client = new Client({
  authStrategy : new LocalAuth()
});

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const sendMsg = async (number, msg) => {
  const correctiveNumber = number.replace(' ', '').replace('-', '').replace('-', '')
  const numberDetails = await client.getNumberId(`${parseInt(correctiveNumber.replace('+', ''))}`)

  if (numberDetails) {
      client.sendMessage(numberDetails._serialized, msg)
      console.log(chalk.green(`Message sent : ${correctiveNumber}`))
      return true
  } else {
      console.log(chalk.red(`Mobile number is not registered : ${correctiveNumber}`))
      return false
  }
}

const randomTxtOnMsg = (option, msg) => {
  return (option == 1) ? (msg+'\n\n' + Math.random().toString(16).substr(2, 8)) : msg;
}

const whatsAppBlast = async () => {
  let textListArray = [];
  let numberListArray = [];
  fs.readdirSync('./textlist/').forEach(file => {
      textListArray.push(file.replace('.txt', ''))
  });
  fs.readdirSync('./numberlist/').forEach(file => {
      numberListArray.push(file.replace('.txt', ''))
  });

  let randomTextOptionArray = ['No, keep original message', 'Yes, use random text on message']
  let randomTextOption = readlineSync.keyInSelect(randomTextOptionArray, chalk.yellow('Use the random text on the bottom message'))
  if(randomTextOption < 0) 
      whatsAppBlastReload()

  let textIndex = readlineSync.keyInSelect(textListArray, chalk.yellow('Message filename'))
  if(textIndex < 0) 
      whatsAppBlastReload()

  let numberIndex = readlineSync.keyInSelect(numberListArray, chalk.yellow('Phone number filename'))
  if(numberIndex < 0) 
      whatsAppBlastReload()

  let delay = readlineSync.question(chalk.yellow('Delay in miliseconds') + ': ')

  let sleepOptionArray = ['No, run program without sleep', 'Yes, run program with sleep']
  let sleepOption = readlineSync.keyInSelect(sleepOptionArray, chalk.yellow('Use sleep after some messages'))
  let sleepAfter = (sleepOption == 1) ? readlineSync.question(chalk.yellow('Sleep after every message count') + ': ') : 0
  let sleepAfterDelay = (sleepOption == 1) ? readlineSync.question(chalk.yellow('Sleep after every message count delay in miliseconds') + ': ') : 0
  if(sleepOption < 0) 
      whatsAppBlastReload()

  console.log(chalk.yellow('\n\nProcessing...\n'))
  let pathText = './textlist/' + textListArray[textIndex] + '.txt'
  let pathNumber = './numberlist/' + numberListArray[numberIndex] + '.txt'

  let dataText = fs.readFileSync(pathText, 'utf8').toString()
  dataText = randomTxtOnMsg(randomTextOption, dataText)
  let dataNumber = fs.readFileSync(pathNumber, 'utf8')
  let dataNumberInArray = dataNumber.toString().split('\n')

  const reportName = + new Date()
  let reportContent = []
  let messageCount = 0
  for (let i = 0; i < dataNumberInArray.length; i++) {

      const numberFormat = dataNumberInArray[i].split('|')[0]
      let textFormat

      if (dataNumberInArray[i].includes('|'))
          textFormat = dataText.replace('{name}', dataNumberInArray[i].split('|')[1])
      else
          textFormat = dataText.replace('{name}', '')

      const status = await sendMsg(numberFormat, textFormat);
      if (status) 
          reportContent.push(`${parseInt(numberFormat)} : success`)
      else 
          reportContent.push(`${parseInt(numberFormat)} : failed`)

      await sleep(delay);

      //check if sleep is enabled
      if(sleepAfter !== 0){
          messageCount++
          if(messageCount == sleepAfter){
              console.log(chalk.yellow('sleep after ' + sleepAfter + ' messages'));
              await sleep(sleepAfterDelay)
              messageCount = 0
          }
      }

      if (i == dataNumberInArray.length - 1) {
          //create report  
          fs.writeFile(`./report/${reportName}-${textListArray[textIndex]}-${numberListArray[numberIndex]}.txt`, reportContent.join('\r\n'), (err) => {
              if (err)
                  console.log(chalk.red(err));
              else {
                  console.log(chalk.green('\n\nBlast finished!'))
                  let runAgainArray = ['No, close.', 'Yes, run again.']
                  let runAgainOption = readlineSync.keyInSelect(runAgainArray, chalk.yellow('Run the program again'))
      
                  if (runAgainOption == 1)
                      whatsAppBlastReload()
                  else
                      process.exit()
              }
          });
      }
  }
}

const whatsAppBlastReload = () => {
  console.clear()
  whatsAppBlast()
}

client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
  console.log('Client is ready!');
  console.log(chalk.green('Client is ready!\n'));

  console.log(chalk.white.bgRed.bold('|--------------------------------------------------|'))
  console.log(chalk.white.bgRed.bold('|                                                  |'))
  console.log(chalk.white.bgRed.bold('| WhatsApp Blast CLI by Agung                   |'))
  console.log(chalk.white.bgWhite.bold('|                                                  |'))
  console.log(chalk.white.bgWhite.bold('|--------------------------------------------------|'))

  whatsAppBlast();
});

client.on('message', message => {
  if (message.body === 'ping') {
    message.reply('pong');
  }
})

client.initialize();