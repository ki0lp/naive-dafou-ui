---
title: tomcat剖析
date: 2021/12/20
description: tomcat剖析
category: 核心
tag: [Java, Java web, tomcat,源码]
---

## 前言

基于Tomcat7

![在这里插入图片描述](./tomcat剖析/20210221223351388.png)

1. `Tomcat`是一个`Servlet`容器。
2. 使用`Java`代码模拟一个`Tomcat`容器：

```java
class Tomcat{
	List<Servlet> servlets;
	Connector connect;//处理请求，生成了Request
}
```

3. 回顾`servlet`的定义

```java
public class MyHttpServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.getWriter().println("http");
    }
}
```

问题1：我们定义的`servlet`，它的实例是怎么生成的？`doGet`方法又是怎么调用到的呢？在哪执行的？

```java
MyHttpServlet myHttpServlet=new MyHttpServlet (); 
myHttpServlet.doGet();
```

问题2：调用doGet()方法时，HttpServletRequest，HttpServletResponse都是接口，那么入参的实际类型是什么？

实际上HttpServletRequest，HttpServletResponse接口的实现类，由servlet容器实现，比如：tomcat,jetty。我们把项目部署到tomcat中，tomcat就提供了一个HttpServletRequest和HttpServletResponse的实现类，部署到jetty,jetty就提供了相应的实现类，这是一个规范。
其中，在Tomcat中，HttpServletRequest的实现类就是RequestFacade

4. RequestFacade-门面模式

RequestFacade实现了HttpServletRequest，充当门面模式中的外观类。RequestFacade屏蔽内部子系统的细节。

RequestFacade代表的是一个请求，实际上是RequestFacade的属性Request,才是真正代表的一个请求，外界的http请求信息，都封装在这个Request对象中，只是利用门面模式的外观类，把它屏蔽在里面了。

Request本身也是实现了接口HttpServletRequest

5. Tomcat的三种部署方式

```java
/**
     * Deploy applications for any directories or WAR files that are found
     * in our "application root" directory.
     * 部署应用的三种方式
     * 1. 描述符部署
     * 2. War包部署
     * 3. 文件夹部署
     *
     * 另外Tomcat中是使用异步多线程的方式部署应用的
     */
protected void deployApps() {

  File appBase = appBase();
  File configBase = configBase();
  String[] filteredAppPaths = filterAppPaths(appBase.list());
  // Deploy XML descriptors from configBase
  // 描述符部署
  deployDescriptors(configBase, configBase.list());
  // Deploy WARs
  // war包部署
  deployWARs(appBase, filteredAppPaths);
  // Deploy expanded folders
  // 文件夹部署
  deployDirectories(appBase, filteredAppPaths);

}
```

- war包部署
- 文件夹部署
- 描述符部署

前面两种经常使用，这里不再说明，这里说一下描述符部署

![image-20220220140547506](./tomcat剖析/image-20220220140547506.png)

可以在server.xml文件中配置Context标签，指定web应用的位置

- path就是启动Tomcat之后的访问网址
- docBase就是web项目路径

这种配置方式，主要为了把Tomcat启动访问网址设置成该项目`path="/"`

## 整体架构

```markdown
# 课程内容
1. tomcat整体架构和处理请求流程解析
2. tomcat中关于长连接的底层原理与源码解析
3. tomcat自定义类加载器的使用与源码实现
4. tomcat请求处理详解
5. tomcat启动过程
6. tomcat中servlet功能的实现
7. tomcat中JSP功能的实现
```

### 源码编译

> tomcat 的源码下载：https://gitee.com/archguide/tomcat.git
>
> tomcat在GitHub开源了，课程中的源代码是已经编译过的，所以使用和课程中一致的地址
>
> **使用课程源码的运行步骤**
>
> 1. 使用idea从github上克隆源码
>
> 按照下面的编译步骤1中的即可
>
> 修改一下分支，和下面的一致
>
> 2. 运行tomcat
>
> 使用ant命令`ide-eclipse`，在7版本中只支持eclipse方式运行
>
> ![image-20220220005415570](./tomcat剖析/image-20220220005415570.png)
>
> 现在工程里面已经下载好了，所以说执行应该很快的
>
> 3. 使用idea在重新打开项目，使用`从已有的项目中导入`->`选择eclipse的方式`
>
> ![image-20220220005650218](./tomcat剖析/image-20220220005650218.png)
>
> 4. 这样就完成了Tomcat的导入了

> **完整编译步骤**
> 
> ```markdown
> 1. 使用idea从github上克隆源码
> 2. 源码克隆下来之后，不能直接运行，需要使用ant进行编译，主要目的是下载依赖
> 3. 依赖添加进来之后，可以尝试使用工具idea构建工程
> 4. 构建成功之后，运行源代码
> ```
> 
>**编译步骤**
> 
>1. 使用idea从github上克隆源码
> 
>![image-20220220000059546](./tomcat剖析/image-20220220000059546.png)
> 
>![image-20220220000114530](./tomcat剖析/image-20220220000114530.png)
> 
>```markdown
> # 将代码拉取下来之后，先修改一下分支
> ```
> 
>![image-20220220004555234](./tomcat剖析/image-20220220004555234.png)
> 
>2. 源码克隆下来之后，不能直接运行，需要使用ant进行编译，主要目的是下载依赖
> 
>![image-20220220000149240](./tomcat剖析/image-20220220000149240.png)
> 
>在⽤ant编译之前，建议先修改build.properties.default⽂件中的base.path的值，ant编译时需要去下载第三⽅jar包，base.path将指定这些jar存放的位置
> 
>![image-20220220000229189](./tomcat剖析/image-20220220000229189.png)
> 
>修改完成后，在源码⽬录下使⽤命令⾏执⾏ant ide-intellij进⾏编译。执⾏命令后需要等待⼀段时间
> 
>![image-20220220000410375](./tomcat剖析/image-20220220000410375.png)
> 
>执⾏成功后在⼯程⽬录结构中多出⼀个⽂件夹，该⽂件夹保存了Tomcat源码所依赖的jar
> 
>![image-20220220000442306](./tomcat剖析/image-20220220000442306.png)
> 
>我们要把该⽂件夹下的jar加⼊到classpath中去，进⼊到Project Structure。把下载的依赖添加进来
> 
>![image-20220220000512059](./tomcat剖析/image-20220220000512059.png)
> 
>![image-20220220000544417](./tomcat剖析/image-20220220000544417.png)
> 
>3. 依赖添加进来之后，可以尝试使用工具idea构建工程
> 
>![image-20220220000645305](./tomcat剖析/image-20220220000645305.png)
> 
>构建过程中可能会报错，⽐如：
> 
>![image-20220220000724198](./tomcat剖析/image-20220220000724198.png)
> 
>该modules下的⼏个模块都是maven⼯程，右键pom.xml⽂件点击Add as Maven Project，点击后会⾃动下载依赖，从⽽解决构建报错，其他模块也类似
> 
>对三个模块都下载依赖后，重新构建后，可能会报如下错误： 
> 
>![image-20220220000850019](./tomcat剖析/image-20220220000850019.png)
> 
>提示ant包不存在，需要引⼊ant.jar的依赖，还是⼀样，打开Project Structure，选择tomcat Module，添加依赖，将ant.jar添加进来，这⾥需要注意，Tomcat默认⽤的是ant-1.9.8.jar，所以可以提前把这个jar下载在电脑上，然后引⼊此jar
> 
>![image-20220220000923723](./tomcat剖析/image-20220220000923723.png)
> 
>但是Apply的时候，会提示
> 
>![image-20220220000947174](./tomcat剖析/image-20220220000947174.png)
> 
>解决办法是，将ant-1.9.8.jar保存在tomcat-build-jars⽂件夹下，然后右键该jar，点击Add as Library
> 
>![image-20220220001022237](./tomcat剖析/image-20220220001022237.png)
> 
>![image-20220220001032188](./tomcat剖析/image-20220220001032188.png)
> 
>点击ok，可以绕过刚刚的错误。重新构建，仍然会报错
> 
>![image-20220220001052861](./tomcat剖析/image-20220220001052861.png)
> 
>将@VERSION@改成9即可，再次重新构建，构建没有问题了
> 
>如果构建后没有报错，但是下图的这个Java⽂件中还是报红⾊，这应该是IDEA的问题，只需要⼿动的使⽤IDEA的快捷提示重新import⼀下依赖即可
> 
>![image-20220220001139397](./tomcat剖析/image-20220220001139397.png)
> 
>4. 构建成功后，运行源代码
> 
>Tomcat的启动类是org.apache.catalina.startup.Bootstrap类。直接运⾏此类中的Main⽅法可以看到Tomcat的启动⽇志
> 
>![image-20220220001230469](./tomcat剖析/image-20220220001230469.png)
> 
>但是我的机器上有乱码，Tomcat做了国际化，增加运⾏参数：-Duser.language=en
> 
>![image-20220220001257818](./tomcat剖析/image-20220220001257818.png)
> 
>增加之后再运⾏就没有问题了
> 
>![image-20220220001311743](./tomcat剖析/image-20220220001311743.png)
> 
>但是此时访问localhost:8080，仍然会报错，看不到我们想看到的熟悉的Tomcat欢迎⻚
> 
>![image-20220220001339633](./tomcat剖析/image-20220220001339633.png)
> 
>这是因为Tomcat内部使⽤了SPI机制来初始化jsp相关的东⻄，⼿动运⾏源码的过程中默认不会去初始化jsp相关
> 
>我们找到
> 
>![image-20220220001409856](./tomcat剖析/image-20220220001409856.png)
> 
>在⼯程⽬录下新建resouces⽂件夹，然后新建META-INF⽂件夹，然后将上图中的services⽂件夹复制到META-INF⽂件中，最后将resources⽂件夹加⼊到classpath中
> 
>![image-20220220001437662](./tomcat剖析/image-20220220001437662.png)
> 
>重新运⾏Bootstrap，访问正常
> 
>![image-20220220001508011](./tomcat剖析/image-20220220001508011.png)

我们现在先将Tomcat7，因为在Tomcat7中，既用到了BIO又用到了NIO，而Tomcat8去掉了BIO，使用NIO为默认的

我们的到时候看源码先使用BIO的方式去看，比较容易理解

```markdown
# 因为BIO和NIO都是去取数据和传输使用的，我们真正要研究的是Tomcat在取到数据之后的操作
```

### Tomcat是Serlvet容器

Tomcat的架构

![image-20220220144458268](./tomcat剖析/image-20220220144458268.png)

```markdown
# 测试源码方式是否能运行成功
创建web项目，然后打包成war放到源码项目的webapps目录下
```

```markdown
# 启动Tomcat项目
通过查看Tomcat的启动脚本，其实最后调用的是下面这个启动类
```

![image-20220220134641695](./tomcat剖析/image-20220220134641695.png)

如果启动终端出现乱码的话，可通过下面的设置或者通过设置语言为空（设置语言为空默认就是英文）

![image-20220220134816280](./tomcat剖析/image-20220220134816280.png)

```markdown
# Servlet 3.0之后，可以通过注解的方式来配置servlet，这样就可以不用在web.xml中配置了
那么war最后其实就可以只留下class文件，那么和jar其实就是没有区别了
# 那为什么web应用为什么不打成jar，而是打成war包呢？
Tomcat在启动的时候，就会去识别webapps目录下，如果有一个文件夹，就会把它当成一个web应用，那么现在有一个xxx.jar，那么这个时候Tomcat应该怎么去判断，是一个web应用还是别的应用依赖的jar包呢，并且是在代码中写死的后缀的war包
```

![image-20220220140229739](./tomcat剖析/image-20220220140229739.png)

### Tomcat底层架构组成

Container容器是父接口，所有的子容器都必须实现这个接口，在Tomcat中Container容器的设计是典型的责任链设计模式，其有四个子容器：Engine、Host、Context和Wrapper。这四个容器之间是父子关系，Engine容器包含Host，Host包含Context，Context包含Wrapper

我们在web项目中的一个Servlet类对应一个Wrapper，多个Servlet就对应多个Wrapper，当有多个Wrapper的时候就需要一个容器来管理这些Wrapper了，这就是Context容器了，Context容器对应一个工程，所以我们新部署一个工程到Tomcat中就会新创建一个Context容器

```markdown
# Engine->Host->Context->Wrapper->Servlet
```

1. Context-Servlet容器

`Context`继承自`Container`容器接口

```java
public interface Context extends Container {
  // ***
}
```

`context`表示的就是应用，这个应用是一个`servlet`容器

```xml
<Context path="/ServletDemoHello##2" docBase="D:\IdeaProjects\ServletDemo\target\classes" />
```

- `path`：是访问时的根地址，表示访问的路径。就是项目路径，根据请求带的项目路径，来确定使用哪个`Context`来处理请求
- `docbase`：表示应用程序的路径，注意斜杠的方向“`/`”。应用编译后的`class`文件的路径

2. Host-Servlet容器

表示虚拟的主机，隔离不同的环境，`Host`表示虚拟主机，一个虚拟主机下可以定义很多个`Context`，即可以部署多个项目

```xml
<Host name="localhost"  appBase="webapps" unpackWARs="true" autoDeploy="true">
	<Context xxxxx/>
  <Context xxxxx/>
</Host>
```

- `name`：表示虚拟主机的名字,就是对应请求的域名，根据域名来确定使用哪个虚拟主机
- `appBase`：表示应用存放的目录
- `unpackWARs`：表示是否需要解压
- `autoDeploy`：热部署

3. Engine-Servlet容器

`Engine`引擎包含多个`Host`,它的责任就是将用户请求分配给一个虚拟上机处理

```xml
<Engine name="Catalina" defaultHost="localhost">
  <Host xxx>
  	<Context xxxx />
    <Context xxxx />
  </Host>
</Engine>
```

- `name`：表示引擎的逻辑名称，在日志和错误消息中会用到，在同一台服务器上有多个`Service`时，`name`必须唯一
- `defaultHost`：指定默认主机，如果没有分配哪个主机来执行用户请求，由这个值所指定的主机来处理，这个值必须和`<Host>`元素中的其中一个相同

4. Wrapper-Servlet容器

`Context`是一个`servlet`容器，但是它并不是直接装`servlet`实例，可以简单的理解,`Context`包含了多个`Wrapper`

```java
class Context{
	List<Wrapper> wrappers;
}
```

`Wrapper`才是装了多个`Servlet`实例，注意装的是某一个类型的`servlet`实例，比如，我自定一了一个`servlet`,就叫`MyServlet`，那么就有一个`Wrapper`里装的都是`MyServlet`的实例

```java
class Wrapper{
	List<servlet> servlet;//装的是某一个类型的servlet实例
}
```

- 一般servlet都是单例的，所有访问同一个servlet的请求是共用同一个servlet实例的
- 定义的servlet实现了SingleThreadModel接口，每一个访问这个servlet的请求，单独有一个servlet实例，既然servlet支持了这个功能，肯定要去实现这个功能，因此，就有了wrapper

5. Pipline管道

前面的`4`个容器都包含`Pipiline`管道，Pipeline 管道，上面的四个容器中，每一个容器中都一个管道`Pipeline pipeline`，容器之间主要是通过管道交流调用

Value 阀门，每个管道有默认的阀门，我们也可以自定义阀门

在Tomcat中，对于每一个容器，都有一个公共的组件Pipiline管道，每个管道下可以有多个阀门Valve，一个阀表示一个具体的执行任务，在servlet容器的管道中，除了有一个基础阀BaseValve，还可以添加任意数量的阀。阀的数量指的是额外添加的阀数量，即不包括基础阀。可以通过编辑Tomcat的配置文件（server.xml）来动态地添加阀

![image-20220220145106661](./tomcat剖析/image-20220220145106661.png)

```markdown
# 比如说，现在有一个请求，Tomcat会一步一步的把Request，先交给Engine中的管道，找到对应的Host是那一个，然后发送到Host对应的管道中，Request经过Host的管道，Host对其进行处理之后找到对应的Context，交给Context，Request经过Context的管道，进行处理之后找打对应的Wrapper，经此类推，找到对应Servlet进行处理（阀门调用对应的Servlet#value.doGet(req,rep)）
```

还可以自定义阀门

比如在Host节点中配置一个阀门

```xml
<Valve className="com.luban.TestValve"/>
```

所以经过这个Host节点的都进行过滤处理

```java
public class TestValve extends RequestFilterValve {
    @Override
    public void invoke(Request request, Response response) throws IOException, ServletException {
        System.out.println("test value");
        getNext().invoke(request, response);
    }

    @Override
    protected Log getLog() {
        return null;
    }
}
```

最后输出`test value`

比如StandardEngine默认的阀门是StandardEngineValve

```java
public StandardEngine() {

  super();
  pipeline.setBasic(new StandardEngineValve());
  /* Set the jmvRoute using the system property jvmRoute */
  try {
    setJvmRoute(System.getProperty("jvmRoute"));
  } catch(Exception ex) {
    log.warn(sm.getString("standardEngine.jvmRouteFail"));
  }
  // By default, the engine will hold the reloading thread
  backgroundProcessorDelay = 10;
}
```

下图显示了一条管道及其阀：

![在这里插入图片描述](./tomcat剖析/20210223224506811.png)

如果对`servlet`编程中的过滤器有所了解的话，那么应该不难想像管道和阀的工作机制。管道就像过滤器链一样，而阀则好似是过滤器。阀与过滤器类似，可以处理传递给它的`request`对象和`response`对象。当一个阀执行完成后，会调用下一个阀继续执行。**基础阀总是最后一个执行的**

> **server.xml配置文件解析**
>
> 每个server.xml的节点都有对应的类
>
> Tomcat中的四个容器：
>
> - Engine 管理Host
>   - List\<Host\> 
> - Host 管理Context
>   - List\<Context\>
> - Wrapper 一个应用下面，可能有很多的ServletClass类，一个ServletClass可能有很多的Servlet实例（即一个类型有多个实例），所以就抽象出来一个Wrapper来管理这些Servlet，根据ServletClass类来分类
> - Context 应用 就是容器，每个应用
>   - List\<Servlet\> 每个应用下面有很多的Servlet
>

## 处理请求流程

### Tomcat的请求处理流程

问：`Wrapper`容器的管道中的最后一个阀门，是怎样把请求转发给对应的`servlet`的？

![在这里插入图片描述](./tomcat剖析/20210223225907471.png)

![image-20220220171433118](./tomcat剖析/image-20220220171433118.png)

看一下阀门的`StandardWrapperValve`的`invoke`方法的核心代码：

![image-20220220171603198](./tomcat剖析/image-20220220171603198.png)

`allocate`方法里的`loadServlet`方法，直接`newInstance`一个`serlvet`实例

```java
servlet = (Servlet) instanceManager.newInstance(servletClass);
```

这也回答了前言里的问题1，`servlet`是怎么生成的，在哪生成的？
`servlet`是在`Wrapper`的基础阀里生成的

`servlet`实例有了，那么`doGet/doPost`在哪执行呢？
回到阀门的`StandardWrapperValve`的`invoke`方法的核心代码：来到这一行代码，传进`servlet`实例，并且返回一个过滤器链

![image-20220220171806883](./tomcat剖析/image-20220220171806883.png)

我们定义一个`Filter`的时候，可以像下面这样写：



执行过程：filter->servlet->再回到filter

因此，`filterChain.doFilter(servletRequest, servletResponse)`;虽然是调用其他过滤器，但是过滤器调用完之后，必然要去调用`servlet`的`doget`方法

所以，上面才需要传入`servlet`实例，然后获取一个过滤器链，因为要用到这个`servlet`

继续往下走：

![image-20220220172047046](./tomcat剖析/image-20220220172047046.png)

进入`doFilter`，再进入`internalDoFilter`方法：发现并没有执行，`servlet`的`doGet/dopost`方法，执行的是`servlet`的`service`方法

![image-20220220172141664](./tomcat剖析/image-20220220172141664.png)

我们自定义`servlet`的时候，并没有`service`，往父类`HttpServlet`中找找：

![image-20220220172316553](./tomcat剖析/image-20220220172316553.png)

因此，在哪里调用的`doGet`、`doPost`方法，与`Tomcat`没有关系，这个实际上是`servlet`规范所定义的

> Request和Response使用门面模式
>
> ![image-20220220151536894](./tomcat剖析/image-20220220151536894.png)
>
> 在Request和Response类中，有一些比较不安全的方法，这个类中有一些方法我自己要用，但是我不想给外面使用，比如
>
> ![image-20220220151720665](./tomcat剖析/image-20220220151720665.png)
>
> 只能在这个包中能使用，外界不能使用

### Tomcat架构平视图

![在这里插入图片描述](./tomcat剖析/20210223235822523-20220220172352668.png)

右边的部分，已经说过了，看看左边

`Request`对象怎么生成的？

1. `Request`对象表示的是一个请求，`Tomcat`要生成一个`Request`对象，首先就要有数据，这个数据拿来的呢？

操作系统。`Tomcat`仅仅是操作系统上的一个应用程序，因此，它的数据开源于操作系统

2. 那操作系统的数据又从哪来的呢？

操作系统安装在服务器上面的，因此，操作系统的数据来源于服务器

3. 那服务器的数据又来源于哪里呢？

一个服务器通过网络将数据发给另一个服务器的。这就涉及到很多很多的协议了，服务器之间想要完成数据的传输和接受，就和计算机网络有关系了，跟各种协议有关系

4. 如果服务器A有数据，想把数据发给服务器B，但是仅仅有数据和IP（没有端口，端口是和应用程序对应的），服务器A能够保证数据安全可靠的发给服务器B吗？

不能。可能数据非常大，数据在网络的传输过程中，会经过机房或者交换机，很有可能数据就会丢失，是不可靠的

5. 如何保证数据的可靠传输呢？

