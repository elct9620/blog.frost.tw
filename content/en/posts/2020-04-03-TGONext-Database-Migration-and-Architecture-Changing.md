---
title: "TGONext: Database Migration and Architecture Changing"
publishDate: 2020-04-03T21:14:56+08:00
date: 2020-04-03T21:14:56+08:00
tags: ["TGONext", "Architecture", "Database", "Experience"]
series: TGONext
toc: true
thumbnail: https://blog.frost.tw/images/2020-04-03-tgonext-database-migration-and-architecture-changing/thumbnail.jpg
credit: Photo by panumas nikhomkhai from Pexels
---

Before we starting to discuss architecture, our mentor let us ask some questions.

Between this meetup and previous meetup,  my customer breaks their migration due to some incorrect plan. So I raise a migration question to discuss the zero-downtime migration plan.

<!--more-->

## Migrate Database without Downtime

In my work, most customers are a startup and we can choose to stop our service for a short time and upgrade their server and migrate the database.

But for a large service, it may not acceptable to shutdown anything when upgrading or migration.

> Even we can stop service for one region but there are more global service is coming. It may unacceptable to other regions.

### The mentee's experience

I believe the most programmer include me knows the method to implement it, but there has a lot of concern we didn't expect.

Other mentees share their experience with:

* Don't remove any column
* Prevent migration rollback to drop anything
* Copy and rename the table
* Use trigger to mirror data

The most common method usually safer for the database is to prevent removing the column, and all of the above solutions I had heard about from the internet.

### Does the Database has version-control?

Our mentor points our more detailed information hidden in the discussion. Some mentees describe their method is the database cannot be lost between migration, that's means we decide to prevent remove any column or drop anything when rollback.

For example the source-code, we can jump to any version and didn't have any side-effects. Because the source-code is stateless, but if we try to change the database's version from `2020-03-28` to `2020-01-01` and is it possible to let everything back to `2020-03-28` after we migrate them again?

There didn't have a correct answer, it depends on the data is important or not for your service. But when we design a migration, we need to consider it and pick a safer policy.

### The Performance Lost

Since we decide to didn't remove any column, the database may slow down due to the database have to load a large row when we query something.

This is a trait of RDBMS, they are the row-based design if we use the NoSQL we may not get this problem because they use column-based design.

But we also have other choices, for example, use the rename table to prevent become large tables. Create a temporary table to apply changes before we are ready to replace them.

The GitHub has a tool [gh-ost](https://github.com/github/gh-ost) to let us didn't need to implement the flow by ourselves.

> Our mentor also reminds us, if our migration progress takes a long time and we want to pause the `gh-ost` is not allow it.

Besides the performance problem, we also need to consider the table-lock and other possible problems.

> I notice in the discussion there are many database behaviors we already know but we usually forget to connect them together and check for the risk when we choose to do it.

## The Database Scalability

This is the extended part of the migration question. Since we know the RDBMS and NoSQL have some different traits. We start to compare MySQL/PostgreSQL and MongoDB's design.

In the RDBMS we usually use B+ Tree to create the index. Our mentor asks us why MongoDB uses B Tree to create the index.

To speed up to find data, one of the ways reduces the total rows to find. In the RDBMS we may choose to use Shard or Partition to create a small subset of a table.

In the B+ Tree, the data node will connect to the next row that means RDBMS can have a fast range scan. But if we want to create a shard to split data to the different databases, it is hard for the database to choose a subtree to split it because the data node may be connected to another subtree's data node.

But for MongoDB, it uses the B Tree that means it will be very easy to split a subtree because the data node didn't connect to another subtree.

That means MongoDB can easier to scale but the cons are the range scan become very slow and sharding may use a lot disk I/O to move data.

> This discussion gives me a inspire for suggest database option. A small design concern will change to behaviors and pros and cons.

## The Architecture Changing

This is our main plan to discuss in this meetup. Our mentor let us share our idea about a service is unable to handle the requests.

In summary our idea, we have below chosen:

* Scale-up (Ex. Add memory, CPU)
* Scale-out (Add more same type instance)
* Add Cache
* Add Queue
* Add Rate-Limit (or throughput limit)
* Split services from a single instance

And next, our mentor let us share when we will change it from one type to another one. Our mentor says, there are many companies is sharing their stories, but that is not for our case.

Same as our every meetup, we start discussing the cons for each choice. For example, the scale-out seems a good idea but when we have over 300 or more machines is it easy to manage it? How long we had to spend on the upgrade?

We may want to merge them and reduce the total instance we manage. Our mentor also let us to check for the famous company which uses microservices to have how many microservices and is there has an up limit or not.

We also discuss the above options' prop and cons. I will pick some interesting parts to share for you.

> In the real world, we usually not only use one of them and we usually combine it to use. I feel it is similar to the toy bricks to let us combine or split them to fit our business.

## Queue

This is the most discuss part of our discussion.  At first, we are discussing the timing to use the queue.

For example, if we have a service is required a realtime result response the queue may not useful in this case. The queue gives us an async capability that means we have the same problem when we use the thread.

In the real world, we usually need to let our data write into the database in sequence to prevent race-condition. Therefore the Queue usually runs in order.

On the other hand, the queue usually has a capacity limit if our request is out of the capacity we have to blocking our user.

That means use the queue we get a buffer to write the database. But it also causes another bottleneck to another service.

> This is interesting for each option have their cons, it also matches I learned in the previous meetup. We have to consider the cons and carefully to pick one of the solutions.

### RabbitMQ

We also discuss some queue service solutions. The RabbitMQ is written in Erlang and the Erlang can recovery from the failed process. That means in the common case our queue needs to have a 2x memory to ensure it can correctly recovery. Because we have another backup in memory to ensure the failed process can be recovered.

### Kafka

Our mentor asks us,  the Kafka is written in Java but why it is fast? And why Java is slow?

One of the reasons is GC will cause some performance problems. But Java has an `Off-Heap` to manage the memory by ourselves so it can run faster than the common cases.

The Kafka focuses on throughput because it is developed by Linkedin and the throughput is more important for Linkedin. The mentor tells us, some compare is useless because they try to compare two similar services but didn't design to resolve the same problem.

## Region

Another interesting discussion is the region.  In the scale-up options which are usually hardest to upgrade? The answer is the network and this is why AWS, GCP, and most large global companies trying to build their submarine cable and data center in the different countries.

To have high-speed exchange data between two regions, we cannot improve it like buy more CPU, RAM or Disk.

Another question is when we have high-availability or master-master architecture. When one data center is shut down in an accident, does there have how many problems we have to resolve?

Maybe we have some data that didn't sync to another data center. If our major data center is recovered, how to keep data is consistent?

Or when our major data center stop, our stand-by data center already has the same hardware which can handle the requests?

## Conclusion

This meetup I think we learned more about how to choose a solution. In the past, I am very hard to answer other's why I use PostgreSQL or MySQL or why I choose Ruby.

At first, I think it is I am not professional enough about one of them. But I think the reason is I never consider their trait or detail behind their feature.

It is a good chance to practice thinking from the cons to find more detail. I also try to convert my thinking flow but it still hard to change my habit.
