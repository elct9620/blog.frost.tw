---
title: "TGONext: The plan for high concurrency "
date: 2020-02-23T15:54:37+08:00
tags: [Experience, TGONext, Architecture]
series: TGONext
toc: true
thumbnail: https://blog.frost.tw/images/2020-02-23-tgonext-the-plan-for-high-concurrency/thumbnail.jpg
---

Yesterday is the first meetup of the [TGONext](https://next.tgonetworks.org/) project, we are learning from Taiwan's high-level technical leaders. After the opening, our mentor [Ant](https://blog.gcos.me/) let our polling for the topic we want to discuss in this half-year project time.

We decide to pick up 4 topics to discuss and the first topic is "high concurrency."

<!--more-->

## What is High Concurrency

When we start this topic, our mentor gives us a question.

> How to define the high concurrency?

We know high concurrency is about we have a lot of users to use our service, but we notice we cannot clearly define it.

But the definition is simple and makes us think deeper.

> The requests we can handle in a short time, usually in one second.

Based on the above definition, the most important thing is

> We should have the capability to handle the request otherwise it is useless in our high concurrency plan.

## How to measure the concurrency

To ensure our service to have the capability to handle the large amount request or the target our market team asks for us.

We have to correctly measure the capability in our system.

Our mentor let us list the tools we had used or heard about.

* [ab](https://httpd.apache.org/docs/2.4/programs/ab.html)
* [wrk](https://github.com/wg/wrk)
* [wrk2](https://github.com/giltene/wrk2)
* [JMeter](https://jmeter.apache.org/)
* SaaS (the cloud service provide similar service)

The tools are very common, so I didn't direct link them with the measurement tools.

And then, the mentor asks us "the report between tools will different?"

We never consider this small concern, but it is very important when we measure the capability.

For example, `ab` will create threads before sending requests. And send it at the same time. It usually gets a lower score and not fit the real-world's user behavior.

> To measure the capability, we have to consider the test is fit the real-world's user behavior.

And there have other things we also need to consider when we are testing capability.

### The test machine's limit

If we try to send a high concurrency request in one machine, but the max threads are over the machine's capability. We will get the wrong result, and we need to use a tool can run on multi-machine or implement a tool controller to trigger tool in multiple machines.

### The network environment

If we send the request from LAN the requested amount will larger than the real-world case. At least, we have to put in a different zone and consider the user's location.

> There has another concern have to be noted, we are testing the "capability" that means we are not put the "pressure" to our server, they are the different test type.

### The tool's calculator method

This already talks before this section, but the `wrk2` is mentioned by our mentor. Some tools didn't calculate the timespan from request to response and it may not fully fit the real-world case.

Our mentor tells us the `wrk2` use [Coordinated Omission](https://medium.com/@siddontang/the-coordinated-omission-problem-in-the-benchmark-tools-5d9abef79279) algorithm and it is more fit the real-world.

### The perfect result

If we see a perfect result, we have to look-out our test method and tool. There may have something we are not expected and give us a different result.

## From MAU to QPS

In the real-world, the QPS (query per second) isn't defined by the developer team. It usually depends on the market team's target or the CEO's plan.

That means we usually get an MAU (monthly active user) instead of QPS.

For example, if the market team tells us the next month they plan to grow to 1 million monthly active users.

What is the minimal QPS we have to provide that can reach the market team's requirement?

After a short discussion and guess, we notice some clues about the requests.

* User didn't always online
* One user may have more than one requests to process one action
* The most user only active in the specified time (ex. event)

For example, we can use the 80-20 rule to assume the 80% user only active in 20% time.

And to define the max request at the same time per user, the mentor tells us in the experience we usually choose the "most active behavior" and count the API request behind it.

And then, we have minimal information to calculate the QPS from MAU.

* MAU: 1 million
* Requests per user: 3 API Request per Action
* Active Time: 20% time of one day

And we can start a calculate:

> (1 million * 3 API Request) / (30 * 0.2 * 86400) * 0.8 ~= 4.6 QPS

The calculate formula will be:
> (MAU * Requests) / (30 * 20% Time * 1 Day (in second)) * 80% User ~= QPS

The result is lower than we expect before we know how to calculate it. But it based on the data and reasonable.

Therefore, our target is to design our architecture to allow it can handle the QPS greater than 4.6.

> The mentor also tells us the ratio will be different in other cases, but we can use the report which is opened on the network and find the best ratio in your industry.

## Conclusion

This is the first part we discuss, it spends about 1.5 hours but has large information.

We have the next part to discuss the SLI/SLO/SLA and the availability to break down the QPS, but it uses a short time and we may discuss it online or next meetup. I will summary them after we finish the next topic.

After about 2 hours discuss with the mentor and other mentees, I still believe the most important thing in TGONext is learning the mentor's viewpoint when they face a question.

In this high concurrency discussion, we define the "high concurrency" and focus on the technical part "QPS" to check the target we have to reach. And connect our experience with other departments to make us can co-work correctly.

In nowadays, some people say "the title is not important". But when you learn from TGONext's CTO or other high-level professional peoples, you will know the actual difference between us is we usually not focus on the correct problem, and we didn't know the correct method to do it.

Thanks to the [TOGNetworks](https://tgonetworks.org/) provide a good chance to us, give a road-sign to learning high-level skills. Not continue self-satisfaction in the title we have in our company.