使用Tcp协议。该协议是一个可靠的协议，但是该协议，毕竟只是一个协议，这个协议肯定是需要去实现的

6. `Tcp`协议由谁实现？

操作系统。`linux`和`Windows`操作系统，或者其他操作系统都会去实现`Tcp`协议。

`Tcp`协议在服务器之间建立连接时，会进行三次握手，`linux`源码就有关于`Tcp`三次握手的相关源码：

> ![在这里插入图片描述](./tomcat剖析/20210224213841909.png)
>
> ![在这里插入图片描述](./tomcat剖析/20210224213923292.png)
>
> ![在这里插入图片描述](./tomcat剖析/20210224214009386.png)

注意：Tcp协议只是保证数据在传输层可靠的传输，但是它并不关心数据长什么样子，也不关心数据的格式以及代表的意义，谁才关系数据的格式是怎么的，内容是怎么的呢？当然是使用数据的人和发送数据的人啊。浏览器和应用程序，因此，Http协议就有了，它是应用层协议，对我们要发送的数据进行规范，数据的格式，内容，数据的意义

7. `Http`协议由谁实现？

浏览器、应用程序(包括`Tomcat`)

8. 如果用`java`代码去实现一个浏览器，当用户在浏览器的地址栏输入地址后，按下回车键，代码执行的流程是怎么样的

-  肯定是要根据`Http`协议，去构造出符合`Http`协议的数据格式
- 发送数据，建立`Tcp`连接
- 应用程序，接受数据

问题来了，java代码里怎么去建立Tcp连接，我们知道操作系统的源码里有建立Tcp连接的代码，那么Java能不能去调用操作系统的建立三次握手的代码，比如：tcp_connect()方法，以此来建立Tcp连接。

实际上建立Tcp连接的方法，java是不能直接调用的，因为这些方法是linux操作系统非常核心的方法，不会直接让你调的，实际上像这种情况，我们通常会想到，写一个API，重新定义一个方法，比如：

```java
create_tcp(){
  //验证
  xxxx
  //验证通过之后，才让调这个方法
  tcp_connect（）;
}
```

`liunx`里也一样，不会让我们直接调用`tcp_connect`方法，它提供了一个对外的接口，就是`socket`，别人不能直接访问`tcp_connect`，只能通过`socket`去访问

因此，回到`java`代码里怎么建立`Tcp`连接？通过`Socket`接口，建立`Tcp`连接。

其实不仅仅`Java`应用程序,运行在操作系统上的各种程序，都只能通过`Socket`去建立`Tcp`连接

### java socket底层实现

> 使用`Java Socket`建立一个`tcp`连接，如下：
>
> ```java
> public static void main(String[] args) throws IOException {
>     Socket socket = new Socket();//tcp
>     socket.connect(new InetSocketAddress("localhost",9090));
> 
>     DatagramSocket datagramSocket = new DatagramSocket();//udp
> }
> ```
>
> `Java` 的`Socket`类底层是不是直接调的操作系统的`Socket`呢？它们有没有什么联系呢？
>
> 1. 进入`connect`方法
>
> ![在这里插入图片描述](./tomcat剖析/20210224231418703.png)
>
> 2. 进入`createImpl`
>
> ![在这里插入图片描述](./tomcat剖析/20210224231442163.png)
>
> 3. 进入`AbstractPlainSocketImpl`的`create`
>
> ![在这里插入图片描述](./tomcat剖析/20210224231506491.png)
>
> 4. 进入`socketCreate`，创建一个`Socket`
>
> ![在这里插入图片描述](./tomcat剖析/20210224231753531.png)
>
> 5. 进入`DualStackPlainSocketImpl`的`socketCreate`
>
> ![在这里插入图片描述](./tomcat剖析/20210224231945456.png)
>
> 发现`socket0`是一个`native`方法
>
> ![在这里插入图片描述](./tomcat剖析/20210224232004296.png)
>
> `native`的`socket0`，代码只能去`open jdk`中去看`socket0`是怎么实现的
>
> 7. `DualStackPlainSocketImpl.c`文件
>
> ![在这里插入图片描述](./tomcat剖析/20210224232611166.png)
>
> 8. `net_util_md.c`文件
>
> ![在这里插入图片描述](./tomcat剖析/20210224232905441.png)
>
> `socket(domain,type,protocol)`又是怎么实现的呢？
>
> 但是该方法的实现，是在`open jdk`中找不到的。那么它到底在哪里实现的
>
> 9. 看到`net_util_md.c`文件的头文件
>
> ![在这里插入图片描述](./tomcat剖析/20210224233950850.png)
>
> 那么，在当前的`windows`操作系统中找找有没有这个头文件
>
> `win10`如下：
>
> ![在这里插入图片描述](./tomcat剖析/20210224234809386.png)
>
> 这个就是上面`socket(domain,type,protocol)`的真正实现
>
> ![在这里插入图片描述](./tomcat剖析/20210224235810353.png)
>
> 10. 回头看`Java`在创建一个`Socket`连接的时候,`socket.connect(new InetSocketAddress("localhost",9090))`这行代码，会先去调用`Jdk`代码，`jdk`最终调用的是操作系统的代码

### Connector组件

> https://blog.csdn.net/weixin_42412601/article/details/113925346

回到`Tomcat`架构平视图中的`8`，浏览器会负责去构造数据，发送数据，那么`Tomcat`接受数据后，需要解析数据，这个时候就要去实现`Http`协议

`Tomcat`使用`socket`接受数据，然后就要取数据，这里就涉及到一个概念，叫做`IO`模型，就是你通过什么方式去取数据的呢，是以`BIO`还是`NIO`呢？

`Connector`组件，会从`socket`中去取数据，然后根据`Http`协议去解析数据，解析成`Request`对象

![image-20220220174117241](./tomcat剖析/image-20220220174117241.png)

#### BIO的方式取数据

这个`Connector`组件，在`Tomcat`中对应有一个类`Connector`，有一个方法`setProtocol`，入参就是上图的`protocol`属性（`Tomcat`启动会去解析`server.xml`）

```java
public void setProtocol(String protocol) {
  if (AprLifecycleListener.isAprAvailable()) {
    if ("HTTP/1.1".equals(protocol)) {
      setProtocolHandlerClassName
        ("org.apache.coyote.http11.Http11AprProtocol");
    } else if ("AJP/1.3".equals(protocol)) {
      setProtocolHandlerClassName
        ("org.apache.coyote.ajp.AjpAprProtocol");
    } else if (protocol != null) {
      setProtocolHandlerClassName(protocol);
    } else {
      setProtocolHandlerClassName
        ("org.apache.coyote.http11.Http11AprProtocol");
    }
  } else {
    //当`protocol` 属性设置为`Http1.1`时,对应的类是`org.apache.coyote.http11.Http11Protocol`
    if ("HTTP/1.1".equals(protocol)) {
      setProtocolHandlerClassName
        ("org.apache.coyote.http11.Http11Protocol");
    } else if ("AJP/1.3".equals(protocol)) {
      setProtocolHandlerClassName
        ("org.apache.coyote.ajp.AjpProtocol");
    } else if (protocol != null) {
      setProtocolHandlerClassName(protocol);
    }
  }
}
```

当`protocol` 属性设置为`Http1.1`时，代码里对应的类是`org.apache.coyote.http11.Http11Protocol`，它对应的协议是`Http1.1`,对应的`io`模型是`BIO`

1. 看看`Http11Protocol`源码，为啥说它对应的是`BIO`

![在这里插入图片描述](./tomcat剖析/20210225222048778.png)

2. 看看`JIoEndpoint`

![在这里插入图片描述](./tomcat剖析/20210225222235376.png)

使用的工厂模式创建`socket`对象

#### NIO的方式取数据

如果想使用`NIO`,只需要修改：`protocol="HTTP/1.1"`变为`org.apache.coyote.http11.Http11NioProtocol`

```java
<Connector port="8080" protocol="org.apache.coyote.http11.Http11NioProtocol"
           connectionTimeout="20000"
           redirectPort="8443" />
```

启动`Tomcat`就户发现走的是下面的红框了

![在这里插入图片描述](./tomcat剖析/20210225224753687.png)

![在这里插入图片描述](./tomcat剖析/20210225225024605.png)

1. 看看`Http11NioProtocol`。查看方法类似上面查看`BIO`

![在这里插入图片描述](./tomcat剖析/20210225225130426.png)

2. 看看`NioEndpoint`

![在这里插入图片描述](./tomcat剖析/20210225225224507.png)

使用的是`SocketChannel`，明显使用的是`NIO`，学过`nio`就知道了

#### 解析数据

不管是BIO还是NIO方式取数据，反正是获取到了对应的Socket。接下来就是解析数据了。

对于BIO方式：会在processSocket方法中处理数据，对应nio方式。猜想Tomcat取数据，应该是socket.getInputStream()来取数据，然后按照Http1.1的格式解析数据

1. `processSocket`方法

![在这里插入图片描述](./tomcat剖析/20210225230306166.png)

`Http`协议的格式：

![在这里插入图片描述](./tomcat剖析/20210225230619604.png)

2. 包装`socket`，然后把这个`socket`连接交给线程池，去处理。这个线程池在`Tomcat7`中默认`10`条线程，`private int minSpareThreads = 10`

![在这里插入图片描述](./tomcat剖析/2021022523085354.png)

3. 进入`SocketProcessor`，是一个线程

![在这里插入图片描述](./tomcat剖析/20210225232438453.png)

4. `process`方法

![在这里插入图片描述](./tomcat剖析/2021022523252350.png)

5. `AbstractHttp11Processor`的`process`，因为`BIO`对应的是`Http11`

![在这里插入图片描述](./tomcat剖析/20210225232830849.png)

![在这里插入图片描述](./tomcat剖析/20210225232851700.png)

解析请求行和请求头的方法里，都会把解析出来的数据，设置到`Request`对象里

`socket.getInputStream()`取出来的数据，不是直接使用的，会放到缓存中

## 长连接实现原理

### 基本思想

就是Http长连接，在http请求头里面有一个非常重要的参数Connection:keep-alive,如果一个http请求带上了这个参数就代表了这是一个长连接

在HTTP1.1中，长连接的标志就是

```xml
Connection:keep-alive
```

假如在浏览器与Tomcat服务器的交互中，基本按照如下的流程来走，二者之间的数据是通过socket连接的，并通过HTTP协议解析的，但是HTTP协议是没有状态的，为了保持长时间连接，需要使用Connection设置为keep-alive来告诉Tomact让这个连接保持活跃，不要关闭

Connection还有另外一个值：close，表示建立本次连接并传输数据之后，就会关闭这个连接

```markdown
# 因为服务器为了保持更合理的资源消耗，一旦不设置这个标志，就会关闭当前连接
```

![image-20220220221922392](./tomcat剖析/image-20220220221922392.png)

浏览器发送请求给Tomcat如果带有keep-alive参数代表tomcat接受请求后不关闭Socket连接，如果是close参数代表接受请求后关闭Socket连接

![image-20220220223734675](./tomcat剖析/image-20220220223734675.png)

服务端接收数据的这一端是通过RecvBuf存储数据的，一旦RecvBuf存储满，那么客户端就不能发送数据了，导致阻塞

### 源码实现

```markdown
# socket解析步骤
1. 接收到socket
2. 将socket交给socket连接
3. 一个线程处理一个socket连接
4. 开始从socket中获取数据
5. 解析请求行
6. 解析请求头
7. 根据请求头解析Connection对应的值是keepalive还是close
8. 请求行和请求头解析后会设置到Request对象中
9. 将Request兑现交给容器进行处理
10. 容器最终会交给对应的servlet进行处理
11. servlet中可以获取请求中的各种信息，包括获取请求 体
12. servlet中也可以使用Response对象向客户端返回响应
13. servlet中的代码都执行完之后，相当于容器中已经处理完成了请求，相当于请求的核心逻辑已经执行完了
14. 处理InputBuffer中的pos和lastValid，以便能够处理下一个请求
```

#### Acceptor 读取数据

Acceptor接收到操作系统的Socket之后，在线程中的run函数进行处理

Acceptor类在`org.apache.tomcat.util.net.JIoEndpoint`类中

```java
protected class Acceptor extends AbstractEndpoint.Acceptor {

  @Override
  public void run() {

    int errorDelay = 0;

    // Loop until we receive a shutdown command
    while (running) {

      // Loop if endpoint is paused
      // 如果Endpoint仍然在运行，但是被暂停了，那么就无限循环，从而不能接受请求
      while (paused && running) {
        state = AcceptorState.PAUSED;
        try {
          Thread.sleep(50);
        } catch (InterruptedException e) {
          // Ignore
        }
      }

      if (!running) {
        break;
      }
      state = AcceptorState.RUNNING;

      try {
        //if we have reached max connections, wait
        //达到了最大连接数限制则等待
        countUpOrAwaitConnection();

        Socket socket = null;  // bio，nio
        try {
          // Accept the next incoming connection from the server
          // bio socket
          // 此处是阻塞的，那么running属性就算已经被改成false，那么怎么进入到下一次循环呢？
          socket = serverSocketFactory.acceptSocket(serverSocket);//
          System.out.println("接收到了一个socket连接");

        } catch (IOException ioe) {
          countDownConnection();
          // Introduce delay if necessary
          errorDelay = handleExceptionWithDelay(errorDelay);
          // re-throw
          throw ioe;
        }
        // Successful accept, reset the error delay
        errorDelay = 0;

        // Configure the socket
        // 如果Endpoint正在运行并且没有被暂停，那么就处理该socket
        if (running && !paused && setSocketOptions(socket)) {
          // Hand this socket off to an appropriate processor
          // socket被正常的交给了线程池，processSocket就会返回true
          // 如果没有被交给线程池或者中途Endpoint被停止了，则返回false
          // 返回false则关闭该socket
          if (!processSocket(socket)) {
            countDownConnection();
            // Close socket right away
            closeSocket(socket);
          }
        } else {
          countDownConnection();
          // Close socket right away
          closeSocket(socket);
        }
      } catch (IOException x) {
        if (running) {
          log.error(sm.getString("endpoint.accept.fail"), x);
        }
      } catch (NullPointerException npe) {
        if (running) {
          log.error(sm.getString("endpoint.accept.fail"), npe);
        }
      } catch (Throwable t) {
        ExceptionUtils.handleThrowable(t);
        log.error(sm.getString("endpoint.accept.fail"), t);
      }
    }
    state = AcceptorState.ENDED;
  }
}
```

1. `socket = serverSocketFactory.acceptSocket(serverSocket);`使用获取到Socket之后，使用`setSocketOptions(socket)`设置Socket参数，具体如下

```java
public void setProperties(Socket socket) throws SocketException{
  if (rxBufSize != null)
    socket.setReceiveBufferSize(rxBufSize.intValue());
  if (txBufSize != null)
    socket.setSendBufferSize(txBufSize.intValue());
  if (ooBInline !=null)
    socket.setOOBInline(ooBInline.booleanValue());
  if (soKeepAlive != null)
    socket.setKeepAlive(soKeepAlive.booleanValue());
  if (performanceConnectionTime != null && performanceLatency != null &&
      performanceBandwidth != null)
    socket.setPerformancePreferences(
    performanceConnectionTime.intValue(),
    performanceLatency.intValue(),
    performanceBandwidth.intValue());
  if (soReuseAddress != null)
    socket.setReuseAddress(soReuseAddress.booleanValue());
  if (soLingerOn != null && soLingerTime != null)
    socket.setSoLinger(soLingerOn.booleanValue(),
                       soLingerTime.intValue());
  if (soTimeout != null && soTimeout.intValue() >= 0)
    socket.setSoTimeout(soTimeout.intValue());
  if (tcpNoDelay != null) {
    try {
      socket.setTcpNoDelay(tcpNoDelay.booleanValue());
    } catch (SocketException e) {
      // Some socket types may not support this option which is set by default
    }
  }
}
```

- `soTimeout`，现在Tomcat是使用java实现的，那么就是说通过InputStream去read数据，那么如果RecvBuf如果是空的话，那么read就会阻塞住，这里的soTimeout就是阻塞的时间

#### processSocket 处理Socket

通过BIO的方式来处理Socket，那么对于BIO来说，就是每拿到一个Socket就交给一个线程`getExecutor().execute(new SocketProcessor(wrapper));`，那么也就说，在BIO的处理过程中，一个请求对应一个线程

```markdown
NIO 是一个线层处理多个请求的
```

```java
protected boolean processSocket(Socket socket) {
  // Process the request from this socket
  try {
    SocketWrapper<Socket> wrapper = new SocketWrapper<Socket>(socket);
    wrapper.setKeepAliveLeft(getMaxKeepAliveRequests());
    wrapper.setSecure(isSSLEnabled());
    // During shutdown, executor may be null - avoid NPE
    if (!running) {
      return false;
    }
    // bio， 一个socket连接对应一个线程
    // 一个http请求对应一个线程？
    getExecutor().execute(new SocketProcessor(wrapper));
  } catch (RejectedExecutionException x) {
    log.warn("Socket processing request was rejected for:"+socket,x);
    return false;
  } catch (Throwable t) {
    ExceptionUtils.handleThrowable(t);
    // This means we got an OOM or similar creating a thread, or that
    // the pool and its queue are full
    log.error(sm.getString("endpoint.process.fail"), t);
    return false;
  }
  return true;
}
```

`SocketProcessor`实现了Runnable接口，主要负责处理Socket

接着调用`state = handler.process(socket,status);`方法进行处理，Handler是一个接口，我们接着往下找，可以找到它的实现类`AbstractProtocol#process`

```java
public SocketState process(SocketWrapper<S> wrapper,
                SocketStatus status) {
  if (wrapper == null) {
    // Nothing to do. Socket has been closed.
    return SocketState.CLOSED;
  }

  S socket = wrapper.getSocket();
  if (socket == null) {
    // Nothing to do. Socket has been closed.
    return SocketState.CLOSED;
  }

  Processor<S> processor = connections.get(socket);
  if (status == SocketStatus.DISCONNECT && processor == null) {
    // Nothing to do. Endpoint requested a close and there is no
    // longer a processor associated with this socket.
    return SocketState.CLOSED;
  }
  // 设置为非异步，就是同步
  wrapper.setAsync(false);
  ContainerThreadMarker.markAsContainerThread();

  try {
    if (processor == null) {
      // 从被回收的processor中获取processor
      processor = recycledProcessors.poll();
    }
    if (processor == null) {
      processor = createProcessor(); // HTTP11NIOProce
    }

    initSsl(wrapper, processor);

    SocketState state = SocketState.CLOSED;
    do {
      if (status == SocketStatus.DISCONNECT &&
          !processor.isComet()) {
        // Do nothing here, just wait for it to get recycled
        // Don't do this for Comet we need to generate an end
        // event (see BZ 54022)
      } else if (processor.isAsync() || state == SocketState.ASYNC_END) {
        // 要么Tomcat线程还没结束，业务线程就已经调用过complete方法了，然后利用while走到这个分支
        // 要么Tomcat线程结束后，在超时时间内业务线程调用complete方法，然后构造一个新的SocketProcessor对象扔到线程池里走到这个分支
        // 要么Tomcat线程结束后，超过超时时间了，由AsyncTimeout线程来构造一个SocketProcessor对象扔到线程池里走到这个分支
        // 不管怎么样，在整个调用异步servlet的流程中，此分支只经历一次，用来将output缓冲区中的内容发送出去

        state = processor.asyncDispatch(status);
        if (state == SocketState.OPEN) {
          // release() won't get called so in case this request
          // takes a long time to process, remove the socket from
          // the waiting requests now else the async timeout will
          // fire
          getProtocol().endpoint.removeWaitingRequest(wrapper);
          // There may be pipe-lined data to read. If the data
          // isn't processed now, execution will exit this
          // loop and call release() which will recycle the
          // processor (and input buffer) deleting any
          // pipe-lined data. To avoid this, process it now.
          state = processor.process(wrapper);
        }
      } else if (processor.isComet()) {
        state = processor.event(status);
      } else if (processor.getUpgradeInbound() != null) {
        state = processor.upgradeDispatch();
      } else if (processor.isUpgrade()) {
        state = processor.upgradeDispatch(status);
      } else {
        // 大多数情况下走这个分支
        state = processor.process(wrapper);
      }

      if (state != SocketState.CLOSED && processor.isAsync()) {
        // 代码执行到这里，就去判断一下之前有没有调用过complete方法
        // 如果调用，那么当前的AsyncState就会从COMPLETE_PENDING-->调用doComplete方法改为COMPLETING，SocketState为ASYNC_END
        // 如果没有调用，那么当前的AsyncState就会从STARTING-->STARTED，SocketState为LONG
        //
        // 状态转换，有三种情况
        // 1. COMPLETE_PENDING--->COMPLETING，COMPLETE_PENDING是在调用complete方法时候由STARTING改变过来的
        // 2. STARTING---->STARTED，STARTED的下一个状态需要有complete方法来改变，会改成COMPLETING
        // 3. COMPLETING---->DISPATCHED
        state = processor.asyncPostProcess();
      }

      if (state == SocketState.UPGRADING) {
        // Get the HTTP upgrade handler
        HttpUpgradeHandler httpUpgradeHandler =
          processor.getHttpUpgradeHandler();
        // Release the Http11 processor to be re-used
        release(wrapper, processor, false, false);
        // Create the upgrade processor
        processor = createUpgradeProcessor(
          wrapper, httpUpgradeHandler);
        // Mark the connection as upgraded
        wrapper.setUpgraded(true);
        // Associate with the processor with the connection
        connections.put(socket, processor);
        // Initialise the upgrade handler (which may trigger
        // some IO using the new protocol which is why the lines
        // above are necessary)
        // This cast should be safe. If it fails the error
        // handling for the surrounding try/catch will deal with
        // it.
        httpUpgradeHandler.init((WebConnection) processor);
      } else if (state == SocketState.UPGRADING_TOMCAT) {
        // Get the UpgradeInbound handler
        org.apache.coyote.http11.upgrade.UpgradeInbound inbound =
          processor.getUpgradeInbound();
        // Release the Http11 processor to be re-used
        release(wrapper, processor, false, false);
        // Create the light-weight upgrade processor
        processor = createUpgradeProcessor(wrapper, inbound);
        inbound.onUpgradeComplete();
      }
      if (getLog().isDebugEnabled()) {
        getLog().debug("Socket: [" + wrapper +
                       "], Status in: [" + status +
                       "], State out: [" + state + "]");
      }
      // 如果在访问异步servlet时，代码执行到这里，已经调用过complete方法了，那么状态就是SocketState.ASYNC_END
    } while (state == SocketState.ASYNC_END ||
             state == SocketState.UPGRADING ||
             state == SocketState.UPGRADING_TOMCAT);

    if (state == SocketState.LONG) {
      // In the middle of processing a request/response. Keep the
      // socket associated with the processor. Exact requirements
      // depend on type of long poll
      connections.put(socket, processor);
      longPoll(wrapper, processor);
    } else if (state == SocketState.OPEN) {
      // In keep-alive but between requests. OK to recycle
      // processor. Continue to poll for the next request.
      connections.remove(socket);
      release(wrapper, processor, false, true);
    } else if (state == SocketState.SENDFILE) {
      // Sendfile in progress. If it fails, the socket will be
      // closed. If it works, the socket either be added to the
      // poller (or equivalent) to await more data or processed
      // if there are any pipe-lined requests remaining.
      connections.put(socket, processor);
    } else if (state == SocketState.UPGRADED) {
      // Need to keep the connection associated with the processor
      connections.put(socket, processor);
      // Don't add sockets back to the poller if this was a
      // non-blocking write otherwise the poller may trigger
      // multiple read events which may lead to thread starvation
      // in the connector. The write() method will add this socket
      // to the poller if necessary.
      if (status != SocketStatus.OPEN_WRITE) {
        longPoll(wrapper, processor);
      }
    } else {
      // Connection closed. OK to recycle the processor. Upgrade
      // processors are not recycled.
      connections.remove(socket);
      if (processor.isUpgrade()) {
        processor.getHttpUpgradeHandler().destroy();
      } else if (processor instanceof org.apache.coyote.http11.upgrade.UpgradeProcessor) {
        // NO-OP
      } else {
        release(wrapper, processor, true, false);
      }
    }
    return state;
  } catch(java.net.SocketException e) {
    // SocketExceptions are normal
    getLog().debug(sm.getString(
      "abstractConnectionHandler.socketexception.debug"), e);
  } catch (java.io.IOException e) {
    // IOExceptions are normal
    getLog().debug(sm.getString(
      "abstractConnectionHandler.ioexception.debug"), e);
  }
  // Future developers: if you discover any other
  // rare-but-nonfatal exceptions, catch them here, and log as
  // above.
  catch (Throwable e) {
    ExceptionUtils.handleThrowable(e);
    // any other exception or error is odd. Here we log it
    // with "ERROR" level, so it will show up even on
    // less-than-verbose logs.
    getLog().error(
      sm.getString("abstractConnectionHandler.error"), e);
  }
  // Make sure socket/processor is removed from the list of current
  // connections
  connections.remove(socket);
  // Don't try to add upgrade processors back into the pool
  if (!(processor instanceof org.apache.coyote.http11.upgrade.UpgradeProcessor)
      && !processor.isUpgrade()) {
    release(wrapper, processor, true, false);
  }
  return SocketState.CLOSED;
}
```

