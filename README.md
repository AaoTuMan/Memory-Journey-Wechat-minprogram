# Memory-Journey-Wechat-minprogram
该旅游微信小程序核心功能涵盖用户管理（微信授权登录/信息管理）、旅游故事（发布/浏览/评论/管理）、旅游产品（自由行浏览、跟团游预订支付）及个性化服务（收藏/订单管理），支持本地与云端数据自动同步及离线使用。技术上采用小程序原生框架与微信云开发架构，含8个云函数处理登录、故事、收藏及订单管理。模块化设计使页面与云函数按业务划分，结合全局状态、本地存储与云端持久化实现数据管理。技术亮点包括云原生架构、智能数据同步、原生性能及流畅用户体验，无需自建服务器，支持微信生态无缝登录。
项目技术栈分析
1. 前端技术栈
🔹 微信小程序原生框架

使用微信小程序原生开发框架，基于基础库版本 2.14.1
支持ES6语法 (es6: true)
使用PostCSS进行样式预处理 (postcss: true)
代码压缩和优化 (minified: true)
🔹 JavaScript & 小程序API

原生JavaScript ES6+语法
微信小程序API (wx.)
页面生命周期管理 (onLoad, onShow等)
本地存储 (wx.getStorageSync, wx.setStorageSync)
网络请求 (wx.request)
用户认证 (wx.getUserProfile)
动画API (wx.createAnimation)
2. 后端技术栈
🔹 微信云开发

云环境ID: cloud1-7go3fmxa5fa9270d
使用 wx-server-sdk 版本 ~2.6.3
云函数架构，包含8个云函数：
login - 用户登录
saveStory - 保存故事
getStories - 获取故事列表
deleteStory - 删除故事
saveFavorites - 保存收藏
getFavorites - 获取收藏
saveConsumption - 保存订单
getConsumption - 获取订单
updateConsumption - 更新订单
🔹 数据存储

云数据库（从代码注释可看出设计）
本地存储（用于数据同步和离线功能）
数据同步机制（本地与云端数据同步）
3. 架构模式
🔹 页面结构

采用传统小程序页面架构
5个主要模块：
故事模块 (pages/story/)
自由行模块 (pages/free-travel/)
跟团游模块 (pages/team-travel/)
需求模块 (pages/demand/)
用户中心模块 (pages/user/)
🔹 状态管理

全局数据通过 app.js 的 globalData 管理
本地存储用于数据持久化
云端数据同步机制
4. 网络通信
🔹 HTTP API

本地开发服务器: http://localhost:3000
封装的ajax方法用于API请求
Bearer Token认证机制
请求拦截和错误处理
🔹 云函数调用

使用 wx.cloud.callFunction() 调用云函数
支持参数传递和错误处理
5. 开发工具与配置
🔹 开发环境

微信开发者工具
项目配置文件 project.config.json
支持热重载和实时调试
🔹 构建优化

WXSS和WXML代码压缩
Babel转译（可配置）
源码映射支持
6. 应用特性
🔹 业务功能

用户认证与登录
故事分享与评论
旅游产品浏览（自由行、跟团游）
收藏与订单管理
需求提交
🔹 数据同步

本地与云端收藏数据同步
订单数据云端备份
离线数据支持
