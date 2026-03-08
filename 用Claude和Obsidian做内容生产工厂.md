很多人做内容的问题，不是不会写。

是每次都从零开始。

今天找选题，明天换风格，后天灵感又丢了。写完发出去，数据不错也没有沉淀，下一篇继续重来。

我最近把这件事彻底重构了一遍：

用 **Obsidian** 做内容数据库， 用 **OpenClaw** 做执行引擎， 把“灵感到发布”变成一条可复用流水线。

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=YWE5MDk2NmE1YTMxNzQ0MDQwZGQ3NjQyOTVjMDA4YmJfZ0V5blA2cEhjbXdOUUNkeTg2SFdrcFVOWVB0V2dCSm1fVG9rZW46TkZwd2JtbnRCb3psZ2h4alhFR2NJanpFblBkXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

这篇就不讲概念，直接讲怎么搭。

你照着做，今天就能跑起来。

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=OWQ2MDNhZTNmOGZiOTVlYTBhZGVhMjExMmJlNzA5M2VfcHVMUXJsNkpJbzBsbnVuWlpJQjdsNFd0TGQxZnJRRnNfVG9rZW46R1ZScGIzVWlxb1pwdVh4dXZ0bGNMVWZ1bjlnXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

## 一、先想清楚分工：谁存，谁跑

先说结论：

- **Obsidian** 负责“长期记忆”：素材、选题、草稿、复盘。
    
- **OpenClaw** 负责“执行动作”：抓取、整理、生成、改写、归档。
    

一句话： **Obsidian 是库，OpenClaw 是手脚。**

## 二、准备环境（10分钟）

### 1）安装 Obsidian

官网下载安装即可。

创建一个 文件库。

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=YWYzNTA0YjY1MTdmYmQ3YTRlMDNmM2M0MWUzYjNmMGJfbDBrYVhhWG5MaUx4TUtVNXBPMHV2N3R3N0pZV0g5WVBfVG9rZW46UHI1dWJsZ21hb0prMmh4UzUwb2NsR0VvbmloXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

### 2）安装 obsidian-cli

用openclaw安装即可。

```Bash
npm install -g obsidian-cli
```

安装后验证：

```Bash
obsidian-cli --version
```

### 3）确认你的 Vault 路径

你的这套当前路径是，把这个路径告诉openclaw即可。

```Bash
/Users/believer/Library/Mobile Documents/iCloud~md~obsidian/Documents/obs+openclaw/obs+opc
```

## 三、目录结构：先搭骨架，再填内容

内容工厂不需要复杂嵌套，但必须有清晰流转。这是我的目录，大家可以按照自己的需求优化。

```Plain
01-灵感与素材库/
  1-日常灵感剪报/
  2-爆款素材片段/
02-选题池/
  待写选题库/
  已立项/
03-内容工厂/
  1-大纲挑选区/
  2-初稿打磨区/
  3-终稿确认区/
04-视频工厂/
  小红书视频/
  抖音视频/
  哔哩哔哩视频/
05-图文工厂/
  公众号文章/
  X推文线程/
06-已发布归档/
  小红书/
  抖音/
  哔哩哔哩/
  公众号/
  X/
90-系统配置/
  模板/
  规则/
  看板/
```

## 四、规则先立住：不然越跑越乱

你至少要固定三条规则。

### 规则1：所有新文档必须有 YAML 头

最少这几个字段：

```YAML
---
title: 
stage: 
platform: 
content_type: 
source_links: []
status: 
---
```

没有这层元数据，后面检索和流转会越来越混乱。

### 规则2：每篇至少 3 条回链

在文末加：

```Markdown
## 关联笔记
- [[上游灵感或选题]]
- [[同主题稿件]]
- [[规则或模板]]
```

这是你图谱能“连起来”的关键。

### 规则3：按阶段推进，不跳步

灵感 -> 选题 -> 大纲 -> 初稿 -> 终稿 -> 发布归档 -> 复盘。

不要直接从“灵感”跳到“发布”。或者让openclaw自动流转。

## 五、日常怎么用（最实操）

### 场景A：你刷到一条灵感

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=MzZiNTYyNDQ0YjJkOWE5MDIyZDU2Mzk0MmFiMzlkYTBfYTk4Y0pYVm9RNmVKc0RqWXM3dkJVNE42Zk5TTFhacnpfVG9rZW46UTVDTGJWZ0FMb1RsMml4Qkx2S2N5bXBkbjJkXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

你只要发一句：

> 把这条存进内容工厂，并给我3个可写选题。

系统动作：

1. 在 `01-灵感与素材库/1-日常灵感剪报` 建灵感卡。
    
2. 自动生成 1-3 个选题到 `02-选题池/待写选题库`。
    