1. `processor = createProcessor();`如果需要处理Socket，那么就需要先创建一个处理器，现在我们主要是讲的是`Http11ConnectionHandler`

![image-20220221001358665](./tomcat剖析/image-20220221001358665.png)

```java
protected Http11Processor createProcessor() {
  Http11Processor processor = new Http11Processor(
    proto.getMaxHttpHeaderSize(), proto.getRejectIllegalHeaderName(),
    (JIoEndpoint)proto.endpoint, proto.getMaxTrailerSize(),
    proto.getAllowedTrailerHeadersAsSet(), proto.getMaxExtensionSize(),
    proto.getMaxSwallowSize(), proto.getRelaxedPathChars(),
    proto.getRelaxedQueryChars());
  processor.setAdapter(proto.adapter);
  processor.setMaxKeepAliveRequests(proto.getMaxKeepAliveRequests());
  processor.setKeepAliveTimeout(proto.getKeepAliveTimeout());
  processor.setConnectionUploadTimeout(
    proto.getConnectionUploadTimeout());
  processor.setDisableUploadTimeout(proto.getDisableUploadTimeout());
  processor.setCompressionMinSize(proto.getCompressionMinSize());
  processor.setCompression(proto.getCompression());
  processor.setNoCompressionUserAgents(proto.getNoCompressionUserAgents());
  processor.setCompressableMimeTypes(proto.getCompressableMimeTypes());
  processor.setRestrictedUserAgents(proto.getRestrictedUserAgents());
  processor.setSocketBuffer(proto.getSocketBuffer());
  processor.setMaxSavePostSize(proto.getMaxSavePostSize());
  processor.setServer(proto.getServer());
  processor.setDisableKeepAlivePercentage(
    proto.getDisableKeepAlivePercentage());
  processor.setMaxCookieCount(proto.getMaxCookieCount());
  register(processor);
  return processor;
}
```

通过这个函数中的`getMaxHttpHeaderSize`我们可以知道，如果我们想要设置HTTP字节头的大小，可以在server.xml中的Connector节点中设置

![image-20220221001655198](./tomcat剖析/image-20220221001655198.png)

默认的大小是

![image-20220221001744008](./tomcat剖析/image-20220221001744008.png)

当然了，通过上面的配置获取可以知道，我们还可以设置更多的东西，比如我们今天讲的长连接中涉及到的两个比较重要的配置

```java
processor.setMaxKeepAliveRequests(proto.getMaxKeepAliveRequests());
processor.setKeepAliveTimeout(proto.getKeepAliveTimeout());
```

- `MaxKeepAliveRequests` 每个长连接上能够处理HTTP请求的最大值，如果最大的活跃的http请求数量仅仅为1 的话，那么设置keepalive为false，则不会继续从socket中获取http请求了，默认是100，当达到75%之后，一旦第一个Socket处理完成，就会关闭，回收资源

```java
/**
  * The percentage of threads that have to be in use before keep-alive is
  * disabled to aid scalability.
  */
private int disableKeepAlivePercentage = 75;
```

可以在server.xml中的Connector中设置

![image-20220221131106506](./tomcat剖析/image-20220221131106506.png)

- `KeepAliveTimeout` 长连接超时大小

2. 创建完处理器之后，就开始处理Socket

```java
// 大多数情况下走这个分支
state = processor.process(wrapper);
```

调用process处理长连接，还是一样，调用的是实现类`AbstractHttp11Processor#process`函数

```java
public SocketState process(SocketWrapper<S> socketWrapper)
        throws IOException {
  RequestInfo rp = request.getRequestProcessor();
  rp.setStage(org.apache.coyote.Constants.STAGE_PARSE);   // 设置请求状态为解析状态

  // Setting up the I/O
  setSocketWrapper(socketWrapper);
  getInputBuffer().init(socketWrapper, endpoint);     // 将socket的InputStream与InternalInputBuffer进行绑定
  getOutputBuffer().init(socketWrapper, endpoint);    // 将socket的OutputStream与InternalOutputBuffer进行绑定

  // Flags
  keepAlive = true;
  comet = false;
  openSocket = false;
  sendfileInProgress = false;
  readComplete = true;
  // NioEndpoint返回true, Bio返回false
  if (endpoint.getUsePolling()) {
    keptAlive = false;
  } else {
    keptAlive = socketWrapper.isKeptAlive();
  }

  // 如果当前活跃的线程数占线程池最大线程数的比例大于75%，那么则关闭KeepAlive，不再支持长连接
  if (disableKeepAlive()) {
    socketWrapper.setKeepAliveLeft(0);
  }

  // keepAlive默认为true,它的值会从请求中读取
  while (!getErrorState().isError() && keepAlive && !comet && !isAsync() &&
         upgradeInbound == null &&
         httpUpgradeHandler == null && !endpoint.isPaused()) {
    // keepAlive如果为true,接下来需要从socket中不停的获取http请求

    // Parsing the request header
    try {
      // 第一次从socket中读取数据，并设置socket的读取数据的超时时间
      // 对于BIO，一个socket连接建立好后，不一定马上就被Tomcat处理了，其中需要线程池的调度，所以这段等待的时间要算在socket读取数据的时间内
      // 而对于NIO而言，没有阻塞
      setRequestLineReadTimeout();

      // 解析请求行
      if (!getInputBuffer().parseRequestLine(keptAlive)) {
        // 下面这个方法在NIO时有用，比如在解析请求行时，如果没有从操作系统读到数据，则上面的方法会返回false
        // 而下面这个方法会返回true，从而退出while，表示此处read事件处理结束
        // 到下一次read事件发生了，就会从小进入到while中
        if (handleIncompleteRequestLineRead()) {
          break;
        }
      }

      if (endpoint.isPaused()) {
        // 503 - Service unavailable
        // 如果Endpoint被暂停了，则返回503
        response.setStatus(503);
        setErrorState(ErrorState.CLOSE_CLEAN, null);
      } else {
        keptAlive = true;
        // Set this every time in case limit has been changed via JMX
        // 每次处理一个请求就重新获取一下请求头和cookies的最大限制
        request.getMimeHeaders().setLimit(endpoint.getMaxHeaderCount());
        request.getCookies().setLimit(getMaxCookieCount());
        // Currently only NIO will ever return false here
        // 解析请求头
        if (!getInputBuffer().parseHeaders()) {
          // We've read part of the request, don't recycle it
          // instead associate it with the socket
          openSocket = true;
          readComplete = false;
          break;
        }
        if (!disableUploadTimeout) {
          setSocketTimeout(connectionUploadTimeout);
        }
      }
    } catch (IOException e) {
      if (getLog().isDebugEnabled()) {
        getLog().debug(
          sm.getString("http11processor.header.parse"), e);
      }
      setErrorState(ErrorState.CLOSE_NOW, e);
      break;
    } catch (Throwable t) {
      ExceptionUtils.handleThrowable(t);
      UserDataHelper.Mode logMode = userDataHelper.getNextMode();
      if (logMode != null) {
        String message = sm.getString(
          "http11processor.header.parse");
        switch (logMode) {
          case INFO_THEN_DEBUG:
            message += sm.getString(
              "http11processor.fallToDebug");
            //$FALL-THROUGH$
          case INFO:
            getLog().info(message, t);
            break;
          case DEBUG:
            getLog().debug(message, t);
        }
      }
      // 400 - Bad Request
      response.setStatus(400);
      setErrorState(ErrorState.CLOSE_CLEAN, t);
      getAdapter().log(request, response, 0);
    }

    if (!getErrorState().isError()) {
      // Setting up filters, and parse some request headers
      rp.setStage(org.apache.coyote.Constants.STAGE_PREPARE);  // 设置请求状态为预处理状态
      try {
        prepareRequest();   // 预处理, 主要从请求中处理处keepAlive属性，以及进行一些验证，以及根据请求分析得到ActiveInputFilter
      } catch (Throwable t) {
        ExceptionUtils.handleThrowable(t);
        if (getLog().isDebugEnabled()) {
          getLog().debug(sm.getString(
            "http11processor.request.prepare"), t);
        }
        // 500 - Internal Server Error
        response.setStatus(500);
        setErrorState(ErrorState.CLOSE_CLEAN, t);
        getAdapter().log(request, response, 0);
      }
    }

    if (maxKeepAliveRequests == 1) {
      // 如果最大的活跃http请求数量仅仅只能为1的话，那么设置keepAlive为false，则不会继续从socket中获取Http请求了
      keepAlive = false;
    } else if (maxKeepAliveRequests > 0 &&
               socketWrapper.decrementKeepAlive() <= 0) {
      // 如果已经达到了keepAlive的最大限制，也设置为false，则不会继续从socket中获取Http请求了
      keepAlive = false;
    }

    // Process the request in the adapter
    if (!getErrorState().isError()) {
      try {
        rp.setStage(org.apache.coyote.Constants.STAGE_SERVICE); // 设置请求的状态为服务状态，表示正在处理请求
        adapter.service(request, response); // 交给容器处理请求
        // Handle when the response was committed before a serious
        // error occurred.  Throwing a ServletException should both
        // set the status to 500 and set the errorException.
        // If we fail here, then the response is likely already
        // committed, so we can't try and set headers.
        if(keepAlive && !getErrorState().isError() && (
          response.getErrorException() != null ||
          (!isAsync() &&
           statusDropsConnection(response.getStatus())))) {
          setErrorState(ErrorState.CLOSE_CLEAN, null);
        }
        setCometTimeouts(socketWrapper);
      } catch (InterruptedIOException e) {
        setErrorState(ErrorState.CLOSE_NOW, e);
      } catch (HeadersTooLargeException e) {
        getLog().error(sm.getString("http11processor.request.process"), e);
        // The response should not have been committed but check it
        // anyway to be safe
        if (response.isCommitted()) {
          setErrorState(ErrorState.CLOSE_NOW, e);
        } else {
          response.reset();
          response.setStatus(500);
          setErrorState(ErrorState.CLOSE_CLEAN, e);
          response.setHeader("Connection", "close"); // TODO: Remove
        }
      } catch (Throwable t) {
        ExceptionUtils.handleThrowable(t);
        getLog().error(sm.getString("http11processor.request.process"), t);
        // 500 - Internal Server Error
        response.setStatus(500);
        setErrorState(ErrorState.CLOSE_CLEAN, t);
        getAdapter().log(request, response, 0);
      }
    }

    // Finish the handling of the request
    rp.setStage(org.apache.coyote.Constants.STAGE_ENDINPUT);  // 设置请求的状态为处理请求结束

    if (!isAsync() && !comet) {
      if (getErrorState().isError()) {
        // If we know we are closing the connection, don't drain
        // input. This way uploading a 100GB file doesn't tie up the
        // thread if the servlet has rejected it.
        getInputBuffer().setSwallowInput(false);
      } else {
        // Need to check this again here in case the response was
        // committed before the error that requires the connection
        // to be closed occurred.
        checkExpectationAndResponseStatus();
      }
      // 当前http请求已经处理完了，做一些收尾工作
      endRequest();
    }

    rp.setStage(org.apache.coyote.Constants.STAGE_ENDOUTPUT); // 请求状态为输出结束

    // If there was an error, make sure the request is counted as
    // and error, and update the statistics counter
    if (getErrorState().isError()) {
      response.setStatus(500);
    }
    request.updateCounters();

    if (!isAsync() && !comet || getErrorState().isError()) {
      if (getErrorState().isIoAllowed()) {
        // 准备处理下一个请求
        getInputBuffer().nextRequest();
        getOutputBuffer().nextRequest();
      }
    }

    if (!disableUploadTimeout) {
      if(endpoint.getSoTimeout() > 0) {
        setSocketTimeout(endpoint.getSoTimeout());
      } else {
        setSocketTimeout(0);
      }
    }

    rp.setStage(org.apache.coyote.Constants.STAGE_KEEPALIVE);

    // 如果处理完当前这个Http请求之后，发现socket里没有下一个请求了,那么就退出当前循环
    // 如果是keepalive，就不会关闭socket, 如果是close就会关闭socket
    // 对于keepalive的情况，因为是一个线程处理一个socket,当退出这个while后，当前线程就会介绍，
    // 当时对于socket来说，它仍然要继续介绍连接，所以又会新开一个线程继续来处理这个socket
    if (breakKeepAliveLoop(socketWrapper)) {
      break;
    }
  }
  // 至此，循环结束

  rp.setStage(org.apache.coyote.Constants.STAGE_ENDED);

  // 主要流程就是将socket的状态设置为CLOSED
  if (getErrorState().isError() || endpoint.isPaused()) {
    return SocketState.CLOSED;
  } else if (isAsync() || comet) {
    // 异步servlet
    return SocketState.LONG;
  } else if (isUpgrade()) {
    return SocketState.UPGRADING;
  } else if (getUpgradeInbound() != null) {
    return SocketState.UPGRADING_TOMCAT;
  } else {
    if (sendfileInProgress) {
      return SocketState.SENDFILE;
    } else {
      // openSocket为true，表示不要关闭socket
      if (openSocket) {
        // readComplete表示本次读数据是否完成，比如nio中可能就没有读完数据，还需要从socket中读数据
        if (readComplete) {
          return SocketState.OPEN;
        } else {
          // nio可能会走到这里
          return SocketState.LONG;
        }
      } else {
        return SocketState.CLOSED;
      }
    }
  }
}
```

会在开始处理之前设置一些参数，比如默认设置keepalive是true，然后在根据请求头中Connection来赋值

一旦设置keepalive为false，那么每个Request将不会共用socket连接，每个Request都会申请自己的连接

比如，设置maxKeepAliveRequests为1，可以间接将keepalvive设置为FALSE

```java
if (maxKeepAliveRequests == 1) {
  // 如果最大的活跃http请求数量仅仅只能为1的话，那么设置keepAlive为false，则不会继续从socket中获取Http请求了
  keepAlive = false;
} else if (maxKeepAliveRequests > 0 &&
           socketWrapper.decrementKeepAlive() <= 0) {
  // 如果已经达到了keepAlive的最大限制，也设置为false，则不会继续从socket中获取Http请求了
  keepAlive = false;
}
```

那么，http Request请求就会单独使用自己的socket连接

比如，浏览器向服务器发送7个请求

![image-20220221133033026](./tomcat剖析/image-20220221133033026.png)

那么就会创建7个socket，在BIO的情况下，Tomcat也会创建七个线程来处理请求

如果我们将maxKeepAliveRequests设置为大于1的参数，间接设置Keepalive为TRUE，那么有些请求就会共用连接，就会出现线程数少于7个的情况（6个），但是socket还是7个

![image-20220221133508707](./tomcat剖析/image-20220221133508707.png)

```markdown
# 浏览器有一个限制：
在我们打开一个网页的时候，浏览器向服务器请求各种资源
比如有100个图片，那么浏览器不会同时并发的去请求100个图片
> 同一个域名下，最多并发6个连接请求资源，所以当前资源请求的时候，看当前没有空的socket的连接，那么就会去申请一个，如果当前有空的socket连接，那么就会拿过来使用，就会出现共用的情况
```

根据上面的process函数，我们可以抽取出大概的流程，就是

```java
while(keepalive){ // while 循环不断处理Socket
  // 第一次从socket中读取数据，并设置socket的读取数据的超时时间
  setRequestLineReadTimeout();
  // 解析请求行
  getInputBuffer().parseRequestLine(keptAlive);
  // 预处理, 主要从请求中处理处keepAlive属性，以及进行一些验证，以及根据请求分析得到ActiveInputFilter
  prepareRequest();
  // 交给容器处理请求
  adapter.service(request, response);
  // 当前http请求已经处理完了，做一些收尾工作
  endRequest();
  // 准备处理下一个请求
  getInputBuffer().nextRequest();
}
```

我们研究一下上面抽取出来的大概流程：

1. `setRequestLineReadTimeout();`

```java
// 第一次从socket中读取数据，并设置socket的读取数据的超时时间
// 对于BIO，一个socket连接建立好后，不一定马上就被Tomcat处理了，其中需要线程池的调度，所以这段等待的时间要算在socket读取数据的时间内
// 而对于NIO而言，没有阻塞
setRequestLineReadTimeout();
```

```java
protected void setRequestLineReadTimeout() throws IOException {

  /*
         * When there is no data in the buffer and this is not the first
         * request on this connection and timeouts are being used the
         * first read for this request may need a different timeout to
         * take account of time spent waiting for a processing thread.
         *
         * This is a little hacky but better than exposing the socket
         * and the timeout info to the InputBuffer
         */
  // 最近一次访问的时间
  if (inputBuffer.lastValid == 0 && socketWrapper.getLastAccess() > -1) {
    int firstReadTimeout;
    // 如果长连接没有超时时间，那么从socket中读数据也没有超时时间
    if (keepAliveTimeout == -1) {
      firstReadTimeout = 0;
    } else {
      // 一个socket在被处理之前会调用一下access方法，所以queueTime表示的是socket创建好了到真正被处理这段过程的排队时间
      long queueTime =
        System.currentTimeMillis() - socketWrapper.getLastAccess();

      // 如果排队时间大于keepAliveTimeout，表示该socket已经超时了不需要被处理了，设置一个最小的超时时间，当从这个socket上读取数据时会立刻超时
      if (queueTime >= keepAliveTimeout) {
        // Queued for longer than timeout but there might be
        // data so use shortest possible timeout
        firstReadTimeout = 1;
      } else {
        // Cast is safe since queueTime must be less than
        // keepAliveTimeout which is an int
        // 如果排队时间还没有超过keepAliveTimeout，那么第一次从socket中读取数据的超时时间就是所剩下的时间了
        firstReadTimeout = keepAliveTimeout - (int) queueTime;
      }
    }
    // 设置socket的超时时间，然后开始读数据，该时间就是每次读取数据的超时时间
    socketWrapper.getSocket().setSoTimeout(firstReadTimeout);
    if (!inputBuffer.fill()) {      // 会从inputStream中获取数据,会阻塞，如果在firstReadTimeout的时间内没有读到数据则抛Eof异常 , 数据会被读到buf中
      // eof是End Of File的意思
      throw new EOFException(sm.getString("iib.eof.error"));
    }
    // Once the first byte has been read, the standard timeout should be
    // used so restore it here.
    // 当第一次读取数据完成后，设置socket的超时时间为原本的超时时间
    if (endpoint.getSoTimeout()> 0) {
      setSocketTimeout(endpoint.getSoTimeout());
    } else {
      setSocketTimeout(0);
    }

    // 这里的场景有点像工作，我现在要做一个任务，规定是5天内要完成，但是其中由于客观原因有1天不能工作，所以那一天不算在5天之内，而客观原因解决之后，以后每次做任务就仍然按5天来限制
    // 任务的就是read
    // 5天就是timeout
    // 客观原因就是tomcat的调度
  }
}
```

