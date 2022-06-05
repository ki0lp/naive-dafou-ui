---
title: rabbitmq基础
date: 2021/7/26
description: rabbitmq基础概述
category: 高级
tag: [Java, rabbitmq]
---

> 参照网址：https://www.jianshu.com/p/79ca08116d57
>
> 找到一篇不错的参照博文：https://www.cnblogs.com/ZhuChangwu/p/14093107.html

## MQ引言

> 市面上的消息队列产品有很多，比如老牌的 ActiveMQ、RabbitMQ ，目前我看最火的 Kafka ，还有 ZeroMQ ，去年底阿里巴巴捐赠给 Apache 的 RocketMQ ，连 redis 这样的 NoSQL 数据库也支持 MQ 功能

### 什么是MQ

消息message是指在应用间传输的数据，消息可以非常简单，比如只包含文本字符串，也可以更加复杂，可能包含嵌入式对象

> 消息队列（Message Queue）是一种应用间的通信方式，消息发送后可以立即返回，由消息系统来确保消息的可靠传递。消息发布者只管把消息发布到 MQ 中而不用管谁来取，消息使用者只管从 MQ 中取消息而不管是谁发布的。这样发布者和使用者都不用知道对方的存在

mq(message queue)翻译为消息队列，通过典型的生产者和消费者模型，生产者不断向消息队列中生产消息，消费者不断从队列中获取消息。因为生产和消费都是异步的，而且只关心消息的发送和接收，没有业务逻辑的侵入，轻松显现系统间的耦合，别名为消息中间件，通过利用高效的消息传递机制进行平台无关的数据交流，并基于数据通信来进行分布式系统的集成

### 为何用消息队列

消息队列是一种应用间的异步协作机制，那么什么时候用MQ呢？

以常见的订单系统为例，用户点击【下单】按钮之后的业务逻辑可能包括：扣减库存、生成相应单据、发红包、发短信通知。在业务发展初期这些逻辑可能放在一起同步执行，随着业务的发展订单量增长，需要提升系统服务的性能，这时可以将一些不需要立即生效的操作拆分出来异步执行，比如发放红包、发短信通知等。这种场景下就可以用 MQ ，在下单的主流程（比如扣减库存、生成相应单据）完成之后发送一条消息到 MQ 让主流程快速完结，而由另外的单独线程拉取MQ的消息（或者由 MQ 推送消息），当发现 MQ 中有发红包或发短信之类的消息时，执行相应的业务逻辑

### MQ有那些

当今市面上有很多主流的消息中间件，如老牌的ActiveMQ、RabbitMQ，炙手可热的kafka，阿里巴巴自主开发的RocketMQ等

### 不同MQ特点

1. ActiveMQ

是apache出品，最流行的，能力强劲的开源消息总线，它是一个完全支持JMS规范的消息中间件，丰富API，多种集群架构模式让ActiveMQ在业界称为老牌的消息中间件，在中小型企业中颇受欢迎，**性能受诟病，吞吐量不高**

> **JMS**：即Java消息服务（Java Message Service）**应用程序接口**，由sun公司提出，并且sun公司定义好了接口。包括create、send、recieve。只要想使用它，就得实现它定义的接口。 消息服务是一个与具体平台无关的API，绝大多数MOM提供商都对JMS提供支持。不好的地方是语言层面的限制，只能为JAVA，这其实稍微有点和微服务的观点相违背。要求语言只能是JAVA，而不能是py等

2. Kafka

kafka是linkedIn开源的分布式发布-订阅消息系统，目前归属于apache顶级项目，kafka主要特点是基于pull的模式来处理消息消费，最求高吞吐量，一开始的目的就是用于日志收集和传输，0.8版本开始支持复制，不支持事务，对消息的重复、丢失、错误没有严格的要求，适合产生大量数据的互联网服务的数据收集业务，**对数据一致性不高**

3. rocketmq

rocketmq是阿里云开源的消息中间件，它是纯Java开发，具有高吞吐量、高可用性、适合大规模分布式系统应用的特点。rocketmq思路起源于kafka，但并不是kafka的一个copy，它对消息的可靠性传输以及事务性做了优化，目前在阿里集团被广泛应用于交易、充值、流计算、消息推送、日志流式计算、binglog分发等场景，**开源的功能相对比较少，比如不支持事务**

4. rabbitmq

使用了erlang语言开发的开源消息队列系统，基于amqp协议来实现，amqp的主要特征是面向消息、队列、路由（包括点对点和发布/订阅）、可靠性、安全。amqp协议更多用在企业系统内对数据一致性、稳定性和可靠性要求很高的场景，对性能和吞吐量还在其次

> rabbitmq比kafka可靠，kafka更适合IO高吞吐的处理，一般应用在大数据日志处理或者对实时性（少量延迟），可靠性（少量丢数据）要求稍低场景使用，比如ELK日志收集

## rabbitmq引言

### rabbitmq

> 基于AMQP协议，erlang语言开发（本身就是做socket编程做的不错的），是部署最刚发的开源消息中间件，是最受欢迎的开源消息中间件之一
>
> - AMQP支持消息中间件的很多的业务场景，比如点对点的发布、以及交换机路由、发布订阅模式
> - erlang语言开发，本身就是做socket编程做的不错的，效率很好
> - 和spring框架天生的无缝的整合
> - 对数据一致性的要求和消息的丢失处理非常，即使是数据出现错误的话，也可以通过内部的机制恢复
>
> 官网：https://www.rabbitmq.com/
>
> 官方教程：https://www.rabbitmq.c(rabbitmq基础/om/#getstarted

### 特点

RabbitMQ 是一个由 Erlang 语言开发的 AMQP 的开源实现。

AMQP ：Advanced Message Queue，高级消息队列协议。它是应用层协议的一个开放标准，为面向消息的中间件设计，基于此协议的客户端与消息中间件可传递消息，并不受产品、开发语言等条件的限制。

RabbitMQ 最初起源于金融系统，用于在分布式系统中存储转发消息，在易用性、扩展性、高可用性等方面表现不俗。具体特点包括：

- 可靠性，持久化、传输确认、发布确认等
- 灵活的路由，在消息进入队列之前，通过exchange来路由消息，对于典型的路由功能，rabbitmq已经提供了一些内置的exchange来实现。针对更加复杂的路由功能，可以将多个exchange绑定在一起，也通过插件机制实现自己的exchange
- 消息集群，多个rabbitmq服务器组成一个集群
- 高可用，队列可以在集群中的机器上进行镜像，使得在部分节点出现问题时仍然可以使用
- 多种协议，支持多种消息队列协议
- 多语言客户端，支持多种语言
- 管理界面，易用管理界面
- 跟踪机制，如果消息异常，使用者可以找出发生了什么
- 插件机制，提供多种插件进行多方面扩展，也可以扩展自己的插件

#### AMQP协议

advance message queuing  protocol （高级消息队列协议）在2003年时被提出，最早用于解决金融领域不同平台之间消息传递交互问题。顾名思义，AMQP是一种协议，更准确的说是一种binary wire-leavl protocol（链接协议）。这是其和JMS的本质差别，AMQP不从api层进行限定，而是直接定义网络交换的数据格式。这使得实现了AMQP的provider天然性就是跨平台的。以下是AMQP协议模型：

![image-20211209021623989](./rabbitmq基础/image-20211209021623989.png)

### rabbitmq中的概念

#### 消息模型

RabbitMQ支持以下五种消息模型，第六种RPC本质上是服务调用，所以不算做服务通信消息模型。

![img](./rabbitmq基础/1496926-20201206162020922-723030915.png)

![img](./rabbitmq基础/1496926-20201206162022288-710990876.png)

消费者（consumer）订阅某个队列，生产者（producer）创建消息，然后发布到队列（queue）中，最后将消息发送到监听的消费者手里

![img](./rabbitmq基础/1496926-20190708125542629-2135674001.png)

- P（producer/ publisher）：生产者，发送消息的服务

- C（consumer）：消费者，接收消息的服务

- 红色区域就是MQ中的Queue，可以把它理解成一个邮箱

  - 首先信件来了不强求必须马上马去拿

  - 其次,它是有最大容量的(受主机和磁盘的限制,是一个缓存区)

  - 允许多个消费者监听同一个队列，争抢消息


Worker模型

![img](./rabbitmq基础/1496926-20190708125528529-1014015990.png)

Worker模型中也只有一个工作队列。但它是一种竞争消费模式。可以看到同一个队列我们绑定上了多个消费者，消费者争抢着消费消息，**这可以有效的避免消息堆积**

比如对于短信微服务集群来说就可以使用这种消息模型，来了请求大家抢着消费掉

如何实现这种架构：对于上面的HelloWorld这其实就是相同的服务我们启动了多次罢了，自然就是这种架构

#### rabbitmq基本概念

rabbitmq是AMQP协议的一种开源实现，所以其内部实际上也是AMQP中的基本概念

![img](./rabbitmq基础/5015984-367dd717d89ae5db.png)

1. message

消息，它由消息头和消息体组成。消息体是不透明的，而消息头则由一系列的可选属性组成，这些属性包括routing-key（路由键）、priority（相对于其他消息的优先权）、delivery-mode（指出该消息可能需要持久性存储）等

2. publisher

消息的生产者，也是一个向交换机发布消息的客户端应用程序

3. exchange

交换器，用来接收生产者发送的消息并将这些消息路由给服务器中的队列

4. binding

绑定，用于消息队列和交换器之间的关联。一个绑定就是基于路由键将交换器和消息队列连接起来的路由规则，所以可以将交换器理解成一个由绑定构成的路由表

5. queue

消息队列，用来保存消息直到发送给消费者。它是消息的容器，也是消息的终点。一个消息可投入一个或多个队列。消息一直在队列里面，等待消费者连接到这个队列将其取走

6. connection

网络连接，比如一个TCP连接

7. channel

信道，多路复用连接中的一条独立的双向数据流通道。信道是建立在真实的TCP连接内地虚拟连接，AMQP 命令都是通过信道发出去的，不管是发布消息、订阅队列还是接收消息，这些动作都是通过信道完成。因为对于操作系统来说建立和销毁 TCP 都是非常昂贵的开销，所以引入了信道的概念，以复用一条 TCP 连接

8. consumer

消息的消费者，表示一个从消息队列中取走消息的客户端应用程序

9. virtual host

虚拟主机，表示一批交换器、消息队列和相关对象。虚拟主机是共享相同的身份认证和加密环境的独立服务器域。每个 vhost 本质上就是一个 mini 版的 RabbitMQ 服务器，拥有自己的队列、交换器、绑定和权限机制。vhost 是 AMQP 概念的基础，必须在连接时指定，RabbitMQ 默认的 vhost 是 / 

10. broker

表示消息队列服务器实体

#### amqp中的路由

> AMQP 中消息的路由过程和 Java 开发者熟悉的 JMS 存在一些差别，AMQP 中增加了 Exchange 和 Binding 的角色。生产者把消息发布到 Exchange 上，消息最终到达队列并被消费者接收，而 Binding 决定交换器的消息应该发送到那个队列
>
> ![img](./rabbitmq基础/5015984-7fd73af768f28704.png)

#### exchange类型

Exchange分发消息时根据类型的不同分发策略有区别，目前共四种类型：direct、fanout、topic、headers 。headers 匹配 AMQP 消息的 header 而不是路由键，此外 headers 交换器和 direct 交换器完全一致，但性能差很多，目前几乎用不到了，所以直接看另外三种类型：

1. direct 直连

![img](./rabbitmq基础/5015984-13db639d2c22f2aa.png)

消息中的路由键（routing key）如果和 Binding 中的 binding key 一致， 交换器就将消息发到对应的队列中。路由键与队列名完全匹配，如果一个队列绑定到交换机要求路由键为“dog”，则只转发 routing key 标记为“dog”的消息，不会转发“dog.puppy”，也不会转发“dog.guard”等等。它是完全匹配、单播的模式

2. fanout 扇出

![img](./rabbitmq基础/5015984-2f509b7f34c47170.png)

每个发到 fanout 类型交换器的消息都会分到所有绑定的队列上去。fanout 交换器不处理路由键，只是简单的将队列绑定到交换器上，每个发送到交换器的消息都会被转发到与该交换器绑定的所有队列上。很像子网广播，每台子网内的主机都获得了一份复制的消息。fanout 类型转发消息是最快的

3. topic 拓扑

![img](./rabbitmq基础/5015984-275ea009bdf806a0.png)

topic 交换器通过模式匹配分配消息的路由键属性，将路由键和某个模式进行匹配，此时队列需要绑定到一个模式上。它将路由键和绑定键的字符串切分成单词，这些单词之间用点隔开。它同样也会识别两个通配符：符号“#”和符号“\*”。#匹配0个或多个单词，\*匹配不多不少一个单词

这些路由键可以包含很多单词，但路由键总长度不能超过255个字节

#### virtual host

可以通过MySQL和MySQL中的数据库来理解RabbitMQ和virtual host的关系

MySQL大家都不陌生，经常会出现多个业务线混用一个MySQL数据库的情况，就像下图这样，每个业务线都在MySQL中创建自己的数据库，使用时各自往各自的数据库中存储数据，彼此相互不干涉

![img](./rabbitmq基础/1496926-20201206162008852-1886576080.png)

RabbitMQ和virtual host的关系也差不多，可以让多个业务线同时使用一个RabbitMQ，只要为业务线各个业务线绑定上不同的virtual host即可

![img](./rabbitmq基础/1496926-20201206162009680-1992407247.png)

##### 创建virtual host并指定用户可以使用它

![img](./rabbitmq基础/1496926-20201206162010556-1179446240.png)

![img](./rabbitmq基础/1496926-20201206162011544-793083561.png)

![img](./rabbitmq基础/1496926-20201206162012923-103289151.png)

![img](./rabbitmq基础/1496926-20201206162016640-682825445.png)

## 安装

### 官网下载

> 官网下载地址：https://www.rabbitmq.com/download.html

因为rabbitmq是使用erlang语言开发的，所有除了需要安装rabbitmq的安装包之外，还需要下载erlang的依赖

![image-20211209022116979](./rabbitmq基础/image-20211209022116979.png)

### mac下安装

1. 更新brew

使用 HomeBrew 来安装，安装前要先更新 brew

```bash
brew update
```

2. 安装rabbitmq

