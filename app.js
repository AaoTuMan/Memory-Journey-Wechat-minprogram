//app.js
App({
  onLaunch: function() {
    // 初始化云开发环境
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: 'cloud1-7go3fmxa5fa9270d', // 默认环境配置，这里填入你的环境ID
          traceUser: true,
        });
        console.log('云开发环境初始化成功');
        
        // 确保云开发初始化成功后再同步数据
        setTimeout(() => {
          this.syncFavorites();
          this.syncOrders();
        }, 1000);
      } catch (error) {
        console.error('云开发初始化失败:', error);
      }
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    }
    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({
        url: '/pages/user/login/index',
      });
    }
  },
  // 公共数据
  globalData: {
    userInfo: null,
    url: 'http://localhost:3000',
  },
  
  // 同步收藏数据
  syncFavorites: function() {
    try {
      // 获取本地收藏
      const localFavorites = wx.getStorageSync('user_favorites') || [];
      
      console.log('开始同步收藏数据');
      
      // 从云端获取收藏
      wx.cloud.callFunction({
        name: 'getFavorites'
      }).then(res => {
        console.log('getFavorites云函数返回:', res);
        
        if (res.result && res.result.success) {
          const cloudFavorites = res.result.data.favorites || [];
          const cloudUpdateTime = res.result.data.updateTime;
          const localUpdateTime = wx.getStorageSync('favorites_last_sync');
          
          console.log('云端收藏数:', cloudFavorites.length);
          console.log('本地收藏数:', localFavorites.length);
          
          // 如果云端有数据且本地无数据，或云端数据更新时间晚于本地，则使用云端数据
          if ((cloudFavorites.length > 0 && localFavorites.length === 0) || 
              (cloudUpdateTime && (!localUpdateTime || new Date(cloudUpdateTime) > new Date(localUpdateTime)))) {
            console.log('使用云端收藏数据');
            wx.setStorageSync('user_favorites', cloudFavorites);
            wx.setStorageSync('favorites_last_sync', new Date().getTime());
          } 
          // 如果本地有数据而云端无数据，则上传本地数据到云端
          else if (localFavorites.length > 0 && cloudFavorites.length === 0) {
            console.log('上传本地收藏到云端');
            this.uploadLocalFavorites(localFavorites);
          }
          // 如果两边都有数据，且更新时间不同，进行合并
          else if (localFavorites.length > 0 && cloudFavorites.length > 0) {
            console.log('合并本地和云端收藏');
            this.mergeFavorites(localFavorites, cloudFavorites);
          }
        } else {
          console.error('获取云端收藏失败:', res);
        }
      }).catch(err => {
        console.error('同步收藏数据失败:', err);
      });
    } catch (error) {
      console.error('同步收藏过程出错:', error);
    }
  },

  // 上传本地收藏到云端
  uploadLocalFavorites: function(favorites) {
    console.log('开始上传本地收藏到云端，数据:', favorites);
    
    wx.cloud.callFunction({
      name: 'saveFavorites',
      data: { favorites }
    }).then(res => {
      console.log('本地收藏上传成功:', res);
      if (res.result && res.result.success) {
        wx.setStorageSync('favorites_last_sync', new Date().getTime());
      } else {
        console.error('上传返回错误:', res);
      }
    }).catch(err => {
      console.error('本地收藏上传失败:', err);
    });
  },
  
  // 合并本地和云端收藏
  mergeFavorites: function(localFavorites, cloudFavorites) {
    try {
      // 创建一个Map来存储所有收藏项，以"id+type"为键
      const mergedMap = new Map();
      
      // 先添加云端收藏
      cloudFavorites.forEach(item => {
        const key = `${item.id}-${item.type}`;
        mergedMap.set(key, item);
      });
      
      // 再添加本地收藏（如果有重复，本地会覆盖云端）
      localFavorites.forEach(item => {
        const key = `${item.id}-${item.type}`;
        mergedMap.set(key, item);
      });
      
      // 转换回数组
      const mergedFavorites = Array.from(mergedMap.values());
      
      console.log('合并后的收藏数:', mergedFavorites.length);
      
      // 更新本地存储
      wx.setStorageSync('user_favorites', mergedFavorites);
      
      // 上传到云端
      this.uploadLocalFavorites(mergedFavorites);
      
    } catch (error) {
      console.error('合并收藏数据出错:', error);
    }
  },
  
  // 同步订单数据
  syncOrders: function() {
    try {
      // 获取本地订单
      const localOrders = wx.getStorageSync('userOrders') || [];
      
      console.log('开始同步订单数据');
      
      // 从云端获取订单
      wx.cloud.callFunction({
        name: 'getConsumption'
      }).then(res => {
        console.log('getConsumption云函数返回:', res);
        
        if (res.result && res.result.success) {
          const cloudOrders = res.result.data.orders || [];
          
          console.log('云端订单数:', cloudOrders.length);
          console.log('本地订单数:', localOrders.length);
          
          // 如果云端有数据且本地无数据，则使用云端数据
          if (cloudOrders.length > 0 && localOrders.length === 0) {
            console.log('使用云端订单数据');
            
            // 格式化订单数据
            const formattedOrders = cloudOrders.map(order => {
              return {
                ...order,
                cloudId: order._id
              };
            });
            
            wx.setStorageSync('userOrders', formattedOrders);
          } 
          // 如果本地有数据而云端无数据，则上传本地数据到云端
          else if (localOrders.length > 0 && cloudOrders.length === 0) {
            console.log('上传本地订单到云端');
            this.uploadLocalOrders(localOrders);
          }
          // 如果两边都有数据，进行合并
          else if (localOrders.length > 0 && cloudOrders.length > 0) {
            console.log('合并本地和云端订单');
            this.mergeOrders(localOrders, cloudOrders);
          }
        } else {
          console.error('获取云端订单失败:', res);
        }
      }).catch(err => {
        console.error('同步订单数据失败:', err);
      });
    } catch (error) {
      console.error('同步订单过程出错:', error);
    }
  },
  
  // 上传本地订单到云端
  uploadLocalOrders: function(orders) {
    console.log('开始上传本地订单到云端');
    
    // 过滤出未同步的订单
    const unsyncedOrders = orders.filter(order => !order.cloudId);
    
    if (unsyncedOrders.length === 0) {
      console.log('没有需要上传的订单');
      return;
    }
    
    console.log('需要上传的订单数量:', unsyncedOrders.length);
    
    // 逐个上传订单
    let uploadedCount = 0;
    const updatedOrders = [...orders];
    
    unsyncedOrders.forEach(order => {
      wx.cloud.callFunction({
        name: 'saveConsumption',
        data: { orderInfo: order }
      }).then(res => {
        if (res.result && res.result.success) {
          console.log('订单上传成功:', order.id);
          
          // 更新本地订单的cloudId
          const index = updatedOrders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            updatedOrders[index].cloudId = res.result.data._id;
          }
          
          uploadedCount++;
          
          // 所有订单上传完成后，更新本地存储
          if (uploadedCount === unsyncedOrders.length) {
            wx.setStorageSync('userOrders', updatedOrders);
            console.log('所有订单上传完成，已更新本地存储');
          }
        } else {
          console.error('订单上传失败:', order.id, res);
        }
      }).catch(err => {
        console.error('订单上传出错:', order.id, err);
      });
    });
  },
  
  // 合并本地和云端订单
  mergeOrders: function(localOrders, cloudOrders) {
    try {
      // 创建一个Map来存储所有订单
      const mergedMap = new Map();
      
      // 先添加云端订单
      cloudOrders.forEach(order => {
        // 使用云端ID作为键
        const key = order._id;
        mergedMap.set(key, {
          ...order,
          cloudId: order._id // 保存云端ID
        });
      });
      
      // 添加本地订单（如果没有对应的云端订单）
      const ordersToUpload = [];
      
      localOrders.forEach(order => {
        if (order.cloudId) {
          // 如果本地订单有cloudId，检查是否已经添加
          if (!mergedMap.has(order.cloudId)) {
            mergedMap.set(order.cloudId, order);
          }
        } else {
          // 本地订单没有cloudId，需要上传到云端
          ordersToUpload.push(order);
          
          // 暂时使用本地id作为键
          const key = `local_${order.id}`;
          mergedMap.set(key, order);
        }
      });
      
      // 转换回数组
      const mergedOrders = Array.from(mergedMap.values());
      
      console.log('合并后的订单数量:', mergedOrders.length);
      console.log('需要上传的订单数量:', ordersToUpload.length);
      
      // 更新本地存储
      wx.setStorageSync('userOrders', mergedOrders);
      
      // 上传未同步的订单
      if (ordersToUpload.length > 0) {
        this.uploadLocalOrders(localOrders);
      }
    } catch (error) {
      console.error('合并订单数据出错:', error);
    }
  },
  
  // option:{method,url,data,config}
  ajax(option) {
    let token = wx.getStorageSync("token");
    token = token ? `Bearer ${token}` : '';
    let headerConfig = { // 默认header ticket、token、params参数是每次请求需要携带的认证信息
      Authorization: token,
      'content-type': 'application/x-www-form-urlencoded'
    };
    wx.showLoading({
      title: '加载中',
    })
    // method默认
    option.method = option.method || "POST";
    //拼接url
    option.url = this.globalData.url + option.url;
    //返回Promise对象
    return new Promise(function(resolve) {
      wx.request({
        method: option.method,
        url: option.url,
        data: option.data,
        header: Object.assign({}, headerConfig, option.config), // 合并传递进来的配置
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode == 200) {
            resolve(res.data);
          } else {
            //错误信息处理
            wx.showModal({
              title: '提示',
              content: '服务器错误，请联系客服',
              showCancel: false,
            })
          }
        }
      })
    })
  }
})