当我们把socket发送给Tomcat之后，就会`sockettimeout(默认是20秒)`时间内处理socket，但是在Tomcat中，不一定能马上处理，其中需要线程池的调度，所以这段等待的时间要算在socket读取数据的时间内

Tomcat认为。接收到一个socket，如果是第一次从socket中读取数据，第一次的read的超时时间，需要算上线程池的调度时间（从放入线程池到开始执行run方法调用read的时间），也就是20S-调度时间=socket处理时间

```markdown
# 正常来说，一旦这个socket来了，那么就应该马上从RectBuf中读取数据
但是第一次的线程池调度时间是特殊情况
```

`inputBuffer.fill()`会从inputStream中获取数据,会阻塞，如果在firstReadTimeout的时间内没有读到数据则抛Eof异常 , 数据会被读到buf中

当我们从RecvBuf中读取数据的时候，不一定是小于RecvBuf的容量的，所以我们需要源源不断的读取，知道读取到数据的最后，这些读取出来的数据会被存储到buf中，然后开始解析

![image-20220221142301604](./tomcat剖析/image-20220221142301604.png)

每次从RecvBuf中取出数据，lastValid标志位不断移动，直到从RecvBuf中取到了本次Socket的完整数据，才开始解析

2. `endRequest();`

```java
public void endRequest() {

  // Finish the handling of the request
  if (getErrorState().isIoAllowed()) {
    try {
      // 把InputBuffer的pos位置移动到第二个请求开始的位置
      getInputBuffer().endRequest();
    } catch (IOException e) {
      setErrorState(ErrorState.CLOSE_NOW, e);
    } catch (Throwable t) {
      ExceptionUtils.handleThrowable(t);
      // 500 - Internal Server Error
      // Can't add a 500 to the access log since that has already been
      // written in the Adapter.service method.
      response.setStatus(500);
      setErrorState(ErrorState.CLOSE_NOW, t);
      getLog().error(sm.getString("http11processor.request.finish"), t);
    }
  }
  if (getErrorState().isIoAllowed()) {
    try {
      getOutputBuffer().endRequest();
    } catch (IOException e) {
      setErrorState(ErrorState.CLOSE_NOW, e);
    } catch (Throwable t) {
      ExceptionUtils.handleThrowable(t);
      setErrorState(ErrorState.CLOSE_NOW, t);
      getLog().error(sm.getString("http11processor.response.finish"), t);
    }
  }
}
```

`getInputBuffer().endRequest();`调用

```java
public void endRequest() throws IOException {

  if (swallowInput && (lastActiveFilter != -1)) {
    // 多度的数据
    int extraBytes = (int) activeFilters[lastActiveFilter].end();
    // 之前多读的数据导致pos位置向后移动了，所以需要修正把pos向前移动
    pos = pos - extraBytes; // 把pos向前移动
  }
}
```

其中，activeFilters是InputFilter类型，InputFilter是一个接口，专门用来处理请求体的，请求体的数据是非常复杂的，而且有多种情况的，比如，当我们设置如下的请求的时候

![image-20220222001143673](./tomcat剖析/image-20220222001143673.png)

```markdown
# 一个请求体的内容的长度都是看Content-Length值判断的，超过Content-Length标注的长度，那么Tomcat就会认为是下一个socket请求的内容
也就说，Content-Length一定要和请求体的长度一致，那么我们如何计算呢，可以使用`getBytes().length()`
如果没有Content-Length的话，那么Tomcat就会认为没有请求体，那么我们如果携带了请求体，相当于白发
```

当前设置Content-Length:3，即设置请求体内容字节长度为3，如果我们的请求体的内容超出3，那么Tomcat会忽略超过的内容

那么，Tomcat在解析的时候，pos就会移动到前面的123为止，后面的123不会被获取和解析，此时就会存在在Buf中，会把它当做下一个请求的请求行

![image-20220222001522956](./tomcat剖析/image-20220222001522956.png)

```markdown
# 当Tomcat在从RecvBuf读取数据的时候，请求行和请求体都是按顺序读取，但是请求体可以在读取当前块完成之后，当要读取下一块的时候，可以直接覆盖之前已经读取的请求体
```

当当前的数据块处理完成之后，Tomcat会使用`InternalInputBuffer#fill`来从RecvBuf中获取下一块数据添加到Buf中处理

```java
protected boolean fill(boolean block) throws IOException {

  int nRead = 0;

  if (parsingHeader) {

    // 如果还在解析请求头，lastValid表示当前解析数据的下标位置，如果该位置等于buf的长度了，表示请求头的数据超过buf了。
    if (lastValid == buf.length) {
      throw new IllegalArgumentException
        (sm.getString("iib.requestheadertoolarge.error"));
    }

    // 从inputStream中读取数据，len表示要读取的数据长度，pos表示把从inputStream读到的数据放在buf的pos位置
    // nRead表示真实读取到的数据
    nRead = inputStream.read(buf, pos, buf.length - lastValid);
    if (nRead > 0) {
      lastValid = pos + nRead; // 移动lastValid
    }

  } else {
    // 当读取请求体的数据时
    // buf.length - end表示还能存放多少请求体数据，如果小于4500，那么就新生成一个byte数组，这个新的数组专门用来盛放请求体
    if (buf.length - end < 4500) {
      // In this case, the request header was really large, so we allocate a
      // brand new one; the old one will get GCed when subsequent requests
      // clear all references
      buf = new byte[buf.length];
      end = 0;
    }
    pos = end;
    lastValid = pos;
    nRead = inputStream.read(buf, pos, buf.length - lastValid);
    if (nRead > 0) {
      lastValid = pos + nRead;
    }

  }

  return (nRead > 0);
}
```

当我们把请求行和请求头读取进来并处理之后，就会开始处理请求体，Tomcat认为，如果请求体的存放位置已经小于4500的话，就会重新申请一个buf来存储请求体

![image-20220222161243973](./tomcat剖析/image-20220222161243973.png)

#### 分块传输

```markdown
# 如果不想用Content-Length，又想发送请求体?
可以使用`Transfer-Encoding:chunked`，表示分块，本来如果使用Content-Length的话，就是一次性的发送，但是使用Transfer-Encoding表示分块发送
```

分块的请求体格式，其中最后一段是要告诉Tomcat当前分块已经结束，如果不添加，就会导致Tomcat一直等待

![image-20220222010731724](./tomcat剖析/image-20220222010731724.png)

然后读取的方式也有不同，是需要通过循环不断的读取出数据

![image-20220222011001955](./tomcat剖析/image-20220222011001955.png)

#### InputFilter

不同的请求体对应不同的InputFilter进行解析，InputFilter有好几个实现类，其中比较重要的有

![image-20220222000643932](./tomcat剖析/image-20220222000643932.png)

1. ChunkedInputFilter 处理`Transfer-Encoding`的情况

```java
public int doRead(ByteChunk chunk, Request req) throws IOException {
  if (endChunk) {
    return -1;
  }
  // chunk会标记一个数据块的内容区域

  checkError();

  if(needCRLFParse) {
    needCRLFParse = false;
    parseCRLF(false);
  }

  if (remaining <= 0) {
    if (!parseChunkHeader()) {
      throwIOException(sm.getString("chunkedInputFilter.invalidHeader"));
    }
    if (endChunk) {
      parseEndChunk();
      return -1;
    }
  }

  int result = 0;

  if (pos >= lastValid) {
    if (readBytes() < 0) {
      throwIOException(sm.getString("chunkedInputFilter.eos"));
    }
  }

  // 如果需要的数据比读到的多，则先标记一下，并且算一下还需要读多少数据
  if (remaining > (lastValid - pos)) {
    result = lastValid - pos;
    remaining = remaining - result;
    chunk.setBytes(buf, pos, result);
    pos = lastValid;
  } else {
    // 如果读到的数据超过了需要的数据，那么则标记到需要的数据
    result = remaining;
    chunk.setBytes(buf, pos, remaining);
    pos = pos + remaining;
    remaining = 0;
    //we need a CRLF
    // 如果pos向后移一位之后没有数据了
    if ((pos+1) >= lastValid) {
      //if we call parseCRLF we overrun the buffer here
      //so we defer it to the next call BZ 11117
      needCRLFParse = true;
    } else {
      // 还有数据则判断紧跟着的数据是不是CRLF
      parseCRLF(false); //parse the CRLF immediately
    }
  }

  return result;
}
```

每一次调用doRead方法，都会获取客户端发送过来的一块数据，直到读到标记的时候，才会停止读取

2. IdentityInputFilter 处理`Content-Length`的情况

```java
public int doRead(ByteChunk chunk, Request req)
    throws IOException {
  // 当servlet中读取请求体时，会进入到这个方法，该方法返回

  int result = -1;

  // contentLength表示请求体的长度，当读取请求体时，只会返回这么长的数据
  // remaining
  if (contentLength >= 0) {  // 100
    // 可能会多次读取请求体，所以记录一下请求体还剩下多少
    if (remaining > 0) { // 10
      // 这里的buffer是InputSteamInputBuffer，会从操作系统的RecvBuf中读取数据，nRead表示读到了多少了数据
      int nRead = buffer.doRead(chunk, req); // 20

      // 如果读到的数据超过了剩余部分，那么将chunk的标记缩小，缩小为剩余部分的最后一个位置，多余数据不属于请求体了
      if (nRead > remaining) {
        // The chunk is longer than the number of bytes remaining
        // in the body; changing the chunk length to the number
        // of bytes remaining
        chunk.setBytes(chunk.getBytes(), chunk.getStart(),
                       (int) remaining);
        result = (int) remaining;
      } else {
        // 如果真实读到的数据小于剩下的
        result = nRead;
      }
      // 记录一下还需要读多少数据
      if (nRead > 0) {
        // 10 - 20==10
        remaining = remaining - nRead; // 如果剩余数据比真实读到的数据小，remaining将为负数
      }
    } else {
      // 如果没有剩余数据了，返回-1
      // No more bytes left to be read : return -1 and clear the
      // buffer
      chunk.recycle();
      result = -1;
    }
  }

  return result;
}
```

3. VoidInputFilter

主要是处理空的请求体

**那么Tomcat是如何判断应该将请求体交给哪一个处理呢？**

在`AbstractHttp11Processor#prepareRequest`方法要执行之前，请求行和请求头都已经被解析出来了，此时就会调用`AbstractHttp11Processor#prepareRequest`方法来解析

```java
protected void prepareRequest() {

  http11 = true;
  http09 = false;
  contentDelimitation = false;
  expectation = false;

  prepareRequestInternal();

  if (endpoint.isSSLEnabled()) {
    request.scheme().setString("https");
  }

  //
  MessageBytes protocolMB = request.protocol();
  if (protocolMB.equals(Constants.HTTP_11)) {
    http11 = true;
    protocolMB.setString(Constants.HTTP_11);
  } else if (protocolMB.equals(Constants.HTTP_10)) {
    // http1.0不支持keepAlive
    http11 = false;
    keepAlive = false;
    protocolMB.setString(Constants.HTTP_10);
  } else if (protocolMB.equals("")) {
    // HTTP/0.9
    // http0.9不支持keepAlive
    http09 = true;
    http11 = false;
    keepAlive = false;
  } else {
    // Unsupported protocol
    http11 = false;
    // Send 505; Unsupported HTTP version
    response.setStatus(505);
    setErrorState(ErrorState.CLOSE_CLEAN, null);
    if (getLog().isDebugEnabled()) {
      getLog().debug(sm.getString("http11processor.request.prepare")+
                     " Unsupported HTTP version \""+protocolMB+"\"");
    }
  }

  MessageBytes methodMB = request.method();
  if (methodMB.equals(Constants.GET)) {
    methodMB.setString(Constants.GET);
  } else if (methodMB.equals(Constants.POST)) {
    methodMB.setString(Constants.POST);
  }

  MimeHeaders headers = request.getMimeHeaders();

  // Check connection header
  MessageBytes connectionValueMB = headers.getValue(Constants.CONNECTION);
  if (connectionValueMB != null && !connectionValueMB.isNull()) {
    ByteChunk connectionValueBC = connectionValueMB.getByteChunk();
    if (findBytes(connectionValueBC, Constants.CLOSE_BYTES) != -1) {
      // 如果请求头中connection=close，表示不是长连接
      keepAlive = false;
    } else if (findBytes(connectionValueBC,
                         Constants.KEEPALIVE_BYTES) != -1) {
      // 如果请求头中connection=keep-alive，表示长连接
      keepAlive = true;
    }
  }

  if (http11) {
    MessageBytes expectMB = headers.getValue("expect");
    if (expectMB != null && !expectMB.isNull()) {
      if (expectMB.indexOfIgnoreCase("100-continue", 0) != -1) {
        getInputBuffer().setSwallowInput(false);
        expectation = true;
      } else {
        response.setStatus(HttpServletResponse.SC_EXPECTATION_FAILED);
        setErrorState(ErrorState.CLOSE_CLEAN, null);
      }
    }
  }

  // Check user-agent header
  // 请求本来是http1.1或keepAlive的，如果请求中所指定的user-agent被限制了，不支持长连接
  if ((restrictedUserAgents != null) && ((http11) || (keepAlive))) {
    MessageBytes userAgentValueMB = headers.getValue("user-agent");
    // Check in the restricted list, and adjust the http11
    // and keepAlive flags accordingly
    if(userAgentValueMB != null && !userAgentValueMB.isNull()) {
      String userAgentValue = userAgentValueMB.toString();
      if (restrictedUserAgents.matcher(userAgentValue).matches()) {
        http11 = false;
        keepAlive = false;
      }
    }
  }


  // Check host header
  MessageBytes hostValueMB = null;
  try {
    // 获取唯一的host,请求头中不能有多个key为host
    hostValueMB = headers.getUniqueValue("host");
  } catch (IllegalArgumentException iae) {
    // Multiple Host headers are not permitted
    badRequest("http11processor.request.multipleHosts");
  }
  if (http11 && hostValueMB == null) {
    badRequest("http11processor.request.noHostHeader");
  }

  // Check for an absolute-URI less the query string which has already
  // been removed during the parsing of the request line
  // URI格式：[协议名]://[用户名]:[密码]@[服务器地址]:[服务器端口号]/[路径]?[查询字符串]#[片段ID]
  ByteChunk uriBC = request.requestURI().getByteChunk();
  byte[] uriB = uriBC.getBytes();
  if (uriBC.startsWithIgnoreCase("http", 0)) {
    int pos = 4;
    // Check for https
    if (uriBC.startsWithIgnoreCase("s", pos)) {
      pos++;
    }
    // Next 3 characters must be "://"
    if (uriBC.startsWith("://", pos)) {
      pos += 3;
      int uriBCStart = uriBC.getStart();

      // '/' does not appear in the authority so use the first
      // instance to split the authority and the path segments
      int slashPos = uriBC.indexOf('/', pos);
      // '@' in the authority delimits the userinfo
      int atPos = uriBC.indexOf('@', pos);
      if (slashPos > -1 && atPos > slashPos) {
        // First '@' is in the path segments so no userinfo
        atPos = -1;
      }

      if (slashPos == -1) {
        slashPos = uriBC.getLength();
        // Set URI as "/". Use 6 as it will always be a '/'.
        // 01234567
        // http://
        // https://
        request.requestURI().setBytes(uriB, uriBCStart + 6, 1);
      } else {
        request.requestURI().setBytes(uriB, uriBCStart + slashPos, uriBC.getLength() - slashPos);
      }

      // Skip any user info
      // 检验用户信息格式是否正确
      if (atPos != -1) {
        // Validate the userinfo
        for (; pos < atPos; pos++) {
          byte c = uriB[uriBCStart + pos];
          if (!HttpParser.isUserInfo(c)) {
            // Strictly there needs to be a check for valid %nn
            // encoding here but skip it since it will never be
            // decoded because the userinfo is ignored
            badRequest("http11processor.request.invalidUserInfo");
            break;
          }
        }
        // Skip the '@'
        pos = atPos + 1;
      }

      if (http11) {
        // Missing host header is illegal but handled above
        if (hostValueMB != null) {
          // Any host in the request line must be consistent with
          // the Host header
          // uri中的主机名是不是和header中的一致，如果不一致，看是否tomcat运行不一致，如果允许则修改header中的为uri中的
          if (!hostValueMB.getByteChunk().equals(
            uriB, uriBCStart + pos, slashPos - pos)) {
            if (allowHostHeaderMismatch) {
              // The requirements of RFC 2616 are being
              // applied. If the host header and the request
              // line do not agree, the request line takes
              // precedence
              hostValueMB = headers.setValue("host");
              hostValueMB.setBytes(uriB, uriBCStart + pos, slashPos - pos);
            } else {
              // The requirements of RFC 7230 are being
              // applied. If the host header and the request
              // line do not agree, trigger a 400 response.
              badRequest("http11processor.request.inconsistentHosts");
            }
          }
        }
      } else {
        // Not HTTP/1.1 - no Host header so generate one since
        // Tomcat internals assume it is set
        try {
          hostValueMB = headers.setValue("host");
          hostValueMB.setBytes(uriB, uriBCStart + pos, slashPos - pos);
        } catch (IllegalStateException e) {
          // Edge case
          // If the request has too many headers it won't be
          // possible to create the host header. Ignore this as
          // processing won't reach the point where the Tomcat
          // internals expect there to be a host header.
        }
      }
    } else {
      badRequest("http11processor.request.invalidScheme");
    }
  }

  // Validate the characters in the URI. %nn decoding will be checked at
  // the point of decoding.
  for (int i = uriBC.getStart(); i < uriBC.getEnd(); i++) {
    if (!httpParser.isAbsolutePathRelaxed(uriB[i])) {
      badRequest("http11processor.request.invalidUri");
      break;
    }
  }

  // Input filter setup
  // 获取处理请求体的Tomcat默认的InputFilter,默认4个Input的
  InputFilter[] inputFilters = getInputBuffer().getFilters();

  // 每个InputFilter都有一个ENCODING_NAME
  // Parse transfer-encoding header
  MessageBytes transferEncodingValueMB = null;
  if (http11) {
    transferEncodingValueMB = headers.getValue("transfer-encoding");
  }
  if (transferEncodingValueMB != null && !transferEncodingValueMB.isNull()) {
    String transferEncodingValue = transferEncodingValueMB.toString();
    // Parse the comma separated list. "identity" codings are ignored
    int startPos = 0;
    int commaPos = transferEncodingValue.indexOf(',');
    String encodingName = null;
    // 请求中设置了多个ENCODING_NAME
    while (commaPos != -1) {
      encodingName = transferEncodingValue.substring(startPos, commaPos);
      addInputFilter(inputFilters, encodingName);
      startPos = commaPos + 1;
      commaPos = transferEncodingValue.indexOf(',', startPos);
    }
    encodingName = transferEncodingValue.substring(startPos);
    addInputFilter(inputFilters, encodingName);
  }

  // Parse content-length header
  // inputFilters提交跟contextlength相关的IDENTITY_FILTER
  long contentLength = -1;
  try {
    contentLength = request.getContentLengthLong();
  } catch (NumberFormatException e) {
    badRequest("http11processor.request.nonNumericContentLength");
  } catch (IllegalArgumentException e) {
    badRequest("http11processor.request.multipleContentLength");
  }
  if (contentLength >= 0) {
    // transfer-encoding等于chunked的时候，contentDelimitation会设置为true，表示是分块传输，所以contentLength没用
    if (contentDelimitation) {
      // contentDelimitation being true at this point indicates that
      // chunked encoding is being used but chunked encoding should
      // not be used with a content length. RFC 2616, section 4.4,
      // bullet 3 states Content-Length must be ignored in this case -
      // so remove it.
      headers.removeHeader("content-length");
      request.setContentLength(-1);
    } else {
      // 利用IDENTITY_FILTER来处理请求体
      getInputBuffer().addActiveFilter(inputFilters[Constants.IDENTITY_FILTER]);
      contentDelimitation = true;
    }
  }

  // Validate host name and extract port if present
  // 解析hostname和port
  parseHost(hostValueMB);

  // 即没有content-length请求头，也没有transfer-encoding请求头，那么用VOID_FILTER来处理请求体，其实就是不处理请求体
  if (!contentDelimitation) {
    // If there's no content length
    // (broken HTTP/1.0 or HTTP/1.1), assume
    // the client is not broken and didn't send a body
    getInputBuffer().addActiveFilter(inputFilters[Constants.VOID_FILTER]);
    contentDelimitation = true;
  }

  // Advertise sendfile support through a request attribute
  if (endpoint.getUseSendfile()) {
    request.setAttribute(
      org.apache.coyote.Constants.SENDFILE_SUPPORTED_ATTR,
      Boolean.TRUE);
  }

  // Advertise comet support through a request attribute
  if (endpoint.getUseComet()) {
    request.setAttribute(
      org.apache.coyote.Constants.COMET_SUPPORTED_ATTR,
      Boolean.TRUE);
  }
  // Advertise comet timeout support
  if (endpoint.getUseCometTimeout()) {
    request.setAttribute(
      org.apache.coyote.Constants.COMET_TIMEOUT_SUPPORTED_ATTR,
      Boolean.TRUE);
  }
  if (getErrorState().isError()) {
    adapter.log(request, response, 0);
  }
}
```