```bash
(base) aldencarter@aldencarter ~ % brew install 11.rabbitmq
Running `brew update --preinstall`...
==> Downloading https://mirrors.ustc.edu.cn/homebrew-bottles/wxwidgets-3.1.5.big_sur.bottle.tar.gz
######################################################################### 100.0%
==> Downloading https://mirrors.ustc.edu.cn/homebrew-bottles/erlang-24.1.7.big_sur.bottle.tar.gz
######################################################################### 100.0%
==> Downloading https://mirrors.ustc.edu.cn/homebrew-bottles/11.rabbitmq-3.9.11.all.bottle.tar.gz
######################################################################### 100.0%
==> Installing dependencies for 11.rabbitmq: wxwidgets and erlang
==> Installing 11.rabbitmq dependency: wxwidgets
==> Pouring wxwidgets-3.1.5.big_sur.bottle.tar.gz
🍺  /usr/local/Cellar/wxwidgets/3.1.5: 828 files, 24.7MB
==> Installing 11.rabbitmq dependency: erlang
==> Pouring erlang-24.1.7.big_sur.bottle.tar.gz
🍺  /usr/local/Cellar/erlang/24.1.7: 7,145 files, 483.5MB
==> Installing 11.rabbitmq
==> Pouring 11.rabbitmq-3.9.11.all.bottle.tar.gz
==> Caveats
Management Plugin enabled by default at http://localhost:15672

To restart 11.rabbitmq after an upgrade:
  brew services restart 11.rabbitmq
Or, if you don't want/need a background service you can just run:
  CONF_ENV_FILE="/usr/local/etc/11.rabbitmq/11.rabbitmq-env.conf" /usr/local/opt/11.rabbitmq/sbin/11.rabbitmq-server
==> Summary
🍺  /usr/local/Cellar/11.rabbitmq/3.9.11: 1,382 files, 29.8MB
==> Running `brew cleanup 11.rabbitmq`...
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see `man brew`).
==> Caveats
==> 11.rabbitmq
Management Plugin enabled by default at http://localhost:15672

To restart 11.rabbitmq after an upgrade:
  brew services restart 11.rabbitmq
Or, if you don't want/need a background service you can just run:
  CONF_ENV_FILE="/usr/local/etc/rabbitmq/rabbitmq-env.conf" /usr/local/opt/11.rabbitmq/sbin/11.rabbitmq-server
```

这样 RabbitMQ 就安装好了，安装过程中会自动其所依赖的 Erlang，通过上面的一些输出信息我们可以知道：

- erlang安装目录：`/usr/local/Cellar/erlang/24.1.7`

- rabbitmq安装目录：`/usr/local/Cellar/rabbitmq/3.9.11`
- To restart rabbitmq after an upgrade：`brew services restart rabbitmq`
- 浏览器访问连接：http://localhost:15672

3. 测试运行

通过上面安装的提示，我们可以知道它安装在了`/usr/local/Cellar/rabbitmq/3.9.11`，所以我们进入这个目录，启动rabbitmq

```bash
(base) aldencarter@aldencarter sbin % pwd
/usr/local/Cellar/11.rabbitmq/3.9.11/sbin
(base) aldencarter@aldencarter sbin % ll
total 184
drwxr-xr-x  13 aldencarter  admin    416 12  9 13:59 ./
drwxr-xr-x  36 aldencarter  admin   1152 12  9 13:59 ../
-r-xr-xr-x   1 aldencarter  admin    678 12  9 13:59 11.rabbitmq-defaults*
-r-xr-xr-x   1 aldencarter  admin    864 12  2 15:12 11.rabbitmq-diagnostics*
-r-xr-xr-x   1 aldencarter  admin   6874 12  9 13:59 11.rabbitmq-env*
-r-xr-xr-x   1 aldencarter  admin    860 12  2 15:12 11.rabbitmq-plugins*
-r-xr-xr-x   1 aldencarter  admin    859 12  2 15:12 11.rabbitmq-queues*
-r-xr-xr-x   1 aldencarter  admin   6002 12  2 15:12 11.rabbitmq-server*
-r-xr-xr-x   1 aldencarter  admin    857 12  2 15:12 11.rabbitmq-streams*
-r-xr-xr-x   1 aldencarter  admin    858 12  2 15:12 11.rabbitmq-tanzu*
-r-xr-xr-x   1 aldencarter  admin    860 12  2 15:12 11.rabbitmq-upgrade*
-r-xr-xr-x   1 aldencarter  admin  42225 12  2 15:12 rabbitmqadmin*
-r-xr-xr-x   1 aldencarter  admin    855 12  2 15:12 rabbitmqctl*
(base) aldencarter@aldencarter sbin % .11.rabbitmq-server*
zsh: no matches found: .11.rabbitmq-server*
(base) aldencarter@aldencarter sbin % ./11.rabbitmq-server*
2021-12-09 14:12:59.772865+08:00 [info] <0.221.0> Feature flags: list of feature flags found:
2021-12-09 14:12:59.785462+08:00 [info] <0.221.0> Feature flags:   [ ] implicit_default_bindings
2021-12-09 14:12:59.785489+08:00 [info] <0.221.0> Feature flags:   [ ] maintenance_mode_status
2021-12-09 14:12:59.785502+08:00 [info] <0.221.0> Feature flags:   [ ] quorum_queue
2021-12-09 14:12:59.785518+08:00 [info] <0.221.0> Feature flags:   [ ] stream_queue
2021-12-09 14:12:59.785563+08:00 [info] <0.221.0> Feature flags:   [ ] user_limits
2021-12-09 14:12:59.785574+08:00 [info] <0.221.0> Feature flags:   [ ] virtual_host_metadata
2021-12-09 14:12:59.785586+08:00 [info] <0.221.0> Feature flags: feature flag states written to disk: yes
2021-12-09 14:13:00.168756+08:00 [noti] <0.44.0> Application syslog exited with reason: stopped
2021-12-09 14:13:00.168812+08:00 [noti] <0.221.0> Logging: switching to configured handler(s); following messages may not be visible in this log output

  ###  ###      RabbitMQ 3.9.11
  ###  ##
  ###########  Copyright (c) 2007-2021 VMware, Inc. or its affiliates.
  #######  ##
  ###########  Licensed under the MPL 2.0. Website: https://rabbitmq.com

  Erlang:      24.1.7 [jit]
  TLS Library: OpenSSL - OpenSSL 1.1.1l  24 Aug 2021

  Doc guides:  https://rabbitmq.com/documentation.html
  Support:     https://rabbitmq.com/contact.html
  Tutorials:   https://rabbitmq.com/getstarted.html
  Monitoring:  https://rabbitmq.com/monitoring.html

  Logs: /usr/local/var/log/11.rabbitmq/rabbit@localhost.log
        /usr/local/var/log/11.rabbitmq/rabbit@localhost_upgrade.log
        <stdout>

  Config file(s): (none)

  Starting broker... completed with 7 plugins.
```

如果想要程序在后台启动，可以添加`-detached`参数

```bash
.11.rabbitmq-server* -detached
```

此时我们通过浏览器访问`http://localhost:15672/`，输入初始账号guest和初始密码guest，就可以看到rabbitmq的后台管理界面

![image-20211209142312115](./rabbitmq基础/image-20211209142312115.png)

4. 查看运行信息

该命令将输出服务器的很多信息，比如 RabbitMQ 和 Erlang 的版本、OS 名称、内存等等

```bash
(base) aldencarter@aldencarter sbin % ./rabbitmqctl status 
Status of node rabbit@localhost ...
Runtime

OS PID: 89583
OS: macOS
Uptime (seconds): 176
Is under maintenance?: false
RabbitMQ version: 3.9.11
Node name: rabbit@localhost
Erlang configuration: Erlang/OTP 24 [erts-12.1.5] [source] [64-bit] [smp:16:16] [ds:16:16:10] [async-threads:1] [jit] [dtrace]
Erlang processes: 453 used, 1048576 limit
Scheduler run queue: 1
Cluster heartbeat timeout (net_ticktime): 60

Plugins

Enabled plugin file: /usr/local/etc/11.rabbitmq/enabled_plugins
Enabled plugins:

 * rabbitmq_stomp
 * rabbitmq_mqtt
 * rabbitmq_stream
 * rabbitmq_stream_common
 * rabbitmq_amqp1_0
 * rabbitmq_management
 * amqp_client
 * rabbitmq_web_dispatch
 * cowboy
 * cowlib
 * rabbitmq_management_agent

Data directory

Node data directory: /usr/local/var/lib/11.rabbitmq/mnesia/rabbit@localhost
Raft data directory: /usr/local/var/lib/11.rabbitmq/mnesia/rabbit@localhost/quorum/rabbit@localhost

Config files


Log file(s)

 * /usr/local/var/log/11.rabbitmq/rabbit@localhost.log
 * /usr/local/var/log/11.rabbitmq/rabbit@localhost_upgrade.log
 * <stdout>

Alarms

(none)

Memory

Total memory used: 0.1521 gb
Calculation strategy: rss
Memory high watermark setting: 0.4 of available memory, computed to: 13.7439 gb

reserved_unallocated: 0.0732 gb (48.17 %)
code: 0.0354 gb (23.29 %)
other_system: 0.0214 gb (14.07 %)
other_proc: 0.0195 gb (12.83 %)
other_ets: 0.0037 gb (2.41 %)
plugins: 0.0026 gb (1.7 %)
atom: 0.0014 gb (0.94 %)
metrics: 2.0e-4 gb (0.15 %)
mgmt_db: 2.0e-4 gb (0.13 %)
binary: 1.0e-4 gb (0.06 %)
mnesia: 1.0e-4 gb (0.06 %)
quorum_ets: 0.0 gb (0.02 %)
msg_index: 0.0 gb (0.02 %)
connection_other: 0.0 gb (0.0 %)
stream_queue_procs: 0.0 gb (0.0 %)
stream_queue_replica_reader_procs: 0.0 gb (0.0 %)
allocated_unused: 0.0 gb (0.0 %)
connection_channels: 0.0 gb (0.0 %)
connection_readers: 0.0 gb (0.0 %)
connection_writers: 0.0 gb (0.0 %)
queue_procs: 0.0 gb (0.0 %)
queue_slave_procs: 0.0 gb (0.0 %)
quorum_queue_procs: 0.0 gb (0.0 %)
stream_queue_coordinator_procs: 0.0 gb (0.0 %)

File Descriptors

Total: 2, limit: 159
Sockets: 0, limit: 141

Free Disk Space

Low free disk space watermark: 0.05 gb
Free disk space: 956.6264 gb

Totals

Connection count: 0
Queue count: 0
Virtual host count: 1

Listeners

Interface: [::], port: 15672, protocol: http, purpose: HTTP API
Interface: [::], port: 5552, protocol: stream, purpose: stream
Interface: [::], port: 1883, protocol: mqtt, purpose: MQTT
Interface: [::], port: 61613, protocol: stomp, purpose: STOMP
Interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Interface: 127.0.0.1, port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
```

5. 关闭rabbitmq节点

我们知道 RabbitMQ 是用 Erlang 语言写的，在Erlang 中有两个概念：节点和应用程序。节点就是 Erlang 虚拟机的每个实例，而多个 Erlang 应用程序可以运行在同一个节点之上。节点之间可以进行本地通信（不管他们是不是运行在同一台服务器之上）。比如一个运行在节点A上的应用程序可以调用节点B上应用程序的方法，就好像调用本地函数一样。如果应用程序由于某些原因奔溃，Erlang 节点会自动尝试重启应用程序。
如果要关闭整个 RabbitMQ 节点可以用参数 stop

```bash
(base) aldencarter@aldencarter sbin % rabbitmqctl stop
Stopping and halting node rabbit@localhost ...
```

它会和本地节点通信并指示其干净的关闭，也可以指定关闭不同的节点，包括远程节点，只需要传入参数 -n ：

```bash
rabbitmqctl -n rabbit@server.example.com stop
```

