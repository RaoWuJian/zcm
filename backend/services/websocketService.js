const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> { socketId, socket, lastActivity }
    this.userRooms = new Map(); // userId -> Set of room names
    this.heartbeatInterval = 30000; // 30秒心跳间隔
    this.inactivityTimeout = 30 * 60 * 1000; // 30分钟不活跃超时
    this.maxConnections = 1000; // 最大连接数限制
  }

  // 初始化WebSocket服务
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5174",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling']
    });

    // 中间件：身份验证
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
          return next(new Error('Authentication error: Invalid user'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // 连接处理
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // 启动清理任务
    this.startCleanupTasks();

    console.log('WebSocket service initialized');
  }

  // 处理新连接
  handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;

    // 检查连接数限制
    if (this.connectedUsers.size >= this.maxConnections) {
      console.warn(`Connection limit reached. Rejecting connection for user ${userId}`);
      socket.emit('error', { message: 'Server is busy, please try again later' });
      socket.disconnect();
      return;
    }

    // 如果用户已经连接，断开旧连接
    if (this.connectedUsers.has(userId)) {
      const oldConnection = this.connectedUsers.get(userId);
      oldConnection.socket.emit('force_disconnect', { reason: 'New connection established' });
      oldConnection.socket.disconnect();
    }

    // 记录新连接
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      socket: socket,
      lastActivity: Date.now(),
      user: user
    });
    
    // 加入用户个人房间
    const personalRoom = `user_${userId}`;
    socket.join(personalRoom);

    // 发送连接成功消息
    socket.emit('connected', {
      message: 'Connected to notification service',
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // 发送离线期间的通知
    this.sendOfflineNotifications(userId, socket);

    // 事件监听
    this.setupSocketEvents(socket);
  }

  // 设置Socket事件监听
  setupSocketEvents(socket) {
    const userId = socket.userId;

    // 心跳响应
    socket.on('pong', () => {
      this.updateUserActivity(userId);
    });

    // 用户活跃度更新
    socket.on('user_activity', () => {
      this.updateUserActivity(userId);
    });

    // 标记通知为已读
    socket.on('mark_notification_read', (data) => {
      this.updateUserActivity(userId);
    });

    // 断开连接处理
    socket.on('disconnect', (reason) => {
      console.log(`User ${userId} disconnected: ${reason}`);
      this.connectedUsers.delete(userId);
      this.userRooms.delete(userId);
    });

    // 错误处理
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  }

  // 更新用户活跃度
  updateUserActivity(userId) {
    const connection = this.connectedUsers.get(userId);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }

  // 发送离线通知（从数据库中获取）
  async sendOfflineNotifications(userId, socket) {
    try {

      // 获取用户未发送的通知，按创建时间排序，避免重复发送
      const unsentNotifications = await Notification.find({
        recipient: userId,
        isSent: false,
        sendAttempts: { $lt: 5 }
      })
      .sort({ createdAt: -1 })
      .limit(20) // 减少一次发送的数量，避免过载
      .lean();

      if (unsentNotifications.length > 0) {
        // 批量更新为已发送状态，避免重复发送
        const notificationIds = unsentNotifications.map(n => n._id);
        await Notification.updateMany(
          { _id: { $in: notificationIds } },
          {
            isSent: true,
            lastSendAttempt: new Date(),
            $inc: { sendAttempts: 1 }
          }
        );

        // 发送每个通知
        for (const notification of unsentNotifications) {
          socket.emit('notification', {
            id: notification._id.toString(), // 确保ID是字符串
            type: notification.type,
            category: notification.category,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            isRead: notification.isRead,
            createdAt: notification.createdAt
          });

          // 添加小延迟，避免前端处理过快
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error sending offline notifications:', error);
    }
  }

  // 发送通知给特定用户
  async sendNotificationToUser(userId, notification) {
    const connection = this.connectedUsers.get(userId);
    if (connection) {
      connection.socket.emit('notification', notification);
      this.updateUserActivity(userId);

      // 如果通知有数据库ID，标记为已发送
      if (notification.dbId) {
        try {
          await Notification.findByIdAndUpdate(notification.dbId, {
            isSent: true,
            lastSendAttempt: new Date()
          });
        } catch (error) {
          console.error('Error updating notification send status:', error);
        }
      }

      return true;
    } else {
      // 将通知存储到数据库中，等用户上线时发送
      try {
        const dbNotification = new Notification({
          recipient: userId,
          type: notification.type || 'general',
          category: notification.category || 'general',
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          priority: notification.priority || 'normal',
          resourceId: notification.data?.reportId,
          resourceType: notification.data?.reportId ? 'daily_report' : null,
          isSent: false,
          sendAttempts: 0
        });

        await dbNotification.save();
      } catch (error) {
        console.error('Error storing notification in database:', error);
      }

      return false;
    }
  }

  // 发送通知给多个用户
  async sendNotificationToUsers(userIds, notification) {
    const results = {
      sent: 0,
      failed: 0,
      offline: []
    };

    for (const userId of userIds) {
      try {
        const success = await this.sendNotificationToUser(userId, notification);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
          results.offline.push(userId);
        }
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        results.failed++;
        results.offline.push(userId);
      }
    }

    return results;
  }

  // 启动清理任务
  startCleanupTasks() {
    // 心跳检测
    setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);

    // 不活跃连接清理
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 60000); // 每分钟检查一次
  }

  // 发送心跳
  sendHeartbeat() {
    this.connectedUsers.forEach((connection, userId) => {
      try {
        connection.socket.emit('ping');
      } catch (error) {
        console.error(`Error sending heartbeat to user ${userId}:`, error);
        this.connectedUsers.delete(userId);
      }
    });
  }

  // 清理不活跃的连接
  cleanupInactiveConnections() {
    const now = Date.now();
    const toRemove = [];

    this.connectedUsers.forEach((connection, userId) => {
      if (now - connection.lastActivity > this.inactivityTimeout) {
        console.log(`Disconnecting inactive user ${userId}`);
        connection.socket.emit('inactive_disconnect', { 
          reason: 'Inactive for too long',
          inactiveTime: now - connection.lastActivity 
        });
        connection.socket.disconnect();
        toRemove.push(userId);
      }
    });

    toRemove.forEach(userId => {
      this.connectedUsers.delete(userId);
      this.userRooms.delete(userId);
    });

    if (toRemove.length > 0) {
      console.log(`Cleaned up ${toRemove.length} inactive connections`);
    }
  }

  // 获取连接统计信息
  getStats() {
    return {
      totalConnections: this.connectedUsers.size,
      maxConnections: this.maxConnections,
      connectedUsers: Array.from(this.connectedUsers.keys())
    };
  }

  // 广播系统消息
  broadcastSystemMessage(message) {
    this.io.emit('system_message', message);
  }

  // 关闭WebSocket服务
  close() {
    if (this.io) {
      this.io.close();
      this.connectedUsers.clear();
      this.userRooms.clear();
      console.log('WebSocket service closed');
    }
  }
}

// 创建单例实例
const websocketService = new WebSocketService();

module.exports = websocketService;