```markdown
# 获取过程
1. 获取四个默认的InputFilter的实现类
2. 通过判断请求头中是否存在需要的参数，content-length使用IdentityInputFilter、transfer-encoding使用ChunkInputFilter，transfer-encoding等于chunked的时候，contentDelimitation会设置为true，表示是分块传输，所以contentLength没用
3. 既没有content-length请求头，也没有transfer-encoding请求头，那么用VOID_FILTER来处理请求体，其实就是不处理请求体
```

处理请求体，将pos移动到下一个位置，并处理剩余的数据

```java
public long end() throws IOException {
  // 本次http请求已经处理完了，做收尾工作
  // 主要处理看请求体是否有剩余数据没有读完

  // 判断剩余数据是否超过了限制
  final boolean maxSwallowSizeExceeded = (maxSwallowSize > -1 && remaining > maxSwallowSize);
  long swallowed = 0;

  // remaining==contentlengt
  // Consume extra bytes.
  // 还有剩余数据
  while (remaining > 0) {

    // 从操作系统读取数据
    int nread = buffer.doRead(endChunk, null);
    if (nread > 0 ) {
      // 如果读到了数据
      swallowed += nread;
      // 更新剩余数据
      remaining = remaining - nread;
      // 如果在遍历剩余数据时，读到的数据超过了maxSwallowSize，则会抛异常，后续逻辑就会把socket关掉
      if (maxSwallowSizeExceeded && swallowed > maxSwallowSize) {
        // 我们不会提早失败，因此客户端可以去读取响应在连接关闭之前
        // Note: We do not fail early so the client has a chance to
        // read the response before the connection is closed. See:
        // https://httpd.apache.org/docs/2.0/misc/fin_wait_2.html#appendix
        throw new IOException(sm.getString("inputFilter.maxSwallow"));
      }
    } else { // errors are handled higher up.
      // 如果本来认为还有剩余数据，但是真正去读的时候没有数据了，nread等于-1，索引剩余数据为0
      remaining = 0;
    }
  }

  // 读到的真实数据超过了剩余数据，则remaining为负数
  // If too many bytes were read, return the amount.
  return -remaining;

}
```

也就是说，如果当前读取到的数据包含了下一次请求的数据（也就是剩余的数据），那么这些数据需要和下一次的数据合并（有可能是下次数据的请求行【比如是POST】）

end方法就是负责修正当前socket和下一次socket数据读取的位置偏移，一旦读取到下次请求的数据，pos需要往前移动

```markdown
# 浏览器可以并行发送socket请求，但是Tomcat只能串行处理
只能串行的从RecvBuf中读取数据，但是处理的部分是可以并行实现的
```

```markdown
# BIO和NIO是从RecvBuf中取数据的方式不同
```

客户端浏览器在发送数据的时候，是通过连续的socket来发送的，所以可能会堆积在RecvBuf中

![image-20220222152104907](./tomcat剖析/image-20220222152104907.png)



因为接下来涉及到Request对象属性的填充，所以我们先了解Request对象

#### Request对象

在Tomcat中其实有两个Request对象

![image-20220221201451969](./tomcat剖析/image-20220221201451969.png)

- connector.Request 实现了servlet规范的，还有一个门面模式的类RequestFacade
- coyote.Request 

它们二者中的属性方法相似，比如平时我们调用`request.getMethod()`获取请求方法类型的时候，调用的顺序是：

`RequestFacade---connector.Request---coyote.Request`

从这里我们可以看得出来，这三者的层级关系，所以说我们真正获取数据是在coyote.Request，Tomcat从socket解析出来的数据，也是填充到`coyote.Request`

##### coyote.Request

我们来了解一下这个底层的Request

**MessageBytes**

我们查看coyote.Request中有很多的属性的类型都MessageBytes，了解一下

此类用于表示 HTTP 消息中的字节子数组。它代表所有请求响应元素。 bytechar 转换被延迟和缓存。一切都是可回收的。该对象可以表示一个字节[]、一个字符[]或一个（子）字符串。所有操作都可以在区分大小写的模式下进行，也可以不进行

```java
// Internal objects to represent array + offset, and specific methods
private final ByteChunk byteC=new ByteChunk();
```

`ByteChunk` 字节块，这个类在我们请求的时候，会使用到，响应的时候也会使用到，这个类里面使用字节数组存储数据，并封装了常用的读取、添加、追加、删除、清空等针对数据byte的操作

![image-20220221203906270](./tomcat剖析/image-20220221203906270.png)

每一个ByteChunk通过在标记byte上不同的位置，标记出不同的参数

![image-20220221205219692](./tomcat剖析/image-20220221205219692.png)

比如，从`coyote.Request`获取到method之后，connector.Request会调用toString方法

```java
public String getMethod() {
  return coyoteRequest.method().toString();
}
```

那么就会从ByteChunk中解析成字符串，`byteC就是ByteChunk`字节块

```java
public String toString() {
  if( hasStrValue ) {
    return strValue;
  }

  switch (type) {
    case T_CHARS:
      strValue=charC.toString();
      hasStrValue=true;
      return strValue;
    case T_BYTES:
      strValue=byteC.toString();
      hasStrValue=true;
      return strValue;
  }
  return null;
}
```

```markdown
# 从这里也可以看到，这里也可以从字符转成字符串
```

当从字节转换到字符串的时候给我们返回的时候，也会把字符串存储到StringCache中，当我们下次在获取的时候，就会不用转换，直接从StringCache中获取

```java
if( hasStrValue ) {
  return strValue;
}
```

接下来就是将封装好的Request交给servlet处理了，等到servlet处理完成之后，就开始封装响应的Response了

Tomcat在将Request交给servlet之后，就可以开始处理下一个socket请求了

```markdown
# 这个时候可能会出现一个问题，Tomcat在当前的数据的时候，可能会把下一个socket的数据也加载到Buf中，比如如下，除了读取当前的请求头+请求体之外，还读取了下一个请求的
```

![image-20220221213554025](./tomcat剖析/image-20220221213554025.png)

## 响应流程原理解析

### 基本点

在servlet中我们如何去响应的，利用response

![image-20220222174141156](./tomcat剖析/image-20220222174141156.png)

或者使用

![image-20220222174238110](./tomcat剖析/image-20220222174238110.png)

```markdown
# 无论是客户端还是服务端，如果应用程序需要发送数据，需要先把数据发送给SendBuf，然后让操作系统去发送
当我们要将数据放到SendBuf的时候，如果这个时候缓冲区已经满了，操作系统暂时还没有将这些满的数据发送出去，这个时候我们将数据放到SendBuf的操作就会被阻塞住，也就是write操作会被阻塞住
Tomcat为了解决这个问题，就会在自己和SendBuf中间加缓冲区，先写到缓冲区，然后write操作就不会阻塞
Tomcat有两个缓冲区，这里面使用的存储类都是ByteChunk类
```

![image-20220222180518776](./tomcat剖析/image-20220222180518776.png)

```markdown
# 如果缓冲区没有满，但是调用了frush方法，就会把数据写出去
这里就涉及到两步，第一步，将第一个缓冲区的数据写到第二个缓冲区；第二步，将第二个缓冲区的数据写到操作系统的SendBuf
```

```java
protected void doFlush(boolean realFlush) throws IOException {

  if (suspended) {
    return;
  }

  try {
    doFlush = true;
    if (initial) {
      // 先发送请求头，再发送请求体
      coyoteResponse.sendHeaders();
      initial = false;
    }
    if (cb.getLength() > 0) {
      cb.flushBuffer();
    }
    if (bb.getLength() > 0) {
      // 这里只是把上层缓冲区中的数据发送到底层缓冲区中，所以数据到底会不会发送给socket并不确定
      bb.flushBuffer();
    }
  } finally {
    doFlush = false;
  }

  if (realFlush) {
    // 如果是真正flush，把底层缓冲区中的数据发送给socket
    coyoteResponse.action(ActionCode.CLIENT_FLUSH, null);
    // If some exception occurred earlier, or if some IOE occurred
    // here, notify the servlet with an IOE
    if (coyoteResponse.isExceptionPresent()) {
      throw new ClientAbortException(coyoteResponse.getErrorException());
    }
  }
}
```

我们现在写的数据叫做响应体，而我们真正要响应的话，应该还要响应头

那么frush就会去发送响应头，frush函数中会去判断，如果是同一个响应的话，就不会重复发送响应头

![image-20220222181402064](./tomcat剖析/image-20220222181402064.png)

```markdown
# 响应也有content-length和chunk
frush就是分块chunk，先发送了一块，然后在发送一块
```

什么请款下使用content-length，当我们直接将数据写入到流里面的时候，就可以确定当前响应体的数据量的大小了

![image-20220222183853851](./tomcat剖析/image-20220222183853851.png)

所以说，当当前函数执行完成之后，Tomcat就会根据当前写入的数据量来计算出content-length的值，并给我们构造出响应头

```markdown
# 逻辑是这样的
首先判断我们的响应体有没有发送过，如果没有发送过的话，那么就取出所有缓冲区中的数据计算content-length，构造出响应头，按照整体发送出去
如果发送过，按照chunk来发送
```

```markdown
# finishResponse和调用outputStream.close()时都会将数据发送出去
```

### 源码解析

上面讲了大概的流程内容，接下来，我们看一下源码的实现方式

我们这里的OutputStream的主要实现类是CoyoteOutputStream，我们现在来看一下它的功能和流程

OutputStream主要存储字节的对象是`ByteChunk`，主要是通过append添加数据到`ByteChunk`

#### `CoyoteOutputStream#write`方法

主要是将数据写入到缓冲区，Tomcat会自动根据当前缓冲区是否满，来决定是否将当前数据移动到下一级缓冲区，然后看下一级是否满来决定是否将数据发送到SendBuf，交给系统发送数据

```java
private void writeBytes(byte b[], int off, int len)
        throws IOException {

  if (closed) {
    return;
  }

  // 将数据先写入ByteChunk的缓冲区中, 如果缓冲区满了，可能会把数据发送出去
  bb.append(b, off, len);
  bytesWritten += len;

  // if called from within flush(), then immediately flush
  // remaining bytes
  // 如果此前已经调用过flush方法
  if (doFlush) {
    // 那么每次write都把缓冲中的数据发送出去
    bb.flushBuffer();
  }
}
```

调用`ByteChunk#append`方法将数据填充到`ByteChunk`

```java
public void append(byte src[], int off, int len) throws IOException {
  // will grow, up to limit
  // 向缓冲区中添加数据，需要开辟缓存区空间，缓存区初始大小为256，最大大小可以设置，默认为8192
  // 意思是现在要想缓冲区存放数据，首先得去开辟空间，但是空间是有一个最大限制的，所以要存放的数据可能小于限制，也可能大于限制
  makeSpace(len);
  int limit = getLimitInternal(); // 缓冲区大小的最大限制

  // Optimize on a common case.
  // If the buffer is empty and the source is going to fill up all the
  // space in buffer, may as well write it directly to the output,
  // and avoid an extra copy
  // 如果要添加到缓冲区中的数据大小正好等于最大限制，并且缓冲区是空的，那么则直接把数据发送给out，不要存在缓冲区中了
  if (optimizedWrite && len == limit && end == start && out != null) {
    out.realWriteBytes(src, off, len);
    return;
  }

  // if we are below the limit
  // 如果要发送的数据长度小于缓冲区中剩余空间，则把数据填充到剩余空间
  if (len <= limit - end) {
    System.arraycopy(src, off, buff, end, len);
    end += len;
    return;
  }

  // 如果要发送的数据长度大于缓冲区中剩余空间，

  // Need more space than we can afford, need to flush buffer.

  // The buffer is already at (or bigger than) limit.

  // We chunk the data into slices fitting in the buffer limit, although
  // if the data is written directly if it doesn't fit.

  // 缓冲区中还能容纳avail个字节的数据
  int avail = limit - end;
  // 先将一部分数据复制到buff，填满缓冲区
  System.arraycopy(src, off, buff, end, avail);
  end += avail;

  // 将缓冲区的数据发送出去
  flushBuffer();

  // 还剩下一部分数据没有放到缓冲区中的
  int remain = len - avail;

  // 如果剩下的数据 超过 缓冲区剩余大小,那么就把数据直接发送出去
  while (remain > (limit - end)) {
    out.realWriteBytes(src, (off + len) - remain, limit - end);
    remain = remain - (limit - end);
  }

  // 直到最后剩下的数据能放入缓冲区，那么就放入到缓冲区
  System.arraycopy(src, (off + len) - remain, buff, end, remain);
  end += remain;
}
```

创建空间，如果当前缓冲区没有满，那么就先填满剩余的部分，并发送出去，然后在处理剩余的数据

- 如果剩下的数据 超过 缓冲区剩余大小,那么就把数据直接发送出去
- 直到最后剩下的数据能放入缓冲区，那么就放入到缓冲区

```markdown
# 这样发一半一半的出去，只要是按照顺序发送的，就不会有问题
```

makeSpace创建出存储数据的内存空间

```java
public void makeSpace(int count) {
  byte[] tmp = null;

  // 缓冲区的最大大小，可以设置，默认为8192
  int limit = getLimitInternal();

  long newSize;
  // end表示缓冲区中已有数据的最后一个位置，desiredSize表示新数据+已有数据共多大
  long desiredSize = end + count;

  // Can't grow above the limit
  // 如果超过限制了，那就只能开辟limit大小的缓冲区了
  if (desiredSize > limit) {
    desiredSize = limit;
  }

  if (buff == null) {
    // 初始化字节数组
    if (desiredSize < 256) {
      desiredSize = 256; // take a minimum
    }
    buff = new byte[(int) desiredSize];
  }

  // limit < buf.length (the buffer is already big)
  // or we already have space XXX
  // 如果需要的大小小于buff长度，那么不需要增大缓冲区
  if (desiredSize <= buff.length) {
    return;
  }

  // 下面代码的前提条件是，需要的大小超过了buff的长度

  // grow in larger chunks
  // 如果需要的大小大于buff.length, 小于2*buff.length，则缓冲区的新大小为2*buff.length，
  if (desiredSize < 2L * buff.length) {
    newSize = buff.length * 2L;
  } else {
    // 否则为buff.length * 2L + count
    newSize = buff.length * 2L + count;
  }

  // 扩容前没有超过限制，扩容后可能超过限制
  if (newSize > limit) {
    newSize = limit;
  }
  tmp = new byte[(int) newSize];

  // Compacts buffer
  // 把当前buff中的内容复制到tmp中
  System.arraycopy(buff, start, tmp, 0, end - start);
  buff = tmp;
  tmp = null;
  end = end - start;
  start = 0;
}
```

扩容机制：

- `desiredSize`表示所有的数据量的大小=当前已经存在缓冲区中的数据量+将要放入的数据量

- 如果当前的已经在缓冲区中的数据量+将要放入的数据量小于`缓冲区的最大大小，可以设置，默认为8192`那么就按照传入的数据量来创建对应大小的内存

- 如果当前的已经在缓冲区中的数据量+将要放入的数据量大于缓冲区的最大限制，就按照最大限制来创建内存

- 如果所有的数据量已经超过缓冲区的最大容量，那么就看是否超过两倍的buff的长度，不超过就创建两倍的最大容量空间，超过了就创建两倍当前已经buff的长度+将要存储的数据量

#### `CoyoteOutputStream#frush`方法

表示主动将缓冲区中的数据发送到SendBuf，交给系统发送出去，`CoyoteOutputStream#frush`调用`OutputBuffer#flush`

```java
protected void doFlush(boolean realFlush) throws IOException {

  if (suspended) {
    return;
  }

  try {
    doFlush = true;
    if (initial) {
      // 先发送请求头，再发送请求体
      coyoteResponse.sendHeaders();
      initial = false;
    }
    if (cb.getLength() > 0) {
      cb.flushBuffer();
    }
    if (bb.getLength() > 0) {
      // 这里只是把上层缓冲区中的数据发送到底层缓冲区中，所以数据到底会不会发送给socket并不确定
      bb.flushBuffer();
    }
  } finally {
    doFlush = false;
  }

  if (realFlush) {
    // 如果是真正flush，把底层缓冲区中的数据发送给socket
    coyoteResponse.action(ActionCode.CLIENT_FLUSH, null);
    // If some exception occurred earlier, or if some IOE occurred
    // here, notify the servlet with an IOE
    if (coyoteResponse.isExceptionPresent()) {
      throw new ClientAbortException(coyoteResponse.getErrorException());
    }
  }
}
```

逻辑：

- 如果非真的frush，就只是将当前的一级的数据移动到二级

  - 如果响应头还没有发送，那么就先发送响应头

  - 如果发送的是字符串的话，就按照字符串的方式来发送

  - 如果发送的是字节的话，按照字节的方式发送

- 如果是真正flush，把底层缓冲区中的数据发送给socket

解析：

1. `coyoteResponse.sendHeaders();`发送请求头

```java
public void sendHeaders() {
  action(ActionCode.COMMIT, this);
  setCommitted(true);
}
```

这里使用命令模式，将对应的执行操作和数据发送给执行者

```java
public void action(ActionCode actionCode, Object param) {
  if (hook != null) {
    if (param == null) {
      hook.action(actionCode, this);
    } else {
      hook.action(actionCode, param);
    }
  }
}
```

![image-20220223153833366](./tomcat剖析/image-20220223153833366.png)

然后调用`prepareResponse()`预处理，也就是整合出响应头

```java
private void prepareResponse() {

  boolean entityBody = true;
  contentDelimitation = false;

  OutputFilter[] outputFilters = getOutputBuffer().getFilters();

  if (http09 == true) {
    // HTTP/0.9
    getOutputBuffer().addActiveFilter
      (outputFilters[Constants.IDENTITY_FILTER]);
    return;
  }

  // 如果是这些状态，则不发送响应体
  int statusCode = response.getStatus();
  if (statusCode < 200 || statusCode == 204 || statusCode == 205 ||
      statusCode == 304) {
    // No entity body
    getOutputBuffer().addActiveFilter
      (outputFilters[Constants.VOID_FILTER]);
    entityBody = false;
    contentDelimitation = true;
    if (statusCode == 205) {
      // RFC 7231 requires the server to explicitly signal an empty
      // response in this case
      response.setContentLength(0);
    } else {
      response.setContentLength(-1);
    }
  }

  // 如果请求方法是HEAD，也不发送响应体
  MessageBytes methodMB = request.method();
  if (methodMB.equals("HEAD")) {
    // No entity body
    getOutputBuffer().addActiveFilter
      (outputFilters[Constants.VOID_FILTER]);
    contentDelimitation = true;
  }

  // Sendfile support
  boolean sendingWithSendfile = false;
  if (getEndpoint().getUseSendfile()) {
    sendingWithSendfile = prepareSendfile(outputFilters);
  }

  // Check for compression
  boolean isCompressible = false;
  boolean useCompression = false;
  if (entityBody && (compressionLevel > 0) && !sendingWithSendfile) {
    isCompressible = isCompressible();
    if (isCompressible) {
      useCompression = useCompression();
    }
    // Change content-length to -1 to force chunking
    if (useCompression) {
      response.setContentLength(-1);
    }
  }

  MimeHeaders headers = response.getMimeHeaders();
  // A SC_NO_CONTENT response may include entity headers
  if (entityBody || statusCode == 204) {
    String contentType = response.getContentType();
    if (contentType != null) {
      headers.setValue("Content-Type").setString(contentType);
    }
    String contentLanguage = response.getContentLanguage();
    if (contentLanguage != null) {
      headers.setValue("Content-Language")
        .setString(contentLanguage);
    }
  }

  // 如果response中有content-length，则通过IDENTITY_FILTER发送
  long contentLength = response.getContentLengthLong();
  boolean connectionClosePresent = false;
  if (contentLength != -1) {
    headers.setValue("Content-Length").setLong(contentLength);
    getOutputBuffer().addActiveFilter
      (outputFilters[Constants.IDENTITY_FILTER]);
    contentDelimitation = true;
  } else {
    // If the response code supports an entity body and we're on
    // HTTP 1.1 then we chunk unless we have a Connection: close header
    connectionClosePresent = isConnectionClose(headers);
    if (entityBody && http11 && !connectionClosePresent) {
      getOutputBuffer().addActiveFilter
        (outputFilters[Constants.CHUNKED_FILTER]);
      contentDelimitation = true;
      headers.addValue(Constants.TRANSFERENCODING).setString(Constants.CHUNKED);
    } else {
      getOutputBuffer().addActiveFilter
        (outputFilters[Constants.IDENTITY_FILTER]);
    }
  }

  if (useCompression) {
    getOutputBuffer().addActiveFilter(outputFilters[Constants.GZIP_FILTER]);
    headers.setValue("Content-Encoding").setString("gzip");
  }
  // If it might be compressed, set the Vary header
  if (isCompressible) {
    ResponseUtil.addVaryFieldName(headers, "accept-encoding");
  }

  // Add date header unless application has already set one (e.g. in a
  // Caching Filter)
  if (headers.getValue("Date") == null) {
    headers.setValue("Date").setString(
      FastHttpDateFormat.getCurrentDate());
  }

  // FIXME: Add transfer encoding header

  if ((entityBody) && (!contentDelimitation)) {
    // Mark as close the connection after the request, and add the
    // connection: close header
    keepAlive = false;
  }

  // This may disabled keep-alive to check before working out the
  // Connection header.
  checkExpectationAndResponseStatus();

  // If we know that the request is bad this early, add the
  // Connection: close header.
  keepAlive = keepAlive && !statusDropsConnection(statusCode);
  if (!keepAlive) {
    // socket连接不再活跃了，会关闭socket
    // Avoid adding the close header twice
    if (!connectionClosePresent) {
      headers.addValue(Constants.CONNECTION).setString(
        Constants.CLOSE);
    }
  } else if (!http11 && !getErrorState().isError()) {
    headers.addValue(Constants.CONNECTION).setString(Constants.KEEPALIVE);
  }

  // Build the response header
  // 先发送协议和状态 比如HTTP/1.1 200 OK
  getOutputBuffer().sendStatus();

  // 再发送响应头中的Server
  // Add server header
  if (server != null) {
    // Always overrides anything the app might set
    headers.setValue("Server").setString(server);
  } else if (headers.getValue("Server") == null) {
    // If app didn't set the header, use the default
    getOutputBuffer().write(Constants.SERVER_BYTES);
  }

  int size = headers.size();
  for (int i = 0; i < size; i++) {
    getOutputBuffer().sendHeader(headers.getName(i), headers.getValue(i));
  }
  getOutputBuffer().endHeaders();
}
```