-n node 默认 node 名称是 rabbit@server ，如果你的主机名是 [server.example.com](https://link.jianshu.com?t=http://server.example.com) ，那么 node 名称就是 [rabbit@server.example.com](https://link.jianshu.com?t=mailto:rabbit@server.example.com) 。

6. 关闭 RabbitMQ 应用程序

如果只想关闭应用程序，同时保持 Erlang 节点运行则可以用 stop_app：

```bash
rabbitmqctl stop_app
```

7. 启动rabbitmq应用程序

```bash
rabbitmqctl start_app
```

8. 重置 RabbitMQ 节点

```bash
rabbitmqctl reset
```

该命令将清除所有的队列

9. 查看已声明的队列

```bash
rabbitmqctl list_queues
```

10. 查看交换器

```bash
rabbitmqctl list_exchanges
```

该命令还可以附加参数，比如列出交换器的名称、类型、是否持久化、是否自动删除：

```bash
rabbitmqctl list_exchanges name type durable auto_delete
```

11. 查看绑定

```bash
rabbitmqctl list_bindings
```

### linux下安装

因为rabbitmq依赖于erlang环境，所以我们需要先安装erlang，然后在安装rabbitmq

> 参照网址：https://segmentfault.com/a/1190000021539070

#### 安装erlang环境(需要根据rabbitmq的版本对应)

> 我后面安装的rabbitmq版本需要的erlang版本比这这高，直接使用yum安装就好

1. 安装GCC GCC-C++ Openssl等模块,安装过就不需要安装了

```bash
yum -y install make gcc gcc-c++ kernel-devel m4 ncurses-devel openssl-devel
```

2. 安装ncurses

```bash
yum -y install ncurses-devel
```

3. 安装erlang环境

wget下载速度太慢了，在本地电脑下载在上传上去，**修改为国内源也无效**

![image-20211209150119715](./rabbitmq基础/image-20211209150119715.png)

上传到opt目录下

```bash
(base) aldencarter@aldencarter sbin % scp ~/Downloads/otp_src_22.0.tar.gz root@172.16.187.9:/opt/
root@172.16.187.9's password: 
otp_src_18.2.1.tar.gz                                                                 100%   65MB 132.2MB/s   00:00
```

解压并进入目录

```bash
tar xvfz otp_src_22.0.tar.gz
cd otp_src_18.2.1
```

执行配置并安装

```bash
## 执行配置
./configure
## 安装，还整挺久
make install
```

4. 验证erlang环境安装完成

```bash
[root@localhost 22]## erl -v
Erlang/OTP 22 [erts-10.4] [source] [64-bit] [smp:2:2] [ds:2:2:10] [async-threads:1] [hipe]

Eshell V10.4  (abort with ^G)
1>
```

##### 修改yum源为国内镜像

如果上面下载太慢了，可以更改为国内镜像

1. 安装wget

`yum install -y wget`

2. 完事前都做备份

`mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup`

3. 下载阿里云镜像文件

`wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo`

4. 清理缓存

`yum clean all`

5. 生成缓存

`yum makecache`

6. 更新最新源设置

`yum update -y`

#### 安装rabbitmq

> 官方的通过rpm安装教程：https://www.rabbitmq.com/install-rpm.html

1. 安装rabbitmq的依赖包

```bash
[root@localhost etc]## yum install socat logrotate -y ## 我已经安装过了，所以无需处理
已加载插件：fastestmirror
Loading mirror speeds from cached hostfile
 * base: mirror.hostlink.com.hk
 * centos-sclo-rh: mirror.hostlink.com.hk
 * centos-sclo-sclo: mirror.hostlink.com.hk
 * extras: mirror.hostlink.com.hk
 * updates: mirror.hostlink.com.hk
软件包 socat-1.7.3.2-2.el7.x86_64 已安装并且是最新版本
软件包 logrotate-3.8.6-19.el7.x86_64 已安装并且是最新版本
无须任何处理
```

2. 从官方下载rpm包并上传到centos

```bash
[root@localhost opt]## ll | grep 11.rabbitmq
-rw-r--r--   1 root root    14392152 12月  9 16:45 11.rabbitmq-server-3.9.11-1.suse.noarch.rpm
```

已经上传

3. 安装rabbitmq-server

```bash
## 版本问题
[root@localhost opt]## rpm -ivh 11.rabbitmq-server-3.9.11-1.suse.noarch.rpm
警告：11.rabbitmq-server-3.9.11-1.suse.noarch.rpm: 头V4 RSA/SHA512 Signature, 密钥 ID 6026dfca: NOKEY
错误：依赖检测失败：
	erlang >= 23.2 被 11.rabbitmq-server-3.9.11-1.suse.noarch 需要
```

真麻烦，删除刚才安装的erlang，直接使用yum安装最新的

```bash
yum install erlang
```

![image-20211209172317812](./rabbitmq基础/image-20211209172317812.png)

安装rabbitmq

```bash
[root@localhost opt]## rpm -ivh 11.rabbitmq-server-3.9.11-1.suse.noarch.rpm
警告：11.rabbitmq-server-3.9.11-1.suse.noarch.rpm: 头V4 RSA/SHA512 Signature, 密钥 ID 6026dfca: NOKEY
准备中...                          ################################## [100%]
正在升级/安装...
   1:11.rabbitmq-server-3.9.11-1.suse    ################################## [100%]
```

4. 启动rabbitmq

```bash
[root@localhost ~]## systemctl start 11.rabbitmq-server
```

5. 查看rabbitmq状态

```bash
[root@localhost ~]## rabbitmqctl status
Status of node rabbit@localhost ...
Runtime

## 进程pid
OS PID: 130734
OS: Linux
Uptime (seconds): 33
Is under maintenance?: false
RabbitMQ version: 3.9.11 ## 版本
Node name: rabbit@localhost ## 节点名称，在erlang中有节点和应用的概念

## erlang 配置信息

Erlang configuration: Erlang/OTP 23 [erts-11.2.2.7] [source] [64-bit] [smp:2:2] [ds:2:2:10] [async-threads:1] [hipe]
Erlang processes: 267 used, 1048576 limit
Scheduler run queue: 1
Cluster heartbeat timeout (net_ticktime): 60

## 11.rabbitmq 插件
Plugins

Enabled plugin file: /etc/11.rabbitmq/enabled_plugins
Enabled plugins:

## 数据存储目录
Data directory

Node data directory: /var/lib/11.rabbitmq/mnesia/rabbit@localhost
Raft data directory: /var/lib/11.rabbitmq/mnesia/rabbit@localhost/quorum/rabbit@localhost

## 配置文件
Config files


## 日志
Log file(s)

 * /var/log/11.rabbitmq/rabbit@localhost.log
 * /var/log/11.rabbitmq/rabbit@localhost_upgrade.log
 * <stdout>

## 警报
Alarms

(none)

## 内存信息
Memory

Total memory used: 0.0703 gb
Calculation strategy: rss
Memory high watermark setting: 0.4 of available memory, computed to: 0.4078 gb

code: 0.0242 gb (34.16 %)
other_proc: 0.0187 gb (26.4 %)
other_system: 0.0128 gb (18.04 %)
allocated_unused: 0.0103 gb (14.49 %)
other_ets: 0.003 gb (4.2 %)
atom: 0.0013 gb (1.87 %)
metrics: 0.0002 gb (0.31 %)
binary: 0.0002 gb (0.27 %)
mnesia: 0.0001 gb (0.13 %)
plugins: 0.0 gb (0.05 %)
quorum_ets: 0.0 gb (0.04 %)
msg_index: 0.0 gb (0.04 %)
stream_queue_procs: 0.0 gb (0.0 %)
stream_queue_replica_reader_procs: 0.0 gb (0.0 %)
connection_channels: 0.0 gb (0.0 %)
connection_other: 0.0 gb (0.0 %)
connection_readers: 0.0 gb (0.0 %)
connection_writers: 0.0 gb (0.0 %)
mgmt_db: 0.0 gb (0.0 %)
queue_procs: 0.0 gb (0.0 %)
queue_slave_procs: 0.0 gb (0.0 %)
quorum_queue_procs: 0.0 gb (0.0 %)
reserved_unallocated: 0.0 gb (0.0 %)
stream_queue_coordinator_procs: 0.0 gb (0.0 %)

File Descriptors

Total: 2, limit: 32671
Sockets: 0, limit: 29401

Free Disk Space

Low free disk space watermark: 0.05 gb
Free disk space: 41.1812 gb

Totals

Connection count: 0 ## 连接数量
Queue count: 0 ## 队列数量
Virtual host count: 1 ## 主机数量

## 监听端口
Listeners

Interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication ## 应该是通信的端口
Interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0 ## AMQP端口
```

7. 开启rabbitmq的web管理界面

```bash
[root@localhost ~]## 11.rabbitmq-plugins enable rabbitmq_management
Enabling plugins on node rabbit@localhost:
rabbitmq_management
The following plugins have been configured:
  rabbitmq_management
  rabbitmq_management_agent
  rabbitmq_web_dispatch
Applying plugin configuration to rabbit@localhost...
The following plugins have been enabled:
  rabbitmq_management
  rabbitmq_management_agent
  rabbitmq_web_dispatch

started 3 plugins.
```

然后我们就可以通过curl访问到rabbitmq的web界面了

![image-20211209174027079](./rabbitmq基础/image-20211209174027079.png)

7. 配置远程访问方式一

出于安全的考虑，guest这个默认的用户只能通过http://localhost:15672 来登录，不能使用IP地址登录，也就是不能远程访问，在这里可以新建一个账号，赋予管理员权限，实现远程访问

默认rabbitmq在启动之后会去读取`/etc/rabbitmq/`目录下的名为`rabbitmq.config`的配置文件

rabbitmq的系统配置文件一般是rabbitmq.conf，可以登录后台查看它的路径，如果你是源码安装，最初这个文件是没有的，需要手动创建

如果是apt安装他的位置在/etc/rabbitmq/目录下，它规定了rabbitmq的众多参数设定

> 如果你没有找到的话也没关系，去github上拷贝一份模版配置，手动创建 `/etc/rabbitmq/rabbitmq.config` 配置文件，然后将你拷贝的配置放进去也是ok的
>
> rabbitmq github addr：https://github.com/rabbitmq/rabbitmq-server/blob/v3.8.9/docs/

> 官方：强烈不建议允许默认的用户可远程登陆MQ，用过RabbitMQ的程序员都知道默认用户名和密码是啥，这会让你的系统的安全性大大降低！
>
> 推荐的做法是：删除默认用户、使用新的安全凭证创建新的用户

添加以下配置信息

```bash
[
{rabbit, [{tcp_listeners, [5672]}, {loopback_users, ["admin"]}]}
].
```

新增远程访问管理账号：admin

```bash
[root@localhost 11.rabbitmq]## rabbitmqctl add_user admin 12345
Adding user "admin" ...
Done. Don't forget to grant the user permissions to some virtual hosts! See 'rabbitmqctl help set_permissions' to learn more.
[root@localhost 11.rabbitmq]## rabbitmqctl set_user_tags admin administrator
Setting tags for user "admin" to [administrator] ...
[root@localhost 11.rabbitmq]## rabbitmqctl set_permissions -p "/" admin ".*" ".*" ".*"
Setting permissions for user "admin" in vhost "/" ...
[root@localhost 11.rabbitmq]## rabbitmqctl list_users
Listing users ...
user	tags
admin	[administrator]
guest	[administrator]
```

**如果不能访问，记得关闭防火墙**

通过浏览器已经可以访问了。

![image-20211209184733523](./rabbitmq基础/image-20211209184733523.png)

8. 配置远程访问方式二

> 去github上拷贝一份模版配置，手动创建 `/etc/rabbitmq/rabbitmq.config` 配置文件，然后将你拷贝的配置放进去也是ok的
>
> rabbitmq github addr：https://github.com/rabbitmq/rabbitmq-server/blob/v3.8.9/docs/

然后将配置文件中的lookback_users设置为none

![img](./rabbitmq基础/1496926-20201206161952296-434923127.png)

然后通过service命令重启MQ，在web页面尝试登陆，接着你会成功登陆，然后添加用户，这样就可以使用添加的这个用户进行登录了

![img](./rabbitmq基础/1496926-20201206161955945-1616483470.png)

9. 如果想要开机自启动，可以设置

```bash
chkconfig 11.rabbitmq-server on ## 设置rabbitmq开机启动
```

### docker下安装

访问rabbitmq官方的安装页面：https://www.rabbitmq.com/download.html

![image-20211209143545465](./rabbitmq基础/image-20211209143545465.png)

1. 直接使用命令

`docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.8-management`即可，docker如果在本地找不到这个镜像会自动去仓库找，找到并下载镜像启动

最好就是在加一个参数-d，让它在后台运行，不要在前台运行`docker run -d -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.8-management`

查看运行状态

```bash
[root@localhost ~]## docker ps
CONTAINER ID   IMAGE                     COMMAND                  CREATED         STATUS         PORTS                                                                                                                                                 NAMES
f938fee3451f   11.rabbitmq:3.8-management   "docker-entrypoint.s…"   6 minutes ago   Up 6 minutes   4369/tcp, 5671/tcp, 0.0.0.0:5672->5672/tcp, :::5672->5672/tcp, 15671/tcp, 15691-15692/tcp, 25672/tcp, 0.0.0.0:15672->15672/tcp, :::15672->15672/tcp   11.rabbitmq
```

2. 进入容器查看rabbitmq状态和执行上面mac下的命令都是可以的

```bash
## 进入容器
[root@localhost ~]## docker ps
CONTAINER ID   IMAGE                     COMMAND                  CREATED         STATUS         PORTS                                                                                                                                                 NAMES
f938fee3451f   11.rabbitmq:3.8-management   "docker-entrypoint.s…"   8 minutes ago   Up 8 minutes   4369/tcp, 5671/tcp, 0.0.0.0:5672->5672/tcp, :::5672->5672/tcp, 15671/tcp, 15691-15692/tcp, 25672/tcp, 0.0.0.0:15672->15672/tcp, :::15672->15672/tcp   11.rabbitmq
[root@localhost ~]## docker exec -it f938fee3451f /bin/bash

## 查看rabbitmq状态
root@f938fee3451f:/## rabbitmqctl status
Status of node rabbit@f938fee3451f ...
Runtime

OS PID: 273
OS: Linux
Uptime (seconds): 544
Is under maintenance?: false
RabbitMQ version: 3.8.26
Node name: rabbit@f938fee3451f
Erlang configuration: Erlang/OTP 24 [erts-12.1.5] [source] [64-bit] [smp:2:2] [ds:2:2:10] [async-threads:1] [jit]
Erlang processes: 397 used, 1048576 limit
Scheduler run queue: 1
Cluster heartbeat timeout (net_ticktime): 60

Plugins

Enabled plugin file: /etc/11.rabbitmq/enabled_plugins
Enabled plugins:

 * rabbitmq_prometheus
 * prometheus
 * rabbitmq_management
 * amqp_client
 * rabbitmq_web_dispatch
 * cowboy
 * cowlib
 * rabbitmq_management_agent

Data directory

Node data directory: /var/lib/11.rabbitmq/mnesia/rabbit@f938fee3451f
Raft data directory: /var/lib/11.rabbitmq/mnesia/rabbit@f938fee3451f/quorum/rabbit@f938fee3451f

Config files

 * /etc/11.rabbitmq/11.rabbitmq.conf

Log file(s)

 * <stdout>

Alarms

(none)

Memory

Total memory used: 0.1432 gb
Calculation strategy: rss
Memory high watermark setting: 0.4 of available memory, computed to: 0.4078 gb

reserved_unallocated: 0.0669 gb (46.76 %)
code: 0.0364 gb (25.44 %)
other_proc: 0.0265 gb (18.48 %)
other_system: 0.0249 gb (17.39 %)
other_ets: 0.0033 gb (2.32 %)
atom: 0.0014 gb (1.0 %)
plugins: 0.0011 gb (0.78 %)
metrics: 2.0e-4 gb (0.16 %)
mgmt_db: 2.0e-4 gb (0.12 %)
binary: 1.0e-4 gb (0.08 %)
mnesia: 1.0e-4 gb (0.06 %)
quorum_ets: 0.0 gb (0.03 %)
msg_index: 0.0 gb (0.02 %)
connection_other: 0.0 gb (0.0 %)
allocated_unused: 0.0 gb (0.0 %)
connection_channels: 0.0 gb (0.0 %)
connection_readers: 0.0 gb (0.0 %)
connection_writers: 0.0 gb (0.0 %)
queue_procs: 0.0 gb (0.0 %)
queue_slave_procs: 0.0 gb (0.0 %)
quorum_queue_procs: 0.0 gb (0.0 %)

File Descriptors

Total: 2, limit: 1048479
Sockets: 0, limit: 943629

Free Disk Space

Low free disk space watermark: 0.05 gb
Free disk space: 42.9601 gb

Totals

Connection count: 0
Queue count: 0
Virtual host count: 1

Listeners

Interface: [::], port: 15672, protocol: http, purpose: HTTP API
Interface: [::], port: 15692, protocol: http/prometheus, purpose: Prometheus exporter API over HTTP
Interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
```

**在docker环境中配置rabbitmq时，需要配置hostname**

rabbitmq的数据库名称规则是，NODENAME@hostname，docker每次从docker image启动容器的时候会自动生成hostname，这样一来，你保存在主机上的数据库就会没用了，包括之前创建的用户也会没有了

所以在创建容器的时候必须指定`--hostname=rabbitmqhostone`，这样docker环境启动后rabbitmq就会一直读取固定目录中的数据了

## rabbitmq配置

### Authentication（认证）

RabbitMQ启动之后，我们想使用它的前提是用username、password连接上它。这里所说的username和passowrd其实就是一个被授予一定权限的用户

用户连接上RabbitMQ即可创建virtual host使用MQ。在说什么是virtual host之前，先说下RabbitMQ默认有的被授权的用户：`username=guest、password=guest、virtualhost=/`

但是这个用户被限制了只能在RabbitMQ所在机器的本地才能登陆MQ（不允许你使用该用户通过ip+port远程登录RabbitMQ）

> 你使用特定的用户去连接MQ的过程即为Authentication

### rabbitmq管理命令行

```bash
## 服务启动相关
systemctl start|restart|status 11.rabbitmq-server

## 管理命令行，用来在不使用web管理界面情况下命令操作rabbitmq
rabbitmqctl help ## 可以查看更多的命令

## 插件管理命令
11.rabbitmq-plugins enable|list|disable
```

### web管理界面介绍

#### overview概览

基本说明：

- overview 概览
- connection 连接
- channel 通道
- exchange 交换机
- queue 队列
- admin 管理

1. overview

![image-20211209192804695](./rabbitmq基础/image-20211209192804695.png)

- 5672 AMQP 协议端口
- 15672 http端口

2. connections

![image-20211209202255979](./rabbitmq基础/image-20211209202255979.png)

当前rabbitmq的连接情况，就是那些客户端与rabbitmq连接

- 可以通过搜索过滤
- 也可以通过正则表达式的方式过滤
- 还可以执行分页操作

3. channel

![image-20211209202415125](./rabbitmq基础/image-20211209202415125.png)

消息队列通过通道传递消息

- 可以通过搜索过滤
- 也可以通过正则表达式的方式过滤
- 还可以执行分页操作

4. exchange

![image-20211209202533279](./rabbitmq基础/image-20211209202533279.png)

交换机，也可以叫做路由，默认安装成功之后内置了7种路由

> Features：
>
> - D 表示durable，耐用的，代表直连的消息是存在磁盘中，不会随着rabbitmq的关闭、重启等而消失
> - I 表示internal，内部的，

- AMQP default 表示AMQP默认路由为direct
- amq.direct 直连
- amq.fanout 扇出广播
- amq.headers
- amq.match
- amq.topic

**Add a new exchange**：可以自己添加交换机

5. queue

![image-20211209203436351](./rabbitmq基础/image-20211209203436351.png)

队列，是要绑定交换机的，可以自己添加队列

6. admin

![image-20211209203606571](./rabbitmq基础/image-20211209203606571.png)

用来对用户进行管理，我们可以创建新的用户

新创建的用户是没有任何权限的，我们可以设置Tags设置权限

## rabbitmq的第一个程序

### rabbitmq协议回顾

![image-20211209204912151](./rabbitmq基础/image-20211209204912151.png)

- 虚拟主机类似于mysql中库的概念
- 一个项目或者一个业务只能访问一个虚拟主机
- 一个虚拟主机绑定一个特定的用户

**所以，在真正使用rabbitmq的时候，必须得在它的管理界面中，先创建用户，再创建虚拟主机，然后将用户和虚拟主机进行绑定**

- 生产者可以将消息发送给exchange，或者直接发送给queue

### rabbitmq支持的消息模型

> 官方消息模型：https://www.rabbitmq.com/getstarted.html

![image-20211209210931455](./rabbitmq基础/image-20211209210931455.png)

### 引入依赖

创建maven项目，引入依赖

```xml
<!--引入amqp的相关依赖，在使用java去操作amqp只需要这一个依赖就好了-->
<dependency>
  <groupId>com.rabbitmq</groupId>s
  <artifactId>amqp-client</artifactId>
  <version>5.13.1</version>
</dependency>
<!--顺便引入junit，方便测试-->
<dependency>
  <groupId>junit</groupId>
  <artifactId>junit</artifactId>
  <version>4.12</version>
</dependency>
```

### 第一种模型

(直连)

#### 配置rabbitmq

![img](./rabbitmq基础/python-one.png)

1. 创建一个虚拟主机(就像创建一个数据库)

虚拟主机必须以`/`开头，当前的虚拟主机还不允许任何用户访问，仅允许guest

![image-20211209212152137](./rabbitmq基础/image-20211209212152137.png)

2. 创建一个用户

创建ems用户，先赋予admin权限

![image-20211209212421513](./rabbitmq基础/image-20211209212421513.png)

3. 绑定我们刚才创建的虚拟主机/ems

点击用户名，然后在`set permission`标签中设置虚拟主机为`/ems`，下面是一些配置的权限，可配置、可写、可读

![image-20211209212826170](./rabbitmq基础/image-20211209212826170.png)

4. 这样设置之后就可以了看到ems已经和/ems虚拟主机绑定到一起了

![image-20211209212948402](./rabbitmq基础/image-20211209212948402.png)

#### 编码

##### 生产者

在引入依赖并配置rabbitmq之后，我们就可以编写测试代码生成消息

```java
public class Producer {
    /**
     * 生产消息
     */
    @Test
    public void testSendMessage() throws IOException, TimeoutException {
        // 创建连接mq的连接工厂对象
        final ConnectionFactory connectionFactory = new ConnectionFactory();
        // 设置连接mq的主机
        connectionFactory.setHost("172.16.187.9");
        // 设置端口号
        connectionFactory.setPort(5672);
        // 设置连接的虚拟主机
        connectionFactory.setVirtualHost("/ems");
        // 设置用户名和密码
        connectionFactory.setUsername("ems");
        connectionFactory.setPassword("123456");

        // 获取连接对象
        final Connection connection = connectionFactory.newConnection();

        // 获取连接中的通道对象
        final Channel channel = connection.createChannel();

        // 通道绑定对应的消息队列
        // 队列可以在web管理界面去创建，也可以通过代码去创建
        /**
         * 参数1：队列的名称，如果队列不存在，就会自动创建
         * 参数2：用来定义队列的特性是否要持久化，true表示持久化
         * 参数3：exclusive 是否独占队列，代表当前队列只允许当前这个连接可用，其他的连接不可用 true 独占队列
         * 参数4：autoDelete 是否在消费完成之后自动删除队列，true 自动删除
         * 参数5：额外附加参数
         */
        channel.queueDeclare("hello", false, false, false, null);

        // 发布消息
        /**
         * 参数1：交换机名称，简单模式直接连接到队列，赋值为""
         * 参数2：队列名称
         * 参数3：传递消息的额外设置
         * 参数4：消息的具体内容
         */
        channel.basicPublish("", "hello", null, "hello rabbitmq".getBytes());

        channel.close();
        connection.close();
    }
}
```

发送成功

![image-20211209215445344](./rabbitmq基础/image-20211209215445344.png)

查看rabbitmq管理界面

![image-20211209215624198](./rabbitmq基础/image-20211209215624198.png)

##### 消费者

> 在Junit测试模式中是单线程的模式，所以没有办法让消费一直监听，所以换成main函数
>
> 不像生产者，生产者生产完消息之后就完事了，消费者是要一直去监听的

消费者测试代码

```java
/**
 * 消费消息
 */
public class Consumer {
    public static void main(String[] args) throws IOException, TimeoutException {
        // 创建连接mq的连接工厂对象
        final ConnectionFactory connectionFactory = new ConnectionFactory();
        // 设置连接mq的主机
        connectionFactory.setHost("172.16.187.9");
        // 设置端口号
        connectionFactory.setPort(5672);
        // 设置连接的虚拟主机
        connectionFactory.setVirtualHost("/ems");
        // 设置用户名和密码
        connectionFactory.setUsername("ems");
        connectionFactory.setPassword("123456");

        // 获取连接对象
        final Connection connection = connectionFactory.newConnection();

        // 获取连接中的通道对象
        final Channel channel = connection.createChannel();

        // 通道绑定对应的消息队列
        // 队列可以在web管理界面去创建，也可以通过代码去创建
        /**
         * 参数1：队列的名称，如果队列不存在，就会自动创建
         * 参数2：用来定义队列的特性是否要持久化，true表示持久化
         * 参数3：exclusive 是否独占队列，代表当前队列只允许当前这个连接可用，其他的连接不可用 true 独占队列
         * 参数4：autoDelete 是否在消费完成之后自动删除队列，true 自动删除
         * 参数5：额外附加参数
         */
        channel.queueDeclare("hello", false, false, false, null);

        // 消费消息
        /**
         * 参数1：消费那个队列的消息，队列的名称
         * 参数2：开启消息的自动确认机制
         * 参数3：消费消息的回调接口
         */
        channel.basicConsume("hello", true, new DefaultConsumer(channel) {
            /**
             * @param consumerTag 消息传递过程中的信封，传递的一些属性
             * @param envelope
             * @param properties
             * @param body 消息队列中取出的消息
             * @throws IOException
             */
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("new String(body)=" + new String(body) + ", date=" + new Date());
            }
        });

        // 如果不关闭就会一直监听队列
        //channel.close();
        //connection.close();
    }
}
```

执行结果

> 如果使用Junit或者在消费完之后直接关闭是不会等待回调消息函数执行就退出了
>
> 所以不建议关闭通道和连接

![image-20211209222548013](./rabbitmq基础/image-20211209222548013.png)

> 点对点的消息模式适用于登录、注册等这些单点的模式中，比如当我们使用手机号或者邮箱登录/注册时发送的验证码

#### 连接工具类的封装

在于rabbitmq通信的过程中，获取连接对象的过程是存在大量的冗余的，就像获取MySQL数据库连接一样，所以可以就可以封装成工具类

```java
public class RabbitMQUtils {
    /**
     * 连接工厂属于重量级资源
     * 对于重量级资源来说，不能说没拿一次连接就创建一次工厂，代价有点大，所以我们更希望在创建的时候只创建一次
     */
    private static final ConnectionFactory connectionFactory;

    static {
        // 类加载的时候执行，只执行一次
        connectionFactory = new ConnectionFactory();
        // 如果对于项目当前的rabbitmq信息是不变的（一般是不变的，一旦确定下来就很少变化），可以把属性的赋值也放在这里
        connectionFactory.setHost("172.16.187.9");
        connectionFactory.setPort(5672);
        connectionFactory.setVirtualHost("/ems");
        connectionFactory.setUsername("ems");
        connectionFactory.setPassword("123456");
    }

    /**
     * 定义提供连接对象的方法
     *
     * @return
     */
    public static Connection getConnection() {
        try {

            return connectionFactory.newConnection();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * 关闭通道和关闭连接的方法
     */
    public static void closeConnectionAndChannel(Channel channel, Connection connection) {
        try {
            if (channel != null) {
                channel.close();
            }
            if (connection != null) {
                connection.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### API参数细节

通过第一种模型，了解API相关的细节

```java
/**
 * 参数1：队列的名称，如果队列不存在，就会自动创建
 * 参数2：用来定义队列的特性是否要持久化，true表示持久化，设置为false时，当rabbitmq重新启动的时候，都会消失，是队列的持久化，不是消息的持久化，要做消息的持久化就要在发送消息的时候明确告诉rabbitmq要持久化
 * 参数3：exclusive 是否独占队列，代表当前队列只允许当前这个连接可用，其他的连接不可用 true 独占队列
 * 参数4：autoDelete 是否在消费完成之后(消费者彻底断开连接之后)自动删除队列，true 自动删除
 * 参数5：额外附加参数
 */
channel.queueDeclare("hello", false, false, false, null);
```

```java
/**
 * 参数1：交换机名称，简单模式直接连接到队列，赋值为""
 * 参数2：队列名称
 * 参数3：传递消息的额外设置
 *  - MessageProperties.PERSISTENT_TEXT_PLAIN 告诉rabbitmq将消息持久化
 * 参数4：消息的具体内容
 */
channel.basicPublish("", "hello", MessageProperties.PERSISTENT_TEXT_PLAIN, "hello rabbitmq".getBytes());
```

### 第二种模型

(work queue)

work queue，也被称为（task queues）任务模型，当消息处理比较耗时的时候，可能会产生消息的速度远远大于消息的消费速度，长此以往，消息就会堆积越来越多，无法及时处理。此时就可以使用work模型：让多个消息者绑定到一个队列，共同消费队列中的消息。队列中的消息一旦消费，就会消失，因此任务不会重复执行

![img](./rabbitmq基础/python-two.png)

角色：

- P 生产者 任务的发布者
- C1 消费者，领取任务并完成任务，假设完成速度较慢
- C2 消费者，领取任务并完成任务，假设完成速度较慢

#### 开发生产者

连接用的工具类还是使用第一种模式中封装的工具类型

```java
/**
 * 生产消息
 */
public class Producer {
    /**
     * 生产消息
     */
    @Test
    public void testSendMessage() throws IOException {

        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();

        // 获取连接中的通道对象
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 通道绑定对应的消息队列
        channel.queueDeclare("work", true, false, false, null);

        for (int i = 0; i < 10; i++) {
            // 发布消息
            channel.basicPublish("", "work", null, (i + " hello work rabbitmq").getBytes());
        }

        RabbitMQUtils.closeConnectionAndChannel(channel, connection);
    }
}
```



#### 开发消费者-1

```java
/**
 * 消费消息
 */
public class Consumer1 {
    public static void main(String[] args) throws IOException {

        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();

        // 获取连接中的通道对象
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 通道绑定对应的消息队列
        channel.queueDeclare("work", true, false, false, null);

        // 消费消息
        channel.basicConsume("work", true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-1 " + new String(body) + ", date=" + new Date());
            }
        });
    }
}
```



#### 开发消费者-2

```java
/**
 * 消费消息
 */
