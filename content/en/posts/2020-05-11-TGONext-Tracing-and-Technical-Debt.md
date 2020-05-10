---
title: "TGONext: Tracing and Technical Debt"
publishDate: 2020-05-11T00:19:35+08:00
date: 2020-05-11T00:19:35+08:00
tags: ["Experiance", "TGONext", "Architecture"]
toc: true
series: TGONext
thumbnail: https://blog.frost.tw/images/2020-05-11-tgonext-tracing-and-technical-debt/thumbnail.jpg
credit: Photo by Simon Matzinger from Pexels
---

We have 4 ~ 5 times meetup in TGONext, and this time is the last meetup in the schedule. In the possible last meetup, we discuss some topic which we are not planning to discuss at first.

This time we are talking about log tracing and how to deal with technical debt.

<!--more-->

## Log Tracing

Some of the mentees have some questions about the log collection in their work.

### Collection

In the common cases is choose to put our logs in the local disk but when the services are growing, this is hard to debug from the logs.

In my company, we usually put the logs on the local disk because our customers usually have only one server. Or we will let our customers use SaaS to upload to third-party services to save the time to build a logging server. We already have a lot of useful tools that can be chosen, for example, the AWS CloudWatch or [Papertrail](https://www.papertrail.com/) is easier to integrate to Rails.

### Open Tracing

When the amount of service is growing, the logging is not enough to trace a whole system and we need more information to know about our system.

Open Tracing is a standard to define how to trace our service. We can use [Jagger](https://www.jaegertracing.io/) or [Zipkin](https://zipkin.io/) which are support the Open Tracing API.

> Choose Open Tracing may be a good idea, the most business solution are support Open Tracing API that we can easily switch between them.

### Application Performance Monitor

This is a part of the Open Tracing, it gives us to trace a function call or API call spend time. In my experience, the business solution like [Datadog](https://www.datadoghq.com/), [NewRelic](https://newrelic.com/), [ScoutAPM](https://scoutapm.com/) and others are provided more detail information can help us to determine the performance problem.

But the OpenSource solution like [ElasticAPM](https://www.elastic.co/apm) is limited and only very simple trace information can be traced.

> The business solutions are had support memory tracking and helpful to find memory problems, but ElasticAPM is not supporting it but in the roadmap.

### Time

After sharing our experience and tools, the mentor points out a key point in tracing tools.

When we use these tools to trace our service, it usually related the time. And to prevent the network latency, the agent usually uses local time as timestamp and sends it to the trace server.

That means if we have two machines but the time is not synchronized, we may get an invalid timeline let us unable to find a correct problem in the dashboard.

For example, if we have 3 API calls (A => B => C) in this trace, one of the API server (B) has invalid local time. We may see the timeline shows the B is early than A, but it doesn't match the actual event time. It will cause us cannot correctly find the problem.

### Dashboard

Another important part is the dashboard. To find the problem in a short time usually depend on a good design dashboard to help developer trace the problem.

This is why the business solution is more mature than open-source projects, and we usually choose ElasticSearch as our self-hosting solution.

Building a powerful dashboard is not easy, but the trace isn't the highest priority in product development.

This is why we prefer to choose SaaS or an existing open-source project.

## Technical Debt

This part we share our experience when we try to decide to refactor or schedule to resolve it.

I think we are agree to there no correct answers, but we still have some guide can follow.

### The Test

To deal with the technical debt we usually have to refactor our code. To refactor the code, we need the test to ensure we didn't break anything.

In my experience, the "spec" is important. If we didn't have a correct spec, the test will focus on incorrect things and we get a useless test.

### The known and unknown debt

In work, we never always have enough time to write an ideal code. That means the event we didn't have technical debt, we still have to make technical debt due to the time limit.

In this case, we will add a `TODO` as a comment to waiting we can refactor it, and in another case, we may write some bad code we didn't know.

To resolve the known debt, most members agree to take the initiative to resolve it, and the unknown debt we still have to wait for it had appeared for us to fix them.

But the trace will help us find the hidden issue faster, this is connected to the previous topic we are talking about.

> And there we have another case cause the technical debt, the programming language is used too old version. The language will be improved after the upgrade and drop some syntax, it will cause we cannot let our old codes continue work in the newer version.

### The communicate

In the last, our mentor gives us a summary of his experience.

The reason causes the technical debt usually depends on the product team or marketing team requirement, but it will gain more value for the company.

If we want to have the time to deal with the technical debt, we have to explain the pros and cons to them.

And the programmer team usually be rejected, because others cannot figure out the importance of refactoring.

To resolve it, we had to convert the information to the same unit to compare that other teams can figure out it.

For example, we can explain the refactoring can improve the 10% in the future promote feature's development time. It will give the marketing team can be faster to push their new product, but we have to spend more 50% time at this time, to refactor it.

If the marketing team thinks this value is higher than keeping used the same way to add promote the feature, we will get the support to start this refactor.

## Conclusion

This meetup is shorter than previous meetups, but include other meetups, we almost covered all topics we want to discuss at the first.

In these meetups, I think I learned two important things. The first one is trying to find the key point or the core target of the architecture we are evaluating. This is important for us to pick a solution best to match our service and avoid the cons brakes it.

Another one is communication skill, this is a skill I attach importance to my work. But I only do it well with the programmers, but for my customer or non-programmer partners, I didn't work well for them. In most cases, I usually hope the project manager can do it for me. But it still important when I need to explain some technical considerations to them.