- 如果response中有content-length，则通过IDENTITY_FILTER发送
- 如果keepAlive是false，就会关闭连接

调用`getOutputBuffer().commit()`提交数据，这里提交数据如果设置了二级缓冲区，那么就会发送到二级缓冲区，如果没有设置，就会直接发送到SendBuf，交给操作系统发送socket数据

```java
protected void commit()
    throws IOException {

    // The response is now committed
    committed = true;
    response.setCommitted(true);

    if (pos > 0) {
        // Sending the response header buffer
        // 如果用了socketbuffer则写写到socketbuffer中，如果没有则直接通过socketoutputstream返回
        if (useSocketBuffer) {
            socketBuffer.append(buf, 0, pos);
        } else {
            outputStream.write(buf, 0, pos);
        }
    }
}
```

2. `bb.flushBuffer()`调用字符串或者字节发送数据

接着调用`OutputBuffer#realWriteBytes`方法，接着调用`coyoteResponse.doWrite(outputChunk)`发送数据

```java
public void doWrite(ByteChunk chunk)
        throws IOException
{
  // 把chunk中的数据写入InternalOutputBuffer
  outputBuffer.doWrite(chunk, this);
  contentWritten+=chunk.getLength();
}
```

`outputBuffer.doWrite(chunk, this)`会根据不同的打包方式来发送数据

![image-20220223161121862](./tomcat剖析/image-20220223161121862.png)

![image-20220223162225511](./tomcat剖析/image-20220223162225511.png)

最后会调用socket的本地方法发送数据

![image-20220223162809888](./tomcat剖析/image-20220223162809888.png)

![image-20220223170841612](./tomcat剖析/image-20220223170841612.png)

## BIO的整个流程总结

Tomcat的启动的话，可以按照server.xml的层级来理解，因为server.xml已经把Tomcat的一些基本的结构都已经列举出来了

先有一个Service，然后调用一些Connector的方法来启动，Connector类规定解析交互的协议、端口等属性，然后调用`startInternal`启动，并在最后调用`endPoint.start`方法，endPoint有三个实现类

![image-20220223171848865](./tomcat剖析/image-20220223171848865.png)

之前的BIO一直就是JIO方式的EndPoint，所以就会执行到`JIoEndPoint#startInternal`，如果没有创建线程池的话，就会创建最小10个线程、最大200线程的线程池

```java
public void startInternal() throws Exception {

    if (!running) {
        running = true;
        paused = false;

        // Create worker collection
        // 如果配置文件里没有配置线程池，那么将创建一个默认的
        if (getExecutor() == null) {
            createExecutor();
        }

        initializeConnectionLatch();

        startAcceptorThreads();

        // Start async timeout thread
        Thread timeoutThread = new Thread(new AsyncTimeout(),
                getName() + "-AsyncTimeout");
        timeoutThread.setPriority(threadPriority);
        timeoutThread.setDaemon(true);
        timeoutThread.start();
    }
}
```

BIO一个连接过来就交给一个线程处理，调用`startAcceptorThreads`

```java
protected final void startAcceptorThreads() {
  int count = getAcceptorThreadCount();
  acceptors = new Acceptor[count];

  for (int i = 0; i < count; i++) {
    acceptors[i] = createAcceptor();
    String threadName = getName() + "-Acceptor-" + i;
    acceptors[i].setThreadName(threadName);
    Thread t = new Thread(acceptors[i], threadName);
    t.setPriority(getAcceptorThreadPriority());
    t.setDaemon(getDaemon());
    t.start();
  }
}
```

我们前面查看源码的时候，可以知道`Acceptor`主要用来处理请求的，调用`Acceptor#run`方法

```java
public void run() {

    int errorDelay = 0;

    // Loop until we receive a shutdown command
    while (running) {

        // Loop if endpoint is paused
        // 如果Endpoint仍然在运行，但是被暂停了，那么就无限循环，从而不能接受请求
        while (paused && running) {
            state = AcceptorState.PAUSED;
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                // Ignore
            }
        }

        if (!running) {
            break;
        }
        state = AcceptorState.RUNNING;

        try {
            //if we have reached max connections, wait
            //达到了最大连接数限制则等待
            countUpOrAwaitConnection();

            Socket socket = null;  // bio，nio
            try {
                // Accept the next incoming connection from the server
                // bio socket
                // 此处是阻塞的，那么running属性就算已经被改成false，那么怎么进入到下一次循环呢？
                socket = serverSocketFactory.acceptSocket(serverSocket);//
                System.out.println("接收到了一个socket连接");

            } catch (IOException ioe) {
                countDownConnection();
                // Introduce delay if necessary
                errorDelay = handleExceptionWithDelay(errorDelay);
                // re-throw
                throw ioe;
            }
            // Successful accept, reset the error delay
            errorDelay = 0;

            // Configure the socket
            // 如果Endpoint正在运行并且没有被暂停，那么就处理该socket
            if (running && !paused && setSocketOptions(socket)) {
                // Hand this socket off to an appropriate processor
                // socket被正常的交给了线程池，processSocket就会返回true
                // 如果没有被交给线程池或者中途Endpoint被停止了，则返回false
                // 返回false则关闭该socket
                if (!processSocket(socket)) {
                    countDownConnection();
                    // Close socket right away
                    closeSocket(socket);
                }
            } else {
                countDownConnection();
                // Close socket right away
                closeSocket(socket);
            }
        } catch (IOException x) {
            if (running) {
                log.error(sm.getString("endpoint.accept.fail"), x);
            }
        } catch (NullPointerException npe) {
            if (running) {
                log.error(sm.getString("endpoint.accept.fail"), npe);
            }
        } catch (Throwable t) {
            ExceptionUtils.handleThrowable(t);
            log.error(sm.getString("endpoint.accept.fail"), t);
        }
    }
    state = AcceptorState.ENDED;
}
```

调用`processSocket`方法，在`processSocket`方法中执行`getExecutor().execute(new SocketProcessor(wrapper));`

接着调用`state = handler.process(socket,status);`其中handler是AbstractProtocol

接着是`state = processor.process(wrapper);`其中processor是AbstractHttp11Processor

接着是`adapter.service(request, response); // 交给容器处理请求`adapter是CoyoteAdapter

接着是`connector.getService().getContainer().getPipeline().getFirst().invoke(request, response);`调用容器处理

![image-20220223222904771](./tomcat剖析/image-20220223222904771.png)

## nio处理请求源码实现

````markdown
# NIO是非阻塞的，那些地方呢？
接收socket，读写socket
# tomcat7中是如何使用的呢？
只有在接收socket是阻塞的；
读取数据的时候：
- 读取请求行、请求头是非阻塞的，读取请求体是阻塞的
响应的时候：
- 阻塞的
# 既然Tomcat7已经实现了NIO，那为什么不全部实现非阻塞方式
跟servlet规范有关系的，Tomcat7实现的servlet3.0版本；tomcat8之后才实现servlet3.1规范，而servelet3.0以及以前读取数据是通过inputStream.read方式读取的
```java
while((n=inputStream.read(bytes)>0)){
	sout(new String(bytes,0,n));
}
```
在NIO中，如果想要非阻塞的方式读取数据，就要将socketchannel在selector注册一个读事件，然后就需要有一个单独的线程不停的while轮询查看所有的通道上有没有就绪事件，然后在通过socketchannel.read()读取数据，伪代码大概是
```java
selector.register(socketchannel);
while(true){
	if(selector.event(socketchannel)){
		socketchannel.read();
		socketchannel=selector.nextChannel();
	}
}
```
那么，出现的问题就是，怎么使用NIO阻塞的读取数据呢？
Tomcat中是通过主副Selector来实现的，主selector用来注册socketchannel，辅助selector也是注册socketchannel，但是有一个线程Poller配合不断的while查看是否有就绪事件
1. 尝试调用socketchannel.read()看能不能读取到数据，如果能读取到，直接返回
2. 注册一个读事件
3. 加锁，导致read方法阻塞，当Poller发现有就绪事件的时候，就会解锁，加锁主要是为了阻塞
4. socketchannel.read()读取数据
所以包含有的类有：
Selector
Poller
PollerEvents
NioChannel，也就是对象socketChannel
````

> 之前我们说，Tomcat从RecvBuf获取数据的时候，是使用fill()函数来获取的，当Tomcat看自己的缓冲区中没有数据的时候，就会去获取RecvBuf中的数据到缓冲区中，这是BIO的流程，这个获取的过程是阻塞的，只有获取到数据才会返回
>
> ```java
> protected boolean fill(boolean block) throws IOException {
> 
>     int nRead = 0;
> 
>     if (parsingHeader) {
> 
>         // 如果还在解析请求头，lastValid表示当前解析数据的下标位置，如果该位置等于buf的长度了，表示请求头的数据超过buf了。
>         if (lastValid == buf.length) {
>             throw new IllegalArgumentException
>                 (sm.getString("iib.requestheadertoolarge.error"));
>         }
> 
>         // 从inputStream中读取数据，len表示要读取的数据长度，pos表示把从inputStream读到的数据放在buf的pos位置
>         // nRead表示真实读取到的数据
>         nRead = inputStream.read(buf, pos, buf.length - lastValid);
>         if (nRead > 0) {
>             lastValid = pos + nRead; // 移动lastValid
>         }
> 
>     } else {
>         // 当读取请求体的数据时
>         // buf.length - end表示还能存放多少请求体数据，如果小于4500，那么就新生成一个byte数组，这个新的数组专门用来盛放请求体
>         if (buf.length - end < 4500) {
>             // In this case, the request header was really large, so we allocate a
>             // brand new one; the old one will get GCed when subsequent requests
>             // clear all references
>             buf = new byte[buf.length];
>             end = 0;
>         }
>         pos = end;
>         lastValid = pos;
>         nRead = inputStream.read(buf, pos, buf.length - lastValid);
>         if (nRead > 0) {
>             lastValid = pos + nRead;
>         }
> 
>     }
> 
>     return (nRead > 0);
> }
> ```
>
> 那么NIO什么时候调用fill方法呢，和BIO的调用方法一样吗？
>
> > 视频教程是这么说的：应该是反过来，RecvBuf中有数据的话，就跟Tomcat说一句，让Tomcat调用fill方法（过来取数据）
> >
> > 但是NIO应该是：给任务之后，然后隔段时间来循环是否完成才是
>
> 对于Tomcat来说，不管是使用BIO还是NIO，当我们获取数据的时候，都是通过`inputStream.read()`
>
> ![image-20220223230818607](./tomcat剖析/image-20220223230818607.png)
>
> 这个`inputStream.read`方法就是阻塞读取的
>
> ```markdown
> # tomcat7中在处理请求体和响应体的时候，是阻塞的；而请求行和请求头是NIO方式去处理的
> ```

![image-20220224155519552](./tomcat剖析/image-20220224155519552.png)

`NioEndPoint`中的类`Acceptor`用来获取RecvBuf中的数据，`serverSock.accept()`就是以阻塞的方式来获取socket连接，只有等待到socket连接，才能开始处理socket的数据，接着处理socket数据，NIO就不是阻塞了

![image-20220223232309188](./tomcat剖析/image-20220223232309188.png)

调用`setSocketOptions`方法，`socket.configureBlocking(false)`设置不阻塞读取数据，所以从这里开始才是非阻塞的

```java
protected boolean setSocketOptions(SocketChannel socket) {
    // Process the connection
    try {
        //disable blocking, APR style, we are gonna be polling it
        // 从该channel上读取数据不阻塞
        socket.configureBlocking(false);
        Socket sock = socket.socket();
        socketProperties.setProperties(sock);

        // 每接收到一个socket连接就获取一个NioChannel来封装这个socket，NioChannel是可重用的对象
        NioChannel channel = nioChannels.poll(); // 拿出对头的NioChannel
        if ( channel == null ) {
            // SSL setup
            if (sslContext != null) {
                SSLEngine engine = createSSLEngine();
                int appbufsize = engine.getSession().getApplicationBufferSize();
                NioBufferHandler bufhandler = new NioBufferHandler(Math.max(appbufsize,socketProperties.getAppReadBufSize()),
                                                                   Math.max(appbufsize,socketProperties.getAppWriteBufSize()),
                                                                   socketProperties.getDirectBuffer());
                channel = new SecureNioChannel(socket, engine, bufhandler, selectorPool);
            } else {
                // normal tcp setup
                NioBufferHandler bufhandler = new NioBufferHandler(socketProperties.getAppReadBufSize(),
                                                                   socketProperties.getAppWriteBufSize(),
                                                                   socketProperties.getDirectBuffer());
                channel = new NioChannel(socket, bufhandler);
            }
        } else {
            channel.setIOChannel(socket);
            if ( channel instanceof SecureNioChannel ) {
                SSLEngine engine = createSSLEngine();
                ((SecureNioChannel)channel).reset(engine);
            } else {
                channel.reset();
            }
        }
        // 每接收到一个新socket连接，就会获取到一个Poller
        getPoller0().register(channel);
    } catch (Throwable t) {
        ExceptionUtils.handleThrowable(t);
        try {
            log.error("",t);
        } catch (Throwable tt) {
            ExceptionUtils.handleThrowable(tt);
        }
        // Tell to close the socket
        return false;
    }
    return true;
}
```

`getPoller0().register(channel);`，每接收到一个新socket连接，就会获取到一个Poller，并将通道注册到Poller，当有新的数据的时候，Selector就会通过监听事件来获知，虽然可以通过一个Selector来处理所有的socketChannel，但是通过一个Selector，可能会查询到多个就绪事件，就会导致等待的发生，所以有多个Poller

```markdown
# Poller是一个线程，events中的也是线程
```

Poller本来是应该不断的查询Selector中是否已经有就绪事件的，查询事件的前提的就是需要先去注册事件，查询到事件就回去读取数据

```java
public void run() {
    // Loop until destroy() is called
    while (true) {
        try {
            // Loop if endpoint is paused
            while (paused && (!close) ) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    // Ignore
                }
            }

            boolean hasEvents = false;

            // Time to terminate?
            if (close) {
                events();
                timeout(0, false);
                try {
                    selector.close();
                } catch (IOException ioe) {
                    log.error(sm.getString(
                            "endpoint.nio.selectorCloseFail"), ioe);
                }
                break;
            } else {
                // 执行PollerEvent事件，向Selector注册读写事件
                hasEvents = events(); // 真正的向selector注册
            }
            try {
                if ( !close ) {
                    if (wakeupCounter.getAndSet(-1) > 0) {
                        //if we are here, means we have other stuff to do
                        //do a non blocking select
                        // 上面的events()会去注册事件，而这里是去查询是否有事件就绪
                        // 不阻塞
                        keyCount = selector.selectNow();
                    } else {
                        // 阻塞，超时会继续执行下面的代码，不会报错
                        keyCount = selector.select(selectorTimeout);
                    }
                    wakeupCounter.set(0);
                }
                if (close) {
                    events();
                    timeout(0, false);
                    try {
                        selector.close();
                    } catch (IOException ioe) {
                        log.error(sm.getString(
                                "endpoint.nio.selectorCloseFail"), ioe);
                    }
                    break;
                }
            } catch ( NullPointerException x ) {
                //sun bug 5076772 on windows JDK 1.5
                if ( log.isDebugEnabled() ) log.debug("Possibly encountered sun bug 5076772 on windows JDK 1.5",x);
                if ( wakeupCounter == null || selector == null ) throw x;
                continue;
            } catch ( CancelledKeyException x ) {
                //sun bug 5076772 on windows JDK 1.5
                if ( log.isDebugEnabled() ) log.debug("Possibly encountered sun bug 5076772 on windows JDK 1.5",x);
                if ( wakeupCounter == null || selector == null ) throw x;
                continue;
            } catch (Throwable x) {
                ExceptionUtils.handleThrowable(x);
                log.error("",x);
                continue;
            }
            //either we timed out or we woke up, process events first
            if ( keyCount == 0 ) hasEvents = (hasEvents | events());

            // 如果存在就绪事件，那么则遍历并处理事件
            Iterator<SelectionKey> iterator =
                keyCount > 0 ? selector.selectedKeys().iterator() : null;
            // Walk through the collection of ready keys and dispatch
            // any active event.
            // 循环处理当前就绪的事件
            while (iterator != null && iterator.hasNext()) {
                SelectionKey sk = iterator.next();
                KeyAttachment attachment = (KeyAttachment)sk.attachment();
                // Attachment may be null if another thread has called
                // cancelledKey()
                if (attachment == null) {
                    iterator.remove();
                } else {
                    attachment.access();
                    iterator.remove();
                    // 处理事件
                    processKey(sk, attachment);
                }
            }//while

            //process timeouts
            timeout(keyCount,hasEvents);
            if ( oomParachute > 0 && oomParachuteData == null ) checkParachute();
        } catch (OutOfMemoryError oom) {
            try {
                oomParachuteData = null;
                releaseCaches();
                log.error("", oom);
            }catch ( Throwable oomt ) {
                try {
                    System.err.println(oomParachuteMsg);
                    oomt.printStackTrace();
                }catch (Throwable letsHopeWeDontGetHere){
                    ExceptionUtils.handleThrowable(letsHopeWeDontGetHere);
                }
            }
        }
    }//while

    stopLatch.countDown();
}
```

Poller的events函数在事件注册的时候，会调用该函数来处理，这里调用PollerEvent类的run函数来处理，虽然PollerEvent实现了Runnable类，但是并没有调用start来异步处理，因为NIO是同步非阻塞方式，也有可能为了方便处理，也有可能是为了以后能方便的扩展开一个线程去处理事件而实现了Runnable接口

```java
public boolean events() {
    boolean result = false;

    Runnable r = null;
    // poll会把元素从队列中删除掉
    for (int i = 0, size = events.size(); i < size && (r = events.poll()) != null; i++ ) {
        result = true;
        try {
            // 如果是PollerEvent，会将读事件注册到当前poller中的selector对象上
            r.run();
            if ( r instanceof PollerEvent ) {
                ((PollerEvent)r).reset();
                eventCache.offer((PollerEvent)r);
            }
        } catch ( Throwable x ) {
            log.error("",x);
        }
    }

    return result;
}
```

然后在监听到事件之后，就开始调用`processKey`函数来从channel中读取数据

```java
protected boolean processKey(SelectionKey sk, KeyAttachment attachment) {
    boolean result = true;
    try {
        if ( close ) {
            cancelledKey(sk, SocketStatus.STOP, attachment.comet);
        } else if ( sk.isValid() && attachment != null ) {
            attachment.access();//make sure we don't time out valid sockets
            sk.attach(attachment);//cant remember why this is here

            // 当前就绪事件对应的channel
            NioChannel channel = attachment.getChannel();
            // 读就绪或写就绪
            if (sk.isReadable() || sk.isWritable() ) {
                if ( attachment.getSendfileData() != null ) {
                    processSendfile(sk,attachment, false);
                } else {
                    if ( isWorkerAvailable() ) {
                        unreg(sk, attachment, sk.readyOps()); //
                        boolean closeSocket = false;
                        // Read goes before write
                        if (sk.isReadable()) {
                            // 从channel中读取数据
                            if (!processSocket(channel, SocketStatus.OPEN_READ, true)) {
                                closeSocket = true;
                            }
                        }
                        // 读完数据之后可能就要写数据
                        if (!closeSocket && sk.isWritable()) {
                            // 将数据写入到channel中
                            if (!processSocket(channel, SocketStatus.OPEN_WRITE, true)) {
                                closeSocket = true;
                            }
                        }
                        if (closeSocket) {
                            cancelledKey(sk,SocketStatus.DISCONNECT,false);
                        }
                    } else {
                        result = false;
                    }
                }
            }
        } else {
            //invalid key
            cancelledKey(sk, SocketStatus.ERROR,false);
        }
    } catch ( CancelledKeyException ckx ) {
        cancelledKey(sk, SocketStatus.ERROR,false);
    } catch (Throwable t) {
        ExceptionUtils.handleThrowable(t);
        log.error("",t);
    }
    return result;
}
```

接着交给`processSocket`函数来处理来

```java
public boolean processSocket(NioChannel socket, SocketStatus status, boolean dispatch) {
    // 该方法是用来从socket中读数据或写数据的，dispatch表示是不是要把这个任务派发给线程池，也就是要不要异步

    try {
        KeyAttachment attachment = (KeyAttachment)socket.getAttachment();
        if (attachment == null) {
            return false;
        }
        attachment.setCometNotify(false); //will get reset upon next reg

        // 获取一个SocketProcessor对象
        SocketProcessor sc = processorCache.poll();
        if ( sc == null ) sc = new SocketProcessor(socket,status);
        else sc.reset(socket,status);

        // 派发给线程池
        if ( dispatch && getExecutor()!=null ) getExecutor().execute(sc);
        else sc.run();
    } catch (RejectedExecutionException rx) {
        log.warn("Socket processing request was rejected for:"+socket,rx);
        return false;
    } catch (Throwable t) {
        ExceptionUtils.handleThrowable(t);
        // This means we got an OOM or similar creating a thread, or that
        // the pool and its queue are full
        log.error(sm.getString("endpoint.process.fail"), t);
        return false;
    }
    return true;
}
```