public class Consumer2 {
    public static void main(String[] args) throws IOException {

        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();

        // 获取连接中的通道对象
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 通道绑定对应的消息队列
        channel.queueDeclare("work", true, false, false, null);

        // 消费消息
        channel.basicConsume("work", true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-2 " + new String(body) + ", date=" + new Date());
            }
        });
    }
}
```



#### 测试结果

![image-20211209235035269](./rabbitmq基础/image-20211209235035269.png)

![image-20211209235022376](./rabbitmq基础/image-20211209235022376.png)



> 总结：在默认的情况下，rabbitmq将按顺序将每个消息发送给下一个使用者。平均而言，每个消费者都会收到相同数量的消息。这种分发消息的方式称为循环
>
> 平均分配会出现的问题：有的消费者处理得快，有的消费者处理得慢，那么就会导致处理慢的消费者消息堆积，而处理得快的消费者已经空闲了，我们更希望在分配消息的时候能够**能者多劳**

#### 消息自动确认机制

> Doing a task can take a few seconds. You may wonder what happens if one of the consumers starts a long task and dies with it only partly done. With our current code once RabbitMQ delivers message to the consumer it immediately marks it for deletion. In this case, if you kill a worker we will lose the message it was just processing. We'll also lose all the messages that were dispatched to this particular worker but were not yet handled.
>
> But we don't want to lose any tasks. If a worker dies, we'd like the task to be delivered to another worker.
>
> 翻译：
>
> 完成一项任务可能需要几秒钟。您可能想知道如果其中一个消费者开始了一项长期任务并且只完成了部分任务而死亡，会发生什么。使用我们当前的代码，一旦 RabbitMQ 将消息传递给消费者，它就会立即将其标记为删除。在这种情况下，如果你杀死一个工人，我们将丢失它刚刚处理的消息。我们还将丢失所有已分派给该特定工作人员但尚未处理的消息。
>
>  但我们不想丢失任何任务。如果一个工人死了，我们希望将任务交给另一个工人。
>
> ![image-20211210001128181](./rabbitmq基础/image-20211210001128181.png)
>
> - 因为自动确认机制，当任务一旦分配出去，消费者就反馈给队列说已经消费了，那么队列就会立即删除

为了保证能够能者多劳，我们需要：

1. 设置当前通道只能存储一个消息

```java
// 告诉当前的队列每次只能发送一个消息给消费者，每次只能消费一个消息
channel.basicQos(1);
```

2. 关闭自动确认

```java
/**
 * 参数1：消费那个队列的消息，队列的名称
 * 参数2：开启消息的自动确认机制，设置为false，不会自动去确认消息，也就是说即使被消费了，但是在队列中也是标记为未被消费的
 * 参数3：消费消息的回调接口
 */
