

**ABSTRACT**


```
Disposable mail boxes are a quick and efficient way to sign up to services which have the non-functional requirement of an email address of a user. They offer mailboxes which expire within a small period of time, the user may utilize the mailbox for that specified period of time after which it becomes inaccessible. This project identifies some of the issues with existing services and how to build such a system for small-scale usage. However, the infrastructure is designed in a way to keep costs minimum and easily scale for a large number of users. The tech stack is predominantly AWS + Nodejs.

```



# Introduction and Glossary

Some of the impotent components of this project are:



1. **AWS** : Amazon Web Services Is a major  cloud service provider, providing cloud computing and serverless computing in both private and public cloud domains. The usp of AWS is that it provides a wide range of services, at a price cheaper than its on-prem alternatives. We would be using its  Function as a Service offering, ie Lambda Functions and SNS.
2. **Nodejs**: It is a Javascript Platform, that is cross platform. It uses google’s V8 engine and is event-driven and asynchronous in nature. Because of its event-driven nature it's a perfect choice for function as a service execution environment.
3. **Function as a Service**:  It is a cloud computing service that allows one to run code without worrying about managing, provisioning and scaling servers.
4. **Discord** : It's a IM platform with extensive features for community interactions and a good support for 3rd party integrations, webhooks etc. Users have various modes of communication such as video, text, voice etc. In this project we will be using the webhook feature to deliver the emails.
5. **Webhook**s: It is a web endpoint to deliver data to a server, theoretically it's the reverse of an API. Webhooks are used frequently for integrations between web applications. They are way faster and more efficient than pooling and have many advantages over them, which makes them ideal for an event driven application.
6. **MX Records**: MX stands for Mail exchanger, it's a DNS resource record to specify the servers, load balancers etc that would be responsible for receiving emails on behalf of a particular domain.

**Architecture**


# Functional and Non-Functional Requirements



* Fast and real time receiving of emails.
* Add-free experience.
* Low maintenance cost.
* Notifications on receiving mail.
* Scalable for about 100 users.
* Serverless design.
* Use of existing IM clients, for example Discord
* Fast deployment.
* Infrastructure as a Code ( IaaC)
* No Cold start.
* Improved Latency.

**Logging and Monitoring**

For logging we are using AWS Cloud watch and for monitoring we have AWS SNS. CloudWatch logs are easy to configure and come out of the box, for Lambda functions. We have configured Cloudwatch logs to have a retention period of 1 to 2 months. The emails which don't fall into the given **regex **filters are directly dumped into the logs.

AWS SNS keeps a check on number of invocation requests etc. And if something goes wrong, for example a large number of emails flow into the system, a notification would be sent to the configured email address citing the reason for alerts.

**Working **

This application has an event driven architecture, which is a most used approach for serverless applications. At the core of this application are the following components and their setup process and working:



1. **AWS SES **: It is configured with a custom domain from which it will receive emails. It has the capability to both send and receive emails, however we are interested in receiving capability. The free tier allows one to receive 1k emails per month.

    As a part of setting up the SES for this application we need a custom domain, it can be purchased from anywhere and Route 53 is one such service. For the domain verification, we need to add **MX **records into our domain's DNS records. 


    

<p id="gdcalert1" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image1.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert2">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image1.png "image_tooltip")



    If the domain record is owned by aws the records will be configured automatically, otherwise we can go to our domain registrar and set them up manually.


    Once a mail is received the content is stored in **S3 **and an event is fired and delivered to the Lambda function. The event however contains only basic information like the **messageId ** of the email.

2. **AWS S3**: The email body can’t be sent in the Lambda event and hence to keep a track of all the received emails we will use a S3 bucket. All content such as Js or embedded HTML are stored as an object inside the bucket and can be retrieved later by the **messageId**(actually an **UUID**) assigned by SES. 

    We name this bucket as **disposable-email-bucket. **Since the bucket will be accessed by SES we need to attach a policy document to allow it, a simple policy can be of the following form:


    

<p id="gdcalert2" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image2.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert3">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image2.png "image_tooltip")



    **aws:Referer** is the account number which can be found in  **My Accoun**t –> **Account Settings** –> **Account Id**.

3. **AWS Lambda**: It acts as an email handler, receiving the email  event form SES which contains basic information like the event id etc. It then uses the id to fetch the email body stored in S3 and process it further.

    This can be easily set up by going to the AWS Console and creating a Lambda function. The Lambda however requires access to the S3 and needs a policy document similar to the one above. If we need the emails to be deleted after sending them to discord, **AmazonS3FullAccess **must be added to the policy document.


    The Lambda function uses the **mailparser **library in nodejs, to parse the email body. After the body has been parsed the text content is ready for sending as a webhook event.

4. **Rule Document**: The rule document is a json file stored just beside the lambda function code and it has the following structure:

    

<p id="gdcalert3" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image3.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert4">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image3.png "image_tooltip")



    This application is so designed that it can be used by multiple users, probably each having their own private Discord Channels. To route the email to separate channels we associate each channel’s webhook endpoint with a **regex** expression. The destination address is then checked against each of the expressions, when there’s a match then email payload is sent to the associated webhook endpoint.


    The document is basically a JSON Array containing objects having 2 parameters: **regex **and **webhook**.

5. **Discord Client**: The Discord app on the User’s phone will receive the email body in one of the channels and will present the user with a normal notification. The channel however needs to be set up properly with the webhook endpoint in the rule document.

    To get the webhook endpoint for a channel go to the channel settings, click on **Integrations >** **Webhooks**. 

Click on **New Webhook. **Give it a suitable name, and click on **Copy Webhook URL**. Next make an entry in the rule document with the newly generated channel’s webhook endpoint, and any suitable **regex** expression. 

**Improvements**

There are several improvements that can be made over the existing architecture, these improvements are results of thorough UAT(user acceptance testing) and load testing. Some of these improvements are :



1. **Regex routing**: Regex routing is fast and simple when we have a few rules. However, this doesn't scale well. For each of the email payloads the lambda has to go through each of the rules searching for a match. This is even worse when we shift the rules to a serverless DB. As a solution we could use a 2 part-naming convention, for example &lt;*>[.id1@mydomain.com](mailto:.id1@mydomain.com). In this system the last part is a fixed constant and the part before the period can be anything. This would reduce the search operation to O(log n) time(if using an optimised db indexes).
2. **Remembering Regex Rules: **regex rules may sound flexible, easy to implement and remember. However, after UAT it's easier to remember a fixed ID than a regex expression, this too can be solved by a 2 part naming convention mentioned earlier.
3. **Text only payload**: Discord webhooks currently support only text payload, although most modern email clients convert the body into a ASCII text form and include it with the html body before sending it across, some clients embed the OTP in a Image before sending. This becomes problematic as we cant see any Js rendered or Image in the Discord texts.
4. **Auto generate Channels: **Creating channels and adding rules can be a tedious process, as a future iteration the lambda function can generate channels based on the destination email address sent in the email.