派发给线程池，将接收到的数据交个`SocketProcessor#doRun`处理，然后调用`process`方法处理

![image-20220224000030068](./tomcat剖析/image-20220224000030068.png)

接着调用`AbstractHttp11Processor#process`方法，`AbstractHttp11Processor`是BIO和NIO共用的类

```java
public SocketState process(SocketWrapper<S> socketWrapper)
    throws IOException {
    RequestInfo rp = request.getRequestProcessor();
    rp.setStage(org.apache.coyote.Constants.STAGE_PARSE);   // 设置请求状态为解析状态

    // Setting up the I/O
    setSocketWrapper(socketWrapper);
    getInputBuffer().init(socketWrapper, endpoint);     // 将socket的InputStream与InternalInputBuffer进行绑定
    getOutputBuffer().init(socketWrapper, endpoint);    // 将socket的OutputStream与InternalOutputBuffer进行绑定

    // Flags
    keepAlive = true;
    comet = false;
    openSocket = false;
    sendfileInProgress = false;
    readComplete = true;
    // NioEndpoint返回true, Bio返回false
    if (endpoint.getUsePolling()) {
        keptAlive = false;
    } else {
        keptAlive = socketWrapper.isKeptAlive();
    }

    // 如果当前活跃的线程数占线程池最大线程数的比例大于75%，那么则关闭KeepAlive，不再支持长连接
    if (disableKeepAlive()) {
        socketWrapper.setKeepAliveLeft(0);
    }

    // keepAlive默认为true,它的值会从请求中读取
    while (!getErrorState().isError() && keepAlive && !comet && !isAsync() &&
            upgradeInbound == null &&
            httpUpgradeHandler == null && !endpoint.isPaused()) {
        // keepAlive如果为true,接下来需要从socket中不停的获取http请求

        // Parsing the request header
        try {
            // 第一次从socket中读取数据，并设置socket的读取数据的超时时间
            // 对于BIO，一个socket连接建立好后，不一定马上就被Tomcat处理了，其中需要线程池的调度，所以这段等待的时间要算在socket读取数据的时间内
            // 而对于NIO而言，没有阻塞
            setRequestLineReadTimeout();

            // 解析请求行
            if (!getInputBuffer().parseRequestLine(keptAlive)) {
                // 下面这个方法在NIO时有用，比如在解析请求行时，如果没有从操作系统读到数据，则上面的方法会返回false
                // 而下面这个方法会返回true，从而退出while，表示此处read事件处理结束
                // 到下一次read事件发生了，就会从小进入到while中
                if (handleIncompleteRequestLineRead()) {
                    break;
                }
            }

            if (endpoint.isPaused()) {
                // 503 - Service unavailable
                // 如果Endpoint被暂停了，则返回503
                response.setStatus(503);
                setErrorState(ErrorState.CLOSE_CLEAN, null);
            } else {
                keptAlive = true;
                // Set this every time in case limit has been changed via JMX
                // 每次处理一个请求就重新获取一下请求头和cookies的最大限制
                request.getMimeHeaders().setLimit(endpoint.getMaxHeaderCount());
                request.getCookies().setLimit(getMaxCookieCount());
                // Currently only NIO will ever return false here
                // 解析请求头
                if (!getInputBuffer().parseHeaders()) {
                    // We've read part of the request, don't recycle it
                    // instead associate it with the socket
                    openSocket = true;
                    readComplete = false;
                    break;
                }
                if (!disableUploadTimeout) {
                    setSocketTimeout(connectionUploadTimeout);
                }
            }
        } catch (IOException e) {
            if (getLog().isDebugEnabled()) {
                getLog().debug(
                        sm.getString("http11processor.header.parse"), e);
            }
            setErrorState(ErrorState.CLOSE_NOW, e);
            break;
        } catch (Throwable t) {
            ExceptionUtils.handleThrowable(t);
            UserDataHelper.Mode logMode = userDataHelper.getNextMode();
            if (logMode != null) {
                String message = sm.getString(
                        "http11processor.header.parse");
                switch (logMode) {
                    case INFO_THEN_DEBUG:
                        message += sm.getString(
                                "http11processor.fallToDebug");
                        //$FALL-THROUGH$
                    case INFO:
                        getLog().info(message, t);
                        break;
                    case DEBUG:
                        getLog().debug(message, t);
                }
            }
            // 400 - Bad Request
            response.setStatus(400);
            setErrorState(ErrorState.CLOSE_CLEAN, t);
            getAdapter().log(request, response, 0);
        }

        if (!getErrorState().isError()) {
            // Setting up filters, and parse some request headers
            rp.setStage(org.apache.coyote.Constants.STAGE_PREPARE);  // 设置请求状态为预处理状态
            try {
                prepareRequest();   // 预处理, 主要从请求中处理处keepAlive属性，以及进行一些验证，以及根据请求分析得到ActiveInputFilter
            } catch (Throwable t) {
                ExceptionUtils.handleThrowable(t);
                if (getLog().isDebugEnabled()) {
                    getLog().debug(sm.getString(
                            "http11processor.request.prepare"), t);
                }
                // 500 - Internal Server Error
                response.setStatus(500);
                setErrorState(ErrorState.CLOSE_CLEAN, t);
                getAdapter().log(request, response, 0);
            }
        }

        if (maxKeepAliveRequests == 1) {
            // 如果最大的活跃http请求数量仅仅只能为1的话，那么设置keepAlive为false，则不会继续从socket中获取Http请求了
            keepAlive = false;
        } else if (maxKeepAliveRequests > 0 &&
                socketWrapper.decrementKeepAlive() <= 0) {
            // 如果已经达到了keepAlive的最大限制，也设置为false，则不会继续从socket中获取Http请求了
            keepAlive = false;
        }

        // Process the request in the adapter
        if (!getErrorState().isError()) {
            try {
                rp.setStage(org.apache.coyote.Constants.STAGE_SERVICE); // 设置请求的状态为服务状态，表示正在处理请求
                adapter.service(request, response); // 交给容器处理请求
                // Handle when the response was committed before a serious
                // error occurred.  Throwing a ServletException should both
                // set the status to 500 and set the errorException.
                // If we fail here, then the response is likely already
                // committed, so we can't try and set headers.
                if(keepAlive && !getErrorState().isError() && (
                        response.getErrorException() != null ||
                                (!isAsync() &&
                                statusDropsConnection(response.getStatus())))) {
                    setErrorState(ErrorState.CLOSE_CLEAN, null);
                }
                setCometTimeouts(socketWrapper);
            } catch (InterruptedIOException e) {
                setErrorState(ErrorState.CLOSE_NOW, e);
            } catch (HeadersTooLargeException e) {
                getLog().error(sm.getString("http11processor.request.process"), e);
                // The response should not have been committed but check it
                // anyway to be safe
                if (response.isCommitted()) {
                    setErrorState(ErrorState.CLOSE_NOW, e);
                } else {
                    response.reset();
                    response.setStatus(500);
                    setErrorState(ErrorState.CLOSE_CLEAN, e);
                    response.setHeader("Connection", "close"); // TODO: Remove
                }
            } catch (Throwable t) {
                ExceptionUtils.handleThrowable(t);
                getLog().error(sm.getString("http11processor.request.process"), t);
                // 500 - Internal Server Error
                response.setStatus(500);
                setErrorState(ErrorState.CLOSE_CLEAN, t);
                getAdapter().log(request, response, 0);
            }
        }

        // Finish the handling of the request
        rp.setStage(org.apache.coyote.Constants.STAGE_ENDINPUT);  // 设置请求的状态为处理请求结束

        if (!isAsync() && !comet) {
            if (getErrorState().isError()) {
                // If we know we are closing the connection, don't drain
                // input. This way uploading a 100GB file doesn't tie up the
                // thread if the servlet has rejected it.
                getInputBuffer().setSwallowInput(false);
            } else {
                // Need to check this again here in case the response was
                // committed before the error that requires the connection
                // to be closed occurred.
                checkExpectationAndResponseStatus();
            }
            // 当前http请求已经处理完了，做一些收尾工作
            endRequest();
        }

        rp.setStage(org.apache.coyote.Constants.STAGE_ENDOUTPUT); // 请求状态为输出结束

        // If there was an error, make sure the request is counted as
        // and error, and update the statistics counter
        if (getErrorState().isError()) {
            response.setStatus(500);
        }
        request.updateCounters();

        if (!isAsync() && !comet || getErrorState().isError()) {
            if (getErrorState().isIoAllowed()) {
                // 准备处理下一个请求
                getInputBuffer().nextRequest();
                getOutputBuffer().nextRequest();
            }
        }

        if (!disableUploadTimeout) {
            if(endpoint.getSoTimeout() > 0) {
                setSocketTimeout(endpoint.getSoTimeout());
            } else {
                setSocketTimeout(0);
            }
        }

        rp.setStage(org.apache.coyote.Constants.STAGE_KEEPALIVE);

        // 如果处理完当前这个Http请求之后，发现socket里没有下一个请求了,那么就退出当前循环
        // 如果是keepalive，就不会关闭socket, 如果是close就会关闭socket
        // 对于keepalive的情况，因为是一个线程处理一个socket,当退出这个while后，当前线程就会介绍，
        // 当时对于socket来说，它仍然要继续介绍连接，所以又会新开一个线程继续来处理这个socket
        if (breakKeepAliveLoop(socketWrapper)) {
            break;
        }
    }
    // 至此，循环结束

    rp.setStage(org.apache.coyote.Constants.STAGE_ENDED);

    // 主要流程就是将socket的状态设置为CLOSED
    if (getErrorState().isError() || endpoint.isPaused()) {
        return SocketState.CLOSED;
    } else if (isAsync() || comet) {
        // 异步servlet
        return SocketState.LONG;
    } else if (isUpgrade()) {
        return SocketState.UPGRADING;
    } else if (getUpgradeInbound() != null) {
        return SocketState.UPGRADING_TOMCAT;
    } else {
        if (sendfileInProgress) {
            return SocketState.SENDFILE;
        } else {
            // openSocket为true，表示不要关闭socket
            if (openSocket) {
                // readComplete表示本次读数据是否完成，比如nio中可能就没有读完数据，还需要从socket中读数据
                if (readComplete) {
                    return SocketState.OPEN;
                } else {
                    // nio可能会走到这里
                    return SocketState.LONG;
                }
            } else {
                return SocketState.CLOSED;
            }
        }
    }
}
```

## 异步Servlet源码实现



## 自定义类加载器使用和源码实现

```markdown
# JVM如果想要使用类，就需要加载class文件，然后使用类加载器加载class文件，转换成Class对象，然后才可以通过Class对象new出类对象
```

### 类加载器

Java中的类遵循按需加载

所谓类加载器，就是⽤于加载 Java 类到 Java 虚拟机中的组件，它负责读取 Java 字节码，并转换成java.lang.Class 类的⼀个实例，使字节码.class ⽂件

得以运⾏。⼀般类加载器负责根据⼀个指定的类找到对应的字节码，然后根据这些字节码定义⼀个 Java 类。另外，它还可以加载资源，包括图像⽂件

和配置⽂件

类加载器在实际使⽤中给我们带来的好处是，它可以使 Java 类动态地加载到 JVM 中并运⾏，即可在程序运⾏时再加载类，提供了很灵活的动态加载⽅式

- 启动类加载器（`Bootstrap ClassLoader`）：加载对象是 Java 核⼼库，把⼀些核⼼的 Java 类加载进JVM 中，这个加载器使⽤原⽣代码（C/C++）实现，并不是继承 `java.lang.ClassLoader`，它是所有其他类加载器的最终⽗加载器，负责加载 `<JAVA_HOME>/jre/lib` ⽬录下 JVM 指定的类库。其实它 属于 JVM 整体的⼀部分，JVM ⼀启动就将这些指定的类加载到内存中，避免以后过多的 I/O 操作，提⾼系统的运⾏效率。启动类加载器⽆法被 Java 程序直接使⽤

- 扩展类加载器（`Extension ClassLoader`）：加载的对象为 Java 的扩展库，即加载`<JAVA_HOME>/jre/lib/ext` ⽬录⾥⾯的类。这个类由启动类加载器加载，但因为启动类加载器并⾮⽤ Java 实现，已经脱离了 Java 体系，所以如果尝试调⽤扩展类加载器的`getParent()`⽅法获取⽗加载器会得到 `null`。然⽽，它的⽗类加载器是启动类加载器

```markdown
# JVM使用C++实现Bootsrap加载器
```

- 应⽤程序类加载器（`Application ClassLoader`）：亦叫系统类加载器（`System ClassLoader`），它负责加载⽤户类路径（`CLASSPATH`）指定的类库，如果程序没有⾃⼰定义类加载器，就默认使⽤应⽤程序类加载器。它也由启动类加载器加载，但它的⽗加载类被设置成了扩展类加载器。如果要使⽤这个 加载器，可通过`ClassLoader.getSystemClassLoader()`获取

![image-20220225002702709](./tomcat剖析/image-20220225002702709.png)

#### 双亲委派

双亲委派模型会在类加载器加载类时⾸先委托给⽗类加载器加载，除⾮⽗类加载器不能加载才⾃⼰加载

这种模型要求，除了顶层的启动类加载器外，其他的类加载器都要有⾃⼰的⽗类加载器。假如有⼀个类要加载进来，⼀个类加载器并不会⻢上尝试⾃⼰将其加载，⽽是委派给⽗类加载器，⽗类加载器收到后⼜尝试委派给其⽗类加载器，以此类推，直到委派给启动类加载器，这样⼀层⼀层往上委派

只有当⽗类加载器反馈⾃⼰没法完成这个加载时，⼦加载器才会尝试⾃⼰加载

通过这个机制，保证了 Java 应⽤所使⽤的都是同⼀个版本的 Java 核⼼库的类，同时这个机制也保证了安全性。设想如果应⽤程序类加载器想要加载⼀个有破坏性的 `java.lang.System` 类，双亲委派模型会⼀层层向上委派，最终委派给启动类加载器，⽽启动类加载器检查到缓存中已经有了这个类，并不会再加载这个有破坏性的 System 类

```java
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) { // 加锁，方式多线程重复加载
        // First, check if the class has already been loaded
        Class<?> c = findLoadedClass(name); // 寻找Class类，如果已经加载到JVM中了，就直接返回
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                if (parent != null) { // 如果父加载器不为空，委派父类加载
                    c = parent.loadClass(name, false);
                } else {
                    c = findBootstrapClassOrNull(name); // 如果没有父类，直接尝试让启动类加载器加载
                }
            } catch (ClassNotFoundException e) {
                // ClassNotFoundException thrown if class not found
                // from the non-null parent class loader
            }

            if (c == null) { // 到这里还是空的话，就让自己加载
                // If still not found, then invoke findClass in order
                // to find the class.
                long t1 = System.nanoTime();
                c = findClass(name);

                // this is the defining class loader; record the stats
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

##### 打破双亲委派

就是需要使用自定义类加载器，Tomcat中用到的很多都是自定义类加载器

比如，如果我们指定加载的`java.xxx`是`classpath`能找到的话，那么就会交给ApplicationClassLoader，下面的代码的ClassLoader是ApplicationClassLoader

如果是ApplicationClassLoader不能找到的话，那就只能交给MyClassLoader

```markdown
# 这里的交给ApplicationClassLoader的时候，是要在ApplicationClassLoader中再委派给他的父类去加载的，并不是到这里就结束了
```

```java
public class MyClassLoader extends ClassLoader {

    private String name;

    public MyClassLoader(ClassLoader parent, String name) {
        super(parent);
        this.name = name;
    }

    @Override
    public String toString() {
        return this.name;
    }