channel.basicConsume("work", false, new DefaultConsumer(channel) {
  @Override
  public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
    try {
      Thread.sleep(2000);
    } catch (InterruptedException e) {
      e.printStackTrace();
    }

    System.out.println("消费者-1 " + new String(body) + ", date=" + new Date());

    // 手动确认
    /**
      * 参数1：确认的是队列中的那个具体的消息
      * 参数2：是否开启多个消息同时确认
      */
    channel.basicAck(envelope.getDeliveryTag(), false);
  }
});
```

3. 处理完成手动确认

```java
// 手动确认
/**
 * 参数1：确认的是队列中的那个具体的消息
 * 参数2：是否开启多个消息同时确认
 */
channel.basicAck(envelope.getDeliveryTag(), false);
```

### 第三种模型

(fanout)

> fanout也称为广播，发布-订阅模式，所有订阅了的消费者都能接收并处理这个消息

![img](./rabbitmq基础/exchanges.png)

在广播模式下，消息发送流程是这样的：

- 可以有多个消息
- 每个消费者有自己的queue（队列），为了不消耗资源，我们创建临时队列，当消费者确认处理完成，队列就会自动销毁
- 每个队列都要绑定到exchange（交换机）
- 生产者发送的消息，只能发送给交换机，交换机来决定要发给哪个队列，生产者无法决定
- 交换机把消息发送给绑定过的所有队列
- 队列的消费者都能拿到消息，实现一条消息被多个消费者消费

#### 开发生产者

```java
/**
 * 生产消息
 */
public class Producer {
    /**
     * 生产消息
     */
    public static void main(String[] args) throws IOException {

        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();

        // 获取连接中的通道对象
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 将通道声明指定交换机
        /**
         * 参数1：交换机的名称 rabbitmq中如果不存在这个名称的交换机会创建 可以随意指定，和业务名称一样就好，比如：logs 日志；register 注册；login 登录
         * 参数2：交换机的类型 fanout表示广播类型
         */
        channel.exchangeDeclare("logs", "fanout");

        // 发送消息
        /**
         * 参数1：交换机
         * 参数2：消息队列，置空，让交换机去选择
         */
        channel.basicPublish("logs", "", null, "fanout type message".getBytes());

        RabbitMQUtils.closeConnectionAndChannel(channel, connection);
    }
}
```

主要在`channel.exchangeDeclare("logs", "fanout");`配置交换机并且设置消息类型为fanout

#### 开发消费者-1

```java
/**
 * 消费消息
 */
public class Consumer1 {
    public static void main(String[] args) throws IOException {

        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();

        // 获取连接中的通道对象
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 通道绑定交换机
        /**
         * 参数1：交换机名称
         * 参数2：消息类型，广播模式下是fanout
         */
        channel.exchangeDeclare("logs", "fanout");
        // 创建临时队列
        /**
         * 会返回一个随机名称的队列
         */
        final String queueName = channel.queueDeclare().getQueue();

        // 绑定交换机和队列
        /**
         * 参数1：队列名称
         * 参数2：交换机名称
         * 参数3：路由的名字，在fanout 广播中是订阅了的消费者都会接收到这个消息，不需要路由
         */
        channel.queueBind(queueName, "logs", "");

        // 消费消息
        /**
         * 参数1：消费那个队列的消息，队列的名称
         * 参数2：开启消息的自动确认机制，设置为false，不会自动去确认消息，也就是说即使被消费了，但是在队列中也是标记为未被消费的
         * 参数3：消费消息的回调接口
         */
        channel.basicConsume(queueName, true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-1 " + new String(body) + ", date=" + new Date());
            }
        });
    }
}
```

三个操作：

- 通道绑定交换机
- 创建临时队列
- 绑定交换机和队列

#### 开发消费者-2

```java
/**
 * 消费消息
 */
public class Consumer1 {
    public static void main(String[] args) throws IOException {

        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();

        // 获取连接中的通道对象
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 通道绑定交换机
        /**
         * 参数1：交换机名称
         * 参数2：消息类型，广播模式下是fanout
         */
        channel.exchangeDeclare("logs", "fanout");
        // 创建临时队列
        /**
         * 会返回一个随机名称的队列
         */
        final String queueName = channel.queueDeclare().getQueue();

        // 绑定交换机和队列
        /**
         * 参数1：队列名称
         * 参数2：交换机名称
         * 参数3：路由的名字，在fanout 广播中是订阅了的消费者都会接收到这个消息，不需要路由
         */
        channel.queueBind(queueName, "logs", "");

        // 消费消息
        /**
         * 参数1：消费那个队列的消息，队列的名称
         * 参数2：开启消息的自动确认机制，设置为false，不会自动去确认消息，也就是说即使被消费了，但是在队列中也是标记为未被消费的
         * 参数3：消费消息的回调接口
         */
        channel.basicConsume(queueName, true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-1 " + new String(body) + ", date=" + new Date());
            }
        });
    }
}
```

三个操作：

- 通道绑定交换机
- 创建临时队列
- 绑定交换机和队列

#### 开发消费者-3

```java
/**
 * 消费消息
 */
public class Consumer1 {
    public static void main(String[] args) throws IOException {

        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();

        // 获取连接中的通道对象
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 通道绑定交换机
        /**
         * 参数1：交换机名称
         * 参数2：消息类型，广播模式下是fanout
         */
        channel.exchangeDeclare("logs", "fanout");
        // 创建临时队列
        /**
         * 会返回一个随机名称的队列
         */
        final String queueName = channel.queueDeclare().getQueue();

        // 绑定交换机和队列
        /**
         * 参数1：队列名称
         * 参数2：交换机名称
         * 参数3：路由的名字，在fanout 广播中是订阅了的消费者都会接收到这个消息，不需要路由
         */
        channel.queueBind(queueName, "logs", "");

        // 消费消息
        /**
         * 参数1：消费那个队列的消息，队列的名称
         * 参数2：开启消息的自动确认机制，设置为false，不会自动去确认消息，也就是说即使被消费了，但是在队列中也是标记为未被消费的
         * 参数3：消费消息的回调接口
         */
        channel.basicConsume(queueName, true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-1 " + new String(body) + ", date=" + new Date());
            }
        });
    }
}
```

三个操作：

- 通道绑定交换机
- 创建临时队列
- 绑定交换机和队列

#### 测试结果

订阅了logs的消费者都能接收到Provider发送的消息

![image-20211210021510413](./rabbitmq基础/image-20211210021510413.png)

### 第四种模型

(routing)

#### routing之订阅模型-direct

> 在fanout模式中，一条消息会被所有的订阅的队列都消费，但是在某些场景下，我们希望不同的消息被不同的队列消费，这时就要用到direct类型的exchange
>
> 是广播模式的变形

在direct模型下：

- 队列与交换机的绑定，不能是任意绑定的，而是要指定一个routingKey（路由key）
- 消息的返送方在向exchange发送消息时，也必须指定消息的routingKey
- exchange不再把消息交给每一个绑定的队列，而是根据消息routingKey进行判断，只有队列routingKey与消息的routingKey完全一致，才会接收到消息

我希望在把所有的日志向控制台打印的同时（C2），将错误的日志保存到文件（C1）中

流程：

![img](./rabbitmq基础/python-four.png)

图解：

- P 生产者，向exchange发送消息，发送消息的时候，	会指定一个routing key
- X exchange 交换机，接收生产者的消息，然后把消息递交给与routing key完全匹配的队列
- C1 消费者，其所在队列指定了需要routing key为 error的消息
- C2 消费者，其所在队列指定了需要routing key为info、error、warning的消息

##### 开发生产者

```java
public class Producer {
    public static void main(String[] args) throws IOException {
        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();
        // 获取通道对象
        assert connection != null;
        final Channel channel = connection.createChannel();
        // 通过通道声明交换机
        /**
         * 参数1 交换机名称
         * 参数2 消息类型 direct 路由模式
         */
        channel.exchangeDeclare("logs_direct", "direct");

        // 发送消息
        // 发送之前定义routing key
        String routingKey = "error";
        channel.basicPublish("logs_direct", routingKey, null, ("这是direct模型发布的基于router_key: [" + routingKey + "] 发送的消息").getBytes());

        // 关闭资源
        RabbitMQUtils.closeConnectionAndChannel(channel, connection);
    }
}
```

##### 开发消费者-1

```java
public class Consumer1 {
    public static void main(String[] args) throws IOException {
        final Connection connection = RabbitMQUtils.getConnection();
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 通道声明交换机以及交换机的类型
        channel.exchangeDeclare("logs_direct", "direct");

        // 获取创建一个临时队列
        final String queueName = channel.queueDeclare().getQueue();

        // 基于routing key绑定队列和交换机 error 只接收为error的消息进行消费
        channel.queueBind(queueName, "logs_direct", "error");

        // 获取消费的消息
        channel.basicConsume(queueName, true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-1: " + new String(body));
            }
        });
    }
}
```

##### 开发消费者-2

```java
public class Consumer2 {
    public static void main(String[] args) throws IOException {
        final Connection connection = RabbitMQUtils.getConnection();
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 声明交换机以及交换机的类型
        channel.exchangeDeclare("logs_direct", "direct");

        // 创建一个临时的队列
        final String queueName = channel.queueDeclare().getQueue();

        // 绑定队列和交换机，接收info error warning的消息类型消费
        channel.queueBind(queueName, "logs_direct", "info");
        channel.queueBind(queueName, "logs_direct", "error");
        channel.queueBind(queueName, "logs_direct", "warning");

        // 消费消息
        channel.basicConsume(queueName, true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-2: " + new String(body));
            }
        });
    }
}
```

##### 测试结果

我们先启动消费者，然后不断改变routingKey的值，不同的消费者根据routingKey接收到不同的消息

- 发送info类型的信息，只有Consumer能接收到
- 发送error类型的信息，两个都能收到信息

![image-20211210031346694](./rabbitmq基础/image-20211210031346694.png)

![image-20211210031356002](./rabbitmq基础/image-20211210031356002.png)

#### routing之订阅模型-topic

topic类型的exchange与direct相比，都是可以根据routingKey把消息路由到不同的队列中，只不过topic类型exchange可以让队列在绑定routingKey的时候使用通配符，这种模型routingKey一般都是一个或者多个单词组成，多个单词之间以"."分割，例如：`item.insert`

![img](./rabbitmq基础/python-five.png)

```markdown
## 通配符
	* (star) can substitute for exactly one word.		匹配不多不少恰好1个词
	## (hash) can substitute for zero or more words.	匹配一个或者多个词

## 如：
	audit.#	匹配audit.irs.corporate或者audit.irs等
	audit.*	只能匹配audit.irs
```

##### 开发生产者

```java
public class Producer {
    public static void main(String[] args) throws IOException {
        // 获取连接对象
        final Connection connection = RabbitMQUtils.getConnection();
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 声明交换机以及交换机类型
        channel.exchangeDeclare("topics", "topic");

        // 发布消息
        String routingKey = "user.save";
        channel.basicPublish("topics", routingKey, null, ("这是direct模型发布的基于router_key: [" + routingKey + "] 发送的消息").getBytes());

        RabbitMQUtils.closeConnectionAndChannel(channel, connection);
    }
}
```

##### 开发消费者-1

```java
public class Consumer1 {
    public static void main(String[] args) throws IOException {
        // 获取连接
        final Connection connection = RabbitMQUtils.getConnection();
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 声明交换机以及交换机类型
        channel.exchangeDeclare("topics", "topic");

        // 创建一个临时队列
        final String queue = channel.queueDeclare().getQueue();

        // 绑定队列和交换机 动态通配符 routing key user.* 表示必须有两个单词，后面的单词任意
        channel.queueBind(queue, "topics", "user.*");

        // 消费消息
        channel.basicConsume(queue, true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-1: " + new String(body));
            }
        });
    }
}
```

##### 开发消费者-2

```java
public class Consumer2 {
    public static void main(String[] args) throws IOException {
        // 获取连接
        final Connection connection = RabbitMQUtils.getConnection();
        assert connection != null;
        final Channel channel = connection.createChannel();

        // 声明交换机以及交换机类型
        channel.exchangeDeclare("topics", "topic");

        // 创建一个临时队列
        final String queue = channel.queueDeclare().getQueue();

        // 绑定队列和交换机 动态通配符 routing key user.## 后面的单词任意，包括 .
        channel.queueBind(queue, "topics", "user.#");

        // 消费消息
        channel.basicConsume(queue, true, new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                System.out.println("消费者-2: " + new String(body));
            }
        });
    }
}
```

##### 测试结果

当发送的routingKey是user.save的时候，两个都能接收到

![image-20211210040511106](./rabbitmq基础/image-20211210040511106.png)

当发送的routingKey是user.add.01的时候，只有Consumer2能接收到

![image-20211210040615409](./rabbitmq基础/image-20211210040615409.png)

当然，通配符还有更多的组合方式，比如：`*.user.#`、`user.*.#`等等

## springboot中使用rabbitmq

### 搭建初始环境

#### 引入依赖

引入web和rabbitmq的依赖，可以在构建界面勾选，或者在创建之后在pom文件中引入

```xml
<!--11.rabbitmq-->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
<!--web-->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

#### 配置配置文件

在引入依赖之后，既然springboot支持通过启动器来配置rabbitmq，那么当前springboot的自动配置包下就应该有自动配置类和属性类

1. RabbitProperties表示我们在当前的配置文件中可配置那些参数

```java
@ConfigurationProperties(prefix = "spring.rabbitmq")
public class RabbitProperties {
  /**
  * RabbitMQ host. Ignored if an address is set.
  */
  private String host = "localhost";

  /**
  * RabbitMQ port. Ignored if an address is set. Default to 5672, or 5671 if SSL is
  * enabled.
  */
  private Integer port;

  /**
  * Login user to authenticate to the broker.
  */
  private String username = "guest";

  /**
  * Login to authenticate against the broker.
  */
  private String password = "guest";

  /**
  * SSL configuration.
  */
  private final Ssl ssl = new Ssl();

  /**
  * Virtual host to use when connecting to the broker.
  */
  private String virtualHost;
}
```

通过上面的配置文件，我们能知道：

- @ConfigurationProperties(prefix = "spring.rabbitmq") 配置rabbitmq参数的前缀是`spring.rabbitmq`
- 可以配置host、port、virtual host、username、password等

2. RabbitAutoConfiguration 表明了rabbitmq是怎么自动配置到springboot项目中的，不是现在的重点

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass({ RabbitTemplate.class, Channel.class })
@EnableConfigurationProperties(RabbitProperties.class)
@Import({ RabbitAnnotationDrivenConfiguration.class, RabbitStreamConfiguration.class })
public class RabbitAutoConfiguration {
  // .....
}
```

所以我们的配置文件为：

```yaml
spring:
  application:
    name: springboot-11.rabbitmq-demo-01 ## 给当前springboot取一个名字
  rabbitmq: ## 配置rabbitmq
    host: 172.16.187.9 ## 默认是localhost
    port: 5672 ## 默认是5672
    virtual-host: /ems
    username: ems ## 默认是guest
    password: 123456 ## 默认是guest
```

