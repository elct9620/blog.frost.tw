---
title: "TGONext: Choose Architecture By Cons"
publishDate: 2020-03-15T03:02:32+08:00
tags: ["Architecture", "Microservice", "Database", "Experience", "TGONext"]
toc: true
series: TGONext
thumbnail: https://blog.frost.tw/images/2020-03-15-tgonext-choose-architecture-by-cons/thumbnail.jpg
credit: Photo by Lex Photography from Pexels
---

This meetup we review previous discussions and switch to the next topic. Based on the high concurrency we talk about the last meetup, we simulate an architecture and evolution it.

<!--more-->

## The trap inside the suggested way

At first, we have a monolithic application put web server and database in the same machine.

```
+-----------------------+
|+---------------------+|
||                     ||
||     Web Server      ||
||                     ||
|+---------------------+|
|+---------------------+|
||                     ||
||      Database       ||
||                     ||
|+---------------------+|
+-----------------------+
```

When the requests are growing, we will split the web server and database to the standalone machine.

```
+---------------------+          +---------------------+
|                     |          |                     |
|     Web Server      <---------->      Database       |
|                     |          |                     |
+---------------------+          +---------------------+
```

When we feel it slow down again, we put a "cache server" to our architecture.
For example, a cache server is added between the web server and database server.

```
+---------------------+      +---------------------+      +---------------------+
|                     |      |                     |      |                     |
|     Web Server      <------>    Cache Server     <------>      Database       |
|                     |      |                     |      |                     |
+---------------------+      +---------------------+      +---------------------+
```

When our cache crashed. The service will recovery after reboot or not?

> It may unable to recovery because the cache server lost everything when it restarts, and the webserver still sends a large number of requests to the cache server but passthrough to the database.

This is the "avalanche effect", one of our servers is failed and cause others to become unstable and finally let all service down.

Our mentor suggests to didn't add the cache server before our team member knows the pros and cons of the cache server, and know what happens the library or framework they are using.

## Will microservice rescue us?

If we want to prevent the "avalanche effect", you may associate it to the microservice which is popular in recent years.

The microservice is designed for "decentralize" which means each component can redeploy easily and work independently.

But it is too ideal, our service usually has some dependency on another service. For example, the webserver usually depends on the database.

This is another point we have to consider when we design an architecture.

In nowadays, the most popular way is to manage the dependency problem in microservice is to create a "sidecar" to control all community between components. The sidecar can know other services is alive or ready and report the status of the service which is managed.

Our mentor tells us an architecture solution usually depends on a problem that is designed to resolve it.

Another point is to find a problem in a microservice system, we have to know which service caused the issue. That means a microservice system needs a powerful log tracker to track each event inside the system.

## Which is paid for an architecture choice?

After we learn some popular terms and the latest architecture design we start to discuss when should we use microservice.

Our mentor tells us the performance includes three concern:

* Throughput
* Latency
* Memory Footprint

They will inflect each other which means if we choose one of them, the others should be paid for our gain.

In the microservice, it passes the packet inside the system to redirect it to the target services. That means the latency will be higher than other architecture, but it is decentralized and easier to create more components that we can easier to handle the growing incoming bandwidth.

The microservice uses latency to exchange more throughput to give us the ability to handle more requests.

But if our service requirements are low latency, the microservice will be a bad idea for our product.

### Domain-Driven Design

The DDD is one of our topics, our mentor also let us think about why DDD becomes popular when microservice is becoming popular.

We can find a similar part is they are both considered by a "domain." They try to let each service to focus on one business part. This is very different than the MVC we are using. And that is why the DDD is more close to the microservice's necessary.

On the other hand, if we want to use the microservice in our company. It depends on your company size and you have some problems to communicate with different departments. The microservice may be a good idea for each department to have its own service.

> But we have to consider the over design in our department.We may only need to create a monolithic application as the only service in our department or  company. The microservice still have a lot of requirement and have too many services in one department may cause more problem.

## The data consistency

Besides the performance, another important part is the data inside our architecture. Each system has its own state and our service needs decide to use a strong consistency or eventual consistency and it should be discussed carefully.

For example, the bank system should be a strong consistency. You may not expect it shows your money does not exist after you save it into the bank. And after one hour it shows again after the bank finished the consistency check.

> The distributed system is a data consistency problem too.

## The database's evolution

In a system, the database is directly related to the data consistency topics. Our mentor let us compare the RDBMS, NoSQL, and NewSQLs' different.

### RDBMS

Before the RDBMS there has an Object-Oriented Database, but we didn't discuss it even the PostgreSQL has the trait of it.

> This is the first state of evolution and most common for us so we didn't discuss it too many at this time.

### NoSQL

In the NoSQL cases, we paid the consistency for throughput. This is why NoSQL has good scalability to let us can scale it very easily.

But NoSQL had to implement a lot of things in the application layer because the RDBMS does many things for us but NoSQL doesn't do that for us.

> Another trait is the NoSQL is depended on the SSD trait to change the data store design and give us a super-fast key-value type data access.

### NewSQL

The NewSQL is the reflection of NoSQL, people start thinking about NoSQL as a database is not enough. There have many things that should not implement on the application layer and should be done in the database.

Therefore they are starting to create a NewSQL that has strong consistency similar to RDBMS but has enough scalability capability.

> Currently, the NewSQL is not popular and didn't have a lot of Open Source solutions.

## The choose of database

In the previous discussion, the mentor let us share our views about the reason to choose a database.

There have many cases to let us choose a database:

* The Database Feature
* Framework
* Team Member
* Customer's preference

There is no correct answer, like the above the architecture has many pros and cons in the different designs we discussed.

## Conclusion

This article lost a lot of detail, but I am out of my memory to write more details.

After the first meetup, I am worried about our discussion will stop at some calculate and knowledge we didn't know.

But in this meetup, our mentor gives us a new method or new viewpoint which we can apply to our work.

The most important thing is **find the cons in your solution** and review it before you decide to use it.

The pros usually give us benefits, but when our system has some trouble. The cons are the actual problem we have to face.

Therefore we have to choose an architecture with minimal damage to our product which means the cons didn't have too many conflicts with our product's requirements.
