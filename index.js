var AWS = require("aws-sdk");
var simpleParser = require("mailparser").simpleParser;
var rp = require('request-promise');


var s3 = new AWS.S3();

const ruleDocument = [
{
 regex : "007",
 webhook : "https://discord.com/api/webhooks/912590714012057620/caurK80wHtmB031vxwWCy0YeT3RZpgZysP1dxRt5_BGbwFNh9SVh1NT8_m44XjPSoT05"
 },
 {
 regex : "himym",
 webhook : "https://discord.com/api/webhooks/912600281026539560/7g-Jt1T44HhtrJtW3LNL00Q5BRgvGZ55DeguRUe5mcfbS2YiWuLtDus-eLIorGc_0Mcu"
 }
]

exports.handler = async (event, context, callback) => {
    console.log("Invoked Lambda");
    const mail = event.Records[0].ses.mail;

    console.log("Mail");
    console.log(JSON.stringify(mail));

    var getParams = {
        Bucket: "disposable-emails-bucket",
        Key: mail.messageId,
    };
    let emailFromS3 = await s3.getObject(getParams).promise();
    let parsedEmail = await simpleParser(emailFromS3.Body);

    console.log("parsedEmail Subject: "  + parsedEmail.subject);
    console.log("destination address " + parsedEmail.to);
    console.log("The text  content "+parsedEmail.text);

    for(var i=0;i<ruleDocument.length;i++){
        if(parsedEmail.to.value[0].address.match(ruleDocument[i].regex)!=null){
            console.log("Matched with "+ruleDocument[i].regex);
            var params = {
                Message: JSON.stringify({
                    "content": parsedEmail.text,
                    "username": "Disposable Email Bot",
                    "avatar_url": "https://i.pravatar.cc/100",
                    "tts": false
                }),
                Webhook: ruleDocument[i].webhook
            };
            await sendWebhook(params);
            break;
        }
    }

    callback(null);
};

async function sendWebhook(params){
    console.log("Sending webhook");
    console.log(params);
    var options = {
        method: 'POST',
        uri: params.Webhook,
        body: params.Message,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    await rp(options);
}