springboot为我们提供了`RabbitTemplate`，用来简化rabbitmq操作，在`RabbitAutoConfiguration.RabbitTemplateConfiguration`中自动引入了`RabbitTemplate`

```java
@Bean
@ConditionalOnSingleCandidate(ConnectionFactory.class)
@ConditionalOnMissingBean(RabbitOperations.class)
public RabbitTemplate rabbitTemplate(RabbitTemplateConfigurer configurer, ConnectionFactory connectionFactory) {
  RabbitTemplate template = new RabbitTemplate();
  configurer.configure(template, connectionFactory);
  return template;
}
```

### 第一种hello world模型

> 队列并不会随着生产者发送消息而创建，只有有消费者才会是有意义的队列，所以只有有了消费者才有队列

#### 开发生产者

在test测试目录下创建

```java
@SpringBootTest(classes = SpringbootRabbitmqDemo01Application.class) // 指定测试类，当我们运行当前测试类中的方法的时候回启动springboot项目
@RunWith(SpringRunner.class) //启动springboot工厂
public class Producer {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Test
    public void test() {
        /**
         * 参数1 队列名称
         * 参数2 消息
         */
        rabbitTemplate.convertAndSend("hello", "hello world");
    }
}
```

#### 开发消费者

在java目录下创建

```java
@Component
/**
 * 消费者监听
 *  queuesToDeclare没有队列就创建一个队列
 *       * @Queue("hello") 表示队列名称为hello，创建出来的队列默认是持久化的、非独占的、不是自动删除的，可以添加参数修改
 */
@RabbitListener(queuesToDeclare = @Queue("hello"))
public class Consumer {
    /**
     * 可以定义一个任意的方法来获取监听队列中的消息
     *      * @RabbitHandler 代表监听队列中的消息的回调方法
     *
     * @param message 接收的消息
     */
    @RabbitHandler
    public void receive(String message) {
        System.out.println("message = " + message);
    }
}
```

其中：

- `@RabbitListener(queuesToDeclare = @Queue("hello"))`表示监听队列中的消息，如果想要在一个组件中监听多个不同的队列，还可以将这个注解加在方法上，此时方法上就可以不同添加`@RabbitHandler`了
  - `@Queue`可以配置是否持久化、是否独占队列、是否自动删除等
- `@RabbitHandler`代表监听队列中的消息的回调方法

Queue类源码中可以配置和队列相关的类型

```java
/**
 * A queue definition used within the bindings attribute of a {@code QueueBinding}.
 *
 * @author Gary Russell
 * @since 1.5
 *
 */
@Target({})
@Retention(RetentionPolicy.RUNTIME)
public @interface Queue {

	/**
	 * @return the queue name or "" for a generated queue name (default).
	 */
	@AliasFor("name")
	String value() default "";

	/**
	 * @return the queue name or "" for a generated queue name (default).
	 * @since 2.0
	 */
	@AliasFor("value")
	String name() default "";

	/**
	 * Specifies if this queue should be durable.
	 * By default if queue name is provided it is durable.
	 * @return true if the queue is to be declared as durable.
	 * @see org.springframework.amqp.core.Queue#isDurable()
	 */
	String durable() default "";

	/**
	 * Specifies if this queue should be exclusive.
	 * By default if queue name is provided it is not exclusive.
	 * @return true if the queue is to be declared as exclusive.
	 * @see org.springframework.amqp.core.Queue#isExclusive()
	 */
	String exclusive() default "";

	/**
	 * Specifies if this queue should be auto deleted when not used.
	 * By default if queue name is provided it is not auto-deleted.
	 * @return true if the queue is to be declared as auto-delete.
	 * @see org.springframework.amqp.core.Queue#isAutoDelete()
	 */
	String autoDelete() default "";

	/**
	 * @return true if the declaration exceptions should be ignored.
	 * @since 1.6
	 */
	String ignoreDeclarationExceptions() default "false";

	/**
	 * @return the arguments to apply when declaring this queue.
	 * @since 1.6
	 */
	Argument[] arguments() default {};

	/**
	 * @return true if the admin(s), if present, should declare this component.
	 * @since 2.1
	 */
	String declare() default "true";

	/**
	 * Return a list of admin bean names that should declare this component.
	 * By default all admins will declare it
	 * @return the bean names
	 * @since 2.1
	 */
	String[] admins() default {};

}
```

#### 测试结果

运行Producer测试方法，Consumer成功接收到发出的消息

![image-20211210151410743](./rabbitmq基础/image-20211210151410743.png)



### 第二种work模型

#### 开发生产者

在第一种的Producer类中添加生产work类型消息的测试方法

```java
/**
* work模式
*/
@Test
public void testWork() {
    for (int i = 0; i < 10; i++) {
        rabbitTemplate.convertAndSend("work", "work模型");
    }
}
```

#### 开发消费者

在mian/java的包中创建work.Consumer，因为此时要注入到spring容器的Consumer有两个，会重名，所以对两个重命名

```java
@Component(value = "workConsumer")
public class Consumer {
    @RabbitListener(queuesToDeclare = @Queue("work"))
    public void receiveWork1(String message) {
        System.out.println("work-1 message : " + message);
    }

    @RabbitListener(queuesToDeclare = @Queue("work"))
    public void receiveWork2(String message) {
        System.out.println("work-2 message : " + message);
    }
}
```

> `@RabbitListener(queuesToDeclare = @Queue("hello"))`表示监听队列中的消息，如果想要在一个组件中监听多个不同的队列，还可以将这个注解加在方法上，此时方法上就可以不同添加`@RabbitHandler`了

#### 测试结果

启动testWork方法，work模式平均分配消息到了两个消费者上

![image-20211210153342265](./rabbitmq基础/image-20211210153342265.png)

> 说明：默认在spring amqp实现work这种方式就是公平分配调度的，如果实现能者多劳需要额外配置

### 第三种fanout模型

#### 开发生产者

```java
/**
* fanout模式
*/
@Test
public void testFanout() {
    rabbitTemplate.convertAndSend("logs", "", "fanout模型发送的消息");
}
```

#### 开发消费者

```java
@Component(value = "fanoutConsumer")
public class Consumer {
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,// 如果不设定名字就会创建临时队列
                    exchange = @Exchange(value = "logs", type = ExchangeTypes.FANOUT) // 指定绑定的交换机，logs 交换机名称；fanout 交换机消息类型
            )
    })
    public void receive1(String message) {
        System.out.println("fanout-1 message = " + message);
    }

    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,// 如果不设定名字就会创建临时队列
                    exchange = @Exchange(value = "logs", type = "fanout") // 指定绑定的交换机，logs 交换机名称；fanout 交换机消息类型
            )
    })
    public void receive2(String message) {
        System.out.println("fanout-2 message = " + message);
    }
}
```

#### 测试结果

>  测试的时候出现没有报错爆红，但是一直接收不到消息的情况，而终端会出现ERROR 字段，是之前测试不是springboot项目的rabbitmq存储的queue匹配出现错误，所以把rabbitmq的queue删除

启动testFanout，只要是连接到交换机logs的都能接收到消息

![image-20211210160539736](./rabbitmq基础/image-20211210160539736.png)

### 第四种routing模型

#### 开发生产者

```java
/**
* routing模型
*/
@Test
public void testRouting(){
    rabbitTemplate.convertAndSend("directs","error","发送info的key是路由信息");
}
```

#### 开发消费者

```java
@Component(value = "routingConsumer")
public class Consumer {
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,// 创建临时队列
                    exchange = @Exchange(value = "directs", type = ExchangeTypes.DIRECT),// 指定交换机名称和类型
                    key = {"info", "error", "warn"} // 接收info、error、warn类型的消息
            )
    })
    public void receive1(String message) {
        System.out.println("routing-1 message : " + message);
    }

    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,// 创建临时队列
                    exchange = @Exchange(value = "directs", type = ExchangeTypes.DIRECT),// 指定交换机名称和类型
                    key = {"error"} // 只接收error相关的信息
            )
    })
    public void receive2(String message) {
        System.out.println("routing-2 message : " + message);
    }
}
```

#### 测试结果

启动testRouting方法，如果发送的是info类型的消息，只有receive1能接收到，如果发送error的消息，则两个消费者都能接收到

![image-20211210162635116](./rabbitmq基础/image-20211210162635116.png)

### 第五种topic模型

#### 开发消费者

```java
/**
* topic模型
*/
@Test
public void testTopic(){
    rabbitTemplate.convertAndSend("topics","user.save","发送user.save 路由信息");
}
```

#### 开发消费者

```java
@Component(value = "topicConsumer")
public class Consumer {
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,
                    exchange = @Exchange(value = "topics",type = ExchangeTypes.TOPIC),
                    key = {"user.save","user.*"}
            )
    })
    public void receive1(String message) {
        System.out.println("topic-1 message : " + message);
    }

    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,
                    exchange = @Exchange(value = "topics",type = ExchangeTypes.TOPIC),
                    key = {"order.#","product.#","user.*"}
            )
    })
    public void receive2(String message) {
        System.out.println("topic-2 message : " + message);
    }
}
```

#### 测试结果

如果我们发送的消息类型是`user.save`那么两个消费者都能接收到

![image-20211210163434714](./rabbitmq基础/image-20211210163434714.png)

## MQ的应用场景

### 异步处理

> 场景：用户注册后，需要发送邮件注册和注册短信，传统的做法有两种：
>
> - 串行方式
> - 并行方式

1. 串行方式：将注册信息写入数据库后，发送注册邮件，再发送注册短信，以上三个任务全部完成之后才返回客户端。这有一个问题是：邮件、短信并不是必须的，它只是一个通知，而这种做法让客户端等待没有必要等待的东西

![image-20211210164308343](./rabbitmq基础/image-20211210164308343.png)

2. 并行方式：将注册信息写入数据库后，发送邮件的同时，发送短信，以上三个任务完成之后，返回客户端，并行的方式能提高处理时间

![image-20211210164443013](./rabbitmq基础/image-20211210164443013.png)

3. 消息队列：假设三个业务节点分别使用50ms，串行的方式使用时间150ms，并行时间100ms，虽然并行已经提高了处理时间，但是，前面说过，邮件和短信对我正常使用网站没有任何影响，客户端没有必要等着其发送弯沉才显示注册成功，应该是写入数据库后就返回

`消息队列`：引入消息队列后，把发送邮件、短信不是必须的业务逻辑异步处理

![image-20211210164930280](./rabbitmq基础/image-20211210164930280.png)

由此可以看出，引入消息队列后，用户的响应时间就等于写入数据库的时间+写入消息队列的时间（可以忽略不计），引入消息队列处理后，响应时间是串行的3倍，是并行的2倍

### 应用解耦

> 场景：双十一是购物狂欢节，用户下单后，订单系统需要通知库存系统，传统的做法就是订单系统调用库存系统的接口
>
> ![image-20211210165241322](./rabbitmq基础/image-20211210165241322.png)
>
> - 库存是必须扣减的，在业务上来说，有库存直接扣除即可，没有库存或者低于某个阈值，可以扣减成功，不过要通知其他系统（比如通知到采购系统尽快采购，通知用户订单系统我们会尽快调货）

这种做法有一个缺点：

当库存系统出现故障的时候，订单就会失败。订单系统和库存系统高耦合。引入消息队列

![image-20211210165350873](./rabbitmq基础/image-20211210165350873.png)

- 订单系统：用户下单后，订单系统完成持续化处理后，将消息写入消息队列，返回用户订单下单成功
- 库存系统：订阅下单的消息，获取下单消息，进行库操作，就算库存系统出现故障，消息队列也能保证消息的可靠投递，不会导致消息丢失

对于我们消息模式的实现，为保证库存必须有扣减，我们必须考虑几个问题：

- 订单系统发给mq服务器的扣减库存的消息必须要被mq服务器接收到，意味着需要使用发送者确认
  - `publisherConfirm=true`
  - `mandatory=true`
  - `sendReturnCallback`
- mq服务器在扣减库存的消息被库存服务正确处理前必须一直存在，那么需要消息进行持久化
  - 交换器持久化`durable=true`
  - `MessageDeliveryMode.PERSISTENT`
- 某个库存服务器出了问题，扣减库存的消息要能够被其他正常的库存服务处理，需要我们自行对消费进行确认，意味着不能使用消费者自动确认，而应该使用手动确认
  - `autoAck=false`
  - 在消息处理完成之后通知队列处理完成

### 流量削峰

> 场景：秒杀活动，一般会因为流量过大，导致应用挂掉，为了解决这个问题，一般在应用前端加入消息队列

作用：

1. 可以控制活动人数，超过此一定阈值的订单直接丢弃（我为什么秒杀活动一次都没有成功过呢）
2. 可以缓解短时间的高流量压垮应用（应用程序按自己的最大处理能力获取订单）

## rabbitmq的集群

> 分布式rabbitmq - 官方网址：https://www.rabbitmq.com/distributed.html

rabbitmq提供两套集群架构，分别为：普通集群和镜像集群

### 集群架构

#### 普通集群(副本集群)