    public static void main(String[] args) {
        final MyClassLoader loader = new MyClassLoader(MyClassLoader.class.getClassLoader(), "MyClassLoader");
        try {
            final Class<?> clazz = loader.loadClass("com.xxx.xxx.Test");
            System.out.println(clazz.getClassLoader());
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

当我们自定义类加载器的时候，不想在去使用父加载器的了，就是打破双亲委派

1. 第一种，就是让自定义的类加载器的父类为null，也就是没有父类，但是这种方法基本上没有人这么用

```java
final MyClassLoader loader = new MyClassLoader(null, "MyClassLoader");
try {
    final Class<?> clazz = loader.loadClass("com.xxx.xxx.Test");
    System.out.println(clazz.getClassLoader());
} catch (ClassNotFoundException e) {
    e.printStackTrace();
}
```

2. 第二种，重写loadClass方法，如果重写了loadClass方法的话，就不会去调用父加载器的loadClass方法了

```java
public class MyClassLoader extends ClassLoader {

    private String name;

    public MyClassLoader(ClassLoader parent, String name) {
        super(parent);
        this.name = name;
    }

    @Override
    public String toString() {
        return this.name;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] data = new byte[0];
        try {
            data = getBytes(name);
        } catch (Exception exception) {
            exception.printStackTrace();
        }
        final Class<?> clazz = this.defineClass(name, data, 0, data.length);
        return clazz;
    }

    private byte[] getBytes(String filePath) throws Exception{
        // 这里要读入.class的字节，因此要使用字节流
        FileInputStream fis = new FileInputStream(filePath);
        FileChannel fc = fis.getChannel();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        WritableByteChannel wbc = Channels.newChannel(baos);
        ByteBuffer by = ByteBuffer.allocate(1024);

        while (true) {
            int i = fc.read(by);
            if (i == 0 || i == -1)
                break;
            by.flip();
            wbc.write(by);
            by.clear();
        }
        fis.close();
        return baos.toByteArray();
    }

    @Override
    public Class<?> loadClass(String name) throws ClassNotFoundException {
        return findClass(name);
    }

    public static void main(String[] args) {
        final MyClassLoader loader = new MyClassLoader(MyClassLoader.class.getClassLoader(), "MyClassLoader");
        try {
            final Class<?> clazz = loader.loadClass("com.xxx.xxx.Test");
            System.out.println(clazz.getClassLoader());
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

```markdown
# 这里应该还有一个地方的代码，就是需要将.转换成/，然后才能在磁盘上找到字节码文件
```

当我们直接运行的时候，会出现报错

![image-20220225012724660](./tomcat剖析/image-20220225012724660.png)

通过调试我们可以知道，当我们加载`com.xxx.xxx.Test`类的时候，会先加载它的父类`java.lang.Object`这个类，报错的位置

![image-20220225013622946](./tomcat剖析/image-20220225013622946.png)

表示，类加载器如果加载类中包含有`java.`，就会报出不安全的异常

```markdown
# 如果是在java开头的这个包下的类，都会抛异常
```

那么这些特殊的类，应该是由启动类夹杂器或者扩展类加载器或者应用加载器来加载的

```markdown
# 为什么这些类要防止自定义类加载呢？
为了安全问题，防止通过和java和核心类一样的类被注入到JVM中
```

另外，类加载器还拥有全盘负责机制，即当⼀个类加载器加载⼀个类时，这个类所依赖的、引⽤的其他所有类都由这个类加载器加载，除⾮在程序中显式地指定另外⼀个类加载器加载

那么怎么去解决呢？

先通过当前系统的类加载器（也就是Application ClassLoader）来加载，如果加载成功，就直接返回，如果加载失败，在用自定义类加载器加载

```java
public Class<?> loadClass(String name) throws ClassNotFoundException {
    final ClassLoader system = getSystemClassLoader();
    Class<?> clazz = null;

    try {
        clazz = system.loadClass(name);
    } catch (Exception e) {

    }

    if (clazz != null)
        return clazz;
    clazz = findClass(name);
    return clazz;
}
```

但是这样去写，就没有太大的意义，因为我们最大的目的就是不使用Application ClassLoader去加载我们的类，那么问题就变成了：又要不使用Application ClassLoader，又要能加载java依赖的一些类

其实很简单，只需要在获取的时候，设置为扩展类启动器就好了，这样就跳过了应用类启动器了

```java
public Class<?> loadClass(String name) throws ClassNotFoundException {
    final ClassLoader system = getSystemClassLoader().getParent(); // 这里
    Class<?> clazz = null;

    try {
        clazz = system.loadClass(name);
    } catch (Exception e) {

    }

    if (clazz != null)
        return clazz;

    clazz = findClass(name);

    return clazz;
}
```

如果我们创建出两个自定义ClassLoader，那么loadClass相同的字节码文件，是否相等呢？

![image-20220225021058768](./tomcat剖析/image-20220225021058768.png)

不相同，因为：

在 Java 中，我们⽤完全匹配类名来标识⼀个类，即⽤**包名和类名**。⽽在 JVM 中，⼀个类由**完全匹配类名**和**⼀个类加载器的实例 ID** 作为唯⼀标识。也就是说，**同⼀个虚拟机可以有两个包名、类名都相同的类，只要它们由两个不同的类加载器加载**。当我们在 Java 中说两个类是否相等时，必须在针对同⼀个类加载器加载的前提下才有意义，否则，就算是同样的字节码，由不同的类加载器加载，这两个类也不是相等的。这种特征为我们提供了隔离机制，在 Tomcat 服务器中它是⼗分有⽤的

#### URLClassLoader

我们在使⽤⾃定义类加载去加载类时，我们需要指明该去哪些资源中进⾏加载，所以JDK提供了URLClassLoader来⽅便我们使⽤，我们在创建URLClassLoader时需要传⼊⼀些URLs，然后在使⽤这个URLClassLoader加载类时就会从这些资源中去加载

#### Tomcat中类加载器架构

![image-20220225160129037](./tomcat剖析/image-20220225160129037.png)

解释：

- 上面三个是JVM提供的
- CommonClassLoader是用来加载Tomcat需要的类
- SharedClassLoader是用来加载在应用之间可以共享的类，有时候需要去父类中去加载
- WebAppClassLoader是用来加载应用的

#### Tomcat中自定义的类加载器

```markdown
# 每一个应用自定义类加载器，隔离应用
Tomcat也有自己需要加载的类，所以也需要自己类加载器，CommonClassLoader名字叫做CatalinaClassLoader
```

Tomcat 拥有不同的⾃定义类加载器，以实现对各种资源库的控制。⼀般来说，Tomcat 主要⽤类加载器解决以下 4 个问题

- 同⼀个Tomcat中，各个Web应⽤之间各⾃使⽤的Java类库要互相隔离

- 同⼀个Tomcat中，各个Web应⽤之间可以提供共享的Java类库

- 为了使Tomcat不受Web应⽤的影响，应该使服务器的类库与应⽤程序的类库互相独⽴

- Tomcat⽀持热部署

在 Tomcat中，最重要的⼀个类加载器是 Common 类加载器，它的⽗类加载器是应⽤程序类加载器，负责加载 `$CATALINA_ BASE/lib`、`$CATALINA_HOME/lib` 两个⽬录下所有的.class ⽂件与.jar ⽂件

Tomcat中⼀般会有多个WebApp类加载器-`WebAppClassLoader` ，每个类加载器负责加载⼀个 Web 程序。它的⽗类加载器是Common类加载器

由于每个 Web 应⽤都有⾃⼰的 WebApp 类加载器，很好地使多个 Web 应⽤程序之间互相隔离且能通过创建新的 WebApp类加载器达到热部署。这种类加载器结构能有效使 Tomcat 不受 Web 应⽤程序影响，⽽ Common 类加载器的存在使多个 Web 应⽤程序能够互相共享类库

![image-20220225154032873](./tomcat剖析/image-20220225154032873.png)

我们先来看`WebapplicationClassLoader#loadClass`

```java
public Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {

    synchronized (getClassLoadingLockInternal(name)) {
        if (log.isDebugEnabled())
            log.debug("loadClass(" + name + ", " + resolve + ")");
        Class<?> clazz = null;

        // Log access to stopped classloader
        if (!started) {
            try {
                throw new IllegalStateException();
            } catch (IllegalStateException e) {
                log.info(sm.getString("webappClassLoader.stopped", name), e);
            }
        }

        // (0) Check our previously loaded local class cache
        // 先检查该类是否已经被Webapp类加载器加载。
        clazz = findLoadedClass0(name); // map
        if (clazz != null) {
            if (log.isDebugEnabled())
                log.debug("  Returning class from cache");
            if (resolve)
                resolveClass(clazz);
            return (clazz);
        }

        // (0.1) Check our previously loaded class cache
        // 该方法直接调用findLoadedClass0本地方法，findLoadedClass0方法会检查JVM缓存中是否加载过此类
        clazz = findLoadedClass(name);   // jvm 内存
        if (clazz != null) {
            if (log.isDebugEnabled())
                log.debug("  Returning class from cache");
            if (resolve)
                resolveClass(clazz);
            return (clazz);
        }

        // (0.2) Try loading the class with the system class loader, to prevent
        //       the webapp from overriding J2SE classes
        // 尝试通过系统类加载器（AppClassLoader）加载类，防止webapp重写JDK中的类
        // 假设，webapp想自己去加载一个java.lang.String的类，这是不允许的，必须在这里进行预防。
        try {
            clazz = j2seClassLoader.loadClass(name);    // java.lang.Object
            if (clazz != null) {
                if (resolve)
                    resolveClass(clazz);
                return (clazz);
            }
        } catch (ClassNotFoundException e) {
            // Ignore
        }

        // (0.5) Permission to access this class when using a SecurityManager
        if (securityManager != null) {
            int i = name.lastIndexOf('.');
            if (i >= 0) {
                try {
                    securityManager.checkPackageAccess(name.substring(0,i));
                } catch (SecurityException se) {
                    String error = "Security Violation, attempt to use " +
                        "Restricted Class: " + name;
                    if (name.endsWith("BeanInfo")) {
                        // BZ 57906: suppress logging for calls from
                        // java.beans.Introspector.findExplicitBeanInfo()
                        log.debug(error, se);
                    } else {
                        log.info(error, se);
                    }
                    throw new ClassNotFoundException(error, se);
                }
            }
        }

        boolean delegateLoad = delegate || filter(name); // 委托--true

        // (1) Delegate to our parent if requested
        // 是否委派给父类去加载
        if (delegateLoad) {
            if (log.isDebugEnabled())
                log.debug("  Delegating to parent classloader1 " + parent);
            try {
                clazz = Class.forName(name, false, parent);
                if (clazz != null) {
                    if (log.isDebugEnabled())
                        log.debug("  Loading class from parent");
                    if (resolve)
                        resolveClass(clazz);
                    return (clazz);
                }
            } catch (ClassNotFoundException e) {
                // Ignore
            }
        }

        // (2) Search local repositories
        // 从webapp应用内部进行加载
        if (log.isDebugEnabled())
            log.debug("  Searching local repositories");
        try {
            clazz = findClass(name);  // classes,lib
            if (clazz != null) {
                if (log.isDebugEnabled())
                    log.debug("  Loading class from local repository");
                if (resolve)
                    resolveClass(clazz);
                return (clazz);
            }
        } catch (ClassNotFoundException e) {
            // Ignore
        }

        // (3) Delegate to parent unconditionally
        // 如果webapp应用内部没有加载到类，那么无条件委托给父类进行加载
        if (!delegateLoad) {
            if (log.isDebugEnabled())
                log.debug("  Delegating to parent classloader at end: " + parent);
            try {
                clazz = Class.forName(name, false, parent);
                if (clazz != null) {
                    if (log.isDebugEnabled())
                        log.debug("  Loading class from parent");
                    if (resolve)
                        resolveClass(clazz);
                    return (clazz);
                }
            } catch (ClassNotFoundException e) {
                // Ignore
            }
        }
    }

    throw new ClassNotFoundException(name);
}
```

1. `findLoadedClass0` 先检查该类是否已经被Webapp类加载器加载

先将`.`转换成`/`变成目录，然后在Tomcat自己设计的一个存储Class文件相关的信息的Map中寻找

```markdown
# 这是Tomcat自己设计的，和JVM没有关系
```

```java
protected Class<?> findLoadedClass0(String name) {   //com.luban.Test
    String path = binaryNameToPath(name, true);   // com/luban/Test
    ResourceEntry entry = resourceEntries.get(path);
    if (entry != null) {
        return entry.loadedClass;
    }
    return (null);  // FIXME - findLoadedResource()
}
```

2. `findLoadedClass` 该方法直接调用findLoadedClass0本地方法，findLoadedClass0方法会检查JVM缓存中是否加载过此类

![image-20220225155628976](./tomcat剖析/image-20220225155628976.png)

3. `clazz = j2seClassLoader.loadClass(name)` 尝试通过系统类加载器（AppClassLoader）加载类，防止webapp重写JDK中的类，假设，webapp想自己去加载一个java.lang.String的类，这是不允许的，必须在这里进行预防

4. `securityManager.checkPackageAccess(name.substring(0,i))` 和安全管理器有关，需要访问的类Tomcat能不能访问
5. 是否委派给父类去加载

```java
if (delegateLoad) {
    if (log.isDebugEnabled())
        log.debug("  Delegating to parent classloader1 " + parent);
    try {
        clazz = Class.forName(name, false, parent);
        if (clazz != null) {
            if (log.isDebugEnabled())
                log.debug("  Loading class from parent");
            if (resolve)
                resolveClass(clazz);
            return (clazz);
        }
    } catch (ClassNotFoundException e) {
        // Ignore
    }
}
```

6. 从webapp应用内部进行加载

`findClass`函数中加载Class

一个应用固定从WEB-INF下的classes目录和lib目录去加载，如果说需要从其他的目录中加载，也是可以的

![image-20220225161523064](./tomcat剖析/image-20220225161523064.png)

核心是下面的`clazz = findClassInternal(name)`用来加载Class

- 也是先从Tomcat存储类的Map中去寻找，如果找到直接返回
- 找不到在通过自己去加载WEB-INF下的lib和classes目录中去加载

![image-20220225162520292](./tomcat剖析/image-20220225162520292.png)

- 每加载一个文件，就保存最近一次修改时间

6. 如果webapp应用内部没有加载到类，那么无条件委托给父类进行加载
7. 如果到最后都没有加载出来，则抛出异常

##### 热加载

在server.xml的context节点中设置`reloadable="true"`就可以实现热加载，应用中的class文件或者jar包文件发生变化，就会把新的class文件加入到应用中

```xml
<Context path="/ServletDemoHello##2" reloadable="true" docBase="D:\IdeaProjects\ServletDemo\target\classes" />
```

那么它的实现在哪里呢？

在`WebappLoader#backgroundProcess`中实现

```java
public void backgroundProcess() {
    if (reloadable && modified()) {
        System.out.println(container.getInfo()+"触发了热加载");
        try {
            Thread.currentThread().setContextClassLoader
                (WebappLoader.class.getClassLoader());
            if (container instanceof StandardContext) {
                ((StandardContext) container).reload();
            }
        } finally {
            if (container.getLoader() != null) {
                Thread.currentThread().setContextClassLoader
                    (container.getLoader().getClassLoader());
            }
        }
    } else {
        closeJARs(false);
    }
}
```

需要有一个线程去监听文件是否发生变化，这里就用到了刚才我们记录了class文件最后发生变化的时间的集合

![image-20220225164656756](./tomcat剖析/image-20220225164656756.png)

调用到`classLoader.modified()`检查文件是否有发生变化

```java
public boolean modified() {

    if (log.isDebugEnabled())
        log.debug("modified()");

    // Checking for modified loaded resources
    // 当前已经被加载了的class的路径
    int length = paths.length;

    // A rare race condition can occur in the updates of the two arrays
    // It's totally ok if the latest class added is not checked (it will
    // be checked the next time
    // 当前已经被加载了的类对应的文件或jar的最近修改时间
    int length2 = lastModifiedDates.length;
    if (length > length2)
        length = length2;

    // 遍历已经被加载了的
    for (int i = 0; i < length; i++) {
        try {
            // 当前这个文件的最近修改时间
            long lastModified =
                        ((ResourceAttributes) resources.getAttributes(paths[i]))
                                .getLastModified();
                // 如果和之前的不相等
                if (lastModified != lastModifiedDates[i]) {
                    if( log.isDebugEnabled() )
                        log.debug("  Resource '" + paths[i]
                                + "' was modified; Date is now: "
                                + new java.util.Date(lastModified) + " Was: "
                                + new java.util.Date(lastModifiedDates[i]));
                    return (true);
            }
        } catch (NamingException e) {
            // 如果没有找到这个文件，则文件被删掉了
            log.error("    Resource '" + paths[i] + "' is missing");
            return (true);
        }
    }

    // 当前应用的jar的个数
    length = jarNames.length;

    // Check if JARs have been added or removed
    // 检查是否有jar包添加或删除
    if (getJarPath() != null) {

        try {
            // 当前存在的jar包
            NamingEnumeration<Binding> enumeration =
                resources.listBindings(getJarPath());
            int i = 0;
            while (enumeration.hasMoreElements() && (i < length)) {
                NameClassPair ncPair = enumeration.nextElement();
                String name = ncPair.getName();
                // Ignore non JARs present in the lib folder
                if (!name.endsWith(".jar"))
                    continue;
                if (!name.equals(jarNames[i])) {
                    // Missing JAR
                    log.info("    Additional JARs have been added : '"
                             + name + "'");
                    return (true);
                }
                i++;
            }
            if (enumeration.hasMoreElements()) {
                while (enumeration.hasMoreElements()) {
                    NameClassPair ncPair = enumeration.nextElement();
                    String name = ncPair.getName();
                    // Additional non-JAR files are allowed
                    // 新增了jar包
                    if (name.endsWith(".jar")) {
                        // There was more JARs
                        log.info("    Additional JARs have been added");
                        return (true);
                    }
                }
            } else if (i < jarNames.length) {
                // There was less JARs
                log.info("    Additional JARs have been added");
                return (true);
            }
        } catch (NamingException e) {
            if (log.isDebugEnabled())
                log.debug("    Failed tracking modifications of '"
                    + getJarPath() + "'");
        } catch (ClassCastException e) {
            log.error("    Failed tracking modifications of '"
                      + getJarPath() + "' : " + e.getMessage());
        }

    }

    // No classes have been modified
    return (false);
}
```

热部署过程：

先将`webappclassloader`设置成null，然后重新`new webappclassloader`，重新加载class类

比如说，应用中有一个类Test，被老的webappclassloader加载了，当我们把Test.class文件修改之后，如果我们还是使用老的webappclassloader加载的话，就会出现问题，加载不到，所以需要新的webappclassloader来加载

```markdown
# 热部署开发的时候使用就好了，因为老的webappclassloader对象很难被回收的，在里面的class对象很难被回收的
热部署相当于之前的应用已经被改了，所以相当于新开的应用
```

假如说我们要修改Context配置的话，那么也会重新热部署，但是在server.xml中修改Context是没有用的

需要在`Conf/Catalina/localhost`目录下对应的文件中修改，才会有效，因为热部署监控的目录是`Conf/Catalina/localhost`

![image-20220225171930856](./tomcat剖析/image-20220225171930856.png)

### 安全机制

Tomcat中设置了了⼀些安全策略，默认的策略⽂件为conf/catalina.policy

![image-20220225163929644](./tomcat剖析/image-20220225163929644.png)

Tomcat中设置了安全策略，规定了Tomcat在运⾏过程中拥有的权限，Tomcat管理者可以修改该权限，但是Tomcat中有⼀些类是必须能够被访问到的，所有Tomcat中在启动过程中会提前去加载这些类，如果发现没有对应的权限，那么将会启动失败

## 处理与启动过程源码实现

启动代码我们都是使用脚本的方式去启动的，比如如果我们运行startup.bat就会调用catalina.sh脚本，所以关键主要是catalina.sh

![image-20220226153947177](./tomcat剖析/image-20220226153947177.png)

因为Tomcat是使用java写的，所以catalina.sh最后就需要能翻译成`java MainClass args`的方式来启动main方法

![image-20220226154512613](./tomcat剖析/image-20220226154512613.png)

调用`org.apache.catalina.startup.Bootstrap`里面的main方法的时候会传进去一个start的字符串

```java
public static void main(String args[]) {

    if (daemon == null) {
        // Don't set daemon until init() has completed
        Bootstrap bootstrap = new Bootstrap();
        try {
            bootstrap.init(); // catalinaaemon
        } catch (Throwable t) {
            handleThrowable(t);
            t.printStackTrace();
            return;
        }
        daemon = bootstrap;
    } else {
        // When running as a service the call to stop will be on a new
        // thread so make sure the correct class loader is used to prevent
        // a range of class not found exceptions.
        Thread.currentThread().setContextClassLoader(daemon.catalinaLoader);
    }

    try {
        String command = "start";
        if (args.length > 0) {
            command = args[args.length - 1];
        }

        if (command.equals("startd")) {
            args[args.length - 1] = "start";
            daemon.load(args);
            daemon.start();
        } else if (command.equals("stopd")) {
            args[args.length - 1] = "stop";
            daemon.stop();
        } else if (command.equals("start")) {
            daemon.setAwait(true);  // 设置阻塞标志
            daemon.load(args);      // 解析server.xml,初始化Catalina
            daemon.start();
            if (null == daemon.getServer()) {
                System.exit(1);
            }
        } else if (command.equals("stop")) {
            daemon.stopServer(args);
        } else if (command.equals("configtest")) {
            daemon.load(args);
            if (null == daemon.getServer()) {
                System.exit(1);
            }
            System.exit(0);
        } else {
            log.warn("Bootstrap: command \"" + command + "\" does not exist.");
        }
    } catch (Throwable t) {
        // Unwrap the Exception for clearer error reporting
        if (t instanceof InvocationTargetException &&
                t.getCause() != null) {
            t = t.getCause();
        }
        handleThrowable(t);
        t.printStackTrace();
        System.exit(1);
    }
}
```

`bootstrap.init()`初始化Bootstrap

```java
/**
 * Initialize daemon.
 * 主要初始化类加载器，在Tomcat的设计中，使用了很多自定义的类加载器，包括Tomcat自己本身的类会由CommonClassLoader来加载，每个wabapp由特定的类加载器来加载
 */
public void init()
    throws Exception
{

    // Set Catalina path
    // catalina.home表示安装目录
    // catalina.base表示工作目录
    setCatalinaHome();
    setCatalinaBase();

    // 初始化commonLoader、catalinaLoader、sharedLoader
    // 其中catalinaLoader、sharedLoader默认其实就是commonLoader
    initClassLoaders();

    // 设置线程的所使用的类加载器，默认情况下就是commonLoader
    Thread.currentThread().setContextClassLoader(catalinaLoader);

    // 如果开启了SecurityManager，那么则要提前加载一些类
    SecurityClassLoad.securityClassLoad(catalinaLoader);

    // Load our startup class and call its process() method
    // 加载Catalina类，并生成instance
    if (log.isDebugEnabled())
        log.debug("Loading startup class");
    Class<?> startupClass =
        catalinaLoader.loadClass
        ("org.apache.catalina.startup.Catalina");
    Object startupInstance = startupClass.newInstance();

    // Set the shared extensions class loader
    // 设置Catalina实例的父级类加载器为sharedLoader(默认情况下就是commonLoader)
    if (log.isDebugEnabled())
        log.debug("Setting startup class properties");
    String methodName = "setParentClassLoader";
    Class<?> paramTypes[] = new Class[1];
    paramTypes[0] = Class.forName("java.lang.ClassLoader");
    Object paramValues[] = new Object[1];
    paramValues[0] = sharedLoader;
    Method method =
        startupInstance.getClass().getMethod(methodName, paramTypes);
    method.invoke(startupInstance, paramValues);

    catalinaDaemon = startupInstance;
}
```



### 解析server.xml

1. Catalina catalina = new Catalina(); // 没做其他事情
2. catalina.setAwait(true); 
3. 以下步骤是解析servler.xml 
4. StandardServer server = new StandardServer(); // 没做其他事情 
5. catalina.setServer(server); 
6. server.addLifecycleListener(...); 
7. StandardService service = new StandardService(); // 没做其他事情 
8. server.addService(service); 
9. Connector connector = new Connector(); // 会根据配置初始化protocolHandler 
   1. endpoint = new JIoEndpoint(); // 初始化Endpoint， JioEndpoint中会setMaxConnections(0); 
   2. cHandler = new Http11ConnectionHandler(this); // 
   
   3. ((JIoEndpoint) endpoint).setHandler(cHandler); // endpoint对应的连接处理器 
   
10. service.addConnector(connector); 
11. Engine engine = new StandardEngine(); // pipeline.setBasic(new StandardEngineValve()); 
12. service.setContainer(engine); 
13. Host host = new StandardHost(); // pipeline.setBasic(new StandardHostValve()); 
14. engine.addChild(host); 
15. Context context = new StandardContext(); // pipeline.setBasic(new StandardContextValve()); 
	
16. host.addChild(context); 

17. engine.setParentClassLoader(Catalina.class.getClassLoader()); // 实际调⽤的是 ContainerBase.setParentClassLoader⽅法，设置属性parentClassLoader为shareClassLoader 

18. server.setCatalina(catalina); 

19. server.init(); // 开始初始化 

20. catalina.start(); // 开始启动 

#### 总结

解析server.xml最主要的作⽤就是

1. 把server.xml中定义的节点都⽣成对应的java对象，⽐如在解析某⼀个Host节点时就会对应⽣成⼀个StandardHost对象

2. 把server.xml中定义的节点的层级关系解析出来，⽐如StandardContext对象.addChild(StandardHost对象)

3. 设置每个容器的pipeline的基础Valve

### 初始化

Tomcat初始化主要做了以下事情： 

1. 将StandardServer实例注册到JMX 

2. 将StringCache实例注册到JMX 

3. 将StandardService实例注册到JMX 

4. container.init(); // 对StandardEngine进⾏初始化 
   1. 初始化startStopExecutor线程池，⽤来启动⼦容器的 

5. connector.init(); // 对Connector进⾏初始化 

   1. adapter = new CoyoteAdapter(this); 

   2. protocolHandler.setAdapter(adapter); 

   3. protocolHandler.init(); // 初始化协议处理器 

      1. endpoint.init(); // 初始化协议处理器对应的endpoint，默认在初始化的时候就会bind 

         1. endpoint.bind() 

            1. serverSocketFactory = new DefaultServerSocketFactory(this); 

            2. serverSocket = serverSocketFactory.createSocket(getPort(), getBacklog(), getAddress()); 

   4. mapperListener.init(); // 没做什么其他的

#### 总结

初始化做得事情⽐较少，最重要的可能就是endpoint的bind的了

### 启动

#### 总结

启动做的事情就⽐较多了，主要分为以下⼏⼤步骤 

##### 启动容器

启动容器主要是部署应⽤，部署应⽤分为两部分：

1. 部署server.xml中定义的Context 

2. 部署webapp⽂件夹下的Context

部署⼀个应⽤主要分为以下步骤 

1. ⽣成Context对象，server.xml中定义的Context在解析server.xml时就已经⽣成了，webapp⽂件夹下的是在部署之前⽣成的

2. 为每个应⽤⽣成⼀个WebappClassLoader

3. 解析web.xml

4. 设置Context对象中的属性，⽐如有哪些Wrapper

##### 启动Connector

主要是：

1. 启动Endpoint开始接收请求

2. 构造Mapper对象，⽤来处理请求时，快速解析出当前请求对应哪个Context，哪个Wrapper