3. 自动补回链到相关笔记。
    

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=Njg5YWIwZTUxNmUyZWIxODdhZThkZTUzNDc4YjRhMTZfT2lLQUxxSE1oQWVhSm0zQXhUMnVpT05NNWtneWY0ZzJfVG9rZW46WGhjNmJ4ZjFSb0FwVEx4c3ViWGNsZjVybjZnXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

而且接上飞书，平时看到好的选题后，只需要在飞书中说一句就可以沉淀到你的内容工厂了。

### 场景B：你准备开写

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=NzkxZmFjNmYyNTE0ZDlmNzE1OGVmOTYxODcyZDIwYTJfeFhvS2Q1VjNFNFZIc09MVjBhTVJmb1VEaDBXV3BVbWVfVG9rZW46TGthNmJIWXB6b3pXMGd4RjI1emMzTE9PbkhaXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

你说：

> 从待写选题里挑1个可以爆的，先给我大纲。

系统动作：

1. 读取待写选题。
    
2. 给出可执行方向。
    
3. 把大纲写入 `03-内容工厂/1-大纲挑选区`。
    

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=OGUzYjRlMzJlNmNjM2I5ZjZhZTlhYjdhYmQ5ZGU4ZjVfVVdUUXN0dzg0MVNsazdUd043MzNCWmlLR0x1ekFxMUNfVG9rZW46V24wN2JtMzlwb0VEakh4VWlMcmMwRXVibkNiXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

### 场景C：你确定要发某平台

你说：

> 用这个大纲，生成公众号长文 + X推文。

系统动作：

- 公众号稿落到 `05-图文工厂/公众号文章`
    
- X推文落到 `05-图文工厂/X推文线程`
    
- 视频脚本落到视频那块
    
- 自动加 `关联笔记`
    

写得很不错

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=NGQwMzVkYWM5ZDljOTQ3YjQzMzdhMjg1MzM1MDgwMWRfNHNBemtxbzRQMDl6cU8wSkFFRXd3VWc4S0N6YXNMZDdfVG9rZW46UndjZWJwd2lab1RBSmh4TlNGa2NzbWd5bk5lXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

也可以直接生成封面图，配图，小红书图片等，你找一个中转API，让它帮你做成一个skill。直接用就行了。

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=MGNjNjk0NDkwM2ZkZDYzYzkwNDU4ZjU2YmVmZjFmNDdfQ3M3OVpBUjN2ZnI1Nm1BWFI3TDJYbUZIRFpHNnpUbTVfVG9rZW46UlBsSGJmTEhob2NlY1Z4U0ZFNWNUeHJwbmNkXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)

## 六、给你一些可直接复制的“触发语”

```Plain
1) 链接🔗+把这条灵感入库，并生成3个选题。
2) 从待写选题里挑今天最值得写的3个。
3) 先给我3个不同角度的大纲。
4) 按这个大纲生成公众号初稿，语气更有人味。
5) 把这篇改成X推文，8-12条。
6) 标记这篇已发布，这是数据，并生成复盘卡片。
```

## 七、常见坑（我已经帮你踩过）

### 坑1：只生成，不归档

短期很爽，长期一定混乱。

你必须把已发布内容归到 `06-已发布归档`，并留复盘。

### 坑2：回链太少，图谱断裂

图谱不是自动智能长出来的。

是靠你每篇都坚持加 3 条以上回链。

### 坑3：文风越来越“AI腔”

解决方法是固定一个“人味写作规则”：

- 少大词
    
- 多场景
    
- 短句
    
- 有情绪
    
- 有你的判断
    

## 八、这套系统为什么有复利

因为你每次写完，不只是发了一篇。

你在给下一篇攒素材。

你每一次复盘，不只是看数据。

你在训练自己的内容系统。

一两周看不出差距。

连续跑 30 天，你会非常明显地感受到：

- 选题更快
    
- 开写更稳
    
- 改稿更少
    
- 产能更高
    

## 最后

内容工厂的价值，在于你终于不再靠状态创作。

你有了一台会积累、会复用、会进化的系统。

这件事，才是长期价值。

欢迎大家进群一起聊AI，如果是西安的小伙伴，可以直接进西安专属群，我们近期会举办openclaw的专属活动。

![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=YzIxZTI5ODNmNzYyZmNkMzBmMDZlMmNmMWE2MjQzMGJfVm8zQndWYW82R0Q3Qk1BMWxKWHFoRUl2MWdueEFvQUVfVG9rZW46VlFydGJTSkVkb3RXNzh4VFpYRGNweHBabkxoXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)![](https://my.feishu.cn/space/api/box/stream/download/asynccode/?code=YjllYmY2ZWE0MGQ1YjUyNjBlNDc1MDFlNjNlN2E2NzhfQnpOckExVUdjSERtcHdoZGZuQ1NIMTdhbTBnN25PdmZfVG9rZW46T0l1WWJzYklQb1JzMjh4Mk1uZWMxbU9SbmFkXzE3NzI4NzkyNjI6MTc3Mjg4Mjg2Ml9WNA)