> clustering -  官方网址：https://www.rabbitmq.com/clustering.html
>
> All data/state required for the operation of a RabbitMQ broker is replicated across all nodes. An exception to this are message queues, which by default reside on one node, though they are visible and reachable from all nodes. To replicate queues across nodes in a cluster, use a queue type that supports replication. This topic is covered in the [Quorum Queues](https://www.rabbitmq.com/quorum-queues.html) guide.    --摘自官网
>
> 翻译：
>
> RabbitMQ 代理操作所需的所有数据/状态都在所有节点之间复制。一个例外是消息队列，它们默认驻留在一个节点上，尽管它们对所有节点都是可见和可访问的。要跨集群中的节点复制队列，请使用支持复制的队列类型。 Quorum Queues 指南中介绍了该主题。

**默认情况下，rabbitmq代理操作所需的所有数据/状态都将跨所有的节点复制，这方面的一个例外是消息队列，默认情况下，消息队列位于一个节点上，尽管他们可以从所有的节点看到和访问**

实际上在RabbitMQ中，Queue才是真正存储消息的，日后我们构建RabbitMQ集群可能有三个节点，一个Master节点，两个Slave节点。

默认情况下，消息队列只位于Master节点上。Slave节点只能对Master节点的队列进行读操作，而不能进行写操作。而Master节点既可以对其队列进行读操作，也可以对其队列进行写操作

这种集群也叫做 "主从复制" 集群，主节点真正去和生产者打交道，从节点只用来同步主节点的相应数据

从节点虽然能够备份主节点中所有的数据，但是不同数据的同步规则不相同。从节点只能实时同步主节点Exchange中的数据，不能实时同步主节点Queue中的信息

消费者可以订阅主节点，也可以订阅从节点，当订阅主节点时，可以获得Queue中实时的信息；订阅从节点时，从节点会自动去主节点中的Queue读取数据，由于多了一步操作，所以读取到的数据已经不是实时数据了

该集群架构并不高可用，公司中使用的很少

虽然在该架构中，从节点可以减少消费者对于主节点的压力，但是如果当主节点忽然宕机，该集群无法进行故障转移，也就是从节点无法代替主节点成为新主节点，因为**从节点虽然可以实时同步主节点的Exchange数据，也可以同步Queue(比如：知道主节点有新的queue创建)，并不能实时同步主节点的Queue数据(消息)**，也就是说从节点的数据可能不是完整的

##### 架构图

![image-20211210181040462](./rabbitmq基础/image-20211210181040462.png)

之后构建集群之后，可能在集群中有三个节点：

- 一个主节点 master
- 两个副节点 slave

**主从模式：**更准确的说应该叫主备模式

主节点上的所有的数据都可以复制到副节点上，但是主节点上的队列是没哟办法复制到副节点上的，也就是说默认情况下，消息队列只位于主节点上

也就是说，数据都是存储在主机节点上的，其他副节点可以看到(访问)，但是对消息队列的操作是有限制的

某些情况下，当主节点宕机的情况下，副节点也没有办法去切换成主节点

**核心解决问题：**当集群中，某一时刻，master节点宕机，可以对queue中的信息进行备份，但是这queue不是实时的

##### 集群搭建

###### 配置环境

```markdown
## 0 集群规划
	centos2	172.16.187.10	mq1	master	主节点
	centos3	172.16.187.11	mq2	repl1		副本节点
	centos4 172.16.187.12 mq3	repl2		副本节点

## 1 克隆三台机器主机名和ip映射
	vim /etc/hosts 加入：
		172.16.187.10	mq1
		172.16.187.11	mq2
		172.16.187.12	mq3
	centos2: vim /etc/hostname 加入 mq1
	centos3: vim /etc/hostname 加入 mq2
	centos4: vim /etc/hostname 加入 mq3
```

###### 安装rabbitmq

rabbitmq的安装，虽然之前在centos上有安装，但是感觉自己把它搞复杂化了，下面的是官方的安装方式

> **Install Packages with Yum**
>
> **CentOS 7**
>
> Update Yum package metadata:
>
> ```bash
> yum update -y
> ```
>
> Next, install the packages:
>
> ```bash
> ### install these dependencies from standard OS repositories
> yum install socat logrotate -y
> 
> yum install erlang 11.rabbitmq-server -y
> ```

出现错误：

```bash
[root@mq3 ~]## yum install erlang 11.rabbitmq-server -y
已加载插件：fastestmirror
Loading mirror speeds from cached hostfile
 * base: mirrors.dgut.edu.cn
 * extras: mirrors.aliyun.com
 * updates: mirrors.aliyun.com
没有可用软件包 erlang。
没有可用软件包 11.rabbitmq-server。
错误：无须任何处理
```

解决方案，添加erlang和rabbitmq的源

> **Add Yum Repositories for RabbitMQ and Modern Erlang**
>
> In order to use the Yum repository, a .repo file (e.g. rabbitmq.repo) has to be added under the /etc/yum.repos.d/ directory.
>
> **Red Hat 7, CentOS 7**
>
> The following example sets up a repository that will install RabbitMQ and its Erlang dependency from PackageCloud, and targets **CentOS 7**. There are slight differences to CentOS 8 instructions.
>
> ```shell
> ## In /etc/yum.repos.d/11.rabbitmq.repo
> 
> ##
> ### Zero dependency Erlang
> ##
> 
> [rabbitmq_erlang]
> name=rabbitmq_erlang
> baseurl=https://packagecloud.io/rabbitmq/erlang/el/7/$basearch
> repo_gpgcheck=1
> gpgcheck=1
> enabled=1
> ## PackageCloud's repository key and RabbitMQ package signing key
> gpgkey=https://packagecloud.io/rabbitmq/erlang/gpgkey
>     https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc
> sslverify=1
> sslcacert=/etc/pki/tls/certs/ca-bundle.crt
> metadata_expire=300
> 
> [rabbitmq_erlang-source]
> name=rabbitmq_erlang-source
> baseurl=https://packagecloud.io/rabbitmq/erlang/el/7/SRPMS
> repo_gpgcheck=1
> gpgcheck=0
> enabled=1
> gpgkey=https://packagecloud.io/rabbitmq/erlang/gpgkey
> sslverify=1
> sslcacert=/etc/pki/tls/certs/ca-bundle.crt
> metadata_expire=300
> 
> ##
> ### RabbitMQ server
> ##
> 
> [rabbitmq_server]
> name=rabbitmq_server
> baseurl=https://packagecloud.io/rabbitmq/rabbitmq-server/el/7/$basearch
> repo_gpgcheck=1
> gpgcheck=1
> enabled=1
> ## PackageCloud's repository key and RabbitMQ package signing key
> gpgkey=https://packagecloud.io/rabbitmq/rabbitmq-server/gpgkey
>     https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc
> sslverify=1
> sslcacert=/etc/pki/tls/certs/ca-bundle.crt
> metadata_expire=300
> 
> [rabbitmq_server-source]
> name=rabbitmq_server-source
> baseurl=https://packagecloud.io/rabbitmq/rabbitmq-server/el/7/SRPMS
> repo_gpgcheck=1
> gpgcheck=0
> enabled=1
> gpgkey=https://packagecloud.io/rabbitmq/rabbitmq-server/gpgkey
> sslverify=1
> sslcacert=/etc/pki/tls/certs/ca-bundle.crt
> metadata_expire=300
> ```

添加之后重新`yum install erlang rabbitmq-server -y`，如果出现签名下载失败的情况，请走代理

```bash
[root@mq1 ~]## yum install erlang 11.rabbitmq-server -y
已加载插件：fastestmirror
Loading mirror speeds from cached hostfile
 * base: mirrors.ustc.edu.cn
 * extras: mirrors.ustc.edu.cn
 * updates: mirrors.ustc.edu.cn
正在解决依赖关系
--> 正在检查事务
---> 软件包 erlang.x86_64.0.23.3.4.8-1.el7 将被 安装
---> 软件包 11.rabbitmq-server.noarch.0.3.9.11-1.el7 将被 安装
--> 解决依赖关系完成

依赖关系解决

================================================================================
 Package             架构       版本                  源                   大小
================================================================================
正在安装:
 erlang              x86_64     23.3.4.8-1.el7        rabbitmq_erlang      19 M
 11.rabbitmq-server     noarch     3.9.11-1.el7          rabbitmq_server      14 M

事务概要
================================================================================
安装  2 软件包

总计：33 M
安装大小：52 M
Downloading packages:
警告：/var/cache/yum/x86_64/7/rabbitmq_server/packages/11.rabbitmq-server-3.9.11-1.el7.noarch.rpm: 头V4 RSA/SHA512 Signature, 密钥 ID 6026dfca: NOKEY
从 https://packagecloud.io/11.rabbitmq/11.rabbitmq-server/gpgkey 检索密钥
从 https://github.com/11.rabbitmq/signing-keys/releases/download/2.0/11.rabbitmq-release-signing-key.asc 检索密钥
导入 GPG key 0x6026DFCA:
 用户ID     : "RabbitMQ Release Signing Key <info@rabbitmq.com>"
 指纹       : 0a9a f211 5f46 87bd 2980 3a20 6b73 a36e 6026 dfca
 来自       : https://github.com/11.rabbitmq/signing-keys/releases/download/2.0/11.rabbitmq-release-signing-key.asc
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  正在安装    : erlang-23.3.4.8-1.el7.x86_64                                1/2
  正在安装    : 11.rabbitmq-server-3.9.11-1.el7.noarch                         2/2
  验证中      : 11.rabbitmq-server-3.9.11-1.el7.noarch                         1/2
  验证中      : erlang-23.3.4.8-1.el7.x86_64                                2/2

已安装:
  erlang.x86_64 0:23.3.4.8-1.el7      11.rabbitmq-server.noarch 0:3.9.11-1.el7

完毕！
```

验证安装情况：

1. erlang：erl -v

2. rabbitmq

```bash
[root@mq1 ~]## systemctl start 11.rabbitmq-server
[root@mq1 ~]## systemctl status 11.rabbitmq-server
● 11.rabbitmq-server.service - RabbitMQ broker
   Loaded: loaded (/usr/lib/systemd/system/11.rabbitmq-server.service; disabled; vendor preset: disabled)
   Active: active (running) since 五 2021-12-10 20:46:08 CST; 21s ago
 Main PID: 49712 (beam.smp)
   CGroup: /system.slice/11.rabbitmq-server.service
           ├─49712 /usr/lib64/erlang/erts-11.2.2.7/bin/beam.smp -W w -MBas ag...
           ├─49727 erl_child_setup 32768
           ├─49752 /usr/lib64/erlang/erts-11.2.2.7/bin/epmd -daemon
           ├─49775 inet_gethost 4
           └─49776 inet_gethost 4

12月 10 20:46:05 mq1 11.rabbitmq-server[49712]: Doc guides:  https://11.rabbitmq....l
12月 10 20:46:05 mq1 11.rabbitmq-server[49712]: Support:     https://11.rabbitmq....l
12月 10 20:46:05 mq1 11.rabbitmq-server[49712]: Tutorials:   https://11.rabbitmq....l
12月 10 20:46:05 mq1 11.rabbitmq-server[49712]: Monitoring:  https://11.rabbitmq....l
12月 10 20:46:05 mq1 11.rabbitmq-server[49712]: Logs: /var/log/11.rabbitmq/rabbit...g
12月 10 20:46:05 mq1 11.rabbitmq-server[49712]: /var/log/11.rabbitmq/rabbit@mq1_u...g
12月 10 20:46:05 mq1 11.rabbitmq-server[49712]: <stdout>
12月 10 20:46:05 mq1 11.rabbitmq-server[49712]: Config file(s): (none)
12月 10 20:46:08 mq1 11.rabbitmq-server[49712]: Starting broker... completed w....
12月 10 20:46:08 mq1 systemd[1]: Started RabbitMQ broker.
Hint: Some lines were ellipsized, use -l to show in full.
```

###### 配置rabbitmq

1. 开启web管理插件

```bash
11.rabbitmq-plugins enable rabbitmq_management
```

2. 配置rabbitmq配置文件

能让guest能在web管理界面登录

- 关闭防火墙

```bash
service iptables stop
```

- 在`/etc/rabbitmq`中创建`rabbitmq.conf`配置文件，并添加如下内容

```bash
[
{rabbit, [{tcp_listeners, [5672]}, {loopback_users, ["admin"]}]}
].
```

- admin是添加的用户名
- . 是必须的

官方表示，rabbitmq会在启动的时候从这些位置读取配置信息

![image-20211210210801146](./rabbitmq基础/image-20211210210801146.png)

**这个官方骗人，rabbitmq.conf名字的配置文件启动失败，要rabbitmq.config才行**

使用以下命令添加admin用户到rabbitmq，并赋予它管理员权限

```bash
## RabbitMQ新增账号密码
rabbitmqctl add_user admin 123456
## 设置成管理员角色
rabbitmqctl set_user_tags admin administrator
## 设置权限
rabbitmqctl set_permissions -p "/" admin ".*" ".*" ".*"
## 查看用户列表
rabbitmqctl list_users
```

执行结果

```bash
[root@mq1 ~]## rabbitmqctl add_user admin 123456
Adding user "admin" ...
Done. Don't forget to grant the user permissions to some virtual hosts! See 'rabbitmqctl help set_permissions' to learn more.
[root@mq1 ~]## rabbitmqctl set_user_tags admin administrator
Setting tags for user "admin" to [administrator] ...
[root@mq1 ~]## rabbitmqctl set_permissions -p "/" admin ".*" ".*" ".*"
Setting permissions for user "admin" in vhost "/" ...
[root@mq1 ~]## rabbitmqctl list_users
Listing users ...
user	tags
admin	[administrator]
guest	[administrator]
```

3. 重启rabbitmq

```bash
systemctl restart 11.rabbitmq-server
```

> 配置之后在启动报错：
>
> ```bash
> [root@mq1 11.rabbitmq]## systemctl start 11.rabbitmq-server
> Job for 11.rabbitmq-server.service failed because the control process exited with error code. See "systemctl status rabbitmq-server.service" and "journalctl -xe" for details.
> ```
>
> 排错步骤：
>
> 1. 获取启动的日志`cat /var/log/messages | grep erro`
>
> ![image-20211210214818383](./rabbitmq基础/image-20211210214818383.png)
>
> 可以看到在解析配置文件的时候出现了错误，改成rabbitmq.config之后成功

使用`rabbitmqctl status`查看rabbitmq状态

```bash
[root@mq1 11.rabbitmq]## rabbitmqctl status
Status of node rabbit@mq1 ...
Runtime

OS PID: 11307
OS: Linux
Uptime (seconds): 148
Is under maintenance?: false
RabbitMQ version: 3.9.11
Node name: rabbit@mq1
Erlang configuration: Erlang/OTP 23 [erts-11.2.2.7] [source] [64-bit] [smp:2:2] [ds:2:2:10] [async-threads:1] [hipe]
Erlang processes: 355 used, 1048576 limit
Scheduler run queue: 1
Cluster heartbeat timeout (net_ticktime): 60

Plugins

Enabled plugin file: /etc/11.rabbitmq/enabled_plugins
Enabled plugins:

 * rabbitmq_management
 * amqp_client
 * rabbitmq_web_dispatch
 * cowboy
 * cowlib
 * rabbitmq_management_agent

Data directory

Node data directory: /var/lib/11.rabbitmq/mnesia/rabbit@mq1
Raft data directory: /var/lib/11.rabbitmq/mnesia/rabbit@mq1/quorum/rabbit@mq1

Config files

 * /etc/11.rabbitmq/11.rabbitmq.config

Log file(s)

 * /var/log/11.rabbitmq/rabbit@mq1.log
 * /var/log/11.rabbitmq/rabbit@mq1_upgrade.log
 * <stdout>

Alarms

(none)

Memory

Total memory used: 0.0764 gb
Calculation strategy: rss
Memory high watermark setting: 0.4 of available memory, computed to: 0.7631 gb

code: 0.0268 gb (35.04 %)
other_proc: 0.0188 gb (24.55 %)
other_system: 0.0135 gb (17.68 %)
reserved_unallocated: 0.0074 gb (9.67 %)
allocated_unused: 0.0034 gb (4.48 %)
other_ets: 0.0034 gb (4.42 %)
atom: 0.0014 gb (1.81 %)
plugins: 0.0011 gb (1.42 %)
metrics: 0.0002 gb (0.3 %)
mgmt_db: 0.0002 gb (0.29 %)
mnesia: 0.0001 gb (0.12 %)
binary: 0.0001 gb (0.11 %)
quorum_ets: 0.0 gb (0.04 %)
msg_index: 0.0 gb (0.04 %)
connection_other: 0.0 gb (0.0 %)
stream_queue_procs: 0.0 gb (0.0 %)
stream_queue_replica_reader_procs: 0.0 gb (0.0 %)
connection_channels: 0.0 gb (0.0 %)
connection_readers: 0.0 gb (0.0 %)
connection_writers: 0.0 gb (0.0 %)
queue_procs: 0.0 gb (0.0 %)
queue_slave_procs: 0.0 gb (0.0 %)
quorum_queue_procs: 0.0 gb (0.0 %)
stream_queue_coordinator_procs: 0.0 gb (0.0 %)

File Descriptors

Total: 2, limit: 32671
Sockets: 0, limit: 29401

Free Disk Space

Low free disk space watermark: 0.05 gb
Free disk space: 38.3294 gb

Totals

Connection count: 0
Queue count: 0
Virtual host count: 1

Listeners

Interface: [::], port: 15672, protocol: http, purpose: HTTP API
Interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
```

4. 网页访问正常

![image-20211210215629445](./rabbitmq基础/image-20211210215629445.png)

###### 集群配置

1. 保持erlang.cookie一致

> 官方文档中：https://www.rabbitmq.com/clustering.html
>
> **How CLI Tools Authenticate to Nodes (and Nodes to Each Other): the Erlang Cookie**
>
> RabbitMQ nodes and CLI tools (e.g. rabbitmqctl) use a cookie to determine whether they are allowed to communicate with each other. For two nodes to be able to communicate they must have the same shared secret called the Erlang cookie. The cookie is just a string of alphanumeric characters up to 255 characters in size. It is usually stored in a local file. The file must be only accessible to the owner (e.g. have UNIX permissions of 600 or similar). Every cluster node must have the same cookie.
>
> If the file does not exist, Erlang VM will try to create one with a randomly generated value when the RabbitMQ server starts up. Using such generated cookie files are appropriate in development environments only. Since each node will generate its own value independently, this strategy is not really viable in a [clustered environment](https://www.rabbitmq.com/clustering.html).
>
> Erlang cookie generation should be done at cluster deployment stage, ideally using automation and orchestration tools.
>
> In distributed deployment
>
> **Cookie File Locations**
>
> **Linux, MacOS, *BSD**
>
> On UNIX systems, the cookie will be typically located in /var/lib/rabbitmq/.erlang.cookie (used by the server) and $HOME/.erlang.cookie (used by CLI tools). Note that since the value of $HOME varies from user to user, it's necessary to place a copy of the cookie file for each user that will be using the CLI tools. This applies to both non-privileged users and root.
>
> RabbitMQ nodes will log its effective user's home directory location early on boot.
>
> 表示：
>
> - rabbitmq和rabbitmqctl工具使用cookie来确定他们是否被允许通信，为了让两个节点能够通信，它们必须具有相同的共享秘密，称为erlang cookie
> - 如果该文件不存在，Erlang VM 会在 RabbitMQ 服务器启动时尝试创建一个随机生成的值
> - 使用此类生成的 cookie 文件仅适用于开发环境。由于每个节点都会独立产生自己的价值，这种策略在集群环境中并不真正可行
> - 在 UNIX 系统上，cookie 通常位于/var/lib/rabbitmq/.erlang.cookie（由服务器使用）和$HOME/.erlang.cookie（由 CLI 工具使用）

```bash
[root@mq1 11.rabbitmq]## ll -a
总用量 752
drwxr-xr-x.  3 11.rabbitmq 11.rabbitmq     64 12月 10 21:26 .
drwxr-xr-x. 28 root     root       4096 12月 10 20:43 ..
-r--------.  1 11.rabbitmq 11.rabbitmq     20 12月 10 00:00 .erlang.cookie
-rw-r-----.  1 11.rabbitmq 11.rabbitmq 759333 12月 10 21:52 erl_crash.dump
drwxr-x---.  4 11.rabbitmq 11.rabbitmq    111 12月 10 21:53 mnesia
```

为了能让我们的erlang cookie保持一致，我们将mq1的.erlang.cookie拷贝到mq2、mq3

先停止三台机器的rabbitmq-server

```bash
[root@mq1 11.rabbitmq]## systemctl stop 11.rabbitmq-server ## 停止rabbitmq-server
```

传输到mq2、mq3

```bash
[root@mq1 11.rabbitmq]## pwd
/var/lib/11.rabbitmq
[root@mq1 11.rabbitmq]## scp .erlang.cookie root@mq2:/var/lib/11.rabbitmq/
The authenticity of host 'mq2 (172.16.187.11)' can't be established.
ECDSA key fingerprint is SHA256:Yo8XjrNSC9Zjw1Jqd8SItOOKQ4vAPPAvFxfVzMPRsjc.
ECDSA key fingerprint is MD5:77:f7:5e:b5:5a:01:47:5b:b6:ab:e4:6e:e0:55:04:59.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'mq2,172.16.187.11' (ECDSA) to the list of known hosts.
root@mq2's password:
Permission denied, please try again.
root@mq2's password:
.erlang.cookie                                100%   20    17.5KB/s   00:00
[root@mq1 11.rabbitmq]## scp .erlang.cookie root@mq3:/var/lib/11.rabbitmq/
The authenticity of host 'mq3 (172.16.187.12)' can't be established.
ECDSA key fingerprint is SHA256:Yo8XjrNSC9Zjw1Jqd8SItOOKQ4vAPPAvFxfVzMPRsjc.
ECDSA key fingerprint is MD5:77:f7:5e:b5:5a:01:47:5b:b6:ab:e4:6e:e0:55:04:59.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'mq3,172.16.187.12' (ECDSA) to the list of known hosts.
root@mq3's password:
.erlang.cookie                                100%   20     8.9KB/s   00:00
```

2. 查看cookie是否一致

```bash
[root@mq1 11.rabbitmq]## cd /var/lib/11.rabbitmq
[root@mq1 11.rabbitmq]## cat .erlang.cookie
```

3. 后台启动rabbitmq，所有节点执行如下命令，启动成功访问管理界面

```bash
11.rabbitmq-server -detached
```

如果启动之后访问web界面不成功，直接使用前台启动，可以看到端口绑定失败

```bash
[root@mq1 11.rabbitmq]## 11.rabbitmq-server

BOOT FAILED
===========
ERROR: could not bind to distribution port 25672, it is in use by another node: rabbit@mq1

2021-12-10 22:52:40.301255+08:00 [erro] <0.131.0>
2021-12-10 22:52:40.301255+08:00 [erro] <0.131.0> BOOT FAILED
2021-12-10 22:52:40.301255+08:00 [erro] <0.131.0> ===========
2021-12-10 22:52:40.301255+08:00 [erro] <0.131.0> ERROR: could not bind to distribution port 25672, it is in use by another node: rabbit@mq1
```

先杀掉所有的rabbitmq进程，在重新后台启动

```bash
[root@mq1 11.rabbitmq]## ps -ef | grep 11.rabbitmq
11.rabbitmq  14635      1  1 22:46 ?        00:00:07 /usr/lib64/erlang/erts-11.2.2.7/bin/beam.smp -W w -MBas ageffcbf -MHas ageffcbf -MBlmbcs 512 -MHlmbcs 512 -MMmcs 30 -P 1048576 -t 5000000 -stbt db -zdbbl 128000 -sbwt none -sbwtdcpu none -sbwtdio none -B i -- -root /usr/lib64/erlang -progname erl -- -home /var/lib/11.rabbitmq -- -pa  -noshell -noinput -s rabbit boot -boot start_sasl -syslog logger [] -syslog syslog_error_logger false -noshell -noinput
11.rabbitmq  14639  14635  0 22:46 ?        00:00:00 erl_child_setup 1024
11.rabbitmq  14665      1  0 22:46 ?        00:00:00 /usr/lib64/erlang/erts-11.2.2.7/bin/epmd -daemon
11.rabbitmq  14688  14639  0 22:46 ?        00:00:00 inet_gethost 4
11.rabbitmq  14689  14688  0 22:46 ?        00:00:00 inet_gethost 4
root      15537   2847  0 22:53 pts/0    00:00:00 grep --color=auto 11.rabbitmq
[root@mq1 11.rabbitmq]## kill -9 14635
```

访问网页成功表示启动成功

> 教程说这种方式启动是不会加载插件的（web插件），所以访问web是访问不到的，可以通过`rabbitmqctl cluster_status`来查看状态

4. 在mq2和mq3中执行加入集群命令

- 关闭

```bash
[root@mq2 11.rabbitmq]## rabbitmqctl stop_app
Stopping rabbit application on node rabbit@mq2 ...
```

- 加入集群

```bash
[root@mq2 11.rabbitmq]## rabbitmqctl join_cluster rabbit@mq1
Clustering node rabbit@mq2 with rabbit@mq1
```

- 启动服务

```bash
[root@mq2 11.rabbitmq]## rabbitmqctl start_app
Starting node rabbit@mq2 ...
```

5. 查询集群状态，任意节点执行

```bash
[root@mq3 11.rabbitmq]## rabbitmqctl cluster_status
Cluster status of node rabbit@mq3 ...
Basics

Cluster name: rabbit@mq3

Disk Nodes

rabbit@mq1
rabbit@mq2
rabbit@mq3

Running Nodes

rabbit@mq1
rabbit@mq2
rabbit@mq3

Versions

rabbit@mq1: RabbitMQ 3.9.11 on Erlang 23.3.4.8
rabbit@mq2: RabbitMQ 3.9.11 on Erlang 23.3.4.8
rabbit@mq3: RabbitMQ 3.9.11 on Erlang 23.3.4.8

Maintenance status

Node: rabbit@mq1, status: not under maintenance
Node: rabbit@mq2, status: not under maintenance
Node: rabbit@mq3, status: not under maintenance

Alarms

(none)

Network Partitions

(none)

Listeners

Node: rabbit@mq1, interface: [::], port: 15672, protocol: http, purpose: HTTP API
Node: rabbit@mq1, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@mq1, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@mq2, interface: [::], port: 15672, protocol: http, purpose: HTTP API
Node: rabbit@mq2, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@mq2, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@mq3, interface: [::], port: 15672, protocol: http, purpose: HTTP API
Node: rabbit@mq3, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@mq3, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0

Feature flags

Flag: drop_unroutable_metric, state: disabled
Flag: empty_basic_get_metric, state: disabled
Flag: implicit_default_bindings, state: enabled
Flag: maintenance_mode_status, state: enabled
Flag: quorum_queue, state: enabled
Flag: stream_queue, state: enabled
Flag: user_limits, state: enabled
Flag: virtual_host_metadata, state: enabled
```

6. 如果出现如下显示，集群搭建成功

```bash
Running Nodes

rabbit@mq1
rabbit@mq2
rabbit@mq3
```

7. 通过任意节点ip访问web管理界面，可以看到节点

![image-20211210230936309](./rabbitmq基础/image-20211210230936309.png)



#### 镜像集群(镜像队列)

RabbitMQ中最经典的集群架构，基于普通集群构建

**镜像队列机制就是将队列在多个节点之间设置主从关系，消息会在节点之间进行自动同步，且如果其中一个节点不可用，并不会导致消息丢失或服务不可用的情况，提升MQ集群的整体高可用性**

该集群引入镜像的概念，从节点可以通过镜像去实时同步主节点中Queue的数据，可以真正做到消息百分百不丢失。由于从节点持有完整主节点数据，那么当主节点忽然宕机，从节点还可以代替主节点成为新主节点，从而实现失败的故障转移

##### 架构图

![image-20211210182022214](./rabbitmq基础/image-20211210182022214.png)

rabbitmq的使用，为了高可用，需要配合lvs和haproxy来使用

- 消费者/生产者与lvs连接，lvs连接到代理中间件，由haproxy来决定要访问哪个节点
- rabbitmq节点会自动镜像同步

镜像架构不需要我们搭建，只需要在普通集群中的做额外的配置就可以了

##### 集群搭建

> RabbitMQ是基于Erlang编写，Erlang语言天生具备分布式特性（通过同步Erlang集群各节点的magic cookie来实现）。因此，RabbitMQ天然支持Clustering。这使得RabbitMQ本身不需要像ActiveMQ、Kafka那样通过ZooKeeper分别来实现HA高可用方案和保存集群的元数据。集群是保证可靠性的一种方式，同时可以通过水平扩展以达到增加消息吞吐量能力的目的。
>
> 该模式解决了普通模式中的问题，其实质和普通模式不同之处在于，消息实体会主动在镜像节点间同步，而不是在客户端取数据时临时拉取。
>
> 该模式带来的副作用也很明显，除了降低系统性能外，如果镜像队列数量过多，加之大量的消息进入，集群内部的网络带宽将会被这种同步通讯大大消耗掉。所以在对可靠性要求较高的场合中适用。
>
> 镜像队列基本上就是一个特殊的BackingQueue，它内部包裹了一个普通的BackingQueue做本地消息持久化处理，在此基础上增加了将消息和ack复制到所有镜像的功能。
>
> 所有对mirror_queue_master的操作，会通过组播GM（下面会讲到）的方式同步到各slave节点。GM负责消息的广播，mirror_queue_slave负责回调处理，而master上的回调处理是由coordinator负责完成。mirror_queue_slave中包含了普通的BackingQueue进行消息的存储，master节点中BackingQueue包含在mirror_queue_master中由AMQQueue进行调用
>
> ![img](./rabbitmq基础/1460000038432420.png)

#### 配置策略

1. 策略说明

```bash
rabbitctl set_policy [-p <vhost>] [--priority <priority>] [--apply-to <apply-to>] <name> <pattern> <definition>
-p vhost: 可选参数，针对指定vhost下的queue进行设置
name: policy的名称
pattern: queue的匹配模式(正则表达式)
definition: 镜像定义，包括三个部分ha-mode, ha-parms, ha-sync-mode
	ha-mode: 指明镜像队列的模式，有效值为 all/exactly/nodes
		all: 表示在集群中所有的节点上进行镜像,所有的节点都可以是镜像
		exactly: 表示在指定个数的节点上进行镜像，节点的个数由ha-params指定
		nodes: 表示在指定的节点上进行镜像，节点的个数由ha-params指定
	ha-parms: ha-mode模式需要用到的参数
	ha-sync-mode: 进行队列中消息的同步方式，有效值为automatic(自动同步)和manual(手动同步)
	priority: 可选参数，policy的优先级
```

2. 查看当前策略

可以在当前集群中的任意一个节点

```bash
rabbitmqctl list_policies
```

3. 添加策略

```bash
rabbitmqctl set_policy ha-all "^hello" '{"ha-mode":"all","ha-sync-mode":"automatic"}'
## 说明：策略正则表达式为"^"表示所有匹配匹配所有队列名称 ^hello:匹配hello开头队列
```

- 创建一个名字为ha-all的策略
- ^hello : 匹配hello开头队列
- 策略模式是all
- 队列数据同步模式：automatic 自动

执行结果：

```bash
Setting policy "ha-all" for pattern "^hello" to "{"ha-mode":"all","ha-sync-mode":"automatic"}" with priority "0" for vhost "/" ...
```

查看web管理界面

![image-20211211003113071](./rabbitmq基础/image-20211211003113071.png)

这个时候如果，往其中一个节点发送消息，即使这个节点掉了，其他节点也能消费这个消息

4. 删除策略

```bash
rabbitmqctl clear_policy ha-all